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
import { CalendarIcon, Loader2 } from 'lucide-react';
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

  // Use the correct hooks for fetching data
  const { data: properties, isLoading: propertiesLoading, error: propertiesError } = useLandivoProperties();
  const { data: emailLists, isLoading: listsLoading, error: listsError } = useEmailLists();
  const { data: templates, isLoading: templatesLoading, error: templatesError } = useTemplates();

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
        },
        body: JSON.stringify(campaignData),
      });

      if (!response.ok) {
        throw new Error('Failed to create campaign');
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
    } catch (error) {
      console.error('Error creating campaign:', error);
      // You might want to show a toast notification here
    } finally {
      setLoading(false);
    }
  };

  // Show error message if any of the APIs fail
  if (propertiesError || listsError || templatesError) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Error Loading Data</DialogTitle>
          </DialogHeader>
          <div className="text-red-600">
            Failed to load campaign options. Please check your connection and try again.
            {propertiesError && <div>Properties: {propertiesError.message}</div>}
            {listsError && <div>Email Lists: {listsError.message}</div>}
            {templatesError && <div>Templates: {templatesError.message}</div>}
          </div>
          <Button onClick={onClose}>Close</Button>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Campaign</DialogTitle>
        </DialogHeader>

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
            <Select value={formData.property} onValueChange={(value) => setFormData(prev => ({ ...prev, property: value }))}>
              <SelectTrigger>
                <SelectValue placeholder={propertiesLoading ? "Loading properties..." : "Select property"} />
              </SelectTrigger>
              <SelectContent>
                {properties?.map((property) => (
                  <SelectItem key={property.id} value={property.id}>
                    {property.title} - {property.streetAddress}, {property.city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="emailList">Email List</Label>
            <Select value={formData.emailList} onValueChange={(value) => setFormData(prev => ({ ...prev, emailList: value }))}>
              <SelectTrigger>
                <SelectValue placeholder={listsLoading ? "Loading email lists..." : "Select email list"} />
              </SelectTrigger>
              <SelectContent>
                {emailLists?.map((list) => (
                  <SelectItem key={list.id} value={list.id}>
                    {list.name} ({list.totalContacts} contacts)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="emailTemplate">Email Template</Label>
            <Select value={formData.emailTemplate} onValueChange={(value) => setFormData(prev => ({ ...prev, emailTemplate: value }))}>
              <SelectTrigger>
                <SelectValue placeholder={templatesLoading ? "Loading templates..." : "Select template"} />
              </SelectTrigger>
              <SelectContent>
                {templates?.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name}
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
            <Button type="submit" disabled={loading || propertiesLoading || listsLoading || templatesLoading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Campaign
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}