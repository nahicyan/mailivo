// app/src/app/dashboard/landivo/campaigns/manage/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
  MousePointer,
  Edit,
  Copy,
  Trash2,
  BarChart3,
  Play,
  Pause,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import { CampaignTypeDialog } from '@/components/campaigns/CampaignTypeDialog';
import { formatDate, formatNumber } from '@/lib/utils';
import { Campaign } from '@/types/campaign';
import { toast } from 'sonner';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.mailivo.landivo.com';

export default function ManageCampaignsPage() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [campaignToDelete, setCampaignToDelete] = useState<Campaign | null>(null);
  const [duplicating, setDuplicating] = useState<string | null>(null);
  const [properties, setProperties] = useState<any[]>([]);
  const [emailLists, setEmailLists] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [campaignTypeDialogOpen, setCampaignTypeDialogOpen] = useState(false);

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
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
        },
        credentials: 'include'
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
      const serverURL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:5000';
      const response = await fetch(`${serverURL}/residency/allresd/`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        console.log('Properties data:', data); // Debug log
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
        console.log('Email lists data:', data); // Debug log
        setEmailLists(Array.isArray(data) ? data : (data.emailLists || []));
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
        console.log('Templates data:', data); // Debug log
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
    const campaignId = campaign._id || campaign.id; // Use consistent ID resolution
    setDuplicating(campaignId);
    try {
      const response = await fetch(`${API_URL}/campaigns/${campaignId}/duplicate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
        },
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to duplicate campaign');
      }

      toast.success('Campaign duplicated successfully');
      fetchCampaigns();
    } catch (error) {
      console.error('Error duplicating campaign:', error);
      toast.error(`Failed to duplicate campaign: ${error.message}`);
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

    const campaignId = campaignToDelete._id || campaignToDelete.id; // Use consistent ID resolution
    try {
      const response = await fetch(`${API_URL}/campaigns/${campaignId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
        },
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete campaign');
      }

      toast.success('Campaign deleted successfully');
      fetchCampaigns();
    } catch (error) {
      console.error('Error deleting campaign:', error);
      toast.error(`Failed to delete campaign: ${error.message}`);
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
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
        },
        credentials: 'include'
      });

      if (!response.ok) throw new Error('Failed to send campaign');

      toast.success('Campaign sending initiated');
      fetchCampaigns(); // Refresh the list
    } catch (error) {
      console.error('Error sending campaign:', error);
      toast.error('Failed to send campaign');
    }
  };

  const handlePauseCampaign = async (campaignId: string) => {
    try {
      const response = await fetch(`${API_URL}/campaigns/${campaignId}/pause`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
        },
        credentials: 'include'
      });

      if (!response.ok) throw new Error('Failed to pause campaign');

      toast.success('Campaign paused');
      fetchCampaigns(); // Refresh the list
    } catch (error) {
      console.error('Error pausing campaign:', error);
      toast.error('Failed to pause campaign');
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
      case 'sending': return 'bg-purple-100 text-purple-800';
      case 'sent': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleCreateCampaign = () => {
    setCampaignTypeDialogOpen(true);
  };


  // Calculate stats
  const totalSent = campaigns.reduce((sum, c) => sum + (c.metrics?.sent || 0), 0);
  const totalOpens = campaigns.reduce((sum, c) => sum + (c.metrics?.open || 0), 0);
  const avgOpenRate = totalSent > 0 ? (totalOpens / totalSent * 100).toFixed(1) : '0';
  const activeCampaigns = campaigns.filter(c => c.status === 'active').length;

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
                <p className="text-2xl font-bold text-green-600">{activeCampaigns}</p>
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
                <p className="text-sm text-muted-foreground">Avg. Open Rate</p>
                <p className="text-2xl font-bold text-blue-600">{avgOpenRate}%</p>
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
            <CampaignCard
              key={campaign._id || campaign.id}
              campaign={campaign}
              onViewDetails={handleViewDetails}
              onEdit={handleEditCampaign}
              onDuplicate={handleDuplicateCampaign}
              onDelete={handleDeleteCampaign}
              onViewAnalytics={handleViewAnalytics}
              onSend={handleSendCampaign}
              onPause={handlePauseCampaign}
              duplicating={duplicating === (campaign._id || campaign.id)}
              getPropertyAddress={getPropertyAddress}
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
              Are you sure you want to delete "{campaignToDelete?.name}"? This action cannot be undone.
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
      {/*Campaign Type Dialog */}
      <CampaignTypeDialog
        open={campaignTypeDialogOpen}
        onOpenChange={setCampaignTypeDialogOpen}
      />

    </div>
  );
}

