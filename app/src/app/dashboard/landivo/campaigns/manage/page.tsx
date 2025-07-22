// app/src/app/dashboard/landivo/campaigns/manage/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal,
  Mail,
  Users,
  TrendingUp,
  Calendar,
  Eye,
  MousePointer
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatDate, formatNumber } from '@/lib/utils';
import { Campaign } from '@/types/campaign';

export default function ManageCampaignsPage() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const response = await fetch('/api/campaigns');
      const data = await response.json();
      setCampaigns(data);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCampaigns = campaigns.filter(campaign =>
    campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    campaign.property.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleCreateCampaign = () => {
    router.push('/dashboard/landivo/campaigns/create');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Manage Campaigns</h1>
          <p className="text-muted-foreground">
            Create and manage your email marketing campaigns
          </p>
        </div>
        <Button onClick={handleCreateCampaign} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Create Campaign
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search campaigns..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" className="w-full sm:w-auto">
          <Filter className="h-4 w-4 mr-2" />
          Filter
        </Button>
      </div>

      {/* Campaign Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Campaigns</p>
                <p className="text-2xl font-bold">{campaigns.length}</p>
              </div>
              <Mail className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold text-green-600">
                  {campaigns.filter(c => c.status === 'active').length}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Sent</p>
                <p className="text-2xl font-bold">
                  {formatNumber(campaigns.reduce((sum, c) => sum + c.metrics.sent, 0))}
                </p>
              </div>
              <Users className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg. Open Rate</p>
                <p className="text-2xl font-bold text-blue-600">
                  {campaigns.length > 0 
                    ? `${((campaigns.reduce((sum, c) => sum + (c.metrics.open / c.metrics.sent * 100), 0) / campaigns.length)).toFixed(1)}%`
                    : '0%'
                  }
                </p>
              </div>
              <Eye className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Campaigns List */}
      <div className="space-y-4">
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded w-full"></div>
                    <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredCampaigns.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No campaigns found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm ? 'Try adjusting your search' : 'Create your first campaign to get started'}
              </p>
              <Button onClick={handleCreateCampaign}>
                <Plus className="h-4 w-4 mr-2" />
                Create Campaign
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredCampaigns.map((campaign) => (
            <CampaignCard key={campaign.id} campaign={campaign} onUpdate={fetchCampaigns} />
          ))
        )}
      </div>
    </div>
  );
}

// Campaign Card Component
function CampaignCard({ campaign, onUpdate }: { campaign: Campaign; onUpdate: () => void }) {
  const openRate = campaign.metrics.sent > 0 ? (campaign.metrics.open / campaign.metrics.sent * 100) : 0;
  const clickRate = campaign.metrics.sent > 0 ? (campaign.metrics.clicks / campaign.metrics.sent * 100) : 0;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Campaign Info */}
          <div className="flex-1 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <h3 className="text-lg font-semibold">{campaign.name}</h3>
              <Badge className={getStatusColor(campaign.status)}>
                {campaign.status}
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Property</p>
                <p className="font-medium">{campaign.property}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Email List</p>
                <p className="font-medium">{campaign.emailList}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Template</p>
                <p className="font-medium">{campaign.emailTemplate}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Schedule</p>
                <p className="font-medium">{campaign.emailSchedule}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Volume</p>
                <p className="font-medium">{formatNumber(campaign.emailVolume)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Sent</p>
                <p className="font-medium text-blue-600">{formatNumber(campaign.metrics.sent)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Opens</p>
                <p className="font-medium text-green-600">
                  {formatNumber(campaign.metrics.open)} ({openRate.toFixed(1)}%)
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Clicks</p>
                <p className="font-medium text-purple-600">
                  {formatNumber(campaign.metrics.clicks)} ({clickRate.toFixed(1)}%)
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Bounces</p>
                <p className="font-medium text-red-600">{formatNumber(campaign.metrics.bounces)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Delivered</p>
                <p className="font-medium text-blue-600">{formatNumber(campaign.metrics.successfulDeliveries)}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
              <span>Created: {formatDate(campaign.createdAt)}</span>
              <span>Mobile Opens: {formatNumber(campaign.metrics.mobileOpen)}</span>
              <span>Did Not Open: {formatNumber(campaign.metrics.didNotOpen)}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              View Details
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Edit Campaign</DropdownMenuItem>
                <DropdownMenuItem>Duplicate</DropdownMenuItem>
                <DropdownMenuItem>View Analytics</DropdownMenuItem>
                <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}