// app/src/app/dashboard/campaigns/page.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCampaigns } from '@/hooks/useCampaigns';
import { Plus, Mail, Users, TrendingUp, Search, Filter, Building, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function CampaignsPage() {
  const [filters, setFilters] = useState({ 
    status: '', 
    source: '', 
    page: 1,
    search: ''
  });
  
  const { data: campaignsData, isLoading } = useCampaigns(filters);

  const campaigns = campaignsData?.campaigns || [];

  const getStatusBadge = (campaign: any) => {
    const status = campaign.status;
    const source = campaign.source;

    switch (status) {
      case 'sent':
        return <Badge variant="default">{status}</Badge>;
      case 'draft':
        return <Badge variant="secondary">{status}</Badge>;
      case 'sending':
        return <Badge variant="destructive">{status}</Badge>;
      case 'active':
        return <Badge className="bg-green-100 text-green-800">{status}</Badge>;
      case 'paused':
        return <Badge className="bg-yellow-100 text-yellow-800">{status}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getSourceBadge = (source: string) => {
    switch (source) {
      case 'landivo':
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            <Building className="w-3 h-3 mr-1" />
            Landivo
          </Badge>
        );
      case 'manual':
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
            <User className="w-3 h-3 mr-1" />
            Manual
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
            <Mail className="w-3 h-3 mr-1" />
            {source || 'Manual'}
          </Badge>
        );
    }
  };

  const groupedCampaigns = campaigns.reduce((acc: any, campaign: any) => {
    const source = campaign.source || 'manual';
    if (!acc[source]) acc[source] = [];
    acc[source].push(campaign);
    return acc;
  }, {});

  if (isLoading) {
    return <div>Loading campaigns...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Campaigns</h1>
          <p className="text-muted-foreground">
            Manage your email marketing campaigns
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/landivo/run">
            <Button variant="outline">
              <Building className="mr-2 h-4 w-4" />
              Landivo Campaign
            </Button>
          </Link>
          <Link href="/dashboard/campaigns/create">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Campaign
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search campaigns..."
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            className="pl-10"
          />
        </div>
        
        <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="sending">Sending</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="paused">Paused</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filters.source} onValueChange={(value) => setFilters(prev => ({ ...prev, source: value }))}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="All Sources" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Sources</SelectItem>
            <SelectItem value="landivo">Landivo</SelectItem>
            <SelectItem value="manual">Manual</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Campaign Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Campaigns</CardTitle>
            <Mail className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaigns.length}</div>
            <p className="text-xs text-muted-foreground">
              {groupedCampaigns.landivo?.length || 0} Landivo + {groupedCampaigns.manual?.length || 0} Manual
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Contacts</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {campaigns.reduce((sum: number, c: any) => sum + (c.metrics?.sent || 0), 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Emails sent across all campaigns
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Emails Sent</CardTitle>
            <Mail className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {campaigns.reduce((sum: number, c: any) => sum + (c.metrics?.sent || 0), 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Total delivery count
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Open Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {campaigns.length > 0 ? 
                `${(campaigns.reduce((sum: number, c: any) => {
                  const rate = c.metrics?.sent > 0 ? (c.metrics.opened || 0) / c.metrics.sent * 100 : 0;
                  return sum + rate;
                }, 0) / campaigns.length).toFixed(1)}%` : 
                '0%'
              }
            </div>
            <p className="text-xs text-muted-foreground">
              Average across all campaigns
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Campaigns List */}
      <div className="space-y-6">
        {Object.keys(groupedCampaigns).length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Mail className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No campaigns yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first email campaign to get started
              </p>
              <div className="flex gap-2 justify-center">
                <Link href="/dashboard/campaigns/create">
                  <Button>Create Manual Campaign</Button>
                </Link>
                <Link href="/dashboard/landivo/run">
                  <Button variant="outline">Create Landivo Campaign</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          Object.entries(groupedCampaigns).map(([source, sourceCampaigns]: [string, any[]]) => (
            <div key={source} className="space-y-4">
              {Object.keys(groupedCampaigns).length > 1 && (
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold capitalize">
                    {source === 'landivo' ? 'Landivo Campaigns' : 'Manual Campaigns'}
                  </h2>
                  <Badge variant="secondary">{sourceCampaigns.length}</Badge>
                </div>
              )}
              
              {sourceCampaigns.map((campaign: any) => (
                <Card key={campaign._id || campaign.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg">{campaign.name}</CardTitle>
                          {getSourceBadge(campaign.source)}
                          {getStatusBadge(campaign)}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {campaign.subject || 'No subject'}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                      <div>
                        <span className="text-muted-foreground">Property:</span>
                        <p className="font-medium">{campaign.property || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Email List:</span>
                        <p className="font-medium">{campaign.emailList || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Template:</span>
                        <p className="font-medium">{campaign.emailTemplate || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Volume:</span>
                        <p className="font-medium">{campaign.emailVolume || 0}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {campaign.metrics?.sent || 0} sent
                      </div>
                      <div className="flex items-center gap-1">
                        <Mail className="h-4 w-4" />
                        {campaign.metrics?.opened || 0} opened
                      </div>
                      <div className="flex items-center gap-1">
                        <TrendingUp className="h-4 w-4" />
                        {campaign.metrics?.clicked || 0} clicked
                      </div>
                      <div className="ml-auto">
                        {formatDistanceToNow(new Date(campaign.createdAt), { addSuffix: true })}
                      </div>
                    </div>

                    {campaign.description && (
                      <p className="text-sm text-muted-foreground mt-2 border-t pt-2">
                        {campaign.description}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
}