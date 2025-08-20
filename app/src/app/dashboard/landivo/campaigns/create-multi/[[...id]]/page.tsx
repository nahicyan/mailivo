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
import Link from 'next/link';

import { StepsSidebar } from '../components/StepsSidebar';
import { Step1Property } from '../components/Step1Property';
import { Step2BasicInfo } from '../components/Step2BasicInfo';
import { Step3Audience } from '../components/Step3Audience';
import { Step4PaymentOptions } from '../components/Step4PaymentOptions';
import { Step5Picture } from '../components/Step5Picture';
import { Step6Subject } from '../components/Step6Subject';
import { Step7Schedule } from '../components/Step7Schedule';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.mailivo.landivo.com';

interface ExtendedCreateCampaignRequest extends CreateCampaignRequest {
    selectedProperties: string[];
    sortedPropertyOrder: string[];
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
        property: '', // Keep for compatibility
        emailList: '',
        emailTemplate: '',
        emailAddressGroup: '',
        emailSchedule: 'immediate',
        emailVolume: 1000,
        description: '',
        subject: '',
        selectedPlan: null,
        selectedProperties: [],
        sortedPropertyOrder: []
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

    // Get selected properties with proper sorting
    const selectedPropertiesData = useMemo(() => {
        if (!properties || !formData.selectedProperties.length) return [];
        
        // If we have sorted order, use it; otherwise use selection order
        const orderToUse = formData.sortedPropertyOrder.length > 0 
            ? formData.sortedPropertyOrder 
            : formData.selectedProperties;
            
        return orderToUse
            .map(id => properties.find(p => p.id === id))
            .filter(Boolean);
    }, [properties, formData.selectedProperties, formData.sortedPropertyOrder]);

    // Generate campaign name from selected properties
    const generateCampaignName = (selectedProps: any[]) => {
        if (selectedProps.length === 0) return '';
        if (selectedProps.length === 1) {
            const prop = selectedProps[0];
            return `${prop.streetAddress}, ${prop.city}, ${prop.zip}`;
        }
        return `Multi-Property Campaign (${selectedProps.length} properties)`;
    };

    // Update campaign name when properties change
    useEffect(() => {
        if (selectedPropertiesData.length > 0 && !formData.name.trim()) {
            setFormData(prev => ({
                ...prev,
                name: generateCampaignName(selectedPropertiesData)
            }));
        }
    }, [selectedPropertiesData]);

    const validateStep = (step: number): boolean => {
        const newErrors: Record<string, string> = {};

        switch (step) {
            case 1:
                if (!formData.selectedProperties || formData.selectedProperties.length === 0) {
                    newErrors.selectedProperties = 'Please select at least one property';
                }
                break;
            case 2:
                if (!formData.name.trim()) newErrors.name = 'Campaign name is required';
                if (!formData.description.trim()) newErrors.description = 'Campaign description is required';
                break;
            case 3:
                if (!formData.emailList) newErrors.emailList = 'Please select an email list';
                break;
            case 4:
                if (!formData.selectedPlan) newErrors.selectedPlan = 'Please select a payment plan';
                break;
            case 5:
                // Picture step - no strict validation required
                break;
            case 6:
                if (!formData.subject.trim()) newErrors.subject = 'Subject line is required';
                break;
            case 7:
                // Schedule step validation if needed
                break;
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNext = () => {
        if (validateStep(currentStep)) {
            setCurrentStep(prev => Math.min(prev + 1, 7));
        }
    };

    const handlePrevious = () => {
        setCurrentStep(prev => Math.max(prev - 1, 1));
    };

    const handleStepClick = (step: number) => {
        // Validate all steps up to the target step
        for (let i = 1; i < step; i++) {
            if (!validateStep(i)) {
                return; // Don't allow jumping if previous steps are invalid
            }
        }
        setCurrentStep(step);
    };

    // Handler for when table sorting changes in Step1Property
    const handleSortOrderChange = (sortedIds: string[]) => {
        setFormData(prev => ({
            ...prev,
            sortedPropertyOrder: sortedIds
        }));
    };

    const selectedTemplate = templates?.find(t => t.id === formData.emailTemplate);

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
        onSortOrderChange: handleSortOrderChange
    };

    const handleSubmit = async () => {
        if (!validateStep(7)) {
            return;
        }

        setLoading(true);
        try {
            const campaignStatus = formData.emailSchedule === 'immediate' ? 'active' : 'draft';

            // Use sorted property order for the final submission
            const finalPropertyOrder = formData.sortedPropertyOrder.length > 0 
                ? formData.sortedPropertyOrder 
                : formData.selectedProperties;

            const campaignData = {
                ...formData,
                status: campaignStatus,
                source: 'landivo',
                type: 'multi-property',
                properties: finalPropertyOrder, // Send as ordered array
                scheduledDate: formData.emailSchedule === 'scheduled' 
                    ? selectedDate?.toISOString() 
                    : null
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
                throw new Error(errorData.message || 'Failed to create campaign');
            }

            const result = await response.json();
            router.push(`/dashboard/landivo/campaigns/${result.id}`);
            
        } catch (error) {
            console.error('Campaign creation failed:', error);
            setErrors({ submit: error instanceof Error ? error.message : 'Unknown error occurred' });
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
                                        {/* Selected Properties Display */}
                                        {selectedPropertiesData.length > 0 && currentStep >= 2 && (
                                            <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Building className="h-4 w-4 text-blue-600" />
                                                    <span className="text-sm font-medium text-blue-800">
                                                        Selected Properties ({selectedPropertiesData.length})
                                                    </span>
                                                </div>
                                                <div className="flex flex-wrap gap-1">
                                                    {selectedPropertiesData.slice(0, 3).map((property) => (
                                                        <Badge 
                                                            key={property.id}
                                                            variant="secondary" 
                                                            className="text-xs"
                                                        >
                                                            {property.streetAddress}, {property.city}
                                                        </Badge>
                                                    ))}
                                                    {selectedPropertiesData.length > 3 && (
                                                        <Badge variant="secondary" className="text-xs">
                                                            +{selectedPropertiesData.length - 3} more
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <Link href="/dashboard/landivo/campaigns/manage">
                                        <Button variant="outline">
                                            <ArrowLeft className="mr-2 h-4 w-4" />
                                            Back to Campaigns
                                        </Button>
                                    </Link>
                                </div>
                            </div>

                            <div className="p-6">
                                {/* Error Display */}
                                {hasErrors && (
                                    <Alert className="mb-6">
                                        <AlertTriangle className="h-4 w-4" />
                                        <AlertDescription>
                                            There was an error loading the required data. 
                                            Please try refreshing the page.
                                        </AlertDescription>
                                    </Alert>
                                )}

                                {errors.submit && (
                                    <Alert className="mb-6">
                                        <AlertTriangle className="h-4 w-4" />
                                        <AlertDescription>{errors.submit}</AlertDescription>
                                    </Alert>
                                )}

                                {/* Step Content */}
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
                                    selectedProperties={selectedPropertiesData}
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
                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                        Creating Campaign...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Mail className="mr-2 h-4 w-4" />
                                                        Create Multi-Property Campaign
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
            </div>
        </div>
    );
}