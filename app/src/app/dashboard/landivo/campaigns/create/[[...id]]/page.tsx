// app/src/app/dashboard/landivo/campaigns/create/[[...id]]/page.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ArrowLeft, Mail, Loader2 } from "lucide-react";
import { CreateCampaignRequest } from "@/types/campaign";
import { useLandivoProperties } from "@/hooks/useLandivoProperties";
import { useTemplates } from "@/hooks/useTemplates";
import { hasAgentProfileComponents } from "@landivo/email-template";
import Link from "next/link";

// Step configuration
import { singlePropertySteps, buildStepArray, getStepByIndex, getTotalSteps } from "../../lib/stepConfig";
import { StepsSidebar } from "../../components/StepsSidebar";

// Step components
import { PropertySelection } from "../components/PropertySelection";
import { BasicInfo } from "../components/BasicInfo";
import { AgentProfile } from "../components/AgentProfile";
import { PaymentOptions } from "../components/PaymentOptions";
import { PictureSelection } from "../components/PictureSelection";
import { SubjectLine } from "../components/SubjectLine";
import { Scheduling } from "../components/Scheduling";
import { useEmailLists } from "@/hooks/useEmailLists";
import { EmailListSelection } from "../components/EmailListSelection";
import { EmailTemplateSelection } from "../components/EmailTemplateSelection";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.mailivo.landivo.com";