// Campaign Card Component
interface CampaignCardProps {
  campaign: Campaign;
  onViewDetails: (id: string) => void;
  onEdit: (id: string) => void;
  onDuplicate: (campaign: Campaign) => void;
  onDelete: (campaign: Campaign) => void;
  onViewAnalytics: (id: string) => void;
  onSend: (id: string) => void;
  onPause: (id: string) => void;
  duplicating: boolean;
  getPropertyAddress: (id: string) => string;
  getEmailListDetails: (id: string) => { name: string; recipientCount: number };
  getTemplateName: (id: string) => string;
}

function CampaignCard({
  campaign,
  onViewDetails,
  onEdit,
  onDuplicate,
  onDelete,
  onViewAnalytics,
  onSend,
  onPause,
  duplicating,
  getPropertyAddress,
  getEmailListDetails,
  getTemplateName
}: CampaignCardProps) {
  const campaignId = campaign._id || campaign.id;
  const openRate = campaign.metrics?.sent > 0 ? (campaign.metrics.open / campaign.metrics.sent * 100) : 0;
  const clickRate = campaign.metrics?.sent > 0 ? (campaign.metrics.clicks / campaign.metrics.sent * 100) : 0;
  const linkClickRate = campaign.links?.length > 0 
  ? (Object.keys(campaign.linkStats || {}).length / campaign.links.length * 100).toFixed(1)
  : 0;
  const emailListDetails = getEmailListDetails(campaign.emailList);

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

  const canSend = campaign.status === 'draft' || campaign.status === 'paused';
  const canPause = campaign.status === 'active' || campaign.status === 'sending';

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
                <p className="font-medium truncate">{getPropertyAddress(campaign.property)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Email List</p>
                <p className="font-medium truncate">
                  {emailListDetails.name}
                  {emailListDetails.recipientCount > 0 && (
                    <span className="text-xs text-muted-foreground ml-1">
                      ({formatNumber(emailListDetails.recipientCount)} Recipients)
                    </span>
                  )}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Template</p>
                <p className="font-medium truncate">{getTemplateName(campaign.emailTemplate)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Schedule</p>
                <p className="font-medium">{campaign.emailSchedule}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Volume</p>
                <p className="font-medium">{formatNumber(campaign.emailVolume || 0)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Sent</p>
                <p className="font-medium text-blue-600">{formatNumber(campaign.metrics?.sent || 0)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Opens</p>
                <p className="font-medium text-green-600">
                  {formatNumber(campaign.metrics?.open || 0)} ({openRate.toFixed(1)}%)
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Clicks</p>
                <p className="font-medium text-purple-600">
                  {formatNumber(campaign.metrics?.clicks || 0)} ({clickRate.toFixed(1)}%)
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Bounces</p>
                <p className="font-medium text-red-600">{formatNumber(campaign.metrics?.bounces || 0)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Delivered</p>
                <p className="font-medium text-blue-600">{formatNumber(campaign.metrics?.successfulDeliveries || 0)}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
              <span>Created: {formatDate(campaign.createdAt)}</span>
              {/* <span>Mobile Opens: {formatNumber(campaign.metrics?.mobileOpen || 0)}</span>
              <span>Did Not Open: {formatNumber(campaign.metrics?.didNotOpen || 0)}</span> */}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewDetails(campaignId)}
              className="w-full sm:w-auto"
            >
              <Eye className="h-4 w-4 mr-2" />
              View Details
            </Button>

            {canSend && (
              <Button
                size="sm"
                onClick={() => onSend(campaignId)}
                className="w-full sm:w-auto"
              >
                <Play className="h-4 w-4 mr-2" />
                Send
              </Button>
            )}

            {canPause && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPause(campaignId)}
                className="w-full sm:w-auto"
              >
                <Pause className="h-4 w-4 mr-2" />
                Pause
              </Button>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(campaignId)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Campaign
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onDuplicate(campaign)}
                  disabled={duplicating}
                >
                  {duplicating ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Copy className="h-4 w-4 mr-2" />
                  )}
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onViewAnalytics(campaignId)}>
                  <BarChart3 className="h-4 w-4 mr-2" />
                  View Analytics
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onDelete(campaign)}
                  className="text-red-600 focus:text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}