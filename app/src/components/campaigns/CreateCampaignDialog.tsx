'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CalendarIcon, Loader2, AlertTriangle, RefreshCcw } from 'lucide-react';
import { format } from 'date-fns';
import { CreateCampaignRequest } from '@/types/campaign';
import { useLandivoProperties } from '@/hooks/useLandivoProperties';
import { useEmailLists } from '@/hooks/useEmailLists';
import { useTemplates } from '@/hooks/useTemplates';

interface CreateCampaignDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateCampaignDialog({ open, onClose, onSuccess }: CreateCampaignDialogProps) {
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>();
  
  const [formData, setFormData] = useState<CreateCampaignRequest>({
    name: '',
    property: '',
    emailList: '',
    emailTemplate: '',
    emailAddressGroup: '',
    emailSchedule: 'immediate',
    emailVolume: 1000,
    description: ''
  });

  // Fetch data with proper error handling
  const { 
    data: properties, 
    isLoading: propertiesLoading, 
    error: propertiesError,
    refetch: refetchProperties 
  } = useLandivoProperties();
  
  const { 
    data: emailLists, 
    isLoading: listsLoading, 
    error: listsError,
    refetch: refetchLists 
  } = useEmailLists();
  
  const { 
    data: templates, 
    isLoading: templatesLoading, 
    error: templatesError,
    refetch: refetchTemplates 
  } = useTemplates();

  // Calculate template line count for display
  const getTemplateLineCount = (template: any) => {
    if (!template.components) return 0;
    return template.components.length;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const campaignData = {
        ...formData,
        scheduledDate: formData.emailSchedule === 'scheduled' ? selectedDate : undefined
      };

      const response = await fetch('/api/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
        },
        credentials: 'include',
        body: JSON.stringify(campaignData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create campaign');
      }

      onSuccess();
      onClose();
      setFormData({
        name: '',
        property: '',
        emailList: '',
        emailTemplate: '',
        emailAddressGroup: '',
        emailSchedule: 'immediate',
        emailVolume: 1000,
        description: ''
      });
    } catch (error: any) {
      console.error('Error creating campaign:', error);
      alert(`Failed to create campaign: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    if (propertiesError) refetchProperties();
    if (listsError) refetchLists();
    if (templatesError) refetchTemplates();
  };

  // Check if there are any critical errors that prevent form display
  const hasErrors = propertiesError || listsError || templatesError;
  const allDataLoaded = !propertiesLoading && !listsLoading && !templatesLoading;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Campaign</DialogTitle>
        </DialogHeader>

        {hasErrors && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="space-y-2">
              <div>Failed to load some campaign options:</div>
              {propertiesError && <div>• Properties: {propertiesError.message}</div>}
              {listsError && <div>• Email Lists: {listsError.message}</div>}
              {templatesError && <div>• Templates: {templatesError.message}</div>}
              <Button size="sm" variant="outline" onClick={handleRetry} className="mt-2">
                <RefreshCcw className="h-3 w-3 mr-1" />
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Campaign Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter campaign name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="property">Property</Label>
            <Select 
              value={formData.property} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, property: value }))}
              disabled={propertiesLoading || !!propertiesError}
            >
              <SelectTrigger>
                <SelectValue placeholder={
                  propertiesLoading ? "Loading properties..." : 
                  propertiesError ? "Error loading properties" :
                  "Select property"
                } />
              </SelectTrigger>
              <SelectContent>
                {properties?.map((property) => (
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
            <Label htmlFor="emailList">Email List</Label>
            <Select 
              value={formData.emailList} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, emailList: value }))}
              disabled={listsLoading || !!listsError}
            >
              <SelectTrigger>
                <SelectValue placeholder={
                  listsLoading ? "Loading email lists..." : 
                  listsError ? "Error loading email lists" :
                  "Select email list"
                } />
              </SelectTrigger>
              <SelectContent>
                {emailLists?.map((list) => (
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
            <Label htmlFor="emailTemplate">Email Template</Label>
            <Select 
              value={formData.emailTemplate} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, emailTemplate: value }))}
              disabled={templatesLoading || !!templatesError}
            >
              <SelectTrigger>
                <SelectValue placeholder={
                  templatesLoading ? "Loading templates..." : 
                  templatesError ? "Error loading templates" :
                  "Select template"
                } />
              </SelectTrigger>
              <SelectContent>
                {templates?.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    <div className="flex flex-col w-full">
                      <span className="font-medium">{template.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {getTemplateLineCount(template)} components • {template.category}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="emailSchedule">Schedule</Label>
            <Select value={formData.emailSchedule} onValueChange={(value) => setFormData(prev => ({ ...prev, emailSchedule: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="immediate">Send Immediately</SelectItem>
                <SelectItem value="scheduled">Schedule for Later</SelectItem>
              </SelectContent>
            </Select>

            {formData.emailSchedule === 'scheduled' && (
              <div className="pt-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="emailVolume">Estimated Email Volume</Label>
            <Input
              id="emailVolume"
              type="number"
              value={formData.emailVolume}
              onChange={(e) => setFormData(prev => ({ ...prev, emailVolume: parseInt(e.target.value) || 0 }))}
              placeholder="1000"
              min="1"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Campaign description (optional)"
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading || !allDataLoaded || hasErrors}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Campaign
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}