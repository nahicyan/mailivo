// api/src/jobs/timeBasedAutomation.job.ts
import Bull from 'bull';
import { TimeBasedAutomationScheduler } from '../services/timeBasedAutomationScheduler.service';
import { logger } from '../utils/logger';

class TimeBasedAutomationJob {
  private queue: Bull.Queue;
  private scheduler: TimeBasedAutomationScheduler;

  constructor() {
    const redisConfig = {
      port: parseInt(process.env.REDIS_PORT || '6379'),
      host: process.env.REDIS_HOST || 'localhost',
    };

    this.queue = new Bull('time-based-automations', {
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

    this.scheduler = new TimeBasedAutomationScheduler();
    this.setupJob();
    this.setupProcessor();
  }

  private setupJob() {
    // Check every minute for due automations
    // This is reliable and survives server restarts
    const checkInterval = '* * * * *'; // Every minute
    
    this.queue.add(
      'check-due-automations',
      {},
      {
        repeat: {
          cron: checkInterval,
        },
        jobId: 'time-based-automation-checker', // Prevents duplicates
      }
    );

    logger.info('Time-based automation scheduler initialized with 1-minute check interval');
  }

  private setupProcessor() {
    this.queue.process('check-due-automations', async (_job) => {
      try {
        logger.debug('Checking for due time-based automations...');
        const result = await this.scheduler.checkAndExecuteDueAutomations();
        
        if (result.executed > 0) {
          logger.info('Time-based automations execution completed', {
            checked: result.checked,
            executed: result.executed,
            failed: result.failed,
            skipped: result.skipped,
          });
        }
        
        return result;
      } catch (error) {
        logger.error('Error in time-based automation job:', error);
        throw error;
      }
    });

    // Event handlers
    this.queue.on('completed', (job, result) => {
      if (result.executed > 0) {
        logger.debug(`Time-based automation job ${job.id} completed`, result);
      }
    });

    this.queue.on('failed', (job, error) => {
      logger.error(`Time-based automation job ${job.id} failed:`, error);
    });

    this.queue.on('error', (error) => {
      logger.error('Time-based automation queue error:', error);
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
      nextExecutionTime: await this.scheduler.getNextExecutionTimes(),
    };
  }

  /**
   * Trigger manual check (useful for testing)
   */
  async triggerManualCheck() {
    const job = await this.queue.add('check-due-automations', {}, {
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
      logger.info('Time-based automation job stopped');
    } catch (error) {
      logger.error('Error stopping time-based automation job:', error);
    }
  }
}

export const timeBasedAutomationJob = new TimeBasedAutomationJob();