// Workflow execution service with queue management and monitoring

import { Queue, Worker, Job } from 'bullmq';
import { Redis } from 'ioredis';
import { 
  Workflow, 
  WorkflowExecution, 
  ScheduledWorkflowJob,
  WorkflowDatabase 
} from '../models/workflow-database';
import { WorkflowExecutionEngine } from '../lib/workflow-execution';
import { WorkflowValidator } from '../lib/workflow-validation';

export interface WorkflowJobData {
  type: 'execute_workflow' | 'continue_execution' | 'retry_execution' | 'schedule_check';
  workflowId: string;
  contactId?: string;
  executionId?: string;
  nodeId?: string;
  triggerData?: any;
  retryCount?: number;
  priority?: number;
}

export class WorkflowExecutionService {
  private redis: Redis;
  private workflowQueue: Queue;
  private schedulingQueue: Queue;
  private executionEngine: WorkflowExecutionEngine;
  private workers: Worker[] = [];
  private isRunning = false;

  constructor(
    redisConnection: Redis,
    executionEngine: WorkflowExecutionEngine
  ) {
    this.redis = redisConnection;
    this.executionEngine = executionEngine;
    
    // Initialize queues
    this.workflowQueue = new Queue('workflow-execution', {
      connection: this.redis,
      defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 50,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      },
    });

    this.schedulingQueue = new Queue('workflow-scheduling', {
      connection: this.redis,
      defaultJobOptions: {
        removeOnComplete: 50,
        removeOnFail: 25,
        attempts: 2,
      },
    });

