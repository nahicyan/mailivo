// app/src/app/dashboard/landivo/campaigns/create-multi/[[...id]]/page.tsx
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

// Step configuration
import {
  multiPropertySteps,
  buildStepArray,
  getStepByIndex,
  getTotalSteps,
} from "../../lib/stepConfig";
import { StepsSidebar } from "../../components/StepsSidebar";

// Step components with new names
import { MultiPropertySelection } from "../components/MultiPropertySelection";
import { MultiBasicInfo } from "../components/MultiBasicInfo";
import { MultiAgentProfile } from "../components/MultiAgentProfile";
import { MultiPaymentOptions } from "../components/MultiPaymentOptions";
import { MultiPictureSelection } from "../components/MultiPictureSelection";
import { MultiSubjectLine } from "../components/MultiSubjectLine";
import { MultiScheduling } from "../components/MultiScheduling";
import { validatePaymentOptions } from "@/utils/paymentValidation";
import {
  validateMultiPropertySchedule,
  prepareMultiPropertyCampaignData,
} from "@/utils/multiPropertyValidation";
import { useEmailLists } from "@/hooks/useEmailLists";
import { MultiEmailListSelection } from "../components/MultiEmailListSelection";
import { MultiEmailTemplateSelection } from "../components/MultiEmailTemplateSelection";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://api.mailivo.landivo.com";

interface ExtendedCreateCampaignRequest extends CreateCampaignRequest {
  selectedProperties: string[];
  sortedPropertyOrder: string[];
  subject?: string;
  selectedAgent?: string;
  paymentPlans?: Record<string, any>;
}

