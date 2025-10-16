// api/src/services/closingDateScheduler.service.ts
import axios from "axios";
import { MailivoAutomation, IMailivoAutomation } from "../models/MailivoAutomation";
import { AutomationExecutor } from "./automation-executor.service";
import { logger } from "../utils/logger";

interface PropertyWithClosingDate {
  propertyId: string;
  closingDate: string;
}

interface ExecutionResult {
  checked: number;
  executed: number;
  failed: number;
  skipped: number;
  details: Array<{
    automationId: string;
    propertyId: string;
    status: "executed" | "failed" | "skipped";
    error?: string;
  }>;
}

export class ClosingDateScheduler {
  private executor: AutomationExecutor;
  private LANDIVO_API_URL: string;
  private processedReminders: Map<string, Set<string>>; // automationId -> Set of propertyIds processed today

  constructor() {
    this.executor = new AutomationExecutor();
    this.LANDIVO_API_URL = process.env.LANDIVO_API_URL || "https://api.landivo.com";
    this.processedReminders = new Map();

    // Reset processed reminders daily at midnight
    this.scheduleResetProcessedReminders();
  }

  /**
   * Check and execute all due closing date automations
   */
  async checkAndExecuteDueAutomations(): Promise<ExecutionResult> {
    const result: ExecutionResult = {
      checked: 0,
      executed: 0,
      failed: 0,
      skipped: 0,
      details: [],
    };

    try {
      // Find all active closing date automations
      const automations = (await MailivoAutomation.find({
        isActive: true,
        "trigger.type": "closing_date",
      })) as unknown as IMailivoAutomation[];

      result.checked = automations.length;

      if (automations.length === 0) {
        return result;
      }

      logger.debug(`Found ${automations.length} active closing date automations`);

      // Fetch all properties with closing dates
      const properties = await this.fetchPropertiesWithClosingDates();

      if (properties.length === 0) {
        logger.debug("No properties with closing dates found");
        return result;
      }

      logger.debug(`Found ${properties.length} properties with closing dates`);

      const now = new Date();

      // Process each automation
      for (const automation of automations) {
        try {
          // Check which properties are due for this automation
          const dueProperties = this.findDueProperties(properties, automation.trigger.config, now, automation._id!.toString());

          if (dueProperties.length === 0) {
            result.skipped++;
            continue;
          }

          logger.info(`Automation ${automation.name} has ${dueProperties.length} due properties`, {
            automationId: automation._id!.toString(),
            duePropertyCount: dueProperties.length,
          });

          // Execute automation for each due property
          for (const property of dueProperties) {
            try {
              await this.executor.executeAutomation(automation._id!.toString(), {
                mockData: {
                  propertyIds: [property.propertyId],
                  closingDate: property.closingDate,
                },
              });

              // Mark this property as processed for today
              this.markPropertyProcessed(automation._id!.toString(), property.propertyId);

              result.executed++;
              result.details.push({
                automationId: automation._id!.toString(),
                propertyId: property.propertyId,
                status: "executed",
              });

              logger.info(`Executed closing date reminder`, {
                automationId: automation._id!.toString(),
                propertyId: property.propertyId,
                closingDate: property.closingDate,
              });
            } catch (error: any) {
              result.failed++;
              result.details.push({
                automationId: automation._id!.toString(),
                propertyId: property.propertyId,
                status: "failed",
                error: error.message,
              });

              logger.error(`Failed to execute closing date reminder`, {
                automationId: automation._id!.toString(),
                propertyId: property.propertyId,
                error: error.message,
              });
            }
          }

          // Update last run time
          await MailivoAutomation.findByIdAndUpdate(automation._id, {
            $set: { lastRunAt: now },
          });
        } catch (error: any) {
          result.failed++;
          logger.error(`Failed to process automation: ${automation.name}`, {
            automationId: automation._id!.toString(),
            error: error.message,
          });
        }
      }

      return result;
    } catch (error) {
      logger.error("Error checking closing date automations:", error);
      throw error;
    }
  }