    this.setupWorkers();
    this.setupScheduler();
  }

  // Initialize workers for processing jobs
  private setupWorkers(): void {
    // Main workflow execution worker
    const executionWorker = new Worker(
      'workflow-execution',
      async (job: Job<WorkflowJobData>) => {
        return await this.processWorkflowJob(job);
      },
      {
        connection: this.redis,
        concurrency: 10,
        stalledInterval: 30000,
        maxStalledCount: 3,
      }
    );

    // Scheduling worker for delayed tasks
    const schedulingWorker = new Worker(
      'workflow-scheduling',
      async (job: Job<WorkflowJobData>) => {
        return await this.processSchedulingJob(job);
      },
      {
        connection: this.redis,
        concurrency: 5,
      }
    );

    // Event handlers
    executionWorker.on('completed', (job) => {
      console.log(`Workflow job ${job.id} completed successfully`);
    });

    executionWorker.on('failed', (job, err) => {
      console.error(`Workflow job ${job?.id} failed:`, err);
      this.handleJobFailure(job, err);
    });

    executionWorker.on('stalled', (jobId) => {
      console.warn(`Workflow job ${jobId} stalled`);
    });

    this.workers = [executionWorker, schedulingWorker];
  }

  // Setup recurring scheduler for checking due jobs
  private setupScheduler(): void {
    // Check for due scheduled jobs every minute
    setInterval(async () => {
      if (!this.isRunning) return;
      
      try {
        await this.processDueJobs();
      } catch (error) {
        console.error('Error processing due jobs:', error);
      }
    }, 60000); // 1 minute

    // Health check every 5 minutes
    setInterval(async () => {
      if (!this.isRunning) return;
      
      try {
        await this.performHealthCheck();
      } catch (error) {
        console.error('Health check failed:', error);
      }
    }, 300000); // 5 minutes
  }

  // Start the service
  async start(): Promise<void> {
    this.isRunning = true;
    console.log('Workflow execution service started');
    
    // Process any pending jobs on startup
    await this.processDueJobs();
  }

  // Stop the service
  async stop(): Promise<void> {
    this.isRunning = false;
    
    // Close workers gracefully
    await Promise.all(this.workers.map(worker => worker.close()));
    
    // Close queues
    await this.workflowQueue.close();
    await this.schedulingQueue.close();
    
    console.log('Workflow execution service stopped');
  }

  // Execute workflow for specific contacts
  async executeWorkflow(
    workflowId: string,
    contactIds: string[],
    triggerData?: any,
    options?: {
      priority?: number;
      delay?: number;
      batchSize?: number;
    }
  ): Promise<{ jobIds: string[]; totalJobs: number }> {
    const workflow = await WorkflowDatabase.getWorkflow(workflowId);
    if (!workflow) {
      throw new Error('Workflow not found');
    }

    if (!workflow.isActive) {
      throw new Error('Workflow is not active');
    }

    // Validate workflow before execution
    const validation = WorkflowValidator.validateWorkflow(workflow);
    if (!validation.isValid) {
      throw new Error('Workflow validation failed: ' + validation.errors.map(e => e.message).join(', '));
    }

    const batchSize = options?.batchSize || 100;
    const priority = options?.priority || 0;
    const delay = options?.delay || 0;

    const jobIds: string[] = [];

    // Process contacts in batches
    for (let i = 0; i < contactIds.length; i += batchSize) {
      const batch = contactIds.slice(i, i + batchSize);
      
      for (const contactId of batch) {
        const job = await this.workflowQueue.add(
          'execute_workflow',
          {
            type: 'execute_workflow',
            workflowId,
            contactId,
            triggerData,
            priority
          },
          {
            priority: 100 - priority, // BullMQ uses lower numbers for higher priority
            delay: delay + Math.floor(i / batchSize) * 1000, // Stagger batch execution
            jobId: `${workflowId}-${contactId}-${Date.now()}`
          }
        );
        
        jobIds.push(job.id!);
      }
    }

    return {
      jobIds,
      totalJobs: contactIds.length
    };
  }

  // Schedule workflow continuation after wait node
  async scheduleWorkflowContinuation(
    executionId: string,
    nodeId: string,
    scheduledAt: Date,
    priority = 0
  ): Promise<string> {
    // Store in database for persistence
    const scheduledJob = await WorkflowDatabase.scheduleJob({
      executionId,
      nodeId,
      jobType: 'wait_delay',
      scheduledAt,
      priority,
      status: 'pending'
    });

    // Add to scheduling queue
    const delay = scheduledAt.getTime() - Date.now();
    const job = await this.schedulingQueue.add(
      'continue_execution',
      {
        type: 'continue_execution',
        executionId,
        nodeId,
        priority
      },
      {
        delay: Math.max(0, delay),
        priority: 100 - priority,
        jobId: scheduledJob._id.toString()
      }
    );

    return job.id!;
  }

  // Process workflow execution job
  private async processWorkflowJob(job: Job<WorkflowJobData>): Promise<any> {
    const { type, workflowId, contactId, executionId, nodeId, triggerData, retryCount = 0 } = job.data;

    try {
      switch (type) {
        case 'execute_workflow':
          return await this.executeWorkflowForContact(workflowId!, contactId!, triggerData);
        
        case 'continue_execution':
          return await this.continueWorkflowExecution(executionId!, nodeId!);
        
        case 'retry_execution':
          return await this.retryFailedExecution(executionId!, nodeId!);
        
        default:
          throw new Error(`Unknown job type: ${type}`);
      }
    } catch (error) {
      // Update execution with error
      if (executionId) {
        await WorkflowDatabase.updateExecutionStatus(executionId, 'failed', {
          error: error instanceof Error ? error.message : 'Unknown error',
          failedAt: new Date(),
          retryCount
        });
      }
      
      throw error;
    }
  }

  // Process scheduling job
  private async processSchedulingJob(job: Job<WorkflowJobData>): Promise<any> {
    const { type, executionId, nodeId } = job.data;

    try {
      if (type === 'continue_execution') {
        // Update scheduled job status
        await ScheduledWorkflowJob.findByIdAndUpdate(job.id, {
          status: 'processing',
          processedAt: new Date()
        });

        const result = await this.continueWorkflowExecution(executionId!, nodeId!);

        // Mark as completed
        await ScheduledWorkflowJob.findByIdAndUpdate(job.id, {
          status: 'completed',
          completedAt: new Date()
        });

        return result;
      }
    } catch (error) {
      // Mark scheduled job as failed
      await ScheduledWorkflowJob.findByIdAndUpdate(job.id, {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        completedAt: new Date()
      });
      
      throw error;
    }
  }

  // Execute workflow for a single contact
  private async executeWorkflowForContact(
    workflowId: string,
    contactId: string,
    triggerData?: any
  ): Promise<any> {
    const workflow = await WorkflowDatabase.getWorkflow(workflowId);
    if (!workflow) {
      throw new Error('Workflow not found');
    }

    console.log(`Executing workflow ${workflowId} for contact ${contactId}`);

    // Create execution record
    const execution = await WorkflowDatabase.createExecution({
      workflowId,
      contactId,
      status: 'running',
      context: {
        variables: {},
        triggerData,
        metadata: {
          startTime: new Date(),
          currentStep: 1,
          totalSteps: workflow.nodes.length,
          retryCount: 0,
          priority: 0
        }
      },
      startedAt: new Date()
    });

    try {
      // Execute workflow using the execution engine
      const result = await this.executionEngine.executeWorkflow(
        workflow,
        contactId,
        triggerData
      );

      // Update execution with results
      await WorkflowDatabase.updateExecutionStatus(execution._id.toString(), result.status, {
        executionPath: result.executionPath,
        totalDuration: Date.now() - execution.startedAt.getTime()
      });

      // Update workflow statistics
      await WorkflowDatabase.updateWorkflowStats(workflowId, {
        success: result.status === 'completed',
        duration: Date.now() - execution.startedAt.getTime()
      });

      return {
        executionId: execution._id.toString(),
        status: result.status,
        duration: Date.now() - execution.startedAt.getTime()
      };

    } catch (error) {
      // Update execution with error
      await WorkflowDatabase.updateExecutionStatus(execution._id.toString(), 'failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      // Update workflow statistics
      await WorkflowDatabase.updateWorkflowStats(workflowId, {
        success: false,
        duration: Date.now() - execution.startedAt.getTime()
      });

      throw error;
    }
  }

  // Continue workflow execution from a specific node
  private async continueWorkflowExecution(
    executionId: string,
    nodeId: string
  ): Promise<any> {
    const execution = await WorkflowExecution.findById(executionId);
    if (!execution) {
      throw new Error('Execution not found');
    }

    const workflow = await WorkflowDatabase.getWorkflow(execution.workflowId);
    if (!workflow) {
      throw new Error('Workflow not found');
    }

    console.log(`Continuing workflow execution ${executionId} from node ${nodeId}`);

    // Update execution status
    await WorkflowDatabase.updateExecutionStatus(executionId, 'running');

    // Find the node to continue from
    const node = workflow.nodes.find(n => n.id === nodeId);
    if (!node) {
      throw new Error('Node not found');
    }

    // Continue execution from this node
    // This would involve calling the execution engine with the current context
    // Implementation depends on your execution engine's capabilities

    return {
      executionId,
      continuedFrom: nodeId,
      status: 'continued'
    };
  }

  // Retry failed execution
  private async retryFailedExecution(
    executionId: string,
    nodeId: string
  ): Promise<any> {
    const execution = await WorkflowExecution.findById(executionId);
    if (!execution) {
      throw new Error('Execution not found');
    }

    console.log(`Retrying failed execution ${executionId} from node ${nodeId}`);

    // Increment retry count
    const retryCount = (execution.context.metadata.retryCount || 0) + 1;
    
    // Update execution context
    await WorkflowExecution.findByIdAndUpdate(executionId, {
      'context.metadata.retryCount': retryCount,
      status: 'running',
      lastActivityAt: new Date()
    });

    // Continue execution from failed node
    return await this.continueWorkflowExecution(executionId, nodeId);
  }

  // Process due scheduled jobs
  private async processDueJobs(): Promise<void> {
    const dueJobs = await WorkflowDatabase.getDueJobs(50);
    
    for (const job of dueJobs) {
      try {
        // Add to appropriate queue based on job type
        if (job.jobType === 'wait_delay') {
          await this.workflowQueue.add(
            'continue_execution',
            {
              type: 'continue_execution',
              executionId: job.executionId!,
              nodeId: job.nodeId,
              priority: job.priority
            },
            {
              priority: 100 - job.priority,
              jobId: `continue-${job._id}`
            }
          );
        }

        // Mark job as processing
        await ScheduledWorkflowJob.findByIdAndUpdate(job._id, {
          status: 'processing',
          processedAt: new Date()
        });

      } catch (error) {
        console.error(`Failed to process due job ${job._id}:`, error);
        
        // Mark job as failed if max retries exceeded
        if (job.retryCount >= job.maxRetries) {
          await ScheduledWorkflowJob.findByIdAndUpdate(job._id, {
            status: 'failed',
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        } else {
          // Schedule retry
          const retryDelay = Math.pow(2, job.retryCount) * 60000; // Exponential backoff
          await ScheduledWorkflowJob.findByIdAndUpdate(job._id, {
            retryCount: job.retryCount + 1,
            nextRetryAt: new Date(Date.now() + retryDelay)
          });
        }
      }
    }
  }

  // Perform health check
  private async performHealthCheck(): Promise<void> {
    try {
      // Check queue health
      const waiting = await this.workflowQueue.getWaiting();
      const active = await this.workflowQueue.getActive();
      const failed = await this.workflowQueue.getFailed();

      console.log(`Queue Health - Waiting: ${waiting.length}, Active: ${active.length}, Failed: ${failed.length}`);

      // Alert if too many failed jobs
      if (failed.length > 100) {
        console.warn(`High number of failed jobs: ${failed.length}`);
        // Could send alert notification here
      }

      // Check for stalled executions
      const stalledExecutions = await WorkflowExecution.find({
        status: 'running',
        lastActivityAt: { $lt: new Date(Date.now() - 30 * 60 * 1000) } // 30 minutes
      });

      if (stalledExecutions.length > 0) {
        console.warn(`Found ${stalledExecutions.length} stalled executions`);
        
        // Mark stalled executions as failed
        for (const execution of stalledExecutions) {
          await WorkflowDatabase.updateExecutionStatus(
            execution._id.toString(),
            'failed',
            { error: 'Execution stalled - exceeded timeout' }
          );
        }
      }

      // Clean up old completed jobs
      await this.workflowQueue.clean(24 * 60 * 60 * 1000, 100, 'completed');
      await this.workflowQueue.clean(7 * 24 * 60 * 60 * 1000, 50, 'failed');

    } catch (error) {
      console.error('Health check failed:', error);
    }
  }

  // Handle job failure
  private async handleJobFailure(job: Job<WorkflowJobData> | undefined, error: Error): Promise<void> {
    if (!job) return;

    const { workflowId, contactId, executionId } = job.data;

    // Log failure
    console.error(`Job ${job.id} failed:`, {
      workflowId,
      contactId,
      executionId,
      error: error.message,
      attempts: job.attemptsMade,
      maxAttempts: job.opts.attempts
    });

    // If max attempts reached, mark execution as permanently failed
    if (job.attemptsMade >= (job.opts.attempts || 3)) {
      if (executionId) {
        await WorkflowDatabase.updateExecutionStatus(executionId, 'failed', {
          error: error.message,
          maxAttemptsExceeded: true,
          finalFailureAt: new Date()
        });
      }

      // Update workflow statistics
      if (workflowId) {
        await WorkflowDatabase.updateWorkflowStats(workflowId, {
          success: false,
          duration: 0
        });
      }
    }
  }

  // Get queue statistics
  async getQueueStats(): Promise<any> {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      this.workflowQueue.getWaiting(),
      this.workflowQueue.getActive(),
      this.workflowQueue.getCompleted(),
      this.workflowQueue.getFailed(),
      this.workflowQueue.getDelayed()
    ]);

    return {
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length,
      delayed: delayed.length,
      total: waiting.length + active.length + completed.length + failed.length + delayed.length
    };
  }

  // Get execution metrics
  async getExecutionMetrics(timeframe = '24h'): Promise<any> {
    const hours = timeframe === '24h' ? 24 : timeframe === '7d' ? 168 : 720; // 30d
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    const metrics = await WorkflowExecution.aggregate([
      {
        $match: {
          startedAt: { $gte: since }
        }
      },
      {
        $group: {
          _id: null,
          totalExecutions: { $sum: 1 },
          completedExecutions: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          failedExecutions: {
            $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
          },
          averageDuration: { $avg: '$totalDuration' },
          uniqueWorkflows: { $addToSet: '$workflowId' },
          uniqueContacts: { $addToSet: '$contactId' }
        }
      },
      {
        $project: {
          totalExecutions: 1,
          completedExecutions: 1,
          failedExecutions: 1,
          averageDuration: { $round: ['$averageDuration', 2] },
          successRate: {
            $round: [
              { $multiply: [{ $divide: ['$completedExecutions', '$totalExecutions'] }, 100] },
              2
            ]
          },
          uniqueWorkflows: { $size: '$uniqueWorkflows' },
          uniqueContacts: { $size: '$uniqueContacts' }
        }
      }
    ]);

    return metrics[0] || {
      totalExecutions: 0,
      completedExecutions: 0,
      failedExecutions: 0,
      averageDuration: 0,
      successRate: 0,
      uniqueWorkflows: 0,
      uniqueContacts: 0
    };
  }

  // Pause workflow execution
  async pauseWorkflow(workflowId: string): Promise<void> {
    // Update workflow status
    await Workflow.findByIdAndUpdate(workflowId, { isActive: false });

    // Pause running executions
    await WorkflowExecution.updateMany(
      { workflowId, status: 'running' },
      { 
        status: 'paused',
        pausedAt: new Date(),
        pauseReason: 'Workflow paused by user'
      }
    );

    // Remove pending jobs from queue
    const jobs = await this.workflowQueue.getJobs(['waiting', 'delayed']);
    for (const job of jobs) {
      if (job.data.workflowId === workflowId) {
        await job.remove();
      }
    }
  }

  // Resume workflow execution
  async resumeWorkflow(workflowId: string): Promise<void> {
    // Update workflow status
    await Workflow.findByIdAndUpdate(workflowId, { isActive: true });

    // Resume paused executions
    const pausedExecutions = await WorkflowExecution.find({
      workflowId,
      status: 'paused'
    });

    for (const execution of pausedExecutions) {
      await this.workflowQueue.add(
        'continue_execution',
        {
          type: 'continue_execution',
          executionId: execution._id.toString(),
          nodeId: execution.currentNodeId!
        },
        {
          priority: 50
        }
      );

      await WorkflowDatabase.updateExecutionStatus(
        execution._id.toString(),
        'running'
      );
    }
  }
}