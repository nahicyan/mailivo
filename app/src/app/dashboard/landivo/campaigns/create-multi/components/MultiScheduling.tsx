// app/src/app/dashboard/landivo/campaigns/create-multi/components/Step7Schedule.tsx
import React from 'react'; // Add React import
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { TimePicker } from '@/components/ui/time-picker'; // Add TimePicker import
import { CalendarIcon, Clock, Target, Building, CreditCard, Image, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { useMemo } from 'react';

interface PropertyImageSelection {
  propertyId: string;
  imageIndex: number;
  imageUrl: string;
}

interface PaymentPlan {
  planNumber: number;
  planName: string;
  downPayment: number;
  loanAmount: number;
  interestRate: number;
  monthlyPayment: number;
  isAvailable: boolean;
}

interface Props {
  formData: any;
  setFormData: (fn: (prev: any) => any) => void;
  errors: Record<string, string>;
  selectedDate: Date | undefined;
  setSelectedDate: (date: Date | undefined) => void;
  properties: any[];
  emailLists: any[];
  templates: any[];
}

export function MultiScheduling({ 
  formData, 
  setFormData, 
  errors, 
  selectedDate, 
  setSelectedDate, 
  properties, 
  emailLists, 
  templates 
}: Props) {
  
  // Add combined date and time state
  const [scheduledDateTime, setScheduledDateTime] = React.useState<Date | undefined>(
    selectedDate || undefined
  );

  // Update parent state when datetime changes
  React.useEffect(() => {
    if (scheduledDateTime) {
      setSelectedDate(scheduledDateTime);
      setFormData(prev => ({
        ...prev,
        scheduledHour: scheduledDateTime.getHours().toString().padStart(2, '0'),
        scheduledMinute: scheduledDateTime.getMinutes().toString().padStart(2, '0')
      }));
    }
  }, [scheduledDateTime, setSelectedDate, setFormData]);

  // Add date and time handlers
  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      const newDateTime = new Date(date);
      if (scheduledDateTime) {
        newDateTime.setHours(scheduledDateTime.getHours());
        newDateTime.setMinutes(scheduledDateTime.getMinutes());
      } else {
        newDateTime.setHours(9, 0, 0, 0);
      }
      setScheduledDateTime(newDateTime);
    } else {
      setScheduledDateTime(undefined);
    }
  };

  const handleTimeChange = (time: Date | undefined) => {
    if (time && scheduledDateTime) {
      const newDateTime = new Date(scheduledDateTime);
      newDateTime.setHours(time.getHours());
      newDateTime.setMinutes(time.getMinutes());
      setScheduledDateTime(newDateTime);
    }
  };

  // Get selected properties in proper order
  const selectedPropertiesData = useMemo(() => {
    if (!properties || !formData.selectedProperties?.length) return [];
    
    const orderToUse = formData.sortedPropertyOrder?.length > 0
      ? formData.sortedPropertyOrder
      : formData.selectedProperties;
    
    return orderToUse
      .map((id: string) => properties.find((p: any) => p.id === id))
      .filter(Boolean);
  }, [properties, formData.selectedProperties, formData.sortedPropertyOrder]);

  // Helper functions
  const getSelectedEmailList = () => emailLists?.find(l => l.id === formData.emailList);
  const getSelectedTemplate = () => templates?.find(t => t.id === formData.emailTemplate);
  
  const formatCurrency = (amount: number | null | undefined) => {
    if (amount == null) return 'N/A';
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD', 
      minimumFractionDigits: 0 
    }).format(amount);
  };

  const getPropertyPaymentPlan = (propertyId: string): PaymentPlan | null => {
    return formData.selectedPaymentPlans?.[propertyId] || null;
  };

  const getPropertyImageSelection = (propertyId: string): PropertyImageSelection | null => {
    return formData.multiPropertyImageSelections?.find(
      (selection: PropertyImageSelection) => selection.propertyId === propertyId
    ) || null;
  };

  // Calculate totals and statistics
  const campaignStats = useMemo(() => {
const propertiesWithFinancing = selectedPropertiesData.filter(
  (property: any) => formData.financingEnabled && getPropertyPaymentPlan(property.id)
);
    
const totalMonthlyPayments = propertiesWithFinancing.reduce((sum: number, property: any) => {
  const plan = getPropertyPaymentPlan(property.id);
  return sum + (plan?.monthlyPayment || 0);
}, 0);

const averagePrice = selectedPropertiesData.reduce((sum: number, property: any) => {
  return sum + (property.askingPrice || 0);
}, 0) / selectedPropertiesData.length;

    return {
      totalProperties: selectedPropertiesData.length,
      propertiesWithFinancing: propertiesWithFinancing.length,
      totalMonthlyPayments,
      averagePrice,
      hasImages: formData.multiPropertyImageSelections?.length > 0
    };
  }, [selectedPropertiesData, formData]);

  return (
    <div className="space-y-6">
      {/* Schedule Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>Schedule Campaign</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>When to send *</Label>
            <Select
              value={formData.emailSchedule}
              onValueChange={(value) => setFormData(prev => ({
                ...prev,
                emailSchedule: value
              }))}
            >
              <SelectTrigger className={errors.emailSchedule ? 'border-red-500' : ''}>
                <SelectValue placeholder="Select send time" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="immediate">Send Immediately</SelectItem>
                <SelectItem value="scheduled">Schedule for Later</SelectItem>
              </SelectContent>
            </Select>
            {errors.emailSchedule && <p className="text-sm text-red-600">{errors.emailSchedule}</p>}
          </div>

          {formData.emailSchedule === 'scheduled' && (
            <div className="space-y-4 pt-4">
              <div>
                <Label className="mb-2 block">Select Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={`w-full justify-start text-left font-normal ${
                        !scheduledDateTime ? 'text-muted-foreground' : ''
                      } ${errors.scheduledDate ? 'border-red-500' : ''}`}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {scheduledDateTime ? format(scheduledDateTime, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={scheduledDateTime}
                      onSelect={handleDateSelect}
                      disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Label className="mb-2 block">Select Time</Label>
                <TimePicker
                  value={scheduledDateTime}
                  onChange={handleTimeChange}
                  hourCycle={24}
                  placeholder="Select time"
                  disabled={!scheduledDateTime}
                />
              </div>

              {scheduledDateTime && (
                <div className="rounded-lg bg-muted p-3">
                  <p className="text-sm font-medium">
                    Scheduled for: {format(scheduledDateTime, "PPP 'at' HH:mm")}
                  </p>
                </div>
              )}

              {errors.scheduledDate && (
                <p className="text-sm text-red-600">{errors.scheduledDate}</p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label>Estimated Email Volume</Label>
            <Input
              type="number"
              value={formData.emailVolume}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                emailVolume: parseInt(e.target.value) || 1000
              }))}
              min="1"
              className={errors.emailVolume ? 'border-red-500' : ''}
            />
            {errors.emailVolume && <p className="text-sm text-red-600">{errors.emailVolume}</p>}
            <p className="text-sm text-gray-500">
              Number of emails estimated to be sent in this campaign
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Multi-Property Campaign Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="h-5 w-5" />
            <span>Multi-Property Campaign Summary</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Campaign Details */}
            <div className="space-y-4">
              <div>
                <Label className="text-xs text-gray-500">Campaign Name</Label>
                <p className="font-medium">{formData.name}</p>
              </div>
              
              <div>
                <Label className="text-xs text-gray-500">Email List</Label>
                <p className="font-medium">{getSelectedEmailList()?.name}</p>
              </div>
              
              <div>
                <Label className="text-xs text-gray-500">Template</Label>
                <p className="font-medium">{getSelectedTemplate()?.name}</p>
              </div>
              
              <div>
                <Label className="text-xs text-gray-500">Schedule</Label>
                <p className="font-medium">
                  {formData.emailSchedule === 'immediate' 
                    ? 'Send Immediately' 
                    : scheduledDateTime 
                      ? format(scheduledDateTime, "PPP 'at' HH:mm")
                      : 'Not scheduled'}
                </p>
              </div>
            </div>

            {/* Campaign Statistics */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{campaignStats.totalProperties}</div>
                  <div className="text-sm text-gray-600">Properties</div>
                </div>
              </div>
              
              {formData.financingEnabled && campaignStats.propertiesWithFinancing > 0 && (
                <div className="grid grid-cols-1 gap-4">
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {campaignStats.propertiesWithFinancing}
                    </div>
                    <div className="text-sm text-gray-600">With Financing</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Properties List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Building className="h-5 w-5" />
            <span>Selected Properties ({selectedPropertiesData.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {selectedPropertiesData.map((property: any, index: number) => {
              const paymentPlan = getPropertyPaymentPlan(property.id);
              const imageSelection = getPropertyImageSelection(property.id);
              
              return (
                <div key={property.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">#{index + 1}</Badge>
                        <h4 className="font-medium">
                          {property.streetAddress}
                        </h4>
                      </div>
                      <div className="flex items-center space-x-1 text-sm text-gray-600 mt-1">
                        <MapPin className="h-3 w-3" />
                        <span>{property.city}, {property.state} {property.zip}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-lg">
                        {formatCurrency(property.askingPrice)}
                      </div>
                      <Badge 
                        variant={property.status === 'Available' ? 'default' : 'secondary'}
                      >
                        {property.status}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    {/* Payment Plan */}
                    <div className="flex items-center space-x-2">
                      <CreditCard className="h-4 w-4 text-gray-400" />
                      <div>
                        <div className="text-gray-600">Payment Plan</div>
                        {paymentPlan ? (
                          <div>
                            <div className="font-medium">{paymentPlan.planName}</div>
                            <div className="text-green-600">
                              {formatCurrency(paymentPlan.monthlyPayment)}/mo
                            </div>
                          </div>
                        ) : (
                          <div className="text-gray-500">Cash Only</div>
                        )}
                      </div>
                    </div>

                    {/* Image Selection */}
                    <div className="flex items-center space-x-2">
                      <Image className="h-4 w-4 text-gray-400" />
                      <div>
                        <div className="text-gray-600">Featured Image</div>
                        {imageSelection ? (
                          <div className="font-medium">Image #{imageSelection.imageIndex + 1}</div>
                        ) : (
                          <div className="text-gray-500">Default Image</div>
                        )}
                      </div>
                    </div>

                    {/* Property Details */}
                    <div>
                      <div className="text-gray-600">Details</div>
                      <div className="font-medium">
                        {property.area ? `${property.area} • ` : ''}
                        {property.sqft ? `${property.sqft.toLocaleString()} sq ft` : ''}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Financing Summary */}
      {formData.financingEnabled && campaignStats.propertiesWithFinancing > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CreditCard className="h-5 w-5" />
              <span>Financing Summary</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-xs text-gray-500">Strategy</Label>
                <p className="font-medium">
                  {formData.planStrategy?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </p>
              </div>
              <div>
                <Label className="text-xs text-gray-500">Properties with Financing</Label>
                <p className="font-medium">
                  {campaignStats.propertiesWithFinancing} of {campaignStats.totalProperties}
                </p>
              </div>
              <div>
                <Label className="text-xs text-gray-500">Total Monthly Payments</Label>
                <p className="font-medium text-green-600">
                  {formatCurrency(campaignStats.totalMonthlyPayments)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Validation Errors */}
      {errors.submit && (
        <Card className="border-red-200">
          <CardContent className="pt-6">
            <div className="text-red-600 text-sm">
              {errors.submit}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}