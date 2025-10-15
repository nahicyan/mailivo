// app/src/app/dashboard/landivo/campaigns/manage/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { CampaignCard } from '@/components/campaigns/CampaignCard';
import { CampaignTypeDialog } from '@/components/campaigns/CampaignTypeDialog';
import { Campaign } from '@/types/campaign';
import { LandivoProperty } from '@/types/landivo';
import {
  Plus,
  Search,
  Filter,
  Mail,
  Loader2,
  Users,
  TrendingUp,
  MousePointer,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatNumber } from '@/lib/utils';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

interface EmailList {
  id: string;
  _id?: string;
  name: string;
  buyerCount?: number;
  contactCount?: number;
  recipients?: any[];
}

interface Template {
  id: string;
  _id?: string;
  name?: string;
  title?: string;
}

interface PropertyDetails {
  address: string;
  isMultiple: boolean;
  count: number;
}

interface EmailListDetails {
  name: string;
  recipientCount: number;
}

export default function ManageCampaignsPage() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [properties, setProperties] = useState<LandivoProperty[]>([]);
  const [emailLists, setEmailLists] = useState<EmailList[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [campaignToDelete, setCampaignToDelete] = useState<Campaign | null>(
    null
  );
  const [campaignTypeDialogOpen, setCampaignTypeDialogOpen] = useState(false);
  const [duplicating, setDuplicating] = useState<string | null>(null);

  // Updated filtering to use new status filters
  const filteredCampaigns = campaigns.filter((campaign) => {
    const matchesSearch = campaign.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    
    let matchesStatus = true;
    
    if (statusFilter !== 'all') {
      // Filter based on campaign status
      matchesStatus = campaign.status === statusFilter;
    }
    
    return matchesSearch && matchesStatus;
  });

  // Calculate stats
  const totalSent = campaigns.reduce(
    (sum, c) => sum + (c.metrics?.sent || 0),
    0
  );
  const totalClicks = campaigns.reduce(
    (sum, c) => sum + (c.metrics?.totalClicks || 0),
    0
  );
  const uniqueClickers = campaigns.reduce(
    (sum, c) => sum + (c.metrics?.clicked || 0),
    0
  );
  const avgClickRate =
    totalSent > 0 ? ((uniqueClickers / totalSent) * 100).toFixed(1) : '0';
  const clicksPerCampaign =
    campaigns.length > 0 ? (totalClicks / campaigns.length).toFixed(1) : '0';
  const activeCampaigns = campaigns.filter((c) => c.status === 'active').length;

  useEffect(() => {
    fetchCampaigns();
    fetchProperties();
    fetchEmailLists();
    fetchTemplates();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const response = await fetch(`${API_URL}/campaigns?source=landivo`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('auth_token') || ''}`,
        },
        credentials: 'include',
      });
      const data = await response.json();
      setCampaigns(data.campaigns || data);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      toast.error('Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  };

  const fetchProperties = async () => {
    try {
      const serverURL =
        process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:5000';
      const response = await fetch(`${serverURL}/residency/allresd/`, {
        credentials: 'include',
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
          Authorization: `Bearer ${localStorage.getItem('auth_token') || ''}`,
        },
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setEmailLists(Array.isArray(data) ? data : data.emailLists || []);
      }
    } catch (error) {
      console.error('Error fetching email lists:', error);
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await fetch(`${API_URL}/templates`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('auth_token') || ''}`,
        },
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setTemplates(Array.isArray(data) ? data : data.templates || []);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  // Updated to handle both string and string[] for properties
  const getPropertyDetails = (propertyId: string | string[]): PropertyDetails => {
    if (!Array.isArray(properties)) {
      return {
        address: typeof propertyId === 'string' ? propertyId : propertyId.join(', '),
        isMultiple: Array.isArray(propertyId) && propertyId.length > 1,
        count: Array.isArray(propertyId) ? propertyId.length : 1,
      };
    }

    // Handle single property
    if (typeof propertyId === 'string') {
      const property = properties.find(
        (p) => p.id === propertyId || p._id === propertyId
      );
      if (!property) {
        return {
          address: propertyId,
          isMultiple: false,
          count: 1,
        };
      }

      const address = `${property.streetAddress || ''}, ${property.city || ''}, ${property.zip || ''}`
        .replace(/^,\s*|,\s*$/g, '')
        .replace(/,\s*,/g, ',');

      return {
        address,
        isMultiple: false,
        count: 1,
      };
    }

    // Handle multiple properties
    if (Array.isArray(propertyId)) {
      return {
        address: '', // Not needed for multiple properties
        isMultiple: true,
        count: propertyId.length,
      };
    }

    return {
      address: String(propertyId),
      isMultiple: false,
      count: 1,
    };
  };

  // Updated to handle both string and string[] for email lists
  const getEmailListDetails = (listId: string | string[]): EmailListDetails => {
    if (!Array.isArray(emailLists)) {
      return {
        name: typeof listId === 'string' ? listId : `${listId.length} Lists`,
        recipientCount: 0,
      };
    }

    // Handle single email list
    if (typeof listId === 'string') {
      const list = emailLists.find((l) => l.id === listId || l._id === listId);
      return {
        name: list?.name || listId,
        recipientCount:
          list?.buyerCount || list?.contactCount || list?.recipients?.length || 0,
      };
    }

    // Handle multiple email lists
    if (Array.isArray(listId)) {
      const totalRecipients = listId.reduce((total, id) => {
        const list = emailLists.find((l) => l.id === id || l._id === id);
        return (
          total +
          (list?.buyerCount || list?.contactCount || list?.recipients?.length || 0)
        );
      }, 0);

      return {
        name: `${listId.length} Email Lists`,
        recipientCount: totalRecipients,
      };
    }

    return {
      name: String(listId),
      recipientCount: 0,
    };
  };

  const getTemplateName = (templateId: string) => {
    if (!Array.isArray(templates)) {
      return templateId;
    }
    const template = templates.find(
      (t) => t.id === templateId || t._id === templateId
    );
    return template?.name || template?.title || templateId;
  };

  const handleViewDetails = (campaignId: string) => {
    router.push(`/dashboard/landivo/campaigns/${campaignId}`);
  };

  const handleEditCampaign = (campaignId: string) => {
    router.push(`/dashboard/landivo/campaigns/${campaignId}/edit`);
  };

  const handleViewAnalytics = (campaignId: string) => {
    router.push(`/dashboard/landivo/campaigns/${campaignId}/analytics`);
  };

  const handleDuplicateCampaign = async (campaign: Campaign) => {
    const campaignId = (campaign as any)._id || campaign.id;
    setDuplicating(campaignId);
    try {
      const response = await fetch(
        `${API_URL}/campaigns/${campaignId}/duplicate`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('auth_token') || ''}`,
          },
          credentials: 'include',
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to duplicate campaign');
      }

      toast.success('Campaign duplicated successfully');
      fetchCampaigns();
    } catch (error) {
      console.error('Error duplicating campaign:', error);
      toast.error('Failed to duplicate campaign', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setDuplicating(null);
    }
  };

  const handleDeleteCampaign = (campaign: Campaign) => {
    setCampaignToDelete(campaign);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!campaignToDelete) return;

    const campaignId = (campaignToDelete as any)._id || campaignToDelete.id;

    try {
      const response = await fetch(`${API_URL}/campaigns/${campaignId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('auth_token') || ''}`,
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete campaign');
      }

      toast.success('Campaign deleted successfully');
      fetchCampaigns();
    } catch (error) {
      console.error('Error deleting campaign:', error);
      toast.error('Failed to delete campaign', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setDeleteDialogOpen(false);
      setCampaignToDelete(null);
    }
  };

  const handleSendCampaign = async (campaignId: string) => {
    try {
      const response = await fetch(`${API_URL}/campaigns/${campaignId}/send`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('auth_token') || ''}`,
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send campaign');
      }

      toast.success('Campaign sent successfully');
      fetchCampaigns();
    } catch (error) {
      console.error('Error sending campaign:', error);
      toast.error('Failed to send campaign', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  const handlePauseCampaign = async (campaignId: string) => {
    try {
      const response = await fetch(`${API_URL}/campaigns/${campaignId}/pause`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('auth_token') || ''}`,
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to pause campaign');
      }

      toast.success('Campaign paused successfully');
      fetchCampaigns();
    } catch (error) {
      console.error('Error pausing campaign:', error);
      toast.error('Failed to pause campaign', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  const handleCreateCampaign = () => {
    setCampaignTypeDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

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
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Campaigns</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="opened">Opened</SelectItem>
            <SelectItem value="clicked">Clicked</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="scheduled">Scheduled</SelectItem>
          </SelectContent>
        </Select>
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
                  {activeCampaigns}
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
                <p className="text-2xl font-bold">{formatNumber(totalSent)}</p>
              </div>
              <Users className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Click Metrics</p>
                <p className="text-2xl font-bold text-purple-600">
                  {avgClickRate}%
                </p>
                <div className="mt-2 space-y-1">
                  <p className="text-xs text-muted-foreground">
                    Total Clicks: {formatNumber(totalClicks)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Unique Clickers: {formatNumber(uniqueClickers)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Avg per Campaign: {clicksPerCampaign}
                  </p>
                </div>
              </div>
              <MousePointer className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Campaigns List */}
      <div className="space-y-4">
        {filteredCampaigns.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No campaigns found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || statusFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Create your first campaign to get started'}
              </p>
              <Button onClick={handleCreateCampaign}>
                <Plus className="h-4 w-4 mr-2" />
                Create Campaign
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredCampaigns.map((campaign) => (
            <CampaignCard
              key={(campaign as any)._id || campaign.id}
              campaign={campaign}
              onViewDetails={handleViewDetails}
              onEdit={handleEditCampaign}
              onDuplicate={handleDuplicateCampaign}
              onDelete={handleDeleteCampaign}
              onViewAnalytics={handleViewAnalytics}
              onSend={handleSendCampaign}
              onPause={handlePauseCampaign}
              duplicating={
                duplicating === ((campaign as any)._id || campaign.id)
              }
              getPropertyDetails={getPropertyDetails}
              getEmailListDetails={getEmailListDetails}
              getTemplateName={getTemplateName}
            />
          ))
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Campaign</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{campaignToDelete?.name}"? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Campaign Type Dialog */}
      <CampaignTypeDialog
        open={campaignTypeDialogOpen}
        onOpenChange={setCampaignTypeDialogOpen}
      />
    </div>
  );
}