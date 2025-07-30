// api/src/services/emailQueue.service.ts
import Bull from 'bull';
import { EmailJobProcessor } from './processors/emailJobProcessor.service';
import { CampaignProcessor } from './processors/campaignProcessor.service';
import { Campaign } from '../models/Campaign';
import { logger } from '../utils/logger';

interface EmailJob {
  campaignId: string;
  contactId: string;
  email: string;
  personalizedContent: {
    subject: string;
    htmlContent: string;
    textContent?: string;
  };
  trackingId: string;
}

interface CampaignJob {
  campaignId: string;
  userId: string;
}

class EmailQueueService {
  private emailQueue: Bull.Queue<EmailJob>;
  private campaignQueue: Bull.Queue<CampaignJob>;
  private emailJobProcessor: EmailJobProcessor;
  private campaignProcessor: CampaignProcessor;

  constructor() {
    this.emailJobProcessor = new EmailJobProcessor();
    this.campaignProcessor = new CampaignProcessor();
    
    this.initializeQueues();
    this.setupProcessors();
    this.setupEventHandlers();
  }

  private initializeQueues() {
    const redisConfig = {
      port: parseInt(process.env.REDIS_PORT || '6379'),
      host: process.env.REDIS_HOST || 'localhost',
    };

    this.emailQueue = new Bull<EmailJob>('email-sending', {
      redis: redisConfig,
      defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 50,
        attempts: 3,
        backoff: { type: 'exponential', delay: 30000 },
      },
    });

    this.campaignQueue = new Bull<CampaignJob>('campaign-processing', {
      redis: redisConfig,
      defaultJobOptions: {
        removeOnComplete: 10,
        removeOnFail: 10,
        attempts: 2,
      },
    });
  }

  private setupProcessors() {
    this.emailQueue.process('send-email', 3, async (job) => {
      return await this.emailJobProcessor.processEmailJob(job.data);
    });

    this.campaignQueue.process('process-campaign', 1, async (job) => {
      const result = await this.campaignProcessor.processCampaign(job.data);
      
      // Add individual email jobs to the email queue
      if (result.success && (result as any).emailJobs) {
        const emailJobs = (result as any).emailJobs;
        
        for (let i = 0; i < emailJobs.length; i++) {
          await this.emailQueue.add('send-email', emailJobs[i], {
            delay: i * 2000, // 2 second delay between emails
          });
        }
      }
      
      return result;
    });
  }

  private setupEventHandlers() {
    this.emailQueue.on('completed', (job, result) => {
      logger.info(`Email job completed: ${job.id}`, result);
    });

    this.emailQueue.on('failed', (job, err) => {
      logger.error(`Email job failed: ${job.id}`, err.message);
    });

    this.campaignQueue.on('completed', (job, result) => {
      logger.info(`Campaign job completed: ${job.id}`, result);
    });

    this.campaignQueue.on('failed', (job, err) => {
      logger.error(`Campaign job failed: ${job.id}`, err.message);
    });
  }

  // Public API methods
  async sendCampaign(campaignId: string, userId: string): Promise<void> {
    await this.campaignQueue.add('process-campaign', {
      campaignId,
      userId,
    });
  }

  async pauseCampaign(campaignId: string): Promise<void> {
    const jobs = await this.emailQueue.getJobs(['waiting', 'delayed']);
    const campaignJobs = jobs.filter(job => job.data.campaignId === campaignId);
    
    for (const job of campaignJobs) {
      await job.remove();
    }

    await Campaign.findByIdAndUpdate(campaignId, { status: 'paused' });
    logger.info(`Campaign ${campaignId} paused`);
  }

  async getQueueStats() {
    const emailWaiting = await this.emailQueue.getWaiting();
    const emailActive = await this.emailQueue.getActive();
    const campaignWaiting = await this.campaignQueue.getWaiting();
    const campaignActive = await this.campaignQueue.getActive();

    return {
      emailQueue: {
        waiting: emailWaiting.length,
        active: emailActive.length,
      },
      campaignQueue: {
        waiting: campaignWaiting.length,
        active: campaignActive.length,
      },
    };
  }

  async close(): Promise<void> {
    await this.emailQueue.close();
    await this.campaignQueue.close();
  }
}

export const emailQueueService = new EmailQueueService();