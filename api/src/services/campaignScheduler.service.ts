import * as cron from 'node-cron';
import { Campaign, ICampaign } from '../models/Campaign';
import { emailQueueService } from './emailQueue.service';
import { logger } from '../utils/logger';
import { Document } from 'mongoose';

class CampaignSchedulerService {
  private schedulerJob: cron.ScheduledTask | null = null;

  start(): void {
    this.schedulerJob = cron.schedule('* * * * *', async () => {
      try {
        await this.checkAndSendScheduledCampaigns();
      } catch (error) {
        logger.error('Scheduler error:', error);
      }
    });

    logger.info('Campaign scheduler started');
  }

  private async checkAndSendScheduledCampaigns(): Promise<void> {
    const now = new Date();
    
    const dueCampaigns = await Campaign.find({
      status: 'scheduled',
      scheduledDate: { $lte: now },
      emailSchedule: 'scheduled'
    }) as (ICampaign & Document)[];

    if (dueCampaigns.length === 0) {
      return;
    }

    logger.info(`Found ${dueCampaigns.length} campaigns to send`);

    for (const campaign of dueCampaigns) {
      try {
        campaign.status = 'sending';
        await campaign.save();

        await emailQueueService.sendCampaign(
          campaign._id!.toString(),
          campaign.userId.toString()
        );

        logger.info(`Queued scheduled campaign: ${campaign.name}`, {
          campaignId: campaign._id!.toString(),
          scheduledDate: campaign.scheduledDate
        });
      } catch (error) {
        logger.error(`Failed to queue campaign ${campaign._id}:`, error);
        
        campaign.status = 'scheduled';
        await campaign.save();
      }
    }
  }

  stop(): void {
    if (this.schedulerJob) {
      this.schedulerJob.stop();
      logger.info('Campaign scheduler stopped');
    }
  }

  async triggerCheck(): Promise<void> {
    await this.checkAndSendScheduledCampaigns();
  }
}

export const campaignSchedulerService = new CampaignSchedulerService();