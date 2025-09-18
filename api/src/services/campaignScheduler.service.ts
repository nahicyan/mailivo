import cron from 'node-cron';
import { Campaign } from '../models/Campaign';
import { emailQueueService } from './emailQueue.service';
import { logger } from '../utils/logger';

class CampaignSchedulerService {
  private schedulerJob: cron.ScheduledTask | null = null;

  /**
   * Initialize the scheduler - runs every minute to check for due campaigns
   */
  start(): void {
    // Run every minute
    this.schedulerJob = cron.schedule('* * * * *', async () => {
      try {
        await this.checkAndSendScheduledCampaigns();
      } catch (error) {
        logger.error('Scheduler error:', error);
      }
    });

    logger.info('Campaign scheduler started');
  }

  /**
   * Check for campaigns that are due to be sent
   */
  private async checkAndSendScheduledCampaigns(): Promise<void> {
    const now = new Date();
    
    // Find campaigns that are scheduled and past their send time
    const dueCampaigns = await Campaign.find({
      status: 'scheduled',
      scheduledDate: { $lte: now },
      emailSchedule: 'scheduled'
    });

    if (dueCampaigns.length === 0) {
      return;
    }

    logger.info(`Found ${dueCampaigns.length} campaigns to send`);

    for (const campaign of dueCampaigns) {
      try {
        // Update status to prevent duplicate sends
        campaign.status = 'sending';
        await campaign.save();

        // Queue the campaign for sending
        await emailQueueService.sendCampaign(
          campaign._id.toString(),
          campaign.userId.toString()
        );

        logger.info(`Queued scheduled campaign: ${campaign.name}`, {
          campaignId: campaign._id,
          scheduledDate: campaign.scheduledDate
        });
      } catch (error) {
        logger.error(`Failed to queue campaign ${campaign._id}:`, error);
        
        // Revert status on error
        campaign.status = 'scheduled';
        await campaign.save();
      }
    }
  }

  /**
   * Stop the scheduler
   */
  stop(): void {
    if (this.schedulerJob) {
      this.schedulerJob.stop();
      logger.info('Campaign scheduler stopped');
    }
  }

  /**
   * Manually trigger a check for scheduled campaigns
   */
  async triggerCheck(): Promise<void> {
    await this.checkAndSendScheduledCampaigns();
  }
}

export const campaignSchedulerService = new CampaignSchedulerService();