// api/src/services/closingDateScheduler.service.ts
import axios from 'axios';
import { MailivoAutomation, IMailivoAutomation } from '../models/MailivoAutomation';
import { AutomationExecutor } from './automation-executor.service';
import { logger } from '../utils/logger';

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
    status: 'executed' | 'failed' | 'skipped';
    error?: string;
  }>;
}

export class ClosingDateScheduler {
  private executor: AutomationExecutor;
  private LANDIVO_API_URL: string;
  private processedReminders: Map<string, Set<string>>; // automationId -> Set of propertyIds processed today

  constructor() {
    this.executor = new AutomationExecutor();
    this.LANDIVO_API_URL = process.env.LANDIVO_API_URL || 'https://api.landivo.com';
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
        'trigger.type': 'closing_date',
      })) as unknown as IMailivoAutomation[];

      result.checked = automations.length;

      if (automations.length === 0) {
        return result;
      }

      logger.debug(`Found ${automations.length} active closing date automations`);

      // Fetch all properties with closing dates
      const properties = await this.fetchPropertiesWithClosingDates();

      if (properties.length === 0) {
        logger.debug('No properties with closing dates found');
        return result;
      }

      logger.debug(`Found ${properties.length} properties with closing dates`);

      const now = new Date();

      // Process each automation
      for (const automation of automations) {
        try {
          // Check which properties are due for this automation
          const dueProperties = this.findDueProperties(
            properties,
            automation.trigger.config,
            now,
            automation._id!.toString()
          );

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
                status: 'executed',
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
                status: 'failed',
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
      logger.error('Error checking closing date automations:', error);
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
      logger.error('Failed to fetch properties with closing dates:', error.message);
      return [];
    }
  }

  /**
   * Find properties that are due for reminders based on trigger config
   */
  private findDueProperties(
    properties: PropertyWithClosingDate[],
    config: any,
    now: Date,
    automationId: string
  ): PropertyWithClosingDate[] {
    const { timeUnit, timeBefore, time, timezone } = config;
    
    // Parse configured time
    const [hours, minutes] = (time || '09:00').split(':').map(Number);
    
    // Get current time in configured timezone
    const nowInTimezone = this.getTimeInTimezone(now, timezone || 'America/New_York');
    const currentHour = nowInTimezone.getHours();
    const currentMinute = nowInTimezone.getMinutes();
    
    // Only process at the configured time (within the current minute)
    if (currentHour !== hours || currentMinute !== minutes) {
      return [];
    }

    return properties.filter(property => {
      // Skip if already processed today
      if (this.isPropertyProcessedToday(automationId, property.propertyId)) {
        return false;
      }

      const closingDate = new Date(property.closingDate);
      const reminderDate = this.calculateReminderDate(closingDate, timeUnit, timeBefore);
      
      // Check if today is the reminder date
      return this.isSameDay(nowInTimezone, reminderDate);
    });
  }

  /**
   * Calculate when the reminder should be sent
   */
  private calculateReminderDate(closingDate: Date, timeUnit: string, timeBefore: number): Date {
    const reminderDate = new Date(closingDate);
    
    switch (timeUnit) {
      case 'months':
        reminderDate.setMonth(reminderDate.getMonth() - timeBefore);
        break;
      case 'weeks':
        reminderDate.setDate(reminderDate.getDate() - (timeBefore * 7));
        break;
      case 'days':
        reminderDate.setDate(reminderDate.getDate() - timeBefore);
        break;
      case 'hours':
        reminderDate.setHours(reminderDate.getHours() - timeBefore);
        break;
    }
    
    return reminderDate;
  }

  /**
   * Get current time in specific timezone
   */
  private getTimeInTimezone(date: Date, timezone: string): Date {
    const dateString = date.toLocaleString('en-US', { timeZone: timezone });
    return new Date(dateString);
  }

  /**
   * Check if two dates are on the same day
   */
  private isSameDay(date1: Date, date2: Date): boolean {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
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
      0, 0, 0 // Midnight
    );
    const msToMidnight = night.getTime() - now.getTime();

    setTimeout(() => {
      this.processedReminders.clear();
      logger.info('Reset processed closing date reminders for new day');
      
      // Schedule next reset (24 hours)
      setInterval(() => {
        this.processedReminders.clear();
        logger.info('Reset processed closing date reminders for new day');
      }, 24 * 60 * 60 * 1000);
    }, msToMidnight);
  }

  /**
   * Get next reminder times for active automations
   */
  async getNextReminderTimes(): Promise<Array<{
    automationId: string;
    name: string;
    propertyId: string;
    closingDate: string;
    reminderDate: Date;
  }>> {
    const automations = (await MailivoAutomation.find({
      isActive: true,
      'trigger.type': 'closing_date',
    })) as unknown as IMailivoAutomation[];

    const properties = await this.fetchPropertiesWithClosingDates();
    const results: any[] = [];

    for (const automation of automations) {
      const config = automation.trigger.config;
      
      for (const property of properties) {
        const closingDate = new Date(property.closingDate);
        const reminderDate = this.calculateReminderDate(
          closingDate,
          config.timeUnit,
          config.timeBefore
        );

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