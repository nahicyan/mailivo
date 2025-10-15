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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  Pause,
  Home,
  MapPin,
  Send,
  Loader2,
  AlertCircle,
  MousePointerClick,
  CheckCircle2,
} from 'lucide-react';
import { formatDate, formatNumber } from '@/lib/utils';
import Link from 'next/link';
import { toast } from 'sonner';

interface Props {
  params: Promise<{ id: string }>;
}

interface PropertyDetails {
  address: string;
  isMultiple: boolean;
  count: number;
}

interface EmailListDetails {
  name: string;
  recipientCount: number;
  isMultiple: boolean;
  count: number;
}

interface Recipient {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  qualified?: boolean;
  buyerType?: string;
}

interface ContactsByStatus {
  sent: string[];
  delivered: string[];
  opened: string[];
  clicked: string[];
  bounced: string[];
}

interface ContactsByStatusResponse {
  success: boolean;
  campaignId: string;
  data: ContactsByStatus;
  counts: {
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    bounced: number;
  };
}

type StatusType = 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced';

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
  const [propertiesDialogOpen, setPropertiesDialogOpen] = useState(false);
  const [emailListsDialogOpen, setEmailListsDialogOpen] = useState(false);
  
  // New state for status dialogs
  const [statusDialogOpen, setStatusDialogOpen] = useState<StatusType | null>(null);
  const [statusContacts, setStatusContacts] = useState<ContactsByStatus | null>(null);
  const [loadingStatusContacts, setLoadingStatusContacts] = useState(false);
  const [allContactsMap, setAllContactsMap] = useState<Map<string, Recipient>>(new Map());

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

  // Fetch all recipients from email lists and create a map
  const fetchAllRecipients = async () => {
    try {
      const allRecipients: Recipient[] = [];
      const emailListIds = Array.isArray(campaign.emailList)
        ? campaign.emailList
        : [campaign.emailList];

      for (const listId of emailListIds) {
        const response = await fetch(`${API_URL}/landivo-email-lists/${listId}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('auth_token') || ''}`,
          },
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          if (data.buyers && Array.isArray(data.buyers)) {
            allRecipients.push(...data.buyers);
          }
        }
      }

      // Create a map of contact ID to recipient
      const contactMap = new Map<string, Recipient>();
      allRecipients.forEach(recipient => {
        contactMap.set(recipient.id, recipient);
      });

      setAllContactsMap(contactMap);
      return contactMap;
    } catch (error) {
      console.error('Error fetching all recipients:', error);
      return new Map<string, Recipient>();
    }
  };

  // Fetch contacts by status from the API
  const fetchContactsByStatus = async () => {
    setLoadingStatusContacts(true);
    try {
      const response = await fetch(
        `${API_URL}/via/contacts/by-status?campaignId=${id}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('auth_token') || ''}`,
          },
          credentials: 'include',
        }
      );

      if (response.ok) {
        const data: ContactsByStatusResponse = await response.json();
        setStatusContacts(data.data);
        
        // Fetch all recipients if not already loaded
        if (allContactsMap.size === 0) {
          await fetchAllRecipients();
        }
      } else {
        toast.error('Failed to load contacts by status');
      }
    } catch (error) {
      console.error('Error fetching contacts by status:', error);
      toast.error('Failed to load contacts by status');
    } finally {
      setLoadingStatusContacts(false);
    }
  };

  // Handle clicking on a status metric
  const handleStatusClick = async (status: StatusType) => {
    if (!statusContacts) {
      await fetchContactsByStatus();
    }
    setStatusDialogOpen(status);
  };

  // Get contacts for a specific status
  const getContactsForStatus = (status: StatusType): Recipient[] => {
    if (!statusContacts) return [];
    
    const contactIds = statusContacts[status] || [];
    return contactIds
      .map(id => allContactsMap.get(id))
      .filter((contact): contact is Recipient => contact !== undefined);
  };

  const getStatusIcon = (status: StatusType) => {
    switch (status) {
      case 'sent':
        return <Send className="h-5 w-5" />;
      case 'delivered':
        return <CheckCircle2 className="h-5 w-5" />;
      case 'opened':
        return <Eye className="h-5 w-5" />;
      case 'clicked':
        return <MousePointerClick className="h-5 w-5" />;
      case 'bounced':
        return <AlertCircle className="h-5 w-5" />;
      default:
        return <Users className="h-5 w-5" />;
    }
  };

  const getStatusTitle = (status: StatusType) => {
    return status.charAt(0).toUpperCase() + status.slice(1) + ' Contacts';
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
        name: typeof listId === 'string' ? listId : `${listId.length} Email Lists`,
        recipientCount: 0,
        isMultiple: Array.isArray(listId) && listId.length > 1,
        count: Array.isArray(listId) ? listId.length : 1,
      };
    }

    // Handle single email list
    if (typeof listId === 'string') {
      const list = emailLists.find((l) => l.id === listId || l._id === listId);
      return {
        name: list?.name || listId,
        recipientCount:
          list?.buyerCount || list?.contactCount || list?.recipients?.length || 0,
        isMultiple: false,
        count: 1,
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
        isMultiple: true,
        count: listId.length,
      };
    }

    return {
      name: String(listId),
      recipientCount: 0,
      isMultiple: false,
      count: 1,
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

  // Calculate rates based on total recipients (calculated on render, not from DB)
  const emailListDetails = getEmailListDetails(campaign.emailList);
  const totalRecipients = emailListDetails.recipientCount || 0;
  
  const sentRate = totalRecipients > 0 
    ? ((campaign.metrics?.sent || 0) / totalRecipients) * 100 
    : 0;
  const deliveredRate = totalRecipients > 0 
    ? ((campaign.metrics?.delivered || 0) / totalRecipients) * 100 
    : 0;
  const openedRate = totalRecipients > 0 
    ? ((campaign.metrics?.opened || 0) / totalRecipients) * 100 
    : 0;
  const clickedRate = totalRecipients > 0 
    ? ((campaign.metrics?.clicked || 0) / totalRecipients) * 100 
    : 0;

  const canSend = campaign.status === 'draft' || campaign.status === 'paused';
  const canPause = campaign.status === 'active' || campaign.status === 'sending';

  const propertyDetails = getPropertyDetails(campaign.property);
  const isMultiCampaign = propertyDetails.isMultiple || emailListDetails.isMultiple;

  // Get property IDs array
  const propertyIds = Array.isArray(campaign.property) 
    ? campaign.property 
    : [campaign.property];

  // Get email list IDs array
  const emailListIds = Array.isArray(campaign.emailList)
    ? campaign.emailList
    : [campaign.emailList];

  return (
    <>
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
              <Badge 
                variant={isMultiCampaign ? "secondary" : "outline"}
                className={isMultiCampaign ? "bg-purple-100 text-purple-800" : ""}
              >
                {isMultiCampaign ? 'Multi' : 'Single'}
              </Badge>
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

        {/* Performance Overview - Rate Display (NOT CLICKABLE) */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-center mb-2">
                <Send className="h-5 w-5 text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-blue-600">{sentRate.toFixed(1)}%</div>
              <p className="text-sm text-muted-foreground">Sent Rate</p>
              <p className="text-xs text-muted-foreground">{formatNumber(campaign.metrics?.sent || 0)} sent</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-center mb-2">
                <CheckCircle className="h-5 w-5 text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-blue-600">{deliveredRate.toFixed(1)}%</div>
              <p className="text-sm text-muted-foreground">Delivery Rate</p>
              <p className="text-xs text-muted-foreground">{formatNumber(campaign.metrics?.delivered || 0)} delivered</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-center mb-2">
                <Eye className="h-5 w-5 text-green-600" />
              </div>
              <div className="text-2xl font-bold text-green-600">{openedRate.toFixed(1)}%</div>
              <p className="text-sm text-muted-foreground">Open Rate</p>
              <p className="text-xs text-muted-foreground">{formatNumber(campaign.metrics?.opened || 0)} opened</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-center mb-2">
                <MousePointer className="h-5 w-5 text-purple-600" />
              </div>
              <div className="text-2xl font-bold text-purple-600">{clickedRate.toFixed(1)}%</div>
              <p className="text-sm text-muted-foreground">Click Rate</p>
              <p className="text-xs text-muted-foreground">{formatNumber(campaign.metrics?.clicked || 0)} clicked</p>
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
                  {propertyDetails.isMultiple ? (
                    <Button
                      variant="link"
                      className="h-auto p-0 font-medium text-left"
                      onClick={() => setPropertiesDialogOpen(true)}
                    >
                      {propertyDetails.count} Properties
                    </Button>
                  ) : (
                    <p className="font-medium">{propertyDetails.address}</p>
                  )}
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Email List</Label>
                  {emailListDetails.isMultiple ? (
                    <Button
                      variant="link"
                      className="h-auto p-0 font-medium text-left"
                      onClick={() => setEmailListsDialogOpen(true)}
                    >
                      {emailListDetails.count} Email Lists
                      {emailListDetails.recipientCount > 0 && (
                        <span className="text-sm text-muted-foreground ml-1">
                          ({formatNumber(emailListDetails.recipientCount)} recipients)
                        </span>
                      )}
                    </Button>
                  ) : (
                    <p className="font-medium">
                      {emailListDetails.name}
                      {emailListDetails.recipientCount > 0 && (
                        <span className="text-sm text-muted-foreground ml-1">
                          ({formatNumber(emailListDetails.recipientCount)} recipients)
                        </span>
                      )}
                    </p>
                  )}
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
                  <Label className="text-sm font-medium text-muted-foreground">Recipients</Label>
                  <p className="font-medium">{formatNumber(totalRecipients)}</p>
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
                <div 
                  className="cursor-pointer hover:bg-accent rounded-md p-2 transition-colors"
                  onClick={() => handleStatusClick('sent')}
                >
                  <Label className="text-sm font-medium text-muted-foreground cursor-pointer">Total Sent</Label>
                  <p className="text-lg font-bold text-blue-600">{formatNumber(campaign.metrics?.sent || 0)}</p>
                </div>
                <div 
                  className="cursor-pointer hover:bg-accent rounded-md p-2 transition-colors"
                  onClick={() => handleStatusClick('delivered')}
                >
                  <Label className="text-sm font-medium text-muted-foreground cursor-pointer">Delivered</Label>
                  <p className="text-lg font-bold text-blue-600">{formatNumber(campaign.metrics?.delivered || 0)}</p>
                </div>
                <div 
                  className="cursor-pointer hover:bg-accent rounded-md p-2 transition-colors"
                  onClick={() => handleStatusClick('opened')}
                >
                  <Label className="text-sm font-medium text-muted-foreground cursor-pointer">Opened</Label>
                  <p className="text-lg font-bold text-green-600">{formatNumber(campaign.metrics?.opened || 0)}</p>
                </div>
                <div 
                  className="cursor-pointer hover:bg-accent rounded-md p-2 transition-colors"
                  onClick={() => handleStatusClick('clicked')}
                >
                  <Label className="text-sm font-medium text-muted-foreground cursor-pointer">Clicked</Label>
                  <p className="text-lg font-bold text-purple-600">{formatNumber(campaign.metrics?.clicked || 0)}</p>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <div 
                  className="flex justify-between items-center cursor-pointer hover:bg-accent rounded-md p-2 transition-colors"
                  onClick={() => handleStatusClick('bounced')}
                >
                  <span className="text-sm text-muted-foreground">Bounced</span>
                  <span className="font-medium text-red-600">{formatNumber(campaign.metrics?.bounced || 0)}</span>
                </div>
                <div className="flex justify-between items-center rounded-md p-2">
                  <span className="text-sm text-muted-foreground">Failed</span>
                  <span className="font-medium">{formatNumber(campaign.metrics?.failed || 0)}</span>
                </div>
                <div className="flex justify-between items-center rounded-md p-2">
                  <span className="text-sm text-muted-foreground">Mobile Opens</span>
                  <span className="font-medium text-orange-600">{formatNumber(campaign.metrics?.mobileOpen || 0)}</span>
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

      {/* Properties Dialog */}
      <Dialog open={propertiesDialogOpen} onOpenChange={setPropertiesDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Home className="h-5 w-5" />
              Campaign Properties
            </DialogTitle>
            <DialogDescription>
              This campaign includes {propertyIds.length} {propertyIds.length === 1 ? 'property' : 'properties'}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[400px] pr-4">
            <div className="space-y-3">
              {propertyIds.map((propertyId, index) => {
                const propDetails = getPropertyDetails(propertyId);
                return (
                  <Card key={propertyId || index}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 mt-1">
                          <MapPin className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline">Property {index + 1}</Badge>
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-foreground">
                              {propDetails.address}
                            </p>
                            <p className="text-xs text-muted-foreground font-mono">
                              ID: {propertyId}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Email Lists Dialog */}
      <Dialog open={emailListsDialogOpen} onOpenChange={setEmailListsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Campaign Email Lists
            </DialogTitle>
            <DialogDescription>
              This campaign includes {emailListIds.length} {emailListIds.length === 1 ? 'email list' : 'email lists'}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[400px] pr-4">
            <div className="space-y-3">
              {emailListIds.map((listId, index) => {
                const listDetails = getEmailListDetails(listId);
                return (
                  <Card key={listId || index}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 mt-1">
                          <Users className="h-5 w-5 text-purple-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline">Email List {index + 1}</Badge>
                            {listDetails.recipientCount > 0 && (
                              <Badge variant="secondary" className="text-xs">
                                {formatNumber(listDetails.recipientCount)} Recipients
                              </Badge>
                            )}
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-foreground">
                              {listDetails.name}
                            </p>
                            <p className="text-xs text-muted-foreground font-mono">
                              ID: {listId}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Status Contacts Dialog (Sent, Delivered, Opened, Clicked, Bounced) */}
      <Dialog 
        open={statusDialogOpen !== null} 
        onOpenChange={(open) => !open && setStatusDialogOpen(null)}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {statusDialogOpen && getStatusIcon(statusDialogOpen)}
              {statusDialogOpen && getStatusTitle(statusDialogOpen)}
            </DialogTitle>
            <DialogDescription>
              {statusDialogOpen && getContactsForStatus(statusDialogOpen).length}{' '}
              {statusDialogOpen && getContactsForStatus(statusDialogOpen).length === 1 
                ? 'contact' 
                : 'contacts'}{' '}
              {statusDialogOpen}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[500px] pr-4">
            {loadingStatusContacts ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-2">
                {statusDialogOpen && getContactsForStatus(statusDialogOpen).length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No contacts found for this status
                  </div>
                ) : (
                  statusDialogOpen && getContactsForStatus(statusDialogOpen).map((contact, index) => (
                    <Card key={contact.id || index}>
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <span className="text-blue-600 font-semibold">
                                {contact.firstName?.charAt(0) || contact.email.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">
                                {contact.firstName} {contact.lastName}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {contact.email}
                              </p>
                              {contact.phone && (
                                <p className="text-xs text-muted-foreground">
                                  {contact.phone}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {contact.qualified && (
                              <Badge variant="secondary" className="text-xs">
                                Qualified
                              </Badge>
                            )}
                            {contact.buyerType && (
                              <Badge variant="outline" className="text-xs">
                                {contact.buyerType}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}