  /**
   * Fetch properties with closing dates from Landivo API
   */
  private async fetchPropertiesWithClosingDates(): Promise<PropertyWithClosingDate[]> {
    try {
      const response = await axios.get(`${this.LANDIVO_API_URL}/automation/closingDates`);

      if (response.data.success && Array.isArray(response.data.data)) {
        return response.data.data;
      }

      return [];
    } catch (error: any) {
      logger.error("Failed to fetch properties with closing dates:", error.message);
      return [];
    }
  }

  /**
   * Find properties that are due for reminders based on trigger config
   */
  private findDueProperties(properties: PropertyWithClosingDate[], config: any, now: Date, automationId: string): PropertyWithClosingDate[] {
    const { timeUnit, timeBefore, time, timezone } = config;

    // Parse configured time
    const [hours, minutes] = (time || "09:00").split(":").map(Number);

    // Get current time in configured timezone
    const nowInTimezone = this.convertToTimezone(now, timezone || "America/New_York");
    const currentHour = nowInTimezone.getHours();
    const currentMinute = nowInTimezone.getMinutes();

    // Only process at the configured time (within the current minute)
    if (currentHour !== hours || currentMinute !== minutes) {
      return [];
    }

    return properties.filter((property) => {
      // Skip if already processed today
      if (this.isPropertyProcessedToday(automationId, property.propertyId)) {
        return false;
      }

      const closingDate = new Date(property.closingDate);
      const reminderDate = this.calculateReminderDate(closingDate, timeUnit, timeBefore, time, timezone);

      // Check if today is the reminder date (in the target timezone)
      const reminderInTimezone = this.convertToTimezone(reminderDate, timezone || "America/New_York");
      return this.isSameDay(nowInTimezone, reminderInTimezone);
    });
  }

  /**
   * Calculate when the reminder should be sent (returns UTC Date)
   */
  private calculateReminderDate(closingDate: Date, timeUnit: string, timeBefore: number, time?: string, timezone?: string): Date {
    // Work with UTC dates throughout
    const closingUTC = new Date(closingDate);

    // Calculate the target date (subtract the time period)
    let targetYear = closingUTC.getUTCFullYear();
    let targetMonth = closingUTC.getUTCMonth();
    let targetDate = closingUTC.getUTCDate();

    switch (timeUnit) {
      case "months":
        targetMonth -= timeBefore;
        break;
      case "weeks":
        targetDate -= timeBefore * 7;
        break;
      case "days":
        targetDate -= timeBefore;
        break;
      case "hours":
        // For hours, just subtract from the closing date time
        return new Date(closingUTC.getTime() - timeBefore * 60 * 60 * 1000);
    }

    // If no specific time is configured, use midnight
    if (!time) {
      return new Date(Date.UTC(targetYear, targetMonth, targetDate, 0, 0, 0, 0));
    }

    // Parse the configured time
    const [hours, minutes] = time.split(":").map(Number);

    // Create date in target timezone and convert to UTC
    const tz = timezone || "America/New_York";
    const reminderDateUTC = this.createDateInTimezone(targetYear, targetMonth, targetDate, hours, minutes, tz);

    return reminderDateUTC;
  }

  /**
   * Create a Date object for a specific time in a timezone, returned as UTC
   */
  private createDateInTimezone(year: number, month: number, date: number, hours: number, minutes: number, timezone: string): Date {
    // Create a date string in ISO format for the target timezone
    // Use UTC date initially
    const tempDate = new Date(Date.UTC(year, month, date, 12, 0, 0)); // Use noon to avoid date boundary issues

    // Format as locale string in target timezone to get the correct date
    const localeDateStr = tempDate.toLocaleDateString("en-US", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });

    // Parse MM/DD/YYYY
    const [m, d, y] = localeDateStr.split("/").map(Number);

