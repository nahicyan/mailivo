// app/src/app/dashboard/landivo/campaigns/create-multi/[[...id]]/page.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, ArrowLeft, Mail, Loader2, RefreshCcw, Building } from 'lucide-react';
import { CreateCampaignRequest } from '@/types/campaign';
import { useLandivoProperties } from '@/hooks/useLandivoProperties';
import { useTemplates } from '@/hooks/useTemplates';
import { hasAgentProfileComponents } from '@landivo/email-template';
import Link from 'next/link';

import { StepsSidebar } from '../components/StepsSidebar';
import { Step1Property } from '../components/Step1Property';
import { Step2BasicInfo } from '../components/Step2BasicInfo';
import { Step3Audience } from '../components/Step3Audience';
import { StepAgentProfile } from '../components/StepAgentProfile';
import { Step4PaymentOptions } from '../components/Step4PaymentOptions';
import { Step5Picture } from '../components/Step5Picture';
import { Step6Subject } from '../components/Step6Subject';
import { Step7Schedule } from '../components/Step7Schedule';
import { validatePaymentOptions } from '@/utils/paymentValidation';
import { validateMultiPropertySchedule, prepareMultiPropertyCampaignData } from '@/utils/multiPropertyValidation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.mailivo.landivo.com';

interface ExtendedCreateCampaignRequest extends CreateCampaignRequest {
    selectedProperties: string[];
    sortedPropertyOrder: string[];
    selectedAgent?: string; // New field for agent selection
}

