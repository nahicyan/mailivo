// app/src/app/dashboard/landivo/campaigns/create/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, ArrowLeft, Mail, Loader2, RefreshCcw } from 'lucide-react';
import { CreateCampaignRequest } from '@/types/campaign';
import { useLandivoProperties } from '@/hooks/useLandivoProperties';
import { useTemplates } from '@/hooks/useTemplates';
import Link from 'next/link';

import { StepsSidebar } from './components/StepsSidebar';
import { Step1Property } from './components/Step1Property';
import { Step2BasicInfo } from './components/Step2BasicInfo';
import { Step3Audience } from './components/Step3Audience';
import { Step4PaymentOptions } from './components/Step4PaymentOptions';
import { Step5Picture } from './components/Step5Picture';
import { Step6Subject } from './components/Step6Subject';
import { Step7Schedule } from './components/Step7Schedule';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.mailivo.landivo.com';

export default function CreateCampaignPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date>();
    const [currentStep, setCurrentStep] = useState(1);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const [formData, setFormData] = useState<CreateCampaignRequest>({
        name: '',
        property: '',
        emailList: '',
        emailTemplate: '',
        emailAddressGroup: '',
        emailSchedule: 'immediate',
        emailVolume: 1000,
        description: '',
        subject: '',
        selectedPlan: null
    });

    // Data fetching hooks
    const { data: properties, isLoading: propertiesLoading, error: propertiesError, refetch: refetchProperties } = useLandivoProperties();
    const { data: templates, isLoading: templatesLoading, error: templatesError, refetch: refetchTemplates } = useTemplates();

    const { data: emailLists, isLoading: listsLoading, error: listsError, refetch: refetchLists } = useQuery({
        queryKey: ['landivo-email-lists'],
        queryFn: async () => {
            const response = await fetch(`${API_URL}/landivo-email-lists`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
                },
                credentials: 'include',
            });
            if (!response.ok) throw new Error(`Failed to fetch email lists: ${response.statusText}`);
            return response.json();
        },
        staleTime: 30000,
        retry: 2
    });

    // Auto-fill campaign name and description when property is selected
    const handlePropertyChange = (propertyId: string) => {
        setFormData(prev => ({ ...prev, property: propertyId }));

        if (propertyId && properties) {
            const selectedProperty = properties.find(p => p.id === propertyId);
            if (selectedProperty) {
                setFormData(prev => ({
                    ...prev,
                    property: propertyId,
                    name: `${selectedProperty.streetAddress}, ${selectedProperty.city}, ${selectedProperty.zip}`,
                    description: selectedProperty.title
                }));
            }
        }
    };

    const validateStep = (step: number): boolean => {
        const newErrors: Record<string, string> = {};

        switch (step) {
            case 1:
                if (!formData.property) newErrors.property = 'Please select a property';
                break;
            case 2:
                if (!formData.name.trim()) newErrors.name = 'Campaign name is required';
                if (!formData.description.trim()) newErrors.description = 'Campaign description is required';
                break;
            case 3:
                if (!formData.emailList) newErrors.emailList = 'Please select an email list';
                if (!formData.emailTemplate) newErrors.emailTemplate = 'Please select an email template';
                break;
            case 4:
                // Payment options validation - handled by component
                break;
            case 5:
                // Picture step - validation handled by component
                break;
            case 6:
                if (!formData.subject?.trim()) newErrors.subject = 'Please generate a subject line';
                break;
            case 7:
                if (formData.emailSchedule === 'scheduled' && !selectedDate) newErrors.schedule = 'Please select a date for scheduled campaign';
                if (!formData.emailVolume || formData.emailVolume < 1) newErrors.emailVolume = 'Email volume must be at least 1';
                break;
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNext = () => {
        if (validateStep(currentStep)) {
            if (currentStep < 7) {
                setCurrentStep(prev => prev + 1);
                setErrors({});
            }
        }
    };

    const handlePrevious = () => setCurrentStep(currentStep - 1);

    const handleSubmit = async () => {
        if (!validateStep(currentStep)) return;

        setLoading(true);
        try {
            const selectedTemplate = templates?.find((t: any) => t.id === formData.emailTemplate || t._id === formData.emailTemplate);
            const campaignStatus = formData.emailSchedule === 'immediate' ? 'active' : 'draft';

            const campaignData = {
                ...formData,
                status: campaignStatus,
                source: 'landivo',
                scheduledDate: formData.emailSchedule === 'scheduled' ? selectedDate : undefined,
                subject: formData.subject || selectedTemplate?.subject || selectedTemplate?.title || `Campaign for ${formData.property}`,
                htmlContent: selectedTemplate?.htmlContent || selectedTemplate?.content || selectedTemplate?.body || '<p>Email content here</p>',
                textContent: selectedTemplate?.textContent || '',
                audienceType: 'landivo',
                segments: [formData.emailList],
                estimatedRecipients: formData.emailVolume
            };

            const response = await fetch(`${API_URL}/campaigns`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
                },
                credentials: 'include',
                body: JSON.stringify(campaignData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to create campaign');
            }

            const newCampaign = await response.json();

            if (formData.emailSchedule === 'immediate' && newCampaign.status === 'active') {
                try {
                    await fetch(`${API_URL}/campaigns/${newCampaign._id}/send`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
                        },
                        credentials: 'include'
                    });
                } catch (sendError) {
                    console.warn('Auto-send failed:', sendError);
                }
            }

            router.push('/dashboard/landivo/campaigns/manage');
        } catch (error: any) {
            setErrors({ submit: error.message || 'Failed to create campaign. Please try again.' });
        } finally {
            setLoading(false);
        }
    };

    const hasErrors = propertiesError || listsError || templatesError;

    const stepProps = {
        formData,
        setFormData,
        handlePropertyChange,
        errors,
        properties,
        propertiesLoading,
        propertiesError,
        emailLists,
        listsLoading,
        listsError,
        refetchLists,
        templates,
        templatesLoading,
        templatesError,
        selectedDate,
        setSelectedDate
    };

    // Get selected template and property for components that need them
    const selectedTemplate = templates?.find(t => t.id === formData.emailTemplate || t._id === formData.emailTemplate);
    const selectedProperty = properties?.find(p => p.id === formData.property);

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
                            {currentStep === 7 ? (
                                <Button onClick={handleSubmit} disabled={loading}>
                                    {loading ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Creating...
                                        </>
                                    ) : (
                                        <>
                                            <Mail className="h-4 w-4 mr-2" />
                                            Create Campaign
                                        </>
                                    )}
                                </Button>
                            ) : (
                                <Button onClick={handleNext}>Next Step</Button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="lg:grid lg:grid-cols-4 lg:gap-8">
                    <StepsSidebar currentStep={currentStep} />

                    <div className="lg:col-span-3">
                        {hasErrors && (
                            <Alert className="mb-6">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertDescription>
                                    There was an error loading campaign data. Please try refreshing the page.
                                </AlertDescription>
                            </Alert>
                        )}

                        {errors.submit && (
                            <Alert className="mb-6">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertDescription>{errors.submit}</AlertDescription>
                            </Alert>
                        )}

                        {currentStep === 1 && <Step1Property {...stepProps} />}
                        {currentStep === 2 && <Step2BasicInfo {...stepProps} />}
                        {currentStep === 3 && <Step3Audience {...stepProps} />}
                        {currentStep === 4 && <Step4PaymentOptions 
                            formData={formData}
                            setFormData={setFormData}
                            errors={errors}
                            selectedTemplate={selectedTemplate}
                        />}
                        {currentStep === 5 && <Step5Picture 
                            formData={formData}
                            setFormData={setFormData}
                            errors={errors}
                            selectedTemplate={selectedTemplate}
                            selectedProperty={selectedProperty}
                        />}
                        {currentStep === 6 && <Step6Subject {...stepProps} />}
                        {currentStep === 7 && <Step7Schedule {...stepProps} />}

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
                                {currentStep < 7 ? (
                                    <Button onClick={handleNext}>Next Step</Button>
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