// api/src/jobs/mailcowSync.job.ts
import Bull from 'bull';
import { mailcowStatusService } from '../services/mailcow/mailcowStatus.service';
import { logger } from '../utils/logger';

class MailcowSyncJob {
  private queue: Bull.Queue;
  private isEnabled: boolean;

  constructor() {
    this.isEnabled = process.env.MAILCOW_SYNC_ENABLED === 'true';
    
    const redisConfig = {
      port: parseInt(process.env.REDIS_PORT || '6379'),
      host: process.env.REDIS_HOST || 'localhost',
    };

    this.queue = new Bull('mailcow-sync', {
      redis: redisConfig,
      defaultJobOptions: {
        removeOnComplete: 10,
        removeOnFail: 5,
      },
    });

    if (this.isEnabled) {
      this.setupJob();
      this.setupProcessor();
    } else {
      logger.info('Mailcow sync job is disabled');
    }
  }

  private setupJob() {
    const syncInterval = process.env.MAILCOW_SYNC_CRON || '*/2 * * * *'; // Every 2 minutes default
    
    // Add recurring job
    this.queue.add(
      'sync-statuses',
      {},
      {
        repeat: {
          cron: syncInterval,
        },
      }
    );

    logger.info(`Mailcow sync job scheduled with cron: ${syncInterval}`);
  }

  private setupProcessor() {
    this.queue.process('sync-statuses', async (_job) => {
      try {
        logger.info('Starting scheduled Mailcow sync...');
        const result = await mailcowStatusService.syncStatuses();
        
        if (result.success) {
          logger.info('Scheduled Mailcow sync completed', {
            processed: result.processed,
            updated: result.updated,
          });
        } else {
          logger.error('Scheduled Mailcow sync failed', { error: result.error });
        }
        
        return result;
      } catch (error) {
        logger.error('Error in Mailcow sync job:', error);
        throw error;
      }
    });

    // Handle job events
    this.queue.on('completed', (job, result) => {
      logger.debug(`Mailcow sync job ${job.id} completed`, result);
    });

    this.queue.on('failed', (job, error) => {
      logger.error(`Mailcow sync job ${job.id} failed:`, error);
    });
  }

  async getJobStats() {
    const jobCounts = await this.queue.getJobCounts();
    const repeatableJobs = await this.queue.getRepeatableJobs();
    
    return {
      enabled: this.isEnabled,
      jobCounts,
      repeatableJobs,
    };
  }

  async triggerManualSync() {
    if (!this.isEnabled) {
      throw new Error('Mailcow sync is disabled');
    }
    
    const job = await this.queue.add('sync-statuses', {}, {
      priority: 1,
      delay: 0,
    });
    
    return { jobId: job.id };
  }
}

export const mailcowSyncJob = new MailcowSyncJob();