// api/src/services/timeBasedAutomationScheduler.service.ts
import { MailivoAutomation, IMailivoAutomation } from "../models/MailivoAutomation";
import { AutomationExecutor } from "./automation-executor.service";
import { logger } from "../utils/logger";

interface ExecutionResult {
  checked: number;
  executed: number;
  failed: number;
  skipped: number;
  details: Array<{
    automationId: string;
    status: "executed" | "failed" | "skipped";
    error?: string;
    nextRun?: Date;
  }>;
}

export class TimeBasedAutomationScheduler {
  private executor: AutomationExecutor;

  constructor() {
    this.executor = new AutomationExecutor();
  }

  /**
   * Check and execute all due time-based automations
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
      // Find all active time-based automations
      const automations = (await MailivoAutomation.find({
        isActive: true,
        "trigger.type": "time_based",
      })) as unknown as IMailivoAutomation[];

      result.checked = automations.length;

      if (automations.length === 0) {
        return result;
      }

      const now = new Date();
      logger.debug(`Found ${automations.length} active time-based automations`);

      // Process each automation
      for (const automation of automations) {
        try {
          const isDue = this.isAutomationDue(automation, now);

          if (!isDue) {
            const nextRun = this.calculateNextExecution(automation, now);
            result.skipped++;
            result.details.push({
              automationId: automation._id!.toString(),
              status: "skipped",
              nextRun,
            });
            continue;
          }

          // Execute the automation
          logger.info(`Executing time-based automation: ${automation.name}`, {
            automationId: automation._id!.toString(),
            schedule: automation.trigger.config.schedule,
          });

          await this.executor.executeAutomation(automation._id!.toString());

          // Update last run time
          await MailivoAutomation.findByIdAndUpdate(automation._id, {
            $set: { lastRunAt: now },
          });

          const nextRun = this.calculateNextExecution(automation, now);
          result.executed++;
          result.details.push({
            automationId: automation._id!.toString(),
            status: "executed",
            nextRun,
          });

          logger.info(`Successfully executed automation: ${automation.name}`, {
            automationId: automation._id!.toString(),
            nextRun: nextRun?.toISOString(),
          });
        } catch (error: any) {
          result.failed++;
          result.details.push({
            automationId: automation._id!.toString(),
            status: "failed",
            error: error.message,
          });

          logger.error(`Failed to execute automation: ${automation.name}`, {
            automationId: automation._id!.toString(),
            error: error.message,
          });
        }
      }

      return result;
    } catch (error) {
      logger.error("Error checking time-based automations:", error);
      throw error;
    }
  }

  /**
   * Check if an automation is due to run
   */
  private isAutomationDue(automation: IMailivoAutomation, now: Date): boolean {
    const config = automation.trigger.config;
    const lastRun = automation.lastRunAt;

    // If never run before, check if it's time based on schedule
    if (!lastRun) {
      return this.isScheduleTimeMatch(config, now);
    }

    // Prevent duplicate runs within the same minute
    const lastRunMinute = this.getMinuteTimestamp(lastRun);
    const currentMinute = this.getMinuteTimestamp(now);

    if (lastRunMinute === currentMinute) {
      return false;
    }

    // Check if enough time has passed since last run
    const timeSinceLastRun = now.getTime() - lastRun.getTime();
    const minimumInterval = this.getMinimumInterval(config.schedule);

    if (timeSinceLastRun < minimumInterval) {
      return false;
    }

    // Check if current time matches schedule
    return this.isScheduleTimeMatch(config, now);
  }