export default function CreateMultiPropertyCampaignPage() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<
    Partial<ExtendedCreateCampaignRequest>
  >({
    name: "",
    description: "",
    selectedProperties: [],
    sortedPropertyOrder: [],
    emailList: "",
    emailTemplate: "",
    emailVolume: 100,
    emailSchedule: "immediate",
    subject: "",
    imageSelections: {},
    paymentPlans: {},
  });

  const {
    data: properties,
    isLoading: propertiesLoading,
    error: propertiesError,
  } = useLandivoProperties();
  const {
    data: templates,
    isLoading: templatesLoading,
    error: templatesError,
  } = useTemplates();
  const {
    data: emailLists,
    isLoading: listsLoading,
    error: listsError,
    refetch: refetchLists,
  } = useEmailLists();

  const selectedTemplate = templates?.find(
    (t: any) => t.id === formData.emailTemplate
  );
  const hasAgentProfile = selectedTemplate
    ? hasAgentProfileComponents(selectedTemplate)
    : false;

  // Build step array with conditions
  const steps = useMemo(
    () =>
      buildStepArray(multiPropertySteps, {
        showAgentProfileStep: hasAgentProfile,
      }),
    [hasAgentProfile]
  );
  const totalSteps = getTotalSteps(steps);

  const handleSortOrderChange = (sortedIds: string[]) => {
    setFormData((prev) => ({ ...prev, sortedPropertyOrder: sortedIds }));
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};
    const currentStepDef = getStepByIndex(steps, step);

    if (!currentStepDef) return true;

    switch (currentStepDef.id) {
      case "property":
        if (
          !formData.selectedProperties ||
          formData.selectedProperties.length === 0
        ) {
          newErrors.selectedProperties = "Please select at least one property";
        }
        break;
      case "basic-info":
        if (!formData.name?.trim())
          newErrors.name = "Campaign name is required";
        if (!formData.description?.trim())
          newErrors.description = "Campaign description is required";
        break;
      case "email-list":
        if (!formData.emailList)
          newErrors.emailList = "Please select an email list";
        break;

      case "email-template":
        if (!formData.emailTemplate)
          newErrors.emailTemplate = "Please select a template";
        break;
      case "agent-profile":
        if (!formData.selectedAgent)
          newErrors.selectedAgent = "Please select an agent profile";
        break;
      case "payment":
        const { isValid, errors: paymentErrors } = validatePaymentOptions(
          formData,
          properties
        );
        if (!isValid) Object.assign(newErrors, paymentErrors);
        break;
      case "subject":
        if (!formData.subject?.trim())
          newErrors.subject = "Subject line is required";
        break;
      case "schedule":
        const scheduleValidation = validateMultiPropertySchedule(
          formData,
          selectedDate
        );
        Object.assign(newErrors, scheduleValidation.errors);
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
    for (let i = 1; i < step; i++) {
      if (!validateStep(i)) return;
    }
    setCurrentStep(step);
  };

  const stepProps = {
    formData,
    setFormData,
    errors,
    properties: (properties || []) as any[],
    templates: templates || [],
    emailLists: emailLists || [],
    selectedDate,
    setSelectedDate,
    propertiesLoading,
    propertiesError,
    templatesLoading,
    templatesError,
    listsLoading,
    listsError,
    refetchLists,
    onSortOrderChange: handleSortOrderChange,
    selectedTemplate,
  };

  // Component mapping
  const renderStepContent = () => {
    const currentStepDef = getStepByIndex(steps, currentStep);
    if (!currentStepDef) return null;

    switch (currentStepDef.component) {
      case "MultiPropertySelection":
        return <MultiPropertySelection {...stepProps} />;
      case "MultiBasicInfo":
        return <MultiBasicInfo {...stepProps} />;
      case "MultiEmailListSelection":
        return (
          <MultiEmailListSelection
            formData={formData}
            setFormData={setFormData}
            errors={errors}
            emailLists={emailLists || []}
            listsLoading={listsLoading}
            listsError={listsError}
            refetchLists={refetchLists}
          />
        );

      case "MultiEmailTemplateSelection":
        return (
          <MultiEmailTemplateSelection
            formData={formData}
            setFormData={setFormData}
            errors={errors}
            templates={templates || []}
            templatesLoading={templatesLoading}
            templatesError={templatesError}
          />
        );
      case "MultiAgentProfile":
        return <MultiAgentProfile {...stepProps} />;
      case "MultiPaymentOptions":
        return (
          <MultiPaymentOptions
            formData={formData}
            setFormData={setFormData}
            errors={errors}
            selectedTemplate={selectedTemplate}
            properties={properties}
          />
        );
      case "MultiPictureSelection":
        return (
          <MultiPictureSelection
            formData={formData}
            setFormData={setFormData}
            errors={errors}
            selectedTemplate={selectedTemplate}
            properties={properties}
          />
        );
      case "MultiSubjectLine":
        return <MultiSubjectLine {...stepProps} />;
      case "MultiScheduling":
        return <MultiScheduling {...stepProps} />;
      default:
        return null;
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(totalSteps)) return;

    setLoading(true);
    try {
      const campaignData: any = prepareMultiPropertyCampaignData(
        formData,
        selectedDate,
        properties || [],
        selectedTemplate
      );

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

      router.push("/dashboard/landivo/campaigns/manage");
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
        <div className="w-64 bg-white shadow-sm">
          <StepsSidebar
            steps={steps}
            currentStep={currentStep}
            onStepClick={handleStepClick}
            title="Multi-Property Campaign"
          />
        </div>

        <div className="flex-1">
          <div className="max-w-4xl mx-auto p-6">
            <div className="bg-white rounded-lg shadow-sm">
              <div className="border-b border-gray-200 p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                      Create Multi-Property Campaign
                    </h1>
                    <p className="text-gray-600">
                      Complete all steps to create your campaign
                    </p>
                  </div>
                  <Link href="/dashboard/landivo/campaigns">
                    <Button variant="outline" size="sm">
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back to Campaigns
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="p-6">
                {hasErrors && (
                  <Alert className="mb-6">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Some data failed to load. Please try refreshing the page.
                    </AlertDescription>
                  </Alert>
                )}

                {errors.submit && (
                  <Alert className="mb-6">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{errors.submit}</AlertDescription>
                  </Alert>
                )}

                {renderStepContent()}

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
      </div>
    </div>
  );
}
