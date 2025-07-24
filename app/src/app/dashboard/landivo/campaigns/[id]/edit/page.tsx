// app/src/app/dashboard/landivo/campaigns/[id]/edit/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { use } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  ArrowLeft,
  Save,
  AlertTriangle,
  Loader2,
  FileText,
  Building,
  Users,
  Clock
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface Props {
  params: Promise<{ id: string }>;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.mailivo.landivo.com';

export default function EditCampaignPage({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    property: '',
    emailList: '',
    emailTemplate: '',
    emailSchedule: 'immediate',
    emailVolume: 0,
    status: 'draft'
  });

  const [properties, setProperties] = useState<any[]>([]);
  const [emailLists, setEmailLists] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);

  useEffect(() => {
    fetchCampaignData();
    fetchDropdownData();
  }, [id]);

  const fetchCampaignData = async () => {
    try {
      const response = await fetch(`${API_URL}/campaigns/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
        },
        credentials: 'include'
      });

      if (!response.ok) throw new Error('Campaign not found');

      const campaign = await response.json();
      setFormData({
        name: campaign.name || '',
        description: campaign.description || '',
        property: campaign.propertyId || campaign.property || '',
        emailList: campaign.emailListId || campaign.emailList || '',
        emailTemplate: campaign.emailTemplateId || campaign.emailTemplate || '',
        emailSchedule: campaign.emailSchedule || 'immediate',
        emailVolume: campaign.emailVolume || 0,
        status: campaign.status || 'draft'
      });
    } catch (error) {
      console.error('Error fetching campaign:', error);
      setError('Failed to load campaign data');
      toast.error('Failed to load campaign data');
    } finally {
      setLoading(false);
    }
  };

  const fetchDropdownData = async () => {
    try {
      const [propertiesRes, emailListsRes, templatesRes] = await Promise.all([
        fetch(`${API_URL}/landivo/properties`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}` },
          credentials: 'include'
        }),
        fetch(`${API_URL}/landivo-email-lists`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}` },
          credentials: 'include'
        }),
        fetch(`${API_URL}/templates`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}` },
          credentials: 'include'
        })
      ]);

      const [propertiesData, emailListsData, templatesData] = await Promise.all([
        propertiesRes.ok ? propertiesRes.json() : [],
        emailListsRes.ok ? emailListsRes.json() : [],
        templatesRes.ok ? templatesRes.json() : []
      ]);

      setProperties(propertiesData || []);
      setEmailLists(emailListsData || []);
      setTemplates(templatesData?.templates || templatesData || []);
    } catch (error) {
      console.error('Error fetching dropdown data:', error);
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Campaign name is required');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`${API_URL}/campaigns/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
        },
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error('Failed to update campaign');

      toast.success('Campaign updated successfully');
      router.push(`/dashboard/landivo/campaigns/${id}`);
    } catch (error) {
      console.error('Error updating campaign:', error);
      toast.error('Failed to update campaign');
    } finally {
      setSaving(false);
    }
  };

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">Campaign Not Found</h3>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Link href="/dashboard/landivo/campaigns/manage">
          <Button>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Campaigns
          </Button>
        </Link>
      </div>
    );
  }

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
              Campaign Details
            </Link>
            <span>/</span>
            <span>Edit</span>
          </div>
          <h1 className="text-3xl font-bold">Edit Campaign</h1>
          <p className="text-muted-foreground">Update your campaign settings</p>
        </div>
        
        <div className="flex gap-2 w-full sm:w-auto">
          <Link href={`/dashboard/landivo/campaigns/${id}`}>
            <Button variant="outline" className="flex-1 sm:flex-none">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Cancel
            </Button>
          </Link>
          <Button onClick={handleSave} disabled={saving} className="flex-1 sm:flex-none">
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Form */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Campaign Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => updateFormData('name', e.target.value)}
                placeholder="Campaign name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => updateFormData('description', e.target.value)}
                placeholder="Campaign description"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => updateFormData('status', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Targeting */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Property & Targeting
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="property">Property *</Label>
              <Select value={formData.property} onValueChange={(value) => updateFormData('property', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select property" />
                </SelectTrigger>
                <SelectContent>
                  {properties.map((property) => (
                    <SelectItem key={property.id} value={property.id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{property.title}</span>
                        <span className="text-xs text-muted-foreground">
                          {property.streetAddress}, {property.city}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="emailList">Email List *</Label>
              <Select value={formData.emailList} onValueChange={(value) => updateFormData('emailList', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select email list" />
                </SelectTrigger>
                <SelectContent>
                  {emailLists.map((list) => (
                    <SelectItem key={list.id} value={list.id}>
                      <div className="flex justify-between items-center w-full">
                        <span>{list.name}</span>
                        <span className="text-xs text-muted-foreground ml-2">
                          ({list.totalContacts} contacts)
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="emailTemplate">Email Template *</Label>
              <Select value={formData.emailTemplate} onValueChange={(value) => updateFormData('emailTemplate', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select template" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{template.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {template.components?.length || 0} components • {template.category}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Schedule & Volume */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Schedule & Volume
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="emailSchedule">Schedule</Label>
              <Select value={formData.emailSchedule} onValueChange={(value) => updateFormData('emailSchedule', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="immediate">Send Immediately</SelectItem>
                  <SelectItem value="scheduled">Schedule for Later</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="emailVolume">Email Volume</Label>
              <Input
                id="emailVolume"
                type="number"
                value={formData.emailVolume}
                onChange={(e) => updateFormData('emailVolume', parseInt(e.target.value) || 0)}
                placeholder="1000"
                min="1"
              />
            </div>
          </CardContent>
        </Card>

        {/* Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Campaign Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div>
                <span className="text-sm text-muted-foreground">Campaign Name:</span>
                <p className="font-medium">{formData.name || 'Untitled Campaign'}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Status:</span>
                <p className="font-medium capitalize">{formData.status}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Schedule:</span>
                <p className="font-medium">{formData.emailSchedule === 'immediate' ? 'Send Immediately' : 'Scheduled'}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Estimated Volume:</span>
                <p className="font-medium">{formData.emailVolume.toLocaleString()} emails</p>
              </div>
            </div>

            {formData.status === 'draft' && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  This campaign is in draft mode. Save changes and set status to "Active" to begin sending.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-4">
        <Link href={`/dashboard/landivo/campaigns/${id}`}>
          <Button variant="outline">Cancel</Button>
        </Link>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving Changes...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </div>
  );
}