  /**
   * Get minute-level timestamp (ignores seconds)
   */
  private getMinuteTimestamp(date: Date): string {
    return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${date.getHours()}-${date.getMinutes()}`;
  }

  /**
   * Get minimum interval between runs in milliseconds
   */
  private getMinimumInterval(schedule: string): number {
    switch (schedule) {
      case "daily":
        return 23 * 60 * 60 * 1000; // 23 hours (allows for small timing variations)
      case "weekly":
        return 6.9 * 24 * 60 * 60 * 1000; // ~6.9 days
      case "monthly":
        return 28 * 24 * 60 * 60 * 1000; // 28 days
      case "specific_date":
        return 365 * 24 * 60 * 60 * 1000; // 1 year (one-time execution)
      default:
        return 0;
    }
  }

  /**
   * Check if current time matches the schedule configuration
   */
  private isScheduleTimeMatch(config: any, now: Date): boolean {
    const configuredTime = config.time || "09:00";
    const [configHours, configMinutes] = configuredTime.split(":").map(Number);

    const currentHours = now.getHours();
    const currentMinutes = now.getMinutes();

    // Time must match (within the same minute)
    const timeMatches = currentHours === configHours && currentMinutes === configMinutes;

    if (!timeMatches) {
      return false;
    }

    switch (config.schedule) {
      case "daily":
        return true;

      case "weekly": {
        const configDayOfWeek = config.dayOfWeek ?? 1; // Default Monday
        const currentDayOfWeek = now.getDay();
        return currentDayOfWeek === configDayOfWeek;
      }

      case "monthly": {
        const configDayOfMonth = config.dayOfMonth ?? 1; // Default 1st
        const currentDayOfMonth = now.getDate();
        return currentDayOfMonth === configDayOfMonth;
      }

      case "specific_date": {
        if (!config.specificDate) return false;
        const targetDate = new Date(config.specificDate);
        return now.getFullYear() === targetDate.getFullYear() && now.getMonth() === targetDate.getMonth() && now.getDate() === targetDate.getDate();
      }

      default:
        return false;
    }
  }

  /**
   * Calculate next execution time for an automation
   */
  private calculateNextExecution(automation: IMailivoAutomation, fromDate: Date): Date | undefined {
    const config = automation.trigger.config;
    const [hours, minutes] = (config.time || "09:00").split(":").map(Number);

    switch (config.schedule) {
      case "daily": {
        const next = new Date(fromDate);
        next.setHours(hours, minutes, 0, 0);

        // If we've passed today's time, move to tomorrow
        if (next <= fromDate) {
          next.setDate(next.getDate() + 1);
        }
        return next;
      }

      case "weekly": {
        const targetDay = config.dayOfWeek ?? 1;
        const next = new Date(fromDate);
        next.setHours(hours, minutes, 0, 0);

        const currentDay = next.getDay();
        const daysUntilTarget = (targetDay - currentDay + 7) % 7;

        if (daysUntilTarget === 0 && next <= fromDate) {
          // If it's the same day but time passed, schedule for next week
          next.setDate(next.getDate() + 7);
        } else {
          next.setDate(next.getDate() + daysUntilTarget);
        }

        return next;
      }

      case "monthly": {
        const targetDay = config.dayOfMonth ?? 1;
        const next = new Date(fromDate);
        next.setHours(hours, minutes, 0, 0);
        next.setDate(targetDay);

        // If we've passed this month's date, move to next month
        if (next <= fromDate) {
          next.setMonth(next.getMonth() + 1);
        }

        // Handle months with fewer days
        if (next.getDate() !== targetDay) {
          next.setDate(0); // Last day of previous month
        }

        return next;
      }

      case "specific_date": {
        if (!config.specificDate) return undefined;
        const specificDate = new Date(config.specificDate);
        specificDate.setHours(hours, minutes, 0, 0);

        // Only return if it's in the future
        return specificDate > fromDate ? specificDate : undefined;
      }

      default:
        return undefined;
    }
  }

  /**
   * Get next execution times for all active time-based automations
   */
  async getNextExecutionTimes(): Promise<Array<{ automationId: string; name: string; nextRun: Date | undefined }>> {
    const automations = (await MailivoAutomation.find({
      isActive: true,
      "trigger.type": "time_based",
    }).select("_id name trigger lastRunAt")) as unknown as IMailivoAutomation[];

    const now = new Date();

    return automations.map((automation) => ({
      automationId: automation._id!.toString(),
      name: automation.name,
      nextRun: this.calculateNextExecution(automation, automation.lastRunAt || now),
    }));
  }
}