export default function CreateCampaignPage() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Extract property ID from URL params
  const propertyId = params.id?.[0];

  const [formData, setFormData] = useState<Partial<CreateCampaignRequest> & { selectedAgent?: string }>({
    name: "",
    description: "",
    property: propertyId || "",
    emailList: "",
    emailListsMulti: [],
    emailTemplate: "",
    emailAddressGroup: "",
    emailSchedule: "immediate",
    emailVolume: 100,
    subject: "",
    selectedAgent: "",
  });

  const { data: properties, isLoading: propertiesLoading, error: propertiesError } = useLandivoProperties();
  const { data: templates, isLoading: templatesLoading, error: templatesError } = useTemplates();
  const { data: emailLists, isLoading: listsLoading, error: listsError, refetch: refetchLists } = useEmailLists();

  const selectedProperty = properties?.find((p: any) => p.id === formData.property);
  const selectedTemplate = templates?.find((t: any) => t.id === formData.emailTemplate);
  const hasAgentProfile = selectedTemplate ? hasAgentProfileComponents(selectedTemplate) : false;

  // Build step array with conditions
  const steps = useMemo(
    () =>
      buildStepArray(singlePropertySteps, {
        showAgentProfileStep: hasAgentProfile,
      }),
    [hasAgentProfile]
  );
  const totalSteps = getTotalSteps(steps);

  // Set property from URL params
  useEffect(() => {
    if (propertyId) {
      setFormData((prev) => ({ ...prev, property: propertyId }));
    }
  }, [propertyId]);

  // Handle property change
  const handlePropertyChange = (propertyId: string) => {
    setFormData((prev) => ({ ...prev, property: propertyId }));
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};
    const currentStepDef = getStepByIndex(steps, step);

    if (!currentStepDef) return true;

    switch (currentStepDef.id) {
      case "property":
        if (!formData.property) newErrors.property = "Please select a property";
        break;
      case "basic-info":
        if (!formData.name?.trim()) newErrors.name = "Campaign name is required";
        if (!formData.description?.trim()) newErrors.description = "Campaign description is required";
        break;
      case "email-list":
        const hasEmailList = formData.emailList || (formData.emailListsMulti && formData.emailListsMulti.length > 0);
        if (!hasEmailList) newErrors.emailList = "Please select at least one email list";
        break;
      case "email-template":
        if (!formData.emailTemplate) newErrors.emailTemplate = "Please select a template";
        break;
      case "agent-profile":
        if (!formData.selectedAgent) newErrors.selectedAgent = "Please select an agent profile";
        break;
      case "subject":
        if (!formData.subject?.trim()) newErrors.subject = "Subject line is required";
        break;
      case "schedule":
        if (formData.emailSchedule === "scheduled" && !selectedDate) {
          newErrors.scheduledDate = "Please select a date and time";
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
    selectedTemplate,
    selectedProperty,
    handlePropertyChange,
  };

  // Component mapping
  const renderStepContent = () => {
    const currentStepDef = getStepByIndex(steps, currentStep);
    if (!currentStepDef) return null;

    switch (currentStepDef.component) {
      case "PropertySelection":
        return <PropertySelection {...stepProps} />;
      case "BasicInfo":
        return <BasicInfo {...stepProps} />;
      case "EmailListSelection":
        return (
          <EmailListSelection
            formData={formData}
            setFormData={setFormData}
            errors={errors}
            emailLists={emailLists || []}
            listsLoading={listsLoading}
            listsError={listsError}
            refetchLists={refetchLists}
          />
        );
      case "EmailTemplateSelection":
        return (
          <EmailTemplateSelection
            formData={formData}
            setFormData={setFormData}
            errors={errors}
            templates={templates || []}
            templatesLoading={templatesLoading}
            templatesError={templatesError}
          />
        );
      case "AgentProfile":
        return <AgentProfile formData={formData} setFormData={setFormData} errors={errors} selectedTemplate={selectedTemplate} />;
      case "PaymentOptions":
        return <PaymentOptions formData={formData} setFormData={setFormData} errors={errors} selectedTemplate={selectedTemplate} />;
      case "PictureSelection":
        return <PictureSelection formData={formData} setFormData={setFormData} errors={errors} selectedTemplate={selectedTemplate} selectedProperty={selectedProperty} />;
      case "SubjectLine":
        return <SubjectLine {...stepProps} />;
      case "Scheduling":
        return <Scheduling {...stepProps} />;
      default:
        return null;
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(totalSteps)) return;

    setLoading(true);
    try {
      const campaignStatus = formData.emailSchedule === "immediate" ? "active" : "draft";

      // Handle multiple email lists
      const emailListValue = formData.emailListsMulti && formData.emailListsMulti.length > 0 ? formData.emailListsMulti : formData.emailList;

      const campaignData = {
        ...formData,
        type: "single",
        status: campaignStatus,
        source: "landivo",
        emailList: emailListValue,
        scheduledDate: formData.emailSchedule === "scheduled" ? selectedDate?.toISOString() : null,
        subject: formData.subject || selectedTemplate?.subject || `Campaign for ${formData.name}`,
        htmlContent: "<p>Email content</p>",
        textContent: "",
        audienceType: "landivo",
        segments: Array.isArray(emailListValue) ? emailListValue : [emailListValue],
      };

      const response = await fetch(`${API_URL}/campaigns`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(campaignData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create campaign");
      }

      router.push("/dashboard/landivo/campaigns");
    } catch (error: any) {
      alert(error.message || "Failed to create campaign");
    } finally {
      setLoading(false);
    }
  };

  if (propertiesLoading || templatesLoading || listsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading campaign setup...</p>
        </div>
      </div>
    );
  }

  if (propertiesError || templatesError || listsError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Alert variant="destructive" className="max-w-md">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>Failed to load campaign data. Please refresh the page.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard/landivo/campaigns">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Campaigns
            </Button>
          </Link>
          <div className="flex items-center space-x-3">
            <Mail className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Create Campaign</h1>
              <p className="text-gray-600 mt-1">Set up your email campaign for {selectedProperty?.title || "your property"}</p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Steps Sidebar */}
          <StepsSidebar steps={steps} currentStep={currentStep} onStepClick={handleStepClick} />

          {/* Step Content */}
          <div className="lg:col-span-3">
            <div className="space-y-6">
              {renderStepContent()}

              {/* Navigation Buttons */}
              <div className="flex justify-between pt-6">
                <Button variant="outline" onClick={handlePrevious} disabled={currentStep === 1}>
                  Previous
                </Button>

                {currentStep < totalSteps ? (
                  <Button onClick={handleNext}>Next</Button>
                ) : (
                  <Button onClick={handleSubmit} disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create Campaign"
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
