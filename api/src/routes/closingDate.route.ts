// api/src/routes/closingDate.route.ts
import { Router } from 'express';
import { closingDateJob } from '../jobs/closingDate.job';
import { ClosingDateScheduler } from '../services/closingDateScheduler.service';

const router = Router();
const scheduler = new ClosingDateScheduler();

/**
 * Get job statistics and next reminder times
 */
router.get('/stats', async (_req, res) => {
  try {
    const stats = await closingDateJob.getJobStats();
    res.json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Get next reminder times for all automations
 */
router.get('/next-reminders', async (_req, res) => {
  try {
    const nextReminders = await scheduler.getNextReminderTimes();
    res.json({
      success: true,
      data: nextReminders,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Manually trigger a check (useful for testing)
 */
router.post('/trigger-check', async (_req, res) => {
  try {
    const result = await closingDateJob.triggerManualCheck();
    res.json({
      success: true,
      message: 'Manual check triggered',
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Manually execute due automations (for testing)
 */
router.post('/execute-due', async (_req, res) => {
  try {
    const result = await scheduler.checkAndExecuteDueAutomations();
    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Health check
 */
router.get('/health', (_req, res) => {
  res.json({ 
    status: 'OK',
    service: 'closing-date-automations',
    timestamp: new Date().toISOString()
  });
});

export { router as closingDateRoutes };