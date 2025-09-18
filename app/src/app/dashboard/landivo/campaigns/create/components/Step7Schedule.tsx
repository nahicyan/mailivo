// app/src/app/dashboard/landivo/campaigns/create/components/Step7Schedule.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { TimePicker } from '@/components/ui/time-picker';
import { CalendarIcon, Clock, Target } from 'lucide-react';
import { format } from 'date-fns';
import * as React from 'react';

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

export function Step7Schedule({ 
    formData, 
    setFormData, 
    errors, 
    selectedDate, 
    setSelectedDate, 
    properties, 
    emailLists, 
    templates 
}: Props) {
    // Combined date and time state
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

    const getSelectedProperty = () => properties?.find(p => p.id === formData.property);
    const getSelectedEmailList = () => emailLists?.find(l => l.id === formData.emailList);
    const getSelectedTemplate = () => templates?.find(t => t.id === formData.emailTemplate);

    const handleDateSelect = (date: Date | undefined) => {
        if (date) {
            // Preserve time if already set, otherwise default to 9:00 AM
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

    return (
        <div className="space-y-6">
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
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="immediate">Send Immediately</SelectItem>
                                <SelectItem value="scheduled">Schedule for Later</SelectItem>
                            </SelectContent>
                        </Select>

                        {formData.emailSchedule === 'scheduled' && (
                            <div className="space-y-4 pt-4">
                                <div>
                                    <Label className="mb-2 block">Select Date</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                className={`w-full justify-start text-left font-normal ${
                                                    errors.schedule ? 'border-red-500' : ''
                                                }`}
                                            >
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {scheduledDateTime 
                                                    ? format(scheduledDateTime, "PPP") 
                                                    : "Pick a date"}
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

                                {errors.schedule && (
                                    <p className="text-sm text-red-600">{errors.schedule}</p>
                                )}
                            </div>
                        )}
                    </div>

                    <Separator />

                    <div className="space-y-2">
                        <Label htmlFor="emailVolume">Estimated Email Volume *</Label>
                        <Input
                            id="emailVolume"
                            type="number"
                            value={formData.emailVolume}
                            onChange={(e) => setFormData(prev => ({ 
                                ...prev, 
                                emailVolume: parseInt(e.target.value) || 0 
                            }))}
                            placeholder="1000"
                            min="1"
                            className={errors.emailVolume ? 'border-red-500' : ''}
                        />
                        {errors.emailVolume && (
                            <p className="text-sm text-red-600 mt-1">{errors.emailVolume}</p>
                        )}
                        <p className="text-sm text-muted-foreground">
                            Number of emails estimated to be sent in this campaign
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Campaign Summary */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <Target className="h-5 w-5" />
                        <span>Campaign Summary</span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                            <div>
                                <Label className="text-xs text-muted-foreground">Campaign Name</Label>
                                <p className="font-medium">{formData.name || 'Not set'}</p>
                            </div>
                            <div>
                                <Label className="text-xs text-muted-foreground">Property</Label>
                                <p className="font-medium">
                                    {getSelectedProperty()?.title || 'Not selected'}
                                </p>
                            </div>
                            <div>
                                <Label className="text-xs text-muted-foreground">Email List</Label>
                                <p className="font-medium">
                                    {getSelectedEmailList()?.name || 'Not selected'}
                                </p>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <div>
                                <Label className="text-xs text-muted-foreground">Template</Label>
                                <p className="font-medium">
                                    {getSelectedTemplate()?.name || 'Not selected'}
                                </p>
                            </div>
                            <div>
                                <Label className="text-xs text-muted-foreground">Schedule</Label>
                                <p className="font-medium">
                                    {formData.emailSchedule === 'immediate' 
                                        ? 'Send Immediately' 
                                        : scheduledDateTime 
                                            ? format(scheduledDateTime, "PPP 'at' HH:mm")
                                            : 'Not scheduled'}
                                </p>
                            </div>
                            <div>
                                <Label className="text-xs text-muted-foreground">Recipients</Label>
                                <p className="font-medium">
                                    {formData.emailVolume.toLocaleString()} emails
                                </p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}