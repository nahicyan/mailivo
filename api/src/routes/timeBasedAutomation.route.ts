// api/src/routes/timeBasedAutomation.route.ts
import { Router } from 'express';
import { timeBasedAutomationJob } from '../jobs/timeBasedAutomation.job';
import { TimeBasedAutomationScheduler } from '../services/timeBasedAutomationScheduler.service';

const router = Router();
const scheduler = new TimeBasedAutomationScheduler();

/**
 * Get job statistics and next execution times
 */
router.get('/stats', async (_req, res) => {
  try {
    const stats = await timeBasedAutomationJob.getJobStats();
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
 * Get next execution times for all automations
 */
router.get('/next-executions', async (_req, res) => {
  try {
    const nextExecutions = await scheduler.getNextExecutionTimes();
    res.json({
      success: true,
      data: nextExecutions,
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
    const result = await timeBasedAutomationJob.triggerManualCheck();
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
    service: 'time-based-automations',
    timestamp: new Date().toISOString()
  });
});

export { router as timeBasedAutomationRoutes };
