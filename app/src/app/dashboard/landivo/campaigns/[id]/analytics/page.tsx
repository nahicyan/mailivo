// app/src/app/dashboard/landivo/campaigns/[id]/analytics/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  ArrowLeft,
  Users,
  MousePointer,
  Mail,
  TrendingUp,
  Eye,
  BarChart3,
  Clock,
  MapPin,
  ExternalLink,
  Search,
  Calendar,
  Smartphone,
  Monitor,
  Globe,
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

interface Campaign {
  _id: string;
  name: string;
  subject: string;
  status: string;
  createdAt: string;
  sentAt?: string;
  metrics: {
    sent: number;
    delivered: number;
    open: number;
    clicks: number;
    totalClicks: number;
    bounces: number;
    uniqueClickers: number;
    mobileOpen?: number;
    avgClicksPerLink?: number;
    clickThroughRate?: number;
    topLink?: string;
  };
}

interface ContactClick {
  contactId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  totalClicks: number;
  uniqueLinks: number;
  firstClick: string;
  lastClick: string;
  devices: string[];
  locations: string[];
  engagementScore: number;
}

interface ClickDetail {
  linkId: string;
  linkText: string;
  originalUrl: string;
  clickedAt: string;
  ipAddress: string;
  userAgent: string;
  referer: string;
  device: string;
  location?: string;
}

interface LinkPerformance {
  linkId: string;
  linkText: string;
  originalUrl: string;
  clickCount: number;
  uniqueClickers: number;
  clickRate: number;
  avgTimeToClick: number;
}

interface AnalyticsData {
  campaign: Campaign;
  clickedContacts: ContactClick[];
  linkPerformance: LinkPerformance[];
  timelineData: { hour: string; clicks: number; opens: number }[];
  deviceData: { device: string; clicks: number; percentage: number }[];
  locationData: { location: string; clicks: number; percentage: number }[];
}

export default function CampaignAnalytics() {
  const { id } = useParams();
  const router = useRouter();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedContact, setSelectedContact] = useState<ContactClick | null>(null);
  const [contactDetails, setContactDetails] = useState<ClickDetail[]>([]);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.mailivo.landivo.com';

  useEffect(() => {
    fetchAnalyticsData();
  }, [id]);


const fetchAnalyticsData = async () => {
  try {
    setLoading(true);
    const response = await fetch(`${API_URL}/analytics/campaigns/${id}/analytics/detailed`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
      },
      credentials: 'include'
    });
    if (!response.ok) throw new Error('Failed to fetch analytics');
    const analyticsData = await response.json();
    setData(analyticsData);
  } catch (error) {
    console.error('Error fetching analytics:', error);
  } finally {
    setLoading(false);
  }
};

