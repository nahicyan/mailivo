// app/src/app/dashboard/landivo/campaigns/create/[[...id]]/page.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  ArrowLeft,
  Mail,
  Loader2,
  RefreshCcw,
} from "lucide-react";
import { CreateCampaignRequest } from "@/types/campaign";
import { useLandivoProperties } from "@/hooks/useLandivoProperties";
import { useTemplates } from "@/hooks/useTemplates";
import Link from "next/link";

// Step configuration
import {
  singlePropertySteps,
  buildStepArray,
  getStepByIndex,
  getTotalSteps,
} from "../../lib/stepConfig";
import { StepsSidebar } from "../../components/StepsSidebar";

// Step components with new names
import { PropertySelection } from "../components/PropertySelection";
import { BasicInfo } from "../components/BasicInfo";
import { PaymentOptions } from "../components/PaymentOptions";
import { PictureSelection } from "../components/PictureSelection";
import { SubjectLine } from "../components/SubjectLine";
import { Scheduling } from "../components/Scheduling";
import { useEmailLists } from "@/hooks/useEmailLists";
import { EmailListSelection } from "../components/EmailListSelection";
import { EmailTemplateSelection } from "../components/EmailTemplateSelection";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://api.mailivo.landivo.com";

export default function CreateCampaignPage() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Build step array (no conditions for single property)
  const steps = useMemo(() => buildStepArray(singlePropertySteps), []);
  const totalSteps = getTotalSteps(steps);

  // Extract property ID from URL params
  const propertyId = params.id?.[0];

  const [formData, setFormData] = useState<Partial<CreateCampaignRequest>>({
    name: "",
    description: "",
    property: propertyId || "",
    emailList: "",
    emailTemplate: "",
    emailVolume: 100,
    emailSchedule: "immediate",
    subject: "",
    imageSelections: {},
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
  // Auto-fill when property is pre-selected from URL
  useEffect(() => {
    if (propertyId && properties && !propertiesLoading) {
      const selectedProperty = properties.find((p) => p.id === propertyId);
      if (selectedProperty) {
        setFormData((prev) => ({
          ...prev,
          property: propertyId,
          name: `${selectedProperty.streetAddress}, ${selectedProperty.city}, ${selectedProperty.zip}`,
          description: selectedProperty.title,
        }));
        setErrors((prev) => {
          const { property, ...rest } = prev;
          return rest;
        });
        setCurrentStep(2);
      } else if (properties.length > 0) {
        console.warn(
          `Property ID ${propertyId} not found, redirecting to step 1`
        );
        router.replace("/dashboard/landivo/campaigns/create");
        return;
      }
    }
  }, [propertyId, properties, propertiesLoading, router]);

  const handlePropertyChange = (propertyId: string) => {
    setFormData((prev) => ({ ...prev, property: propertyId }));
    if (propertyId && properties) {
      const selectedProperty = properties.find((p) => p.id === propertyId);
      if (selectedProperty) {
        setFormData((prev) => ({
          ...prev,
          property: propertyId,
          name: `${selectedProperty.streetAddress}, ${selectedProperty.city}, ${selectedProperty.zip}`,
          description: selectedProperty.title,
        }));
      }
    }
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
        if (!formData.name?.trim())
          newErrors.name = "Campaign name is required";
        if (!formData.description?.trim())
          newErrors.description = "Description is required";
        break;
      case "email-list":
        if (!formData.emailList)
          newErrors.emailList = "Please select an email list";
        break;

      case "email-template":
        if (!formData.emailTemplate)
          newErrors.emailTemplate = "Please select a template";
        break;
      case "subject":
        if (!formData.subject?.trim())
          newErrors.subject = "Subject line is required";
        break;
      case "schedule":
        if (formData.emailSchedule === "scheduled" && !selectedDate) {
          newErrors.emailSchedule = "Please select a date and time";
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
    if (currentStep === 2 && propertyId) {
      router.push("/dashboard/landivo/campaigns");
      return;
    }
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleStepClick = (step: number) => {
    for (let i = 1; i < step; i++) {
      if (!validateStep(i)) return;
    }
    setCurrentStep(step);
  };

  const selectedTemplate = templates?.find(
    (t: any) => t.id === formData.emailTemplate
  );
  const selectedProperty = properties?.find(
    (p: any) => p.id === formData.property
  );

  const stepProps = {
    formData,
    setFormData,
    errors,
    properties: properties || [],
    templates: templates || [],
    emailLists: emailLists || [],
    selectedDate,
    setSelectedDate,
    propertiesLoading,
    propertiesError,
    handlePropertyChange,
    templatesLoading,
    templatesError,
    listsLoading,
    listsError,
    refetchLists,
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
      case "PaymentOptions":
        return (
          <PaymentOptions
            formData={formData}
            setFormData={setFormData}
            errors={errors}
            selectedTemplate={selectedTemplate}
          />
        );
      case "PictureSelection":
        return (
          <PictureSelection
            formData={formData}
            setFormData={setFormData}
            errors={errors}
            selectedTemplate={selectedTemplate}
            selectedProperty={selectedProperty}
          />
        );
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
    const campaignStatus =
      formData.emailSchedule === "immediate" ? "active" : "draft";

    // UPDATED: Handle multiple email lists
    const emailListValue = formData.emailListsMulti && formData.emailListsMulti.length > 0
      ? formData.emailListsMulti  // Send as array if multiple selected
      : formData.emailList;        // Send as string if single selected

    const campaignData = {
      ...formData,
      type: "single",
      status: campaignStatus,
      source: "landivo",
      emailList: emailListValue, // Can be string or array
      scheduledDate:
        formData.emailSchedule === "scheduled"
          ? selectedDate?.toISOString()
          : null,
      // Required fields
      subject:
        formData.subject ||
        selectedTemplate?.subject ||
        `Campaign for ${formData.name}`,
      htmlContent: "<p>Email content</p>",
      textContent: "",
      audienceType: "landivo",
      segments: Array.isArray(emailListValue) ? emailListValue : [emailListValue],
      estimatedRecipients: formData.emailVolume,
    };

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
            title="Campaign Setup"
          />
        </div>

        <div className="flex-1">
          <div className="max-w-4xl mx-auto p-6">
            <div className="bg-white rounded-lg shadow-sm">
              <div className="border-b border-gray-200 p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                      Create Campaign
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
