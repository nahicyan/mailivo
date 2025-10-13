// app/src/app/dashboard/automations/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { use } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import {
  ArrowLeft,
  Edit,
  Play,
  Pause,
  Copy,
  Trash2,
  AlertTriangle,
  Mail,
  Zap,
  Filter,
  Activity,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { useAutomation } from '@/hooks/useAutomation';
import { useTemplate } from '@/hooks/useTemplates';

interface Props {
  params: Promise<{ id: string }>;
}

export default function AutomationDetailsPage({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();
  const [automation, setAutomation] = useState<any>(null);
  const [emailLists, setEmailLists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toggleAutomation, duplicateAutomation, deleteAutomation } = useAutomation();

  // Get template ID from automation
  const templateId = automation?.action?.config?.emailTemplate;
  
  // Fetch template data using the hook
  const { data: template, isLoading: templateLoading } = useTemplate(templateId);

  useEffect(() => {
    fetchAutomationDetails();
    fetchEmailLists();
  }, [id]);

  const fetchAutomationDetails = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/automation/${id}`);
      
      if (response.data.success) {
        console.log('Loaded automation:', response.data.data);
        setAutomation(response.data.data);
      } else {
        throw new Error('Failed to load automation');
      }
    } catch (error) {
      console.error('Error fetching automation:', error);
      setError('Failed to load automation details');
      toast.error('Failed to load automation details');
    } finally {
      setLoading(false);
    }
  };

  const fetchEmailLists = async () => {
    try {
      const response = await api.get('/landivo-email-lists');
      const data = response.data;
      setEmailLists(Array.isArray(data) ? data : (data.emailLists || []));
    } catch (error) {
      console.error('Error fetching email lists:', error);
    }
  };

  const getTemplateName = () => {
    if (!templateId) return 'N/A';
    if (templateLoading) return 'Loading...';
    if (template) {
      return template.name || template.title || templateId;
    }
    console.warn("Couldn't find template name");
    return templateId; // Fallback to ID if template not found
  };

  const getEmailListName = (listId: string) => {
    if (!listId) return 'N/A';
    if (!Array.isArray(emailLists) || emailLists.length === 0) {
      return listId;
    }
    const list = emailLists.find(
      (l) => l.id === listId || l._id === listId
    );
    return list?.name || listId;
  };

  const handleToggle = async () => {
    try {
      await toggleAutomation(id);
      toast.success(`Automation ${automation.isActive ? 'deactivated' : 'activated'}`);
      fetchAutomationDetails();
    } catch (error: any) {
      toast.error(error.message || 'Failed to toggle automation');
    }
  };

  const handleDuplicate = async () => {
    try {
      await duplicateAutomation(id);
      toast.success('Automation duplicated successfully');
      router.push('/dashboard/automations');
    } catch (error: any) {
      toast.error(error.message || 'Failed to duplicate automation');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this automation?')) {
      return;
    }

    try {
      await deleteAutomation(id);
      toast.success('Automation deleted successfully');
      router.push('/dashboard/automations');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete automation');
    }
  };

  const getTriggerLabel = (type: string) => {
    const labels: Record<string, string> = {
      property_uploaded: 'Property Upload',
      time_based: 'Time Based',
      property_viewed: 'Property View',
      property_updated: 'Property Update',
      campaign_status_changed: 'Campaign Status',
      email_tracking_status: 'Email Tracking',
      unsubscribe: 'Unsubscribe',
    };
    return labels[type] || type;
  };

  const getTriggerDescription = (trigger: any) => {
    if (!trigger) return '';
    
    switch (trigger.type) {
      case 'property_uploaded':
        return 'Triggers when a new property is uploaded to Landivo';
      case 'time_based':
        return `Runs ${trigger.config?.schedule || 'daily'}`;
      case 'property_viewed':
        return 'Triggers when a logged-in user views a property';
      case 'property_updated':
        return 'Triggers when property details are updated';
      case 'campaign_status_changed':
        return 'Triggers when campaign status changes';
      case 'email_tracking_status':
        return 'Triggers on email tracking events';
      case 'unsubscribe':
        return 'Triggers when a user unsubscribes';
      default:
        return '';
    }
  };

  const getOperatorLabel = (operator: string) => {
    const labels: Record<string, string> = {
      equals: 'Equals',
      not_equals: 'Not Equals',
      contains: 'Contains',
      not_contains: 'Does Not Contain',
      greater_than: 'Greater Than',
      less_than: 'Less Than',
      between: 'Between',
      in: 'In',
      not_in: 'Not In',
    };
    return labels[operator] || operator;
  };

  const getScheduleLabel = (schedule: string) => {
    const labels: Record<string, string> = {
      immediate: 'Immediate',
      scheduled: 'Scheduled',
      time_delay: 'Time Delay',
    };
    return labels[schedule] || schedule;
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      property_data: 'Property Data',
      campaign_data: 'Campaign Data',
      email_tracking: 'Email Tracking',
      email_template: 'Email Template',
      buyer_data: 'Buyer Data',
    };
    return labels[category] || category;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error || !automation) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">Automation Not Found</h3>
        <p className="text-muted-foreground mb-4">
          The automation you're looking for doesn't exist or has been deleted.
        </p>
        <Link href="/dashboard/automations">
          <Button>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Automations
          </Button>
        </Link>
      </div>
    );
  }

  // Safe access with defaults
  const stats = automation.stats || { totalRuns: 0, successfulRuns: 0, failedRuns: 0 };
  const successRate = stats.totalRuns > 0
    ? ((stats.successfulRuns / stats.totalRuns) * 100).toFixed(1)
    : '0';
  
  const trigger = automation.trigger || { type: 'unknown', config: {} };
  const conditions = automation.conditions || [];
  const action = automation.action || { config: {} };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link href="/dashboard/automations" className="hover:text-foreground">
              Automations
            </Link>
            <span>/</span>
            <span>Details</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{automation.name || 'Unnamed Automation'}</h1>
            <Badge className={automation.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
              {automation.isActive ? 'Active' : 'Inactive'}
            </Badge>
            {stats.lastRunStatus && (
              <Badge variant={stats.lastRunStatus === 'success' ? 'default' : 'destructive'}>
                Last: {stats.lastRunStatus}
              </Badge>
            )}
          </div>
          {automation.description && (
            <p className="text-muted-foreground">{automation.description}</p>
          )}
        </div>

        <div className="flex gap-2 w-full sm:w-auto flex-wrap">
          <Link href={`/dashboard/automations/${id}/edit`}>
            <Button variant="outline" className="flex-1 sm:flex-none">
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </Link>
          <Button variant="outline" onClick={handleToggle}>
            {automation.isActive ? (
              <>
                <Pause className="mr-2 h-4 w-4" />
                Deactivate
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Activate
              </>
            )}
          </Button>
          <Button variant="outline" onClick={handleDuplicate}>
            <Copy className="mr-2 h-4 w-4" />
            Duplicate
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      {/* Performance Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center mb-2">
              <Activity className="h-5 w-5 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-blue-600">{stats.totalRuns}</div>
            <p className="text-sm text-muted-foreground">Total Runs</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center mb-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-green-600">{stats.successfulRuns}</div>
            <p className="text-sm text-muted-foreground">Successful</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center mb-2">
              <XCircle className="h-5 w-5 text-red-600" />
            </div>
            <div className="text-2xl font-bold text-red-600">{stats.failedRuns}</div>
            <p className="text-sm text-muted-foreground">Failed</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center mb-2">
              <Activity className="h-5 w-5 text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-purple-600">{successRate}%</div>
            <p className="text-sm text-muted-foreground">Success Rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Automation Configuration */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Trigger Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Trigger
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Type</Label>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary">{getTriggerLabel(trigger.type)}</Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {getTriggerDescription(trigger)}
              </p>
            </div>

            {trigger.config && Object.keys(trigger.config).length > 0 && (
              <>
                <Separator />
                <div>
                  <Label className="text-sm font-medium text-muted-foreground mb-2 block">Configuration</Label>
                  <div className="space-y-2 bg-muted/50 p-3 rounded-md">
                    {Object.entries(trigger.config).map(([key, value]) => (
                      <div key={key} className="flex justify-between items-start text-sm">
                        <span className="text-muted-foreground capitalize font-medium">
                          {key.replace(/_/g, ' ')}:
                        </span>
                        <span className="font-mono text-xs bg-background px-2 py-1 rounded">
                          {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Conditions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Conditions
              {conditions.length > 0 && (
                <Badge variant="outline" className="ml-auto">
                  {conditions.length}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {conditions.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">No conditions configured</p>
            ) : (
              conditions.map((condition: any, index: number) => (
                <div key={index} className="space-y-2 bg-muted/50 p-3 rounded-md">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{getCategoryLabel(condition.category)}</Badge>
                    {condition.matchAll !== undefined && (
                      <Badge variant="secondary" className="text-xs">
                        Match {condition.matchAll ? 'All' : 'Any'}
                      </Badge>
                    )}
                  </div>
                  {condition.conditions && condition.conditions.length > 0 && (
                    <div className="pl-3 border-l-2 border-primary/20 space-y-2 mt-2">
                      {condition.conditions.map((cond: any, idx: number) => (
                        <div key={idx} className="text-sm">
                          <span className="font-medium text-foreground">{cond.field || 'field'}</span>
                          <span className="text-muted-foreground mx-2">
                            {getOperatorLabel(cond.operator || 'equals')}
                          </span>
                          <span className="font-mono text-xs bg-background px-2 py-1 rounded">
                            {typeof cond.value === 'object' ? JSON.stringify(cond.value) : String(cond.value)}
                          </span>
                          {cond.secondValue && (
                            <>
                              <span className="text-muted-foreground mx-2">and</span>
                              <span className="font-mono text-xs bg-background px-2 py-1 rounded">
                                {typeof cond.secondValue === 'object' ? JSON.stringify(cond.secondValue) : String(cond.secondValue)}
                              </span>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  {index < conditions.length - 1 && <Separator className="mt-2" />}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Action Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Action: Send Campaign
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Campaign Type</Label>
              <p className="font-medium mt-1 capitalize">
                {action.config?.campaignType?.replace(/_/g, ' ') || 'N/A'}
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Schedule</Label>
              <p className="font-medium mt-1">
                {getScheduleLabel(action.config?.schedule || 'immediate')}
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Property Source</Label>
              <p className="font-medium mt-1 capitalize">
                {action.config?.propertySelection?.source || 'N/A'}
              </p>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Campaign Name</Label>
              <p className="font-medium mt-1">{action.config?.name || 'N/A'}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Subject</Label>
              <p className="font-medium mt-1">{action.config?.subject || 'N/A'}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Email List</Label>
              <p className="font-medium mt-1">{getEmailListName(action.config?.emailList)}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Email Template</Label>
              <div className="flex items-center gap-2 mt-1">
                <p className="font-medium">{getTemplateName()}</p>
                {templateLoading && <Loader2 className="h-3 w-3 animate-spin" />}
              </div>
            </div>
          </div>

          {action.config?.description && (
            <>
              <Separator />
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Description</Label>
                <p className="font-medium mt-1 text-sm">{action.config.description}</p>
              </div>
            </>
          )}

          {action.config?.delay && (
            <>
              <Separator />
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Delay</Label>
                <p className="font-medium mt-1">
                  {action.config.delay.amount} {action.config.delay.unit}
                </p>
              </div>
            </>
          )}

          {action.config?.scheduledDate && (
            <>
              <Separator />
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Scheduled Date</Label>
                <p className="font-medium mt-1">{formatDate(action.config.scheduledDate)}</p>
              </div>
            </>
          )}

          {action.config?.multiPropertyConfig && Object.keys(action.config.multiPropertyConfig).length > 0 && (
            <>
              <Separator />
              <div>
                <Label className="text-sm font-medium text-muted-foreground mb-3 block">
                  Multi-Property Configuration
                </Label>
                <div className="grid grid-cols-2 gap-4">
                  {action.config.multiPropertyConfig.sortStrategy && (
                    <div className="bg-muted/50 p-3 rounded-md">
                      <span className="text-xs text-muted-foreground block mb-1">Sort Strategy</span>
                      <p className="font-medium text-sm">{action.config.multiPropertyConfig.sortStrategy}</p>
                    </div>
                  )}
                  {action.config.multiPropertyConfig.maxProperties && (
                    <div className="bg-muted/50 p-3 rounded-md">
                      <span className="text-xs text-muted-foreground block mb-1">Max Properties</span>
                      <p className="font-medium text-sm">{action.config.multiPropertyConfig.maxProperties}</p>
                    </div>
                  )}
                  {action.config.multiPropertyConfig.financingEnabled !== undefined && (
                    <div className="bg-muted/50 p-3 rounded-md">
                      <span className="text-xs text-muted-foreground block mb-1">Financing</span>
                      <p className="font-medium text-sm">
                        {action.config.multiPropertyConfig.financingEnabled ? 'Enabled' : 'Disabled'}
                      </p>
                    </div>
                  )}
                  {action.config.multiPropertyConfig.planStrategy && (
                    <div className="bg-muted/50 p-3 rounded-md">
                      <span className="text-xs text-muted-foreground block mb-1">Plan Strategy</span>
                      <p className="font-medium text-sm">{action.config.multiPropertyConfig.planStrategy}</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {automation.createdAt && (
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                <div className="flex-1">
                  <p className="font-medium">Automation Created</p>
                  <p className="text-sm text-muted-foreground">{formatDate(automation.createdAt)}</p>
                </div>
              </div>
            )}

            {automation.lastRunAt && (
              <div className="flex items-start gap-3">
                <div className={`w-2 h-2 rounded-full mt-2 ${
                  stats.lastRunStatus === 'success' ? 'bg-green-500' : 'bg-red-500'
                }`}></div>
                <div className="flex-1">
                  <p className="font-medium">Last Execution</p>
                  <p className="text-sm text-muted-foreground">{formatDate(automation.lastRunAt)}</p>
                  {stats.lastRunStatus && (
                    <Badge 
                      variant={stats.lastRunStatus === 'success' ? 'default' : 'destructive'}
                      className="mt-1"
                    >
                      {stats.lastRunStatus}
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {automation.updatedAt && (
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div className="flex-1">
                  <p className="font-medium">Last Updated</p>
                  <p className="text-sm text-muted-foreground">{formatDate(automation.updatedAt)}</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}