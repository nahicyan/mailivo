// api/src/jobs/closingDate.job.ts
import Bull from 'bull';
import { ClosingDateScheduler } from '../services/closingDateScheduler.service';
import { logger } from '../utils/logger';

class ClosingDateJob {
  private queue: Bull.Queue;
  private scheduler: ClosingDateScheduler;

  constructor() {
    const redisConfig = {
      port: parseInt(process.env.REDIS_PORT || '6379'),
      host: process.env.REDIS_HOST || 'localhost',
    };

    this.queue = new Bull('closing-date-automations', {
      redis: redisConfig,
      defaultJobOptions: {
        removeOnComplete: 50,
        removeOnFail: 20,
        attempts: 2,
        backoff: {
          type: 'exponential',
          delay: 2000
        }
      },
    });

    this.scheduler = new ClosingDateScheduler();
    this.setupJob();
    this.setupProcessor();
  }

  private setupJob() {
    // Check every minute for due closing date reminders
    const checkInterval = '* * * * *'; // Every minute
    
    this.queue.add(
      'check-closing-dates',
      {},
      {
        repeat: {
          cron: checkInterval,
        },
        jobId: 'closing-date-checker', // Prevents duplicates
      }
    );

    logger.info('Closing date automation scheduler initialized with 1-minute check interval');
  }

  private setupProcessor() {
    this.queue.process('check-closing-dates', async (_job) => {
      try {
        logger.debug('Checking for due closing date automations...');
        const result = await this.scheduler.checkAndExecuteDueAutomations();
        
        if (result.executed > 0) {
          logger.info('Closing date automations execution completed', {
            checked: result.checked,
            executed: result.executed,
            failed: result.failed,
            skipped: result.skipped,
          });
        }
        
        return result;
      } catch (error) {
        logger.error('Error in closing date automation job:', error);
        throw error;
      }
    });

    // Event handlers
    this.queue.on('completed', (job, result) => {
      if (result.executed > 0) {
        logger.debug(`Closing date automation job ${job.id} completed`, result);
      }
    });

    this.queue.on('failed', (job, error) => {
      logger.error(`Closing date automation job ${job.id} failed:`, error);
    });

    this.queue.on('error', (error) => {
      logger.error('Closing date automation queue error:', error);
    });
  }

  /**
   * Get job statistics
   */
  async getJobStats() {
    const jobCounts = await this.queue.getJobCounts();
    const repeatableJobs = await this.queue.getRepeatableJobs();
    
    return {
      jobCounts,
      repeatableJobs,
      nextReminderTimes: await this.scheduler.getNextReminderTimes(),
    };
  }

  /**
   * Trigger manual check (useful for testing)
   */
  async triggerManualCheck() {
    const job = await this.queue.add('check-closing-dates', {}, {
      priority: 1,
    });
    
    return { jobId: job.id };
  }

  /**
   * Clean up and stop the job
   */
  async stop() {
    try {
      await this.queue.close();
      logger.info('Closing date automation job stopped');
    } catch (error) {
      logger.error('Error stopping closing date automation job:', error);
    }
  }
}

export const closingDateJob = new ClosingDateJob();