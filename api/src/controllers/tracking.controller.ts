// api/src/controllers/tracking.controller.ts

import { Request, Response } from 'express';
import { EmailTracking } from '../models/EmailTracking.model';
import { getContactsByStatusWithCounts } from '../services/tracking/aggregation.service';

type EmailStatus = 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced';

const VALID_STATUSES: readonly EmailStatus[] = ['sent', 'delivered', 'opened', 'clicked', 'bounced'];

/**
 * Get all contacts grouped by email status
 * GET /api/tracking/contacts/by-status?campaignId=xxx
 */
export const getContactsByEmailStatus = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { campaignId } = req.query;

    const result = await getContactsByStatusWithCounts(
      EmailTracking,
      campaignId as string | undefined
    );

    res.status(200).json({
      success: true,
      campaignId: campaignId || 'all',
      ...result,
    });
  } catch (error) {
    console.error('Error fetching contacts by status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch contacts by status',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Get contacts for a specific status
 * GET /api/tracking/contacts/by-status/:status?campaignId=xxx
 */
export const getContactsBySpecificStatus = async (
  req: Request<{ status: string }>,
  res: Response
): Promise<void> => {
  try {
    const { status } = req.params;
    const { campaignId } = req.query;

    if (!VALID_STATUSES.includes(status as EmailStatus)) {
      res.status(400).json({
        success: false,
        message: `Invalid status. Valid statuses: ${VALID_STATUSES.join(', ')}`,
      });
      return;
    }

    const result = await getContactsByStatusWithCounts(
      EmailTracking,
      campaignId as string | undefined
    );

    res.status(200).json({
      success: true,
      status,
      campaignId: campaignId || 'all',
      contacts: result.data[status as EmailStatus],
      count: result.counts[status as EmailStatus],
    });
  } catch (error) {
    console.error('Error fetching contacts by specific status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch contacts',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};