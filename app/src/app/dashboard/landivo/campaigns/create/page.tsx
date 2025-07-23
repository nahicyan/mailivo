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
import { Step1BasicInfo } from './components/Step1BasicInfo';
import { Step2Property } from './components/Step2Property';
import { Step3Audience } from './components/Step3Audience';
import { Step4Schedule } from './components/Step4Schedule';

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
        description: ''
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

    const validateStep = (step: number): boolean => {
        const newErrors: Record<string, string> = {};

        switch (step) {
            case 1:
                if (!formData.name.trim()) newErrors.name = 'Campaign name is required';
                if (!formData.description.trim()) newErrors.description = 'Campaign description is required';
                break;
            case 2:
                if (!formData.property) newErrors.property = 'Please select a property';
                break;
            case 3:
                if (!formData.emailList) newErrors.emailList = 'Please select an email list';
                if (!formData.emailTemplate) newErrors.emailTemplate = 'Please select an email template';
                break;
            case 4:
                if (formData.emailSchedule === 'scheduled' && !selectedDate) newErrors.schedule = 'Please select a date for scheduled campaign';
                if (!formData.emailVolume || formData.emailVolume < 1) newErrors.emailVolume = 'Email volume must be at least 1';
                break;
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNext = () => {
        if (validateStep(currentStep)) {
            setCurrentStep(currentStep + 1);
        }
    };

    const handlePrevious = () => setCurrentStep(currentStep - 1);

    const handleSubmit = async () => {
        if (!validateStep(currentStep)) return;

        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/campaigns`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
                },
                credentials: 'include',
                body: JSON.stringify({
                    ...formData,
                    source: 'landivo',
                    scheduledDate: formData.emailSchedule === 'scheduled' ? selectedDate : undefined
                })
            });

            if (!response.ok) throw new Error('Failed to create campaign');
            router.push('/dashboard/landivo/campaigns/manage');
        } catch (error) {
            setErrors({ submit: 'Failed to create campaign. Please try again.' });
        } finally {
            setLoading(false);
        }
    };

    const hasErrors = propertiesError || listsError || templatesError;

    const stepProps = {
        formData,
        setFormData,
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
                                <Button onClick={handleNext}>Next Step</Button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    <StepsSidebar currentStep={currentStep} />

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

                        {currentStep === 1 && <Step1BasicInfo {...stepProps} />}
                        {currentStep === 2 && <Step2Property {...stepProps} />}
                        {currentStep === 3 && <Step3Audience {...stepProps} />}
                        {currentStep === 4 && <Step4Schedule {...stepProps} />}

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