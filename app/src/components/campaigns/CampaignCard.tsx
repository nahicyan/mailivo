// app/src/components/campaigns/CampaignCard.tsx
'use client';

import { useState } from 'react';
import { Campaign } from '@/types/campaign';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Eye,
  Play,
  Pause,
  Edit,
  Copy,
  Trash2,
  MoreHorizontal,
  BarChart3,
  RefreshCw,
  Home,
  Mail,
  MapPin,
  Users,
  Loader2,
  Send,
  CheckCircle2,
  MousePointerClick,
  AlertCircle,
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

interface EmailListDetails {
  name: string;
  recipientCount: number;
}

interface PropertyDetails {
  address: string;
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
  getPropertyDetails: (propertyId: string | string[]) => PropertyDetails;
  getEmailListDetails: (listId: string | string[]) => EmailListDetails;
  getTemplateName: (templateId: string) => string;
}

function formatNumber(num: number): string {
  return num.toLocaleString();
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

type StatusType = 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced';

export function CampaignCard({
  campaign,
  onViewDetails,
  onEdit,
  onDuplicate,
  onDelete,
  onViewAnalytics,
  onSend,
  onPause,
  duplicating,
  getPropertyDetails,
  getEmailListDetails,
  getTemplateName,
}: CampaignCardProps) {
  const [propertiesDialogOpen, setPropertiesDialogOpen] = useState(false);
  const [emailListsDialogOpen, setEmailListsDialogOpen] = useState(false);
  const [recipientsDialogOpen, setRecipientsDialogOpen] = useState(false);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [loadingRecipients, setLoadingRecipients] = useState(false);

  // New state for status dialogs
  const [statusDialogOpen, setStatusDialogOpen] = useState<StatusType | null>(null);
  const [statusContacts, setStatusContacts] = useState<ContactsByStatus | null>(null);
  const [loadingStatusContacts, setLoadingStatusContacts] = useState(false);
  const [allContactsMap, setAllContactsMap] = useState<Map<string, Recipient>>(new Map());

  const campaignId = (campaign as any)._id || campaign.id;
  
  const propertyDetails = getPropertyDetails(campaign.property);
  const emailListDetails = getEmailListDetails(campaign.emailList);
  const isMultiCampaign = propertyDetails.isMultiple || 
    (Array.isArray(campaign.emailList) && campaign.emailList.length > 1);

  // Get property IDs array
  const propertyIds = Array.isArray(campaign.property) 
    ? campaign.property 
    : [campaign.property];

  // Get email list IDs array
  const emailListIds = Array.isArray(campaign.emailList)
    ? campaign.emailList
    : [campaign.emailList];

  const totalRecipients = emailListDetails.recipientCount || 0;

  // Calculate percentages based on total recipients
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
  const bouncedRate = totalRecipients > 0 
    ? ((campaign.metrics?.bounced || 0) / totalRecipients) * 100 
    : 0;

  // Fetch all recipients from email lists and create a map
  const fetchAllRecipients = async () => {
    try {
      const allRecipients: Recipient[] = [];

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

  // Fetch contacts by status from the new API
  const fetchContactsByStatus = async () => {
    setLoadingStatusContacts(true);
    try {
      const response = await fetch(
        `${API_URL}/via/contacts/by-status?campaignId=${campaignId}`,
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

  // Fetch recipients from all email lists for the recipients dialog
  const fetchRecipients = async () => {
    setLoadingRecipients(true);
    try {
      const allRecipients: Recipient[] = [];

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

      // Deduplicate by email
      const uniqueRecipients = Array.from(
        new Map(allRecipients.map(r => [r.email?.toLowerCase(), r])).values()
      );

      setRecipients(uniqueRecipients);
      setRecipientsDialogOpen(true);
    } catch (error) {
      console.error('Error fetching recipients:', error);
      toast.error('Failed to load recipients');
    } finally {
      setLoadingRecipients(false);
    }
  };

  const handleViewRecipients = () => {
    fetchRecipients();
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'sending':
        return 'bg-purple-100 text-purple-800';
      case 'sent':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
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

  const canSend = campaign.status === 'draft' || campaign.status === 'paused';
  const canPause = campaign.status === 'active';

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Campaign Info */}
            <div className="flex-1 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <h3 className="text-lg font-semibold">{campaign.name}</h3>
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

              {/* First row - Campaign details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Property</p>
                  {propertyDetails.isMultiple ? (
                    <Button
                      variant="link"
                      className="h-auto p-0 font-medium text-left"
                      onClick={() => setPropertiesDialogOpen(true)}
                    >
                      {propertyDetails.count} Properties
                    </Button>
                  ) : (
                    <p className="font-medium truncate">
                      {propertyDetails.address}
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-muted-foreground">Email List</p>
                  {Array.isArray(campaign.emailList) && campaign.emailList.length > 1 ? (
                    <Button
                      variant="link"
                      className="h-auto p-0 font-medium text-left"
                      onClick={() => setEmailListsDialogOpen(true)}
                    >
                      {campaign.emailList.length} Email Lists
                    </Button>
                  ) : (
                    <p className="font-medium truncate">
                      {emailListDetails.name}
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-muted-foreground">Template</p>
                  <p className="font-medium truncate">
                    {getTemplateName(campaign.emailTemplate)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Schedule</p>
                  <p className="font-medium">{campaign.emailSchedule}</p>
                </div>
              </div>

              {/* Second row - Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Recipients</p>
                  <Button
                    variant="link"
                    className="h-auto p-0 font-medium text-left"
                    onClick={handleViewRecipients}
                    disabled={loadingRecipients}
                  >
                    {loadingRecipients ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        {formatNumber(totalRecipients)} (100%)
                      </>
                    )}
                  </Button>
                </div>
                <div>
                  <p className="text-muted-foreground">Sent</p>
                  <Button
                    variant="link"
                    className="h-auto p-0 font-medium text-left text-blue-600 hover:text-blue-700"
                    onClick={() => handleStatusClick('sent')}
                    disabled={(campaign.metrics?.sent || 0) === 0}
                  >
                    {formatNumber(campaign.metrics?.sent || 0)} ({sentRate.toFixed(1)}%)
                  </Button>
                </div>
                <div>
                  <p className="text-muted-foreground">Delivered</p>
                  <Button
                    variant="link"
                    className="h-auto p-0 font-medium text-left text-blue-600 hover:text-blue-700"
                    onClick={() => handleStatusClick('delivered')}
                    disabled={(campaign.metrics?.delivered || 0) === 0}
                  >
                    {formatNumber(campaign.metrics?.delivered || 0)} ({deliveredRate.toFixed(1)}%)
                  </Button>
                </div>
                <div>
                  <p className="text-muted-foreground">Opened</p>
                  <Button
                    variant="link"
                    className="h-auto p-0 font-medium text-left text-green-600 hover:text-green-700"
                    onClick={() => handleStatusClick('opened')}
                    disabled={(campaign.metrics?.opened || 0) === 0}
                  >
                    {formatNumber(campaign.metrics?.opened || 0)} ({openedRate.toFixed(1)}%)
                  </Button>
                </div>
                <div>
                  <p className="text-muted-foreground">Clicked</p>
                  <Button
                    variant="link"
                    className="h-auto p-0 font-medium text-left text-purple-600 hover:text-purple-700"
                    onClick={() => handleStatusClick('clicked')}
                    disabled={(campaign.metrics?.clicked || 0) === 0}
                  >
                    {formatNumber(campaign.metrics?.clicked || 0)} ({clickedRate.toFixed(1)}%)
                  </Button>
                </div>
                {/* Conditionally render Bounces only if > 0 */}
                {(campaign.metrics?.bounced || 0) > 0 && (
                  <div>
                    <p className="text-muted-foreground">Bounced</p>
                    <Button
                      variant="link"
                      className="h-auto p-0 font-medium text-left text-red-600 hover:text-red-700"
                      onClick={() => handleStatusClick('bounced')}
                    >
                      {formatNumber(campaign.metrics?.bounced || 0)} ({bouncedRate.toFixed(1)}%)
                    </Button>
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                <span>Created: {formatDate(campaign.createdAt)}</span>
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

      {/* Recipients Dialog */}
      <Dialog open={recipientsDialogOpen} onOpenChange={setRecipientsDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Campaign Recipients
            </DialogTitle>
            <DialogDescription>
              {recipients.length} {recipients.length === 1 ? 'recipient' : 'recipients'} across all email lists
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[500px] pr-4">
            {loadingRecipients ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-2">
                {recipients.map((recipient, index) => (
                  <Card key={recipient.id || index}>
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                            <span className="text-purple-600 font-semibold">
                              {recipient.firstName?.charAt(0) || recipient.email.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {recipient.firstName} {recipient.lastName}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {recipient.email}
                            </p>
                            {recipient.phone && (
                              <p className="text-xs text-muted-foreground">
                                {recipient.phone}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {recipient.qualified && (
                            <Badge variant="secondary" className="text-xs">
                              Qualified
                            </Badge>
                          )}
                          {recipient.buyerType && (
                            <Badge variant="outline" className="text-xs">
                              {recipient.buyerType}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
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