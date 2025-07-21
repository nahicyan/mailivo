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

interface CreateCampaignDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateCampaignDialog({ open, onClose, onSuccess }: CreateCampaignDialogProps) {
  const [loading, setLoading] = useState(false);
  const [properties, setProperties] = useState<string[]>([]);
  const [emailLists, setEmailLists] = useState<string[]>([]);
  const [templates, setTemplates] = useState<string[]>([]);
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

  useEffect(() => {
    if (open) {
      fetchSelectOptions();
    }
  }, [open]);

  const fetchSelectOptions = async () => {
    try {
      const [propsRes, listsRes, templatesRes] = await Promise.all([
        fetch('/api/properties'),
        fetch('/api/email-lists'),
        fetch('/api/templates')
      ]);
      
      setProperties(await propsRes.json());
      setEmailLists(await listsRes.json());
      setTemplates(await templatesRes.json());
    } catch (error) {
      console.error('Error fetching options:', error);
    }
  };

  const handlePropertyChange = (property: string) => {
    setFormData(prev => ({
      ...prev,
      property,
      name: property // Auto-fill name with property address
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          scheduledDate: selectedDate?.toISOString()
        })
      });

      if (response.ok) {
        onSuccess();
        onClose();
        // Reset form
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
        setSelectedDate(undefined);
      }
    } catch (error) {
      console.error('Error creating campaign:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Campaign</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="property">Property *</Label>
              <Select value={formData.property} onValueChange={handlePropertyChange} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select property" />
                </SelectTrigger>
                <SelectContent>
                  {properties.map((property) => (
                    <SelectItem key={property} value={property}>
                      {property}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Campaign Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Campaign name (auto-filled from property)"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="emailList">Email List *</Label>
              <Select value={formData.emailList} onValueChange={(value) => setFormData(prev => ({ ...prev, emailList: value }))} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select email list" />
                </SelectTrigger>
                <SelectContent>
                  {emailLists.map((list) => (
                    <SelectItem key={list} value={list}>
                      {list}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="emailTemplate">Email Template *</Label>
              <Select value={formData.emailTemplate} onValueChange={(value) => setFormData(prev => ({ ...prev, emailTemplate: value }))} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select template" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((template) => (
                    <SelectItem key={template} value={template}>
                      {template}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="emailAddressGroup">Email Address Group</Label>
              <Input
                id="emailAddressGroup"
                value={formData.emailAddressGroup}
                onChange={(e) => setFormData(prev => ({ ...prev, emailAddressGroup: e.target.value }))}
                placeholder="Enter email group"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="emailVolume">Email Volume</Label>
              <Input
                id="emailVolume"
                type="number"
                value={formData.emailVolume}
                onChange={(e) => setFormData(prev => ({ ...prev, emailVolume: parseInt(e.target.value) || 0 }))}
                placeholder="Expected volume"
                min="1"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="emailSchedule">Schedule</Label>
              <Select value={formData.emailSchedule} onValueChange={(value) => setFormData(prev => ({ ...prev, emailSchedule: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select schedule" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="immediate">Send Immediately</SelectItem>
                  <SelectItem value="scheduled">Schedule for Later</SelectItem>
                  <SelectItem value="recurring">Recurring</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.emailSchedule === 'scheduled' && (
              <div className="space-y-2">
                <Label>Scheduled Date</Label>
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
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Campaign
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}