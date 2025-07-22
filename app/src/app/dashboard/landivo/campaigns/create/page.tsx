'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
    CalendarIcon,
    Loader2,
    AlertTriangle,
    RefreshCcw,
    ArrowLeft,
    Mail,
    Building,
    Users,
    FileText,
    Clock,
    Target,
    Settings
} from 'lucide-react';
import { format } from 'date-fns';
import { CreateCampaignRequest } from '@/types/campaign';
import { useLandivoProperties } from '@/hooks/useLandivoProperties';
import { useTemplates } from '@/hooks/useTemplates';
import Link from 'next/link';

export default function CreateCampaignPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date>();
    const [currentStep, setCurrentStep] = useState(1);

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

    const [errors, setErrors] = useState<Record<string, string>>({});

    // Fetch data - Fixed email lists to use Landivo API
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
    } = useQuery({
        queryKey: ['landivo-email-lists'],
        queryFn: async () => {
            const response = await fetch('/api/landivo-email-lists', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
                },
                credentials: 'include',
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch email lists: ${response.statusText}`);
            }

            return response.json();
        },
        staleTime: 30000,
        retry: 2
    });

    const {
        data: templates,
        isLoading: templatesLoading,
        error: templatesError,
        refetch: refetchTemplates
    } = useTemplates();

    const validateStep = (step: number): boolean => {
        const newErrors: Record<string, string> = {};

        switch (step) {
            case 1:
                if (!formData.name.trim()) newErrors.name = 'Campaign name is required';
                if (!formData.description.trim()) newErrors.description = 'Description is required';
                break;
            case 2:
                if (!formData.property) newErrors.property = 'Property selection is required';
                break;
            case 3:
                if (!formData.emailList) newErrors.emailList = 'Email list is required';
                if (!formData.emailTemplate) newErrors.emailTemplate = 'Email template is required';
                break;
            case 4:
                if (formData.emailSchedule === 'scheduled' && !selectedDate) {
                    newErrors.schedule = 'Schedule date is required';
                }
                if (!formData.emailVolume || formData.emailVolume < 1) {
                    newErrors.emailVolume = 'Email volume must be at least 1';
                }
                break;
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNext = () => {
        if (validateStep(currentStep)) {
            setCurrentStep(prev => Math.min(prev + 1, 4));
        }
    };

    const handlePrevious = () => {
        setCurrentStep(prev => Math.max(prev - 1, 1));
    };

    const handleSubmit = async () => {
        if (!validateStep(4)) return;

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

            router.push('/dashboard/landivo/campaigns/manage');
        } catch (error: any) {
            console.error('Error creating campaign:', error);
            setErrors({ submit: `Failed to create campaign: ${error.message}` });
        } finally {
            setLoading(false);
        }
    };

    const getSelectedProperty = () => {
        return properties?.find(p => p.id === formData.property);
    };

    const getSelectedEmailList = () => {
        return emailLists?.find(l => l.id === formData.emailList);
    };

    const getSelectedTemplate = () => {
        return templates?.find(t => t.id === formData.emailTemplate);
    };

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(amount);

    const steps = [
        { number: 1, title: 'Basic Info', icon: FileText, description: 'Campaign name and description' },
        { number: 2, title: 'Property', icon: Building, description: 'Select target property' },
        { number: 3, title: 'Audience', icon: Users, description: 'Choose email list and template' },
        { number: 4, title: 'Schedule', icon: Clock, description: 'Set timing and volume' }
    ];

    const hasErrors = propertiesError || listsError || templatesError;

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center space-x-4">
                            <Link href="/dashboard/landivo/campaigns/manage">
                                <Button variant="ghost" size="sm">
                                    <ArrowLeft className="h-4 w-4 mr-2" />
                                    Back to Campaigns
                                </Button>
                            </Link>
                            <div className="h-6 w-px bg-gray-300" />
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Create New Campaign</h1>
                                <p className="text-sm text-gray-500">Set up your email marketing campaign</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Button variant="outline" onClick={() => router.back()}>Cancel</Button>
                            {currentStep === 4 ? (
                                <Button onClick={handleSubmit} disabled={loading}>
                                    {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Mail className="h-4 w-4 mr-2" />}
                                    Create Campaign
                                </Button>
                            ) : (
                                <Button onClick={handleNext}>
                                    Next Step
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Steps Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-lg border p-6 sticky top-8">
                            <h3 className="text-lg font-semibold mb-6">Campaign Setup</h3>
                            <div className="space-y-4">
                                {steps.map((step) => {
                                    const Icon = step.icon;
                                    const isActive = currentStep === step.number;
                                    const isCompleted = currentStep > step.number;

                                    return (
                                        <div key={step.number} className="flex items-start space-x-3">
                                            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${isCompleted ? 'bg-green-100 text-green-600' :
                                                    isActive ? 'bg-blue-100 text-blue-600' :
                                                        'bg-gray-100 text-gray-400'
                                                }`}>
                                                {isCompleted ? (
                                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                    </svg>
                                                ) : (
                                                    <Icon className="w-4 h-4" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-sm font-medium ${isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-500'}`}>
                                                    {step.title}
                                                </p>
                                                <p className="text-xs text-gray-500">{step.description}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="lg:col-span-3">
                        {hasErrors && (
                            <Alert variant="destructive" className="mb-6">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertDescription>
                                    <div className="space-y-1">
                                        <p>Failed to load some required data:</p>
                                        {propertiesError && <p>• Properties: {propertiesError.message}</p>}
                                        {listsError && <p>• Email Lists: {listsError.message}</p>}
                                        {templatesError && <p>• Templates: {templatesError.message}</p>}
                                    </div>
                                    <Button size="sm" variant="outline" onClick={() => {
                                        refetchProperties();
                                        refetchLists();
                                        refetchTemplates();
                                    }} className="mt-2">
                                        <RefreshCcw className="h-3 w-3 mr-1" />
                                        Retry
                                    </Button>
                                </AlertDescription>
                            </Alert>
                        )}

                        {errors.submit && (
                            <Alert variant="destructive" className="mb-6">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertDescription>{errors.submit}</AlertDescription>
                            </Alert>
                        )}

                        {/* Step 1: Basic Info */}
                        {currentStep === 1 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center space-x-2">
                                        <FileText className="h-5 w-5" />
                                        <span>Campaign Information</span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Campaign Name *</Label>
                                        <Input
                                            id="name"
                                            value={formData.name}
                                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                            placeholder="e.g., New Manhattan Listings - January 2025"
                                            className={errors.name ? 'border-red-500' : ''}
                                        />
                                        {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="description">Campaign Description *</Label>
                                        <Textarea
                                            id="description"
                                            value={formData.description}
                                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                            placeholder="Describe the purpose and goals of this campaign..."
                                            rows={4}
                                            className={errors.description ? 'border-red-500' : ''}
                                        />
                                        {errors.description && <p className="text-sm text-red-600">{errors.description}</p>}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Step 2: Property Selection */}
                        {currentStep === 2 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center space-x-2">
                                        <Building className="h-5 w-5" />
                                        <span>Select Property</span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="space-y-2">
                                        <Label>Property *</Label>
                                        <Select
                                            value={formData.property}
                                            onValueChange={(value) => setFormData(prev => ({ ...prev, property: value }))}
                                            disabled={propertiesLoading || !!propertiesError}
                                        >
                                            <SelectTrigger className={errors.property ? 'border-red-500' : ''}>
                                                <SelectValue placeholder={
                                                    propertiesLoading ? "Loading properties..." :
                                                        propertiesError ? "Error loading properties" :
                                                            "Select a property for this campaign"
                                                } />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {properties?.map((property) => (
                                                    <SelectItem key={property.id} value={property.id}>
                                                        <div className="flex flex-col space-y-1">
                                                            <span className="font-medium">{property.title}</span>
                                                            <span className="text-sm text-gray-500">
                                                                {property.streetAddress}, {property.city}, {property.state}
                                                            </span>
                                                            <div className="flex items-center space-x-2 text-xs">
                                                                <Badge variant="secondary">{formatCurrency(property.askingPrice)}</Badge>
                                                                <Badge variant="outline">{property.acre} acres</Badge>
                                                            </div>
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.property && <p className="text-sm text-red-600">{errors.property}</p>}
                                    </div>

                                    {/* Property Preview */}
                                    {formData.property && getSelectedProperty() && (
                                        <div className="p-4 bg-gray-50 rounded-lg">
                                            <h4 className="font-medium text-gray-900 mb-2">Selected Property</h4>
                                            <div className="space-y-2">
                                                <p className="font-medium">{getSelectedProperty()?.title}</p>
                                                <p className="text-sm text-gray-600">
                                                    {getSelectedProperty()?.streetAddress}, {getSelectedProperty()?.city}, {getSelectedProperty()?.state}
                                                </p>
                                                <div className="flex space-x-2">
                                                    <Badge>{formatCurrency(getSelectedProperty()?.askingPrice || 0)}</Badge>
                                                    <Badge variant="outline">{getSelectedProperty()?.acre} acres</Badge>
                                                    <Badge variant="outline">{getSelectedProperty()?.status}</Badge>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        {/* Step 3: Audience & Template - Fixed Email Lists */}
                        {currentStep === 3 && (
                            <div className="space-y-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center space-x-2">
                                            <Users className="h-5 w-5" />
                                            <span>Target Audience</span>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="space-y-2">
                                            <Label>Email List *</Label>
                                            <Select
                                                value={formData.emailList}
                                                onValueChange={(value) => setFormData(prev => ({ ...prev, emailList: value }))}
                                                disabled={listsLoading || !!listsError}
                                            >
                                                <SelectTrigger className={errors.emailList ? 'border-red-500' : ''}>
                                                    <SelectValue placeholder={
                                                        listsLoading ? "Loading email lists..." :
                                                            listsError ? "Error loading email lists - Click to retry" :
                                                                !emailLists || emailLists.length === 0 ? "No email lists found" :
                                                                    "Select email list"
                                                    } />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {emailLists && emailLists.length > 0 ? (
                                                        emailLists.map((list) => (
                                                            <SelectItem key={list.id} value={list.id}>
                                                                <div className="flex justify-between items-center w-full">
                                                                    <div className="flex flex-col">
                                                                        <span className="font-medium">{list.name}</span>
                                                                        <span className="text-xs text-gray-500">{list.description}</span>
                                                                    </div>
                                                                    <Badge variant="secondary" className="ml-2">
                                                                        {list.totalContacts} contacts
                                                                    </Badge>
                                                                </div>
                                                            </SelectItem>
                                                        ))
                                                    ) : (
                                                        <SelectItem disabled value="no-lists">
                                                            No email lists available
                                                        </SelectItem>
                                                    )}
                                                </SelectContent>
                                            </Select>
                                            {errors.emailList && <p className="text-sm text-red-600">{errors.emailList}</p>}
                                            {listsError && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => refetchLists()}
                                                    className="mt-2"
                                                >
                                                    Retry Loading Lists
                                                </Button>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center space-x-2">
                                            <FileText className="h-5 w-5" />
                                            <span>Email Template</span>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="space-y-2">
                                            <Label>Template *</Label>
                                            <Select
                                                value={formData.emailTemplate}
                                                onValueChange={(value) => setFormData(prev => ({ ...prev, emailTemplate: value }))}
                                                disabled={templatesLoading || !!templatesError}
                                            >
                                                <SelectTrigger className={errors.emailTemplate ? 'border-red-500' : ''}>
                                                    <SelectValue placeholder={
                                                        templatesLoading ? "Loading templates..." :
                                                            templatesError ? "Error loading templates" :
                                                                "Select email template"
                                                    } />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {templates?.map((template) => (
                                                        <SelectItem key={template.id} value={template.id}>
                                                            <div className="flex flex-col w-full">
                                                                <span className="font-medium">{template.name}</span>
                                                                <div className="flex space-x-2 text-xs">
                                                                    <Badge variant="outline">{template.components?.length || 0} components</Badge>
                                                                    <Badge variant="secondary">{template.category}</Badge>
                                                                </div>
                                                            </div>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {errors.emailTemplate && <p className="text-sm text-red-600">{errors.emailTemplate}</p>}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        )}

                        {/* Step 4: Schedule & Settings */}
                        {currentStep === 4 && (
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
                        )}

                        {/* Navigation */}
                        <div className="flex justify-between pt-6">
                            <div>
                                {currentStep > 1 && (
                                    <Button variant="outline" onClick={handlePrevious}>
                                        Previous
                                    </Button>
                                )}
                            </div>
                            <div className="space-x-2">
                                {currentStep < 4 ? (
                                    <Button onClick={handleNext}>
                                        Next Step
                                    </Button>
                                ) : (
                                    <Button onClick={handleSubmit} disabled={loading} size="lg">
                                        {loading ? (
                                            <>
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                Creating Campaign...
                                            </>
                                        ) : (
                                            <>
                                                <Mail className="h-4 w-4 mr-2" />
                                                Create Campaign
                                            </>
                                        )}
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}