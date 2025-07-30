// app/src/app/dashboard/landivo/campaigns/[id]/page.tsx
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
  BarChart3,
  Mail,
  Users,
  MousePointer,
  Eye,
  TrendingDown,
  CheckCircle,
  AlertTriangle,
  Calendar,
  Target,
  FileText,
  Play,
  Pause
} from 'lucide-react';
import { formatDate, formatNumber } from '@/lib/utils';
import Link from 'next/link';
import { toast } from 'sonner';

interface Props {
  params: Promise<{ id: string }>;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.mailivo.landivo.com';

export default function CampaignDetailsPage({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();
  const [campaign, setCampaign] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [properties, setProperties] = useState<any[]>([]);
  const [emailLists, setEmailLists] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);

  useEffect(() => {
    fetchCampaignDetails();
    fetchProperties();
    fetchEmailLists();
    fetchTemplates();
  }, [id]);

  const fetchCampaignDetails = async () => {
    try {
      const response = await fetch(`${API_URL}/campaigns/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Campaign not found');
      }

      const data = await response.json();
      setCampaign(data);
    } catch (error) {
      console.error('Error fetching campaign:', error);
      setError('Failed to load campaign details');
      toast.error('Failed to load campaign details');
    } finally {
      setLoading(false);
    }
  };

  const fetchProperties = async () => {
    try {
      const serverURL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:5000';
      const response = await fetch(`${serverURL}/residency/allresd/`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setProperties(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error fetching properties:', error);
    }
  };

  const fetchEmailLists = async () => {
    try {
      const response = await fetch(`${API_URL}/landivo-email-lists`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
        },
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setEmailLists(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error fetching email lists:', error);
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await fetch(`${API_URL}/templates`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
        },
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setTemplates(Array.isArray(data) ? data : (data.templates || []));
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const getPropertyAddress = (propertyId: string) => {
    if (!Array.isArray(properties)) {
      return propertyId;
    }
    const property = properties.find(p => p.id === propertyId || p._id === propertyId);
    if (!property) return propertyId;
    
    return `${property.streetAddress || ''}, ${property.city || ''}, ${property.zip || ''}`.replace(/^,\s*|,\s*$/g, '').replace(/,\s*,/g, ',');
  };

  const getEmailListDetails = (listId: string) => {
    if (!Array.isArray(emailLists)) {
      return {
        name: listId,
        recipientCount: 0
      };
    }
    const list = emailLists.find(l => l.id === listId || l._id === listId);
    return {
      name: list?.name || listId,
      recipientCount: list?.contactCount || list?.recipients?.length || 0
    };
  };

  const getTemplateName = (templateId: string) => {
    if (!Array.isArray(templates)) {
      return templateId;
    }
    const template = templates.find(t => t.id === templateId || t._id === templateId);
    return template?.name || template?.title || templateId;
  };

  const handleSendCampaign = async () => {
    try {
      const response = await fetch(`${API_URL}/campaigns/${id}/send`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
        },
        credentials: 'include'
      });

      if (!response.ok) throw new Error('Failed to send campaign');
      
      toast.success('Campaign sending initiated');
      fetchCampaignDetails(); // Refresh campaign data
    } catch (error) {
      console.error('Error sending campaign:', error);
      toast.error('Failed to send campaign');
    }
  };

  const handlePauseCampaign = async () => {
    try {
      const response = await fetch(`${API_URL}/campaigns/${id}/pause`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
        },
        credentials: 'include'
      });

      if (!response.ok) throw new Error('Failed to pause campaign');
      
      toast.success('Campaign paused');
      fetchCampaignDetails(); // Refresh campaign data
    } catch (error) {
      console.error('Error pausing campaign:', error);
      toast.error('Failed to pause campaign');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'sending': return 'bg-purple-100 text-purple-800';
      case 'sent': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <Card>
            <CardContent className="p-6 space-y-4">
              {[...Array(6)].map((_, i) => (
                <div key={i}>
                  <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                  <div className="h-10 bg-gray-200 rounded"></div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">Campaign Not Found</h3>
        <p className="text-muted-foreground mb-4">
          Please try again later.
        </p>
        <Link href="/dashboard/landivo/campaigns/manage">
          <Button>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Campaigns
          </Button>
        </Link>
      </div>
    );
  }

  // Calculate rates
  const openRate = campaign.metrics?.sent > 0 ? (campaign.metrics.open / campaign.metrics.sent * 100) : 0;
  const clickRate = campaign.metrics?.sent > 0 ? (campaign.metrics.clicks / campaign.metrics.sent * 100) : 0;
  const deliveryRate = campaign.metrics?.sent > 0 ? (campaign.metrics.successfulDeliveries / campaign.metrics.sent * 100) : 0;
  const bounceRate = campaign.metrics?.sent > 0 ? (campaign.metrics.bounces / campaign.metrics.sent * 100) : 0;

  const canSend = campaign.status === 'draft' || campaign.status === 'paused';
  const canPause = campaign.status === 'active' || campaign.status === 'sending';

  const emailListDetails = getEmailListDetails(campaign.emailList);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link href="/dashboard/landivo/campaigns/manage" className="hover:text-foreground">
              Campaigns
            </Link>
            <span>/</span>
            <span>Campaign Details</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{campaign.name}</h1>
            <Badge className={getStatusColor(campaign.status)}>
              {campaign.status}
            </Badge>
          </div>
        </div>
        
        <div className="flex gap-2 w-full sm:w-auto">
          <Link href={`/dashboard/landivo/campaigns/${id}/edit`}>
            <Button variant="outline" className="flex-1 sm:flex-none">
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </Link>
          <Link href={`/dashboard/landivo/campaigns/${id}/analytics`}>
            <Button variant="outline" className="flex-1 sm:flex-none">
              <BarChart3 className="mr-2 h-4 w-4" />
              Analytics
            </Button>
          </Link>
          {canSend && (
            <Button onClick={handleSendCampaign}>
              <Play className="mr-2 h-4 w-4" />
              Send
            </Button>
          )}
          {canPause && (
            <Button variant="outline" onClick={handlePauseCampaign}>
              <Pause className="mr-2 h-4 w-4" />
              Pause
            </Button>
          )}
        </div>
      </div>

      {/* Performance Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center mb-2">
              <Eye className="h-5 w-5 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-green-600">{openRate.toFixed(1)}%</div>
            <p className="text-sm text-muted-foreground">Open Rate</p>
            <p className="text-xs text-muted-foreground">{formatNumber(campaign.metrics?.open || 0)} opened</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center mb-2">
              <MousePointer className="h-5 w-5 text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-purple-600">{clickRate.toFixed(1)}%</div>
            <p className="text-sm text-muted-foreground">Click Rate</p>
            <p className="text-xs text-muted-foreground">{formatNumber(campaign.metrics?.clicks || 0)} clicked</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center mb-2">
              <TrendingDown className="h-5 w-5 text-red-600" />
            </div>
            <div className="text-2xl font-bold text-red-600">{bounceRate.toFixed(1)}%</div>
            <p className="text-sm text-muted-foreground">Bounce Rate</p>
            <p className="text-xs text-muted-foreground">{formatNumber(campaign.metrics?.bounces || 0)} bounced</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center mb-2">
              <CheckCircle className="h-5 w-5 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-blue-600">{deliveryRate.toFixed(1)}%</div>
            <p className="text-sm text-muted-foreground">Delivery Rate</p>
            <p className="text-xs text-muted-foreground">{formatNumber(campaign.metrics?.successfulDeliveries || 0)} delivered</p>
          </CardContent>
        </Card>
      </div>

      {/* Campaign Information */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Campaign Setup
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Property</Label>
                <p className="font-medium">{getPropertyAddress(campaign.property)}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Email List</Label>
                <p className="font-medium">
                  {emailListDetails.name}
                  {emailListDetails.recipientCount > 0 && (
                    <span className="text-sm text-muted-foreground ml-1">
                      ({formatNumber(emailListDetails.recipientCount)} recipients)
                    </span>
                  )}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Template</Label>
                <p className="font-medium">{getTemplateName(campaign.emailTemplate)}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Schedule</Label>
                <p className="font-medium">{campaign.emailSchedule}</p>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Volume</Label>
                <p className="font-medium">{formatNumber(campaign.emailVolume || 0)}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Source</Label>
                <p className="font-medium capitalize">{campaign.source || 'Landivo'}</p>
              </div>
            </div>

            {campaign.description && (
              <>
                <Separator />
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Description</Label>
                  <p className="font-medium">{campaign.description}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Performance Metrics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Total Sent</Label>
                <p className="text-lg font-bold text-blue-600">{formatNumber(campaign.metrics?.sent || 0)}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Total Opens</Label>
                <p className="text-lg font-bold text-green-600">{formatNumber(campaign.metrics?.open || 0)}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Total Clicks</Label>
                <p className="text-lg font-bold text-purple-600">{formatNumber(campaign.metrics?.clicks || 0)}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Mobile Opens</Label>
                <p className="text-lg font-bold text-orange-600">{formatNumber(campaign.metrics?.mobileOpen || 0)}</p>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Successful Deliveries</span>
                <span className="font-medium">{formatNumber(campaign.metrics?.successfulDeliveries || 0)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Bounces</span>
                <span className="font-medium text-red-600">{formatNumber(campaign.metrics?.bounces || 0)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Did Not Open</span>
                <span className="font-medium">{formatNumber(campaign.metrics?.didNotOpen || 0)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Campaign Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <div className="flex-1">
                <p className="font-medium">Campaign Created</p>
                <p className="text-sm text-muted-foreground">{formatDate(campaign.createdAt)}</p>
              </div>
            </div>
            
            {campaign.sentAt && (
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="font-medium">Campaign Sent</p>
                  <p className="text-sm text-muted-foreground">{formatDate(campaign.sentAt)}</p>
                </div>
              </div>
            )}

            {campaign.status === 'completed' && (
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="font-medium">Campaign Completed</p>
                  <p className="text-sm text-muted-foreground">{formatDate(campaign.updatedAt)}</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}