    // Build ISO string in target timezone (this is a hack but works reliably)
    const isoString = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}T${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00`;

    // Get offset for this timezone at this date/time
    const testDate = new Date(isoString + "Z"); // Treat as UTC first
    const testDateStr = testDate.toLocaleString("en-US", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });

    // Calculate offset by comparing what time it shows in the timezone vs UTC
    const testUTCTime = testDate.getTime();
    const parsedLocal = new Date(testDateStr.replace(/(\d+)\/(\d+)\/(\d+),\s+(\d+):(\d+):(\d+)/, "$3-$1-$2T$4:$5:$6"));
    const offset = testUTCTime - parsedLocal.getTime();

    // Apply offset to get the correct UTC time
    const targetLocal = new Date(`${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}T${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00`);
    return new Date(targetLocal.getTime() + offset);
  }

  /**
   * Convert a UTC Date to show the equivalent time in a specific timezone
   */
  private convertToTimezone(date: Date, timezone: string): Date {
    // Get the date/time components in the target timezone
    const year = parseInt(date.toLocaleString("en-US", { timeZone: timezone, year: "numeric" }));
    const month = parseInt(date.toLocaleString("en-US", { timeZone: timezone, month: "numeric" })) - 1;
    const day = parseInt(date.toLocaleString("en-US", { timeZone: timezone, day: "numeric" }));
    const hour = parseInt(date.toLocaleString("en-US", { timeZone: timezone, hour: "numeric", hour12: false }));
    const minute = parseInt(date.toLocaleString("en-US", { timeZone: timezone, minute: "numeric" }));
    const second = parseInt(date.toLocaleString("en-US", { timeZone: timezone, second: "numeric" }));

    // Create a new Date with these components (treated as local time)
    return new Date(year, month, day, hour, minute, second);
  }

  /**
   * Check if two dates are on the same day
   */
  private isSameDay(date1: Date, date2: Date): boolean {
    return date1.getFullYear() === date2.getFullYear() && date1.getMonth() === date2.getMonth() && date1.getDate() === date2.getDate();
  }

  /**
   * Mark a property as processed for an automation
   */
  private markPropertyProcessed(automationId: string, propertyId: string): void {
    if (!this.processedReminders.has(automationId)) {
      this.processedReminders.set(automationId, new Set());
    }
    this.processedReminders.get(automationId)!.add(propertyId);
  }

  /**
   * Check if a property has been processed today
   */
  private isPropertyProcessedToday(automationId: string, propertyId: string): boolean {
    return this.processedReminders.get(automationId)?.has(propertyId) || false;
  }

  /**
   * Reset processed reminders (called daily at midnight)
   */
  private scheduleResetProcessedReminders(): void {
    const now = new Date();
    const night = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1, // Tomorrow
      0,
      0,
      0 // Midnight
    );
    const msToMidnight = night.getTime() - now.getTime();

    setTimeout(() => {
      this.processedReminders.clear();
      logger.info("Reset processed closing date reminders for new day");

      // Schedule next reset (24 hours)
      setInterval(
        () => {
          this.processedReminders.clear();
          logger.info("Reset processed closing date reminders for new day");
        },
        24 * 60 * 60 * 1000
      );
    }, msToMidnight);
  }

  /**
   * Get next reminder times for active automations
   */
  async getNextReminderTimes(): Promise<
    Array<{
      automationId: string;
      name: string;
      propertyId: string;
      closingDate: string;
      reminderDate: Date;
    }>
  > {
    const automations = (await MailivoAutomation.find({
      isActive: true,
      "trigger.type": "closing_date",
    })) as unknown as IMailivoAutomation[];

    const properties = await this.fetchPropertiesWithClosingDates();
    const results: any[] = [];

    for (const automation of automations) {
      const config = automation.trigger.config;

      for (const property of properties) {
        const closingDate = new Date(property.closingDate);
        const reminderDate = this.calculateReminderDate(closingDate, config.timeUnit, config.timeBefore, config.time, config.timezone);

        // Only include future reminders
        if (reminderDate > new Date()) {
          results.push({
            automationId: automation._id!.toString(),
            name: automation.name,
            propertyId: property.propertyId,
            closingDate: property.closingDate,
            reminderDate,
          });
        }
      }
    }

    return results.sort((a, b) => a.reminderDate.getTime() - b.reminderDate.getTime());
  }
}