const fetchContactDetails = async (contactId: string) => {
  try {
    setDetailsLoading(true);
    const response = await fetch(`${API_URL}/analytics/campaigns/${id}/analytics/contact/${contactId}/clicks`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
      },
      credentials: 'include'
    });
    if (!response.ok) throw new Error('Failed to fetch contact details');
    const details = await response.json();
    setContactDetails(details);
  } catch (error) {
    console.error('Error fetching contact details:', error);
    setContactDetails([]);
  } finally {
    setDetailsLoading(false);
  }
};

  const handleContactClick = (contact: ContactClick) => {
    setSelectedContact(contact);
    fetchContactDetails(contact.contactId);
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calculateRates = (campaign: Campaign) => {
    const sent = campaign.metrics?.sent || 0;
    const delivered = campaign.metrics?.delivered || sent;
    const opened = campaign.metrics?.open || 0;
    const clicked = campaign.metrics?.uniqueClickers || 0;
    
    return {
      deliveryRate: sent > 0 ? (delivered / sent) * 100 : 0,
      openRate: delivered > 0 ? (opened / delivered) * 100 : 0,
      clickRate: delivered > 0 ? (clicked / delivered) * 100 : 0,
      clickToOpenRate: opened > 0 ? (clicked / opened) * 100 : 0,
    };
  };

  const filteredContacts = data?.clickedContacts.filter(contact =>
    contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    `${contact.firstName} ${contact.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4"></div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded"></div>
          ))}
        </div>
        <div className="h-96 bg-gray-200 rounded"></div>
      </div>
    );
  }

  if (!data?.campaign) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <p className="text-muted-foreground">Campaign analytics not found</p>
        <Link href="/dashboard/landivo/campaigns/manage">
          <Button>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Campaigns
          </Button>
        </Link>
      </div>
    );
  }

  const { campaign } = data;
  const rates = calculateRates(campaign);
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'];

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
            <span className="text-foreground">{campaign.name}</span>
            <span>/</span>
            <span className="text-foreground">Analytics</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{campaign.name}</h1>
            <Badge variant={campaign.status === 'sent' ? 'success' : 'secondary'}>
              {campaign.status}
            </Badge>
          </div>
          <p className="text-muted-foreground">{campaign.subject}</p>
        </div>
        <Button onClick={() => router.back()} variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Sent</p>
                <p className="text-2xl font-bold">{formatNumber(campaign.metrics?.sent || 0)}</p>
                <p className="text-xs text-muted-foreground">
                  Delivery Rate: {rates.deliveryRate.toFixed(1)}%
                </p>
              </div>
              <Mail className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Opens</p>
                <p className="text-2xl font-bold text-green-600">{formatNumber(campaign.metrics?.open || 0)}</p>
                <p className="text-xs text-muted-foreground">
                  Open Rate: {rates.openRate.toFixed(1)}%
                </p>
              </div>
              <Eye className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Unique Clickers</p>
                <p className="text-2xl font-bold text-purple-600">{formatNumber(campaign.metrics?.uniqueClickers || 0)}</p>
                <p className="text-xs text-muted-foreground">
                  Click Rate: {rates.clickRate.toFixed(1)}%
                </p>
              </div>
              <MousePointer className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Clicks</p>
                <p className="text-2xl font-bold text-orange-600">{formatNumber(campaign.metrics?.totalClicks || 0)}</p>
                <p className="text-xs text-muted-foreground">
                  CTOR: {rates.clickToOpenRate.toFixed(1)}%
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="contacts">Click Details</TabsTrigger>
          <TabsTrigger value="links">Link Performance</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Timeline Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Activity Timeline
                </CardTitle>
                <CardDescription>Clicks and opens over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={data.timelineData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="clicks" stroke="#8b5cf6" strokeWidth={2} />
                    <Line type="monotone" dataKey="opens" stroke="#10b981" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Device Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5" />
                  Device Distribution
                </CardTitle>
                <CardDescription>Click distribution by device type</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={data.deviceData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ device, percentage }) => `${device} (${percentage.toFixed(1)}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="clicks"
                    >
                      {data.deviceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="contacts" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Contacts Who Clicked ({filteredContacts.length})
                  </CardTitle>
                  <CardDescription>Detailed click analysis for each contact</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search contacts..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-64"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Contact</TableHead>
                    <TableHead>Total Clicks</TableHead>
                    <TableHead>Unique Links</TableHead>
                    <TableHead>First Click</TableHead>
                    <TableHead>Last Click</TableHead>
                    <TableHead>Engagement</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredContacts.map((contact) => (
                    <TableRow key={contact.contactId}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {contact.firstName && contact.lastName 
                              ? `${contact.firstName} ${contact.lastName}` 
                              : 'Unknown Name'}
                          </div>
                          <div className="text-sm text-muted-foreground">{contact.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{contact.totalClicks}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{contact.uniqueLinks}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(contact.firstClick)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(contact.lastClick)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${Math.min(contact.engagementScore * 10, 100)}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {contact.engagementScore.toFixed(1)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleContactClick(contact)}
                            >
                              View Details
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[80vh]">
                            <DialogHeader>
                              <DialogTitle>
                                Click Details - {contact.firstName && contact.lastName 
                                  ? `${contact.firstName} ${contact.lastName}` 
                                  : contact.email}
                              </DialogTitle>
                              <DialogDescription>
                                Comprehensive click history and behavior analysis
                              </DialogDescription>
                            </DialogHeader>
                            <ScrollArea className="h-96">
                              {detailsLoading ? (
                                <div className="space-y-4 animate-pulse">
                                  {[...Array(3)].map((_, i) => (
                                    <div key={i} className="h-16 bg-gray-200 rounded"></div>
                                  ))}
                                </div>
                              ) : (
                                <div className="space-y-4">
                                  {contactDetails.map((detail, index) => (
                                    <Card key={index} className="p-4">
                                      <div className="flex items-start justify-between">
                                        <div className="space-y-2">
                                          <div className="flex items-center gap-2">
                                            <ExternalLink className="h-4 w-4 text-blue-600" />
                                            <span className="font-medium">{detail.linkText || 'Untitled Link'}</span>
                                          </div>
                                          <p className="text-sm text-muted-foreground break-all">
                                            {detail.originalUrl}
                                          </p>
                                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                            <div className="flex items-center gap-1">
                                              <Calendar className="h-3 w-3" />
                                              {formatDate(detail.clickedAt)}
                                            </div>
                                            <div className="flex items-center gap-1">
                                              <Globe className="h-3 w-3" />
                                              {detail.device}
                                            </div>
                                            {detail.location && (
                                              <div className="flex items-center gap-1">
                                                <MapPin className="h-3 w-3" />
                                                {detail.location}
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                        <Badge variant="outline" className="text-xs">
                                          Click #{index + 1}
                                        </Badge>
                                      </div>
                                    </Card>
                                  ))}
                                  {contactDetails.length === 0 && (
                                    <p className="text-center text-muted-foreground py-8">
                                      No click details found for this contact.
                                    </p>
                                  )}
                                </div>
                              )}
                            </ScrollArea>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {filteredContacts.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  {searchTerm ? 'No contacts found matching your search.' : 'No contacts have clicked in this campaign yet.'}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="links" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ExternalLink className="h-5 w-5" />
                Link Performance Analysis
              </CardTitle>
              <CardDescription>Performance metrics for each link in your campaign</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Link</TableHead>
                    <TableHead>Total Clicks</TableHead>
                    <TableHead>Unique Clickers</TableHead>
                    <TableHead>Click Rate</TableHead>
                    <TableHead>URL</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.linkPerformance.map((link, index) => (
                    <TableRow key={link.linkId}>
                      <TableCell>
                        <div className="font-medium">{link.linkText || `Link ${index + 1}`}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{link.clickCount}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{link.uniqueClickers}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-purple-600 h-2 rounded-full" 
                              style={{ width: `${Math.min(link.clickRate, 100)}%` }}
                            ></div>
                          </div>
                          <span className="text-sm">{link.clickRate.toFixed(1)}%</span>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <div className="truncate text-sm text-muted-foreground" title={link.originalUrl}>
                          {link.originalUrl}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {data.linkPerformance.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No link performance data available.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Performance Insights</CardTitle>
                <CardDescription>Key takeaways from your campaign</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-500 mt-2"></div>
                  <div>
                    <p className="font-medium">Strong Engagement</p>
                    <p className="text-sm text-muted-foreground">
                      Your click-to-open rate of {rates.clickToOpenRate.toFixed(1)}% is 
                      {rates.clickToOpenRate > 10 ? ' above' : ' below'} industry average
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-blue-500 mt-2"></div>
                  <div>
                    <p className="font-medium">Top Performing Link</p>
                    <p className="text-sm text-muted-foreground">
                      "{campaign.metrics?.topLink || 'N/A'}" received the most clicks
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-purple-500 mt-2"></div>
                  <div>
                    <p className="font-medium">Mobile Usage</p>
                    <p className="text-sm text-muted-foreground">
                      {((campaign.metrics?.mobileOpen || 0) / (campaign.metrics?.open || 1) * 100).toFixed(1)}% 
                      of opens were on mobile devices
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Geographic Distribution</CardTitle>
                <CardDescription>Click distribution by location</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.locationData.slice(0, 5).map((location, index) => (
                    <div key={location.location} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{location.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-12 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${location.percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-muted-foreground w-12 text-right">
                          {location.percentage.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}