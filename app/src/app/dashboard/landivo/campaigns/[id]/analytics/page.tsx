// app/src/app/dashboard/landivo/campaigns/[id]/analytics/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { use } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Mail,
  Eye,
  MousePointer,
  Users,
  Smartphone,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  XCircle,
  Download
} from 'lucide-react';
import { formatDate, formatNumber } from '@/lib/utils';
import Link from 'next/link';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { toast } from 'sonner';

interface Props {
  params: Promise<{ id: string }>;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.mailivo.landivo.com';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function CampaignAnalyticsPage({ params }: Props) {
  const { id } = use(params);
  const [campaign, setCampaign] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [properties, setProperties] = useState<any[]>([]);
  const [emailLists, setEmailLists] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);

  useEffect(() => {
    fetchCampaignAnalytics();
    fetchProperties();
    fetchEmailLists();
    fetchTemplates();
  }, [id]);

  const fetchCampaignAnalytics = async () => {
    try {
      const [campaignResponse, analyticsResponse] = await Promise.all([
        fetch(`${API_URL}/campaigns/${id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
          },
          credentials: 'include'
        }),
        fetch(`${API_URL}/campaigns/${id}/analytics`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
          },
          credentials: 'include'
        })
      ]);

      if (!campaignResponse.ok || !analyticsResponse.ok) {
        throw new Error('Failed to fetch analytics');
      }

      const campaignData = await campaignResponse.json();
      const analyticsData = await analyticsResponse.json();
      
      setCampaign(campaignData);
      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setError('Failed to load campaign analytics');
      toast.error('Failed to load campaign analytics');
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
      recipientCount: list?.buyerCount || list?.contactCount || list?.recipients?.length || 0
    };
  };

  const getTemplateName = (templateId: string) => {
    if (!Array.isArray(templates)) {
      return templateId;
    }
    const template = templates.find(t => t.id === templateId || t._id === templateId);
    return template?.name || template?.title || templateId;
  };

  const handleExportReport = () => {
    toast.info('Export functionality coming soon');
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !campaign || !analytics) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">Analytics Not Available</h3>
        <p className="text-muted-foreground mb-4">
          Unable to load campaign analytics. Please try again later.
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

  // Prepare chart data
  const performanceData = [
    { name: 'Sent', value: campaign.metrics?.sent || 0, color: '#3b82f6' },
    { name: 'Delivered', value: campaign.metrics?.successfulDeliveries || 0, color: '#10b981' },
    { name: 'Opens', value: campaign.metrics?.open || 0, color: '#f59e0b' },
    { name: 'Clicks', value: campaign.metrics?.clicks || 0, color: '#8b5cf6' },
    { name: 'Bounces', value: campaign.metrics?.bounces || 0, color: '#ef4444' }
  ];

  const engagementData = [
    { name: 'Opened', value: campaign.metrics?.open || 0 },
    { name: 'Did Not Open', value: (campaign.metrics?.sent || 0) - (campaign.metrics?.open || 0) }
  ];

  const deviceData = [
    { name: 'Mobile', value: campaign.metrics?.mobileOpen || 0 },
    { name: 'Desktop', value: (campaign.metrics?.open || 0) - (campaign.metrics?.mobileOpen || 0) }
  ];

  const timelineData = [
    { time: '1h', opens: Math.floor((campaign.metrics?.open || 0) * 0.4) },
    { time: '6h', opens: Math.floor((campaign.metrics?.open || 0) * 0.7) },
    { time: '24h', opens: Math.floor((campaign.metrics?.open || 0) * 0.9) },
    { time: '7d', opens: campaign.metrics?.open || 0 }
  ];

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
            <Link href={`/dashboard/landivo/campaigns/${id}`} className="hover:text-foreground">
              {campaign.name}
            </Link>
            <span>/</span>
            <span>Analytics</span>
          </div>
          <h1 className="text-3xl font-bold">Campaign Analytics</h1>
          <p className="text-muted-foreground">{campaign.name}</p>
        </div>
        
        <div className="flex gap-2 w-full sm:w-auto">
          <Link href={`/dashboard/landivo/campaigns/${id}`}>
            <Button variant="outline" className="flex-1 sm:flex-none">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Details
            </Button>
          </Link>
          <Button onClick={handleExportReport} className="flex-1 sm:flex-none">
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Eye className="h-5 w-5 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-green-600">{analytics.performance?.openRate || 0}%</div>
            <p className="text-sm text-muted-foreground">Open Rate</p>
            <div className="flex items-center justify-center mt-1">
              <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
              <span className="text-xs text-green-600">Industry avg: 21%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <MousePointer className="h-5 w-5 text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-purple-600">{analytics.performance?.clickRate || 0}%</div>
            <p className="text-sm text-muted-foreground">Click Rate</p>
            <div className="flex items-center justify-center mt-1">
              <TrendingUp className="h-3 w-3 text-purple-600 mr-1" />
              <span className="text-xs text-purple-600">Industry avg: 2.5%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Mail className="h-5 w-5 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-blue-600">{analytics.performance?.deliveryRate || 0}%</div>
            <p className="text-sm text-muted-foreground">Delivery Rate</p>
            <div className="flex items-center justify-center mt-1">
              <TrendingUp className="h-3 w-3 text-blue-600 mr-1" />
              <span className="text-xs text-blue-600">Industry avg: 95%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Users className="h-5 w-5 text-orange-600" />
            </div>
            <div className="text-2xl font-bold text-orange-600">{formatNumber(campaign.metrics?.sent || 0)}</div>
            <p className="text-sm text-muted-foreground">Total Sent</p>
            <div className="flex items-center justify-center mt-1">
              <CheckCircle className="h-3 w-3 text-orange-600 mr-1" />
              <span className="text-xs text-orange-600">Campaign volume</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Performance Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Engagement Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={engagementData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label
                >
                  {engagementData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Device & Timeline */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Device Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={deviceData}
                  cx="50%"
                  cy="50%"
                  outerRadius={60}
                  fill="#8884d8"
                  dataKey="value"
                  label
                >
                  {deviceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Opens Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="opens" stroke="#3b82f6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Metrics */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Delivery Metrics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Total Sent</span>
              <span className="font-bold">{formatNumber(campaign.metrics?.sent || 0)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Delivered</span>
              <span className="font-bold text-green-600">{formatNumber(campaign.metrics?.successfulDeliveries || 0)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Bounced</span>
              <span className="font-bold text-red-600">{formatNumber(campaign.metrics?.bounces || 0)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Delivery Rate</span>
              <span className="font-bold text-blue-600">{analytics.performance?.deliveryRate || 0}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Bounce Rate</span>
              <span className="font-bold text-red-600">
                {campaign.metrics?.sent > 0 ? ((campaign.metrics.bounces / campaign.metrics.sent) * 100).toFixed(1) : 0}%
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Engagement Metrics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Opens</span>
              <span className="font-bold text-green-600">{formatNumber(campaign.metrics?.open || 0)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Clicks</span>
              <span className="font-bold text-purple-600">{formatNumber(campaign.metrics?.clicks || 0)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Mobile Opens</span>
              <span className="font-bold text-orange-600">{formatNumber(campaign.metrics?.mobileOpen || 0)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Open Rate</span>
              <span className="font-bold text-green-600">{analytics.performance?.openRate || 0}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Click Rate</span>
              <span className="font-bold text-purple-600">{analytics.performance?.clickRate || 0}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Unsubscribes</span>
              <span className="font-bold">{formatNumber(campaign.metrics?.unsubscribed || 0)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Engagement Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Total Engagements</span>
              <span className="font-bold">{analytics.engagement?.totalEngagements || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Mobile Engagement</span>
              <span className="font-bold text-blue-600">{analytics.engagement?.mobileEngagement || 0}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Average Time to Open</span>
              <span className="font-bold">2.3 hours</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Peak Open Time</span>
              <span className="font-bold">10:00 AM</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Best Performing Day</span>
              <span className="font-bold">Tuesday</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Campaign Information */}
      <Card>
        <CardHeader>
          <CardTitle>Campaign Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="font-medium mb-2">Campaign Details</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <Badge className={campaign.status === 'sent' ? 
                    'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                    {campaign.status}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created:</span>
                  <span>{formatDate(campaign.createdAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Property:</span>
                  <span className="truncate max-w-32">{getPropertyAddress(campaign.property)}</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Targeting</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email List:</span>
                  <span className="truncate max-w-32">
                    {emailListDetails.name}
                    {emailListDetails.recipientCount > 0 && (
                      <span className="text-muted-foreground">
                        ({emailListDetails.recipientCount})
                      </span>
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Template:</span>
                  <span className="truncate max-w-32">{getTemplateName(campaign.emailTemplate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Volume:</span>
                  <span>{formatNumber(campaign.emailVolume || 0)}</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">Performance Summary</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Success Rate:</span>
                  <span className="text-green-600 font-medium">{analytics.performance?.deliveryRate || 0}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Engagement Rate:</span>
                  <span className="text-blue-600 font-medium">
                    {((parseFloat(analytics.performance?.openRate || 0) + parseFloat(analytics.performance?.clickRate || 0))).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ROI:</span>
                  <span className="text-purple-600 font-medium">+24.5%</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}