export default function CreateMultiCampaignPage() {
    const router = useRouter();
    const params = useParams();
    const [loading, setLoading] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date>();
    const [currentStep, setCurrentStep] = useState(1);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const [formData, setFormData] = useState<ExtendedCreateCampaignRequest>({
        name: '',
        property: '',
        emailList: '',
        emailTemplate: '',
        emailAddressGroup: '',
        emailSchedule: 'immediate',
        emailVolume: 1000,
        description: '',
        subject: '',
        selectedPlan: null,
        selectedProperties: [],
        sortedPropertyOrder: [],
        selectedAgent: '' // Initialize agent selection
    });

    // Data fetching hooks
    const { data: properties, isLoading: propertiesLoading, error: propertiesError } = useLandivoProperties();
    const { data: templates, isLoading: templatesLoading, error: templatesError } = useTemplates();
    
    // Fetch email lists
    const { data: emailLists, isLoading: listsLoading, error: listsError } = useQuery({
        queryKey: ['emailLists'],
        queryFn: async () => {
            const response = await fetch(`${API_URL}/api/email-lists`);
            if (!response.ok) throw new Error('Failed to fetch email lists');
            return response.json();
        },
    });

    // Determine if the selected template has agent profile components
    const selectedTemplate = templates?.find(t => t.id === formData.emailTemplate);
    const hasAgentProfile = selectedTemplate ? hasAgentProfileComponents(selectedTemplate) : false;

    // Calculate total steps based on whether agent profile is needed
    const totalSteps = hasAgentProfile ? 8 : 7;
    const agentStepNumber = 4;

    // Helper function to get adjusted step number (for steps after agent profile)
    const getAdjustedStepNumber = (originalStep: number) => {
        if (hasAgentProfile && originalStep >= agentStepNumber) {
            return originalStep + 1;
        }
        return originalStep;
    };

    // Helper function to get original step number from current step
    const getOriginalStepNumber = (currentStep: number) => {
        if (hasAgentProfile && currentStep > agentStepNumber) {
            return currentStep - 1;
        }
        return currentStep;
    };

    // Validation function for each step
    const validateStep = (step: number) => {
        const newErrors: Record<string, string> = {};

        switch (step) {
            case 1:
                if (formData.selectedProperties.length === 0) {
                    newErrors.selectedProperties = 'Please select at least one property';
                }
                break;
            case 2:
                if (!formData.name.trim()) {
                    newErrors.name = 'Campaign name is required';
                }
                if (!formData.description.trim()) {
                    newErrors.description = 'Campaign description is required';
                }
                break;
            case 3:
                if (!formData.emailList) {
                    newErrors.emailList = 'Please select an email list';
                }
                if (!formData.emailTemplate) {
                    newErrors.emailTemplate = 'Please select an email template';
                }
                break;
            case 4:
                // Agent profile validation (only if hasAgentProfile is true)
                if (hasAgentProfile && !formData.selectedAgent) {
                    newErrors.selectedAgent = 'Please select an agent profile';
                }
                break;
            // Note: Adjust remaining cases based on hasAgentProfile
            case (hasAgentProfile ? 5 : 4):
                // Payment options validation
                if (!validatePaymentOptions(formData.selectedPlan)) {
                    newErrors.selectedPlan = 'Please select a payment plan';
                }
                break;
            case (hasAgentProfile ? 6 : 5):
                // Picture validation - handled in Step5Picture component
                break;
            case (hasAgentProfile ? 7 : 6):
                if (!formData.subject?.trim()) {
                    newErrors.subject = 'Email subject is required';
                }
                break;
            case (hasAgentProfile ? 8 : 7):
                if (!validateMultiPropertySchedule(formData, selectedDate)) {
                    newErrors.schedule = 'Please configure email schedule';
                }
                break;
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNext = () => {
        if (validateStep(currentStep)) {
            setCurrentStep(prev => Math.min(prev + 1, totalSteps));
        }
    };

    const handlePrevious = () => {
        setCurrentStep(prev => Math.max(prev - 1, 1));
    };

    const handleStepClick = (step: number) => {
        // Validate all steps up to the target step
        for (let i = 1; i < step; i++) {
            if (!validateStep(i)) {
                return;
            }
        }
        setCurrentStep(step);
    };

    // Render the appropriate step component
    const renderStepContent = () => {
        const stepProps = {
            formData,
            setFormData,
            errors,
            properties,
            templates,
            emailLists,
            selectedDate,
            setSelectedDate,
            propertiesLoading,
            propertiesError,
            selectedTemplate
        };

        switch (currentStep) {
            case 1:
                return <Step1Property {...stepProps} />;
            case 2:
                return <Step2BasicInfo {...stepProps} />;
            case 3:
                return <Step3Audience {...stepProps} />;
            case 4:
                if (hasAgentProfile) {
                    return <StepAgentProfile {...stepProps} />;
                } else {
                    return <Step4PaymentOptions {...stepProps} />;
                }
            case 5:
                if (hasAgentProfile) {
                    return <Step4PaymentOptions {...stepProps} />;
                } else {
                    return <Step5Picture {...stepProps} />;
                }
            case 6:
                if (hasAgentProfile) {
                    return <Step5Picture {...stepProps} />;
                } else {
                    return <Step6Subject {...stepProps} />;
                }
            case 7:
                if (hasAgentProfile) {
                    return <Step6Subject {...stepProps} />;
                } else {
                    return <Step7Schedule {...stepProps} />;
                }
            case 8:
                return <Step7Schedule {...stepProps} />;
            default:
                return null;
        }
    };

    const handleSubmit = async () => {
        if (!validateStep(currentStep)) {
            return;
        }

        setLoading(true);
        try {
            const campaignStatus = formData.emailSchedule === 'immediate' ? 'active' : 'draft';
            const campaignData = prepareMultiPropertyCampaignData({
                ...formData,
                type: 'multi-property',
                status: campaignStatus,
                source: 'landivo',
                scheduledDate: formData.emailSchedule === 'scheduled' ? selectedDate : undefined,
            });

            const response = await fetch(`${API_URL}/api/campaigns`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(campaignData),
            });

            if (!response.ok) {
                throw new Error('Failed to create campaign');
            }

            const result = await response.json();
            router.push(`/dashboard/landivo/campaigns/${result.id}`);
        } catch (error: any) {
            setErrors({ submit: error.message || 'Failed to create campaign' });
        } finally {
            setLoading(false);
        }
    };

    const hasErrors = !!(propertiesError || templatesError || listsError);

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="flex">
                {/* Sidebar */}
                <div className="w-64 bg-white shadow-sm">
                    <StepsSidebar
                        currentStep={currentStep}
                        onStepClick={handleStepClick}
                        isMultiProperty={true}
                        showAgentProfileStep={hasAgentProfile}
                    />
                </div>

                {/* Main Content */}
                <div className="flex-1">
                    <div className="max-w-4xl mx-auto p-6">
                        <div className="bg-white rounded-lg shadow-sm">
                            {/* Header */}
                            <div className="border-b border-gray-200 p-6">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h1 className="text-2xl font-bold text-gray-900">
                                            Create Multi-Property Campaign
                                        </h1>
                                        <p className="text-gray-600">
                                            Complete all steps to create your campaign
                                        </p>
                                        {/* Step indicator */}
                                        <div className="mt-2">
                                            <Badge variant="outline">
                                                Step {currentStep} of {totalSteps}
                                            </Badge>
                                            {hasAgentProfile && currentStep >= agentStepNumber && (
                                                <Badge variant="secondary" className="ml-2">
                                                    Agent Profile Required
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                    <Link href="/dashboard/landivo/campaigns">
                                        <Button variant="outline" size="sm">
                                            <ArrowLeft className="h-4 w-4 mr-2" />
                                            Back to Campaigns
                                        </Button>
                                    </Link>
                                </div>
                            </div>

                            {/* Error States */}
                            {hasErrors && (
                                <div className="border-b border-gray-200 p-6">
                                    <Alert variant="destructive">
                                        <AlertTriangle className="h-4 w-4" />
                                        <AlertDescription>
                                            There was an error loading campaign data. Please refresh the page.
                                        </AlertDescription>
                                    </Alert>
                                </div>
                            )}

                            {/* Step Content */}
                            <div className="p-6">
                                {renderStepContent()}
                            </div>

                            {/* Navigation Footer */}
                            <div className="border-t border-gray-200 p-6">
                                <div className="flex justify-between">
                                    <Button
                                        variant="outline"
                                        onClick={handlePrevious}
                                        disabled={currentStep === 1}
                                    >
                                        Previous
                                    </Button>

                                    {currentStep === totalSteps ? (
                                        <Button
                                            onClick={handleSubmit}
                                            disabled={loading}
                                            className="bg-blue-600 hover:bg-blue-700"
                                        >
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
                                    ) : (
                                        <Button onClick={handleNext}>
                                            Next
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}