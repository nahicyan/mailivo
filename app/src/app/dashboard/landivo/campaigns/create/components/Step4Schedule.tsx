// app/src/app/dashboard/landivo/campaigns/create/components/Step4Schedule.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { CalendarIcon, Clock, Target } from 'lucide-react';
import { format } from 'date-fns';

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

export function Step4Schedule({ formData, setFormData, errors, selectedDate, setSelectedDate, properties, emailLists, templates }: Props) {
    const getSelectedProperty = () => properties?.find(p => p.id === formData.property);
    const getSelectedEmailList = () => emailLists?.find(l => l.id === formData.emailList);
    const getSelectedTemplate = () => templates?.find(t => t.id === formData.emailTemplate);

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
                            onValueChange={(value) => setFormData(prev => ({ ...prev, emailSchedule: value }))}
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
                            <div className="pt-4">
                                <Label>Select Date & Time</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className={`w-full justify-start text-left font-normal ${errors.schedule ? 'border-red-500' : ''}`}
                                        >
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
                                {errors.schedule && <p className="text-sm text-red-600 mt-1">{errors.schedule}</p>}
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
                            onChange={(e) => setFormData(prev => ({ ...prev, emailVolume: parseInt(e.target.value) || 0 }))}
                            placeholder="1000"
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

            {/* Campaign Summary */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <Target className="h-5 w-5" />
                        <span>Campaign Summary</span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <div>
                                <Label className="text-xs text-gray-500">Campaign Name</Label>
                                <p className="font-medium">{formData.name}</p>
                            </div>
                            <div>
                                <Label className="text-xs text-gray-500">Property</Label>
                                <p className="font-medium">{getSelectedProperty()?.title}</p>
                            </div>
                            <div>
                                <Label className="text-xs text-gray-500">Email List</Label>
                                <p className="font-medium">{getSelectedEmailList()?.name}</p>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <div>
                                <Label className="text-xs text-gray-500">Template</Label>
                                <p className="font-medium">{getSelectedTemplate()?.name}</p>
                            </div>
                            <div>
                                <Label className="text-xs text-gray-500">Schedule</Label>
                                <p className="font-medium">
                                    {formData.emailSchedule === 'immediate' ? 'Send Immediately' :
                                        selectedDate ? format(selectedDate, "PPP") : 'Scheduled'}
                                </p>
                            </div>
                            <div>
                                <Label className="text-xs text-gray-500">Recipients</Label>
                                <p className="font-medium">{formData.emailVolume.toLocaleString()} emails</p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}