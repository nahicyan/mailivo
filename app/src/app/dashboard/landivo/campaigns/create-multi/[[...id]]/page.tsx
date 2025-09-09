"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  ArrowLeft,
  Mail,
  Loader2,
  RefreshCcw,
  Building,
} from "lucide-react";
import { CreateCampaignRequest } from "@/types/campaign";
import { useLandivoProperties } from "@/hooks/useLandivoProperties";
import { useTemplates } from "@/hooks/useTemplates";
import { hasAgentProfileComponents } from "@landivo/email-template";
import Link from "next/link";

import { StepsSidebar } from "../components/StepsSidebar";
import { Step1Property } from "../components/Step1Property";
import { Step2BasicInfo } from "../components/Step2BasicInfo";
import { Step3Audience } from "../components/Step3Audience";
import { StepAgentProfile } from "../components/StepAgentProfile";
import { Step4PaymentOptions } from "../components/Step4PaymentOptions";
import { Step5Picture } from "../components/Step5Picture";
import { Step6Subject } from "../components/Step6Subject";
import { Step7Schedule } from "../components/Step7Schedule";
import { validatePaymentOptions } from "@/utils/paymentValidation";
import {
  validateMultiPropertySchedule,
  prepareMultiPropertyCampaignData,
} from "@/utils/multiPropertyValidation";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://api.mailivo.landivo.com";

interface ExtendedCreateCampaignRequest extends CreateCampaignRequest {
  selectedProperties: string[];
  sortedPropertyOrder: string[];
  selectedAgent?: string;
  subject: string; // Add missing subject property
}

