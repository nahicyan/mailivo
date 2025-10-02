// api/src/controllers/automation-trigger.controller.ts
import { Request, Response } from 'express';
import { automationTriggerService } from '../services/automation-trigger.service';
import { logger } from '../utils/logger';

class AutomationTriggerController {
  /**
   * Handle property upload trigger from Landivo
   */
  async handlePropertyUpload(req: Request, res: Response): Promise<void> {
    try {
      logger.info('Property upload trigger received', { body: req.body });

      const result = await automationTriggerService.processTrigger({
        type: 'property_uploaded',
        data: req.body,
        source: 'landivo'
      });

      res.status(200).json({
        success: true,
        message: 'Property upload processed',
        executionsTriggered: result.executionsTriggered,
        automationsMatched: result.automationsMatched,
        executionIds: result.executionIds
      });
    } catch (error: any) {
      logger.error('Property upload trigger failed', { error: error.message, stack: error.stack });
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to process property upload trigger'
      });
    }
  }

  /**
   * Handle property update trigger from Landivo
   */
  async handlePropertyUpdate(req: Request, res: Response): Promise<void> {
    try {
      logger.info('Property update trigger received', { body: req.body });

      const result = await automationTriggerService.processTrigger({
        type: 'property_updated',
        data: req.body,
        source: 'landivo'
      });

      res.status(200).json({
        success: true,
        message: 'Property update processed',
        executionsTriggered: result.executionsTriggered,
        automationsMatched: result.automationsMatched,
        executionIds: result.executionIds
      });
    } catch (error: any) {
      logger.error('Property update trigger failed', { error: error.message });
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to process property update trigger'
      });
    }
  }

  /**
   * Handle property view trigger
   */
  async handlePropertyView(req: Request, res: Response): Promise<void> {
    try {
      logger.info('Property view trigger received', { body: req.body });

      const result = await automationTriggerService.processTrigger({
        type: 'property_viewed',
        data: req.body,
        source: 'landivo'
      });

      res.status(200).json({
        success: true,
        message: 'Property view processed',
        executionsTriggered: result.executionsTriggered,
        automationsMatched: result.automationsMatched,
        executionIds: result.executionIds
      });
    } catch (error: any) {
      logger.error('Property view trigger failed', { error: error.message });
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to process property view trigger'
      });
    }
  }

  /**
   * Handle campaign status change trigger
   */
  async handleCampaignStatusChange(req: Request, res: Response): Promise<void> {
    try {
      logger.info('Campaign status change trigger received', { body: req.body });

      const result = await automationTriggerService.processTrigger({
        type: 'campaign_status_changed',
        data: req.body,
        source: 'mailivo'
      });

      res.status(200).json({
        success: true,
        message: 'Campaign status change processed',
        executionsTriggered: result.executionsTriggered,
        automationsMatched: result.automationsMatched,
        executionIds: result.executionIds
      });
    } catch (error: any) {
      logger.error('Campaign status change trigger failed', { error: error.message });
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to process campaign status change trigger'
      });
    }
  }

  /**
   * Handle email tracking event trigger
   */
  async handleEmailTrackingEvent(req: Request, res: Response): Promise<void> {
    try {
      logger.info('Email tracking event trigger received', { body: req.body });

      const result = await automationTriggerService.processTrigger({
        type: 'email_tracking_status',
        data: req.body,
        source: 'mailivo'
      });

      res.status(200).json({
        success: true,
        message: 'Email tracking event processed',
        executionsTriggered: result.executionsTriggered,
        automationsMatched: result.automationsMatched,
        executionIds: result.executionIds
      });
    } catch (error: any) {
      logger.error('Email tracking event trigger failed', { error: error.message });
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to process email tracking event trigger'
      });
    }
  }
}

export const automationTriggerController = new AutomationTriggerController();