export default function CreateMultiCampaignPage() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<ExtendedCreateCampaignRequest>({
    name: "",
    property: "", // Keep for compatibility
    emailList: "",
    emailTemplate: "",
    emailAddressGroup: "",
    emailSchedule: "immediate",
    emailVolume: 1000,
    description: "",
    subject: "", // Initialize subject
    selectedPlan: null,
    selectedProperties: [],
    sortedPropertyOrder: [],
    selectedAgent: "",
  });

  // Data fetching hooks
  const {
    data: properties,
    isLoading: propertiesLoading,
    error: propertiesError,
    refetch: refetchProperties,
  } = useLandivoProperties();
  const {
    data: templates,
    isLoading: templatesLoading,
    error: templatesError,
    refetch: refetchTemplates,
  } = useTemplates();

  const {
    data: emailLists,
    isLoading: listsLoading,
    error: listsError,
    refetch: refetchLists,
  } = useQuery({
    queryKey: ["landivo-email-lists"],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/landivo-email-lists`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("auth_token") || ""}`,
        },
        credentials: "include",
      });
      if (!response.ok)
        throw new Error(`Failed to fetch email lists: ${response.statusText}`);
      return response.json();
    },
    staleTime: 30000,
    retry: 2,
  });

  // Get selected properties with proper sorting
  const selectedPropertiesData = useMemo(() => {
    if (!properties || !formData.selectedProperties.length) return [];

    // If we have sorted order, use it; otherwise use selection order
    const orderToUse =
      formData.sortedPropertyOrder.length > 0
        ? formData.sortedPropertyOrder
        : formData.selectedProperties;

    return orderToUse
      .map((id) => properties.find((p) => p.id === id))
      .filter(Boolean);
  }, [properties, formData.selectedProperties, formData.sortedPropertyOrder]);

  // Generate campaign name from selected properties
  const generateCampaignName = (selectedProps: any[]) => {
    if (selectedProps.length === 0) return "";
    if (selectedProps.length === 1) {
      const prop = selectedProps[0];
      return `${prop.streetAddress}, ${prop.city}, ${prop.zip}`;
    }
    return `Multi-Property Campaign (${selectedProps.length} properties)`;
  };

  // Update campaign name when properties change
  useEffect(() => {
    if (selectedPropertiesData.length > 0 && !formData.name.trim()) {
      setFormData((prev) => ({
        ...prev,
        name: generateCampaignName(selectedPropertiesData),
      }));
    }
  }, [selectedPropertiesData]);

  // Find selected template - handle both 'id' and '_id' fields
  const selectedTemplate = useMemo(() => {
    if (!templates || !formData.emailTemplate) return null;

    // Try to find by 'id' first
    let template = templates.find((t) => t.id === formData.emailTemplate);

    // If not found by 'id', try MongoDB '_id' format
    if (!template) {
      template = templates.find((t) => {
        // Handle MongoDB ObjectId format
        const templateId = (t as any)._id?.$oid || (t as any)._id || t.id;
        return templateId === formData.emailTemplate;
      });
    }

    return template;
  }, [templates, formData.emailTemplate]);

  // Determine if the selected template has agent profile components
  const hasAgentProfile = useMemo(() => {
    if (!selectedTemplate) return false;
    return hasAgentProfileComponents(selectedTemplate);
  }, [selectedTemplate]);

  // Calculate total steps based on whether agent profile is needed
  const totalSteps = hasAgentProfile ? 8 : 7;

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 1:
        if (
          !formData.selectedProperties ||
          formData.selectedProperties.length === 0
        ) {
          newErrors.selectedProperties = "Please select at least one property";
        }
        break;
      case 2:
        if (!formData.name.trim()) newErrors.name = "Campaign name is required";
        if (!formData.description?.trim())
          newErrors.description = "Campaign description is required";
        break;
      case 3:
        if (!formData.emailList)
          newErrors.emailList = "Please select an email list";
        if (!formData.emailTemplate)
          newErrors.emailTemplate = "Please select an email template";
        break;
      case 4:
        if (hasAgentProfile) {
          if (!formData.selectedAgent)
            newErrors.selectedAgent = "Please select an agent profile";
        } else {
          const { isValid, errors: paymentErrors } = validatePaymentOptions(
            formData,
            properties
          );
          if (!isValid) {
            Object.assign(newErrors, paymentErrors);
          }
        }
        break;
      case 5:
        if (hasAgentProfile) {
          const { isValid, errors: paymentErrors } = validatePaymentOptions(
            formData,
            properties
          );
          if (!isValid) {
            Object.assign(newErrors, paymentErrors);
          }
        } else {
          // Picture step - no strict validation required
        }
        break;
      case 6:
        if (hasAgentProfile) {
          // Picture step - no strict validation required
        } else {
          if (!formData.subject?.trim())
            newErrors.subject = "Subject line is required";
        }
        break;
      case 7:
        if (hasAgentProfile) {
          if (!formData.subject?.trim())
            newErrors.subject = "Subject line is required";
        } else {
          const scheduleValidation = validateMultiPropertySchedule(
            formData,
            selectedDate
          );
          Object.assign(newErrors, scheduleValidation.errors);
        }
        break;
      case 8:
        if (hasAgentProfile) {
          const scheduleValidation = validateMultiPropertySchedule(
            formData,
            selectedDate
          );
          Object.assign(newErrors, scheduleValidation.errors);
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
    }
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
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
    setFormData((prev) => ({
      ...prev,
      sortedPropertyOrder: sortedIds,
    }));
  };

  const stepProps = {
    formData,
    setFormData,
    errors,
    properties: (properties || []) as any,
    templates: templates || [],
    emailLists: emailLists || [],
    selectedDate,
    setSelectedDate,
    propertiesLoading,
    propertiesError,
    templatesLoading, // Add this
    templatesError, // Add this
    listsLoading, // Add this
    listsError, // Add this
    refetchLists, // Add thisF
    onSortOrderChange: handleSortOrderChange,
    selectedTemplate,
  };

  // Render the appropriate step component
  const renderStepContent = () => {
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
          return (
            <Step4PaymentOptions
              formData={formData}
              setFormData={setFormData}
              errors={errors}
              selectedTemplate={selectedTemplate}
              properties={properties}
            />
          );
        }
      case 5:
        if (hasAgentProfile) {
          return (
            <Step4PaymentOptions
              formData={formData}
              setFormData={setFormData}
              errors={errors}
              selectedTemplate={selectedTemplate}
              properties={properties}
            />
          );
        } else {
          return (
            <Step5Picture
              formData={formData}
              setFormData={setFormData}
              errors={errors}
              selectedTemplate={selectedTemplate}
              properties={properties}
            />
          );
        }
      case 6:
        if (hasAgentProfile) {
          return (
            <Step5Picture
              formData={formData}
              setFormData={setFormData}
              errors={errors}
              selectedTemplate={selectedTemplate}
              properties={properties}
            />
          );
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
    if (!validateStep(totalSteps)) return;

    setLoading(true);
    try {
      // Use compatible data preparation
      const campaignData: any = prepareMultiPropertyCampaignData(
        formData,
        selectedDate,
        properties || [], // Ensure array
        selectedTemplate
      );

      // Set campaign type and add missing audience fields
      campaignData.type = "multi-property";
      campaignData.audienceType = "landivo";
      campaignData.segments = [formData.emailList];
      campaignData.estimatedRecipients = formData.emailVolume;
      const response = await fetch(`${API_URL}/campaigns`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("auth_token") || ""}`,
        },
        credentials: "include",
        body: JSON.stringify(campaignData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create campaign");
      }

      const newCampaign = await response.json();

      // Add immediate sending logic for multi-property campaigns
      if (
        formData.emailSchedule === "immediate" &&
        newCampaign.status === "active"
      ) {
        try {
          await fetch(`${API_URL}/campaigns/${newCampaign._id}/send`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${localStorage.getItem("auth_token") || ""}`,
            },
            credentials: "include",
          });
        } catch (sendError) {
          console.warn(
            "Auto-send failed for multi-property campaign:",
            sendError
          );
        }
      }

      router.push(`/dashboard/landivo/campaigns/manage`);
    } catch (error) {
      console.error("Campaign creation failed:", error);
      setErrors({
        submit:
          error instanceof Error ? error.message : "Unknown error occurred",
      });
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
                    {/* Selected Properties Display */}
                    {selectedPropertiesData.length > 0 && currentStep >= 2 && (
                      <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Building className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-medium text-blue-800">
                            Selected Properties ({selectedPropertiesData.length}
                            )
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {selectedPropertiesData
                            .slice(0, 3)
                            .map((property: any) => (
                              <Badge
                                key={property?.id}
                                variant="secondary"
                                className="text-xs"
                              >
                                {property?.streetAddress}, {property?.city}
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
                      There was an error loading the required data. Please try
                      refreshing the page.
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
                {renderStepContent()}

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
                    {currentStep < totalSteps ? (
                      <Button onClick={handleNext}>Next Step</Button>
                    ) : (
                      <Button
                        onClick={handleSubmit}
                        disabled={loading}
                        size="lg"
                      >
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
