// app/src/app/dashboard/landivo/campaigns/create/[[...id]]/page.tsx
"use client";

import { useState, useEffect } from "react";
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

import { StepsSidebar } from "../components/StepsSidebar";
import { Step1Property } from "../components/Step1Property";
import { Step2BasicInfo } from "../components/Step2BasicInfo";
import { Step3Audience } from "../components/Step3Audience";
import { Step4PaymentOptions } from "../components/Step4PaymentOptions";
import { Step5Picture } from "../components/Step5Picture";
import { Step6Subject } from "../components/Step6Subject";
import { Step7Schedule } from "../components/Step7Schedule";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://api.mailivo.landivo.com";

export default function CreateCampaignPage() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Extract property ID from URL params
  const propertyId = params.id?.[0] as string | undefined;

  const [formData, setFormData] = useState<CreateCampaignRequest>({
    name: "",
    property: "",
    emailList: "",
    emailTemplate: "",
    emailAddressGroup: "",
    emailSchedule: "immediate",
    emailVolume: 1000,
    description: "",
    subject: "",
    selectedPlan: null,
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

  // Handle property pre-selection when URL has property ID
  useEffect(() => {
    if (propertyId && properties && !propertiesLoading) {
      const selectedProperty = properties.find((p) => p.id === propertyId);

      if (selectedProperty) {
        // Auto-fill campaign details and advance to step 2
        setFormData((prev) => ({
          ...prev,
          property: propertyId,
          name: `${selectedProperty.streetAddress}, ${selectedProperty.city}, ${selectedProperty.zip}`,
          description: selectedProperty.title,
        }));

        // Clear any property-related errors and advance to step 2
        setErrors((prev) => {
          const { property, ...rest } = prev;
          return rest;
        });

        // Auto-advance to step 2 since property is pre-selected
        setCurrentStep(2);
      } else if (properties.length > 0) {
        // Property ID not found - redirect to base create page
        console.warn(
          `Property ID ${propertyId} not found, redirecting to step 1`
        );
        router.replace("/dashboard/landivo/campaigns/create");
        return;
      }
    }
  }, [propertyId, properties, propertiesLoading, router]);

  // Auto-fill campaign name and description when property is selected
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

    switch (step) {
      case 1:
        if (!formData.property) newErrors.property = "Please select a property";
        break;
      case 2:
        if (!formData.name.trim()) newErrors.name = "Campaign name is required";
        if (!formData.description.trim())
          newErrors.description = "Campaign description is required";
        break;
      case 3:
        if (!formData.emailList)
          newErrors.emailList = "Please select an email list";
        break;
      case 4:
        if (!formData.selectedPlan)
          newErrors.selectedPlan = "Please select a payment plan";
        break;
      case 5:
        // Picture step - no strict validation required
        break;
      case 6:
        if (!formData.subject.trim())
          newErrors.subject = "Subject line is required";
        break;
      case 7:
      case 7:
        // Schedule validation with 1-minute buffer
        if (!formData.emailSchedule) {
          newErrors.emailSchedule = "Please select when to send the campaign";
        }

        if (formData.emailSchedule === "scheduled") {
          if (!selectedDate) {
            newErrors.scheduledDate = "Please select a date for scheduling";
          } else {
            const now = new Date();
            const oneMinuteFromNow = new Date(now.getTime() + 60000);
            if (selectedDate < oneMinuteFromNow) {
              newErrors.scheduledDate =
                "Scheduled date must be at least 1 minute in the future";
            }
          }
        }

        if (!formData.emailVolume || formData.emailVolume < 1) {
          newErrors.emailVolume = "Email volume must be at least 1";
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 7));
    }
  };

  const handlePrevious = () => {
    // If we're at step 2 and came from a direct property URL, go back to campaigns list
    if (currentStep === 2 && propertyId) {
      router.push("/dashboard/landivo/campaigns");
      return;
    }
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

  const selectedTemplate = templates?.find(
    (t) => t.id === formData.emailTemplate
  );
  const selectedProperty = properties?.find((p) => p.id === formData.property);

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
    handlePropertyChange,
  };

  const handleSubmit = async () => {
    if (!validateStep(7)) {
      return;
    }

    setLoading(true);
    try {
      const campaignStatus =
        formData.emailSchedule === "immediate" ? "active" : "draft";

      const campaignData = {
        ...formData,
        type: "single",
        status: campaignStatus,
        source: "landivo",
        scheduledDate:
          formData.emailSchedule === "scheduled" ? selectedDate : undefined,
        subject:
          formData.subject ||
          selectedTemplate?.subject ||
          selectedTemplate?.title ||
          `Campaign for ${formData.property}`,
        htmlContent:
          selectedTemplate?.htmlContent ||
          selectedTemplate?.content ||
          selectedTemplate?.body ||
          "<p>Email content here</p>",
        textContent: selectedTemplate?.textContent || "",
        audienceType: "landivo",
        segments: [formData.emailList],
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
        throw new Error(errorData.error || "Failed to create campaign");
      }

      const newCampaign = await response.json();

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
          console.warn("Auto-send failed:", sendError);
        }
      }

      router.push("/dashboard/landivo/campaigns/manage");
    } catch (error: any) {
      setErrors({
        submit: error.message || "Failed to create campaign. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  // Show loading state while properties are being fetched and we have a property ID
  if (propertyId && propertiesLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">
            Loading property information...
          </p>
        </div>
      </div>
    );
  }

  // Handle data loading errors
  const hasErrors = propertiesError || templatesError || listsError;
  if (hasErrors) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-2xl mx-auto pt-8">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="ml-2">
              Failed to load required data. Please try again.
              <div className="flex gap-2 mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    refetchProperties();
                    refetchTemplates();
                    refetchLists();
                  }}
                >
                  <RefreshCcw className="h-4 w-4 mr-2" />
                  Retry
                </Button>
                <Link href="/dashboard/landivo/campaigns">
                  <Button variant="secondary" size="sm">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Campaigns
                  </Button>
                </Link>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8 px-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <StepsSidebar currentStep={currentStep} />

          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg border">
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                      {propertyId
                        ? "Create Campaign for Property"
                        : "Create New Campaign"}
                    </h1>
                    <p className="text-gray-600">
                      Complete all steps to create your campaign
                    </p>
                    {selectedProperty && currentStep >= 2 && (
                      <p className="text-sm text-blue-600 mt-1">
                        <strong>Property:</strong>{" "}
                        {selectedProperty.streetAddress},{" "}
                        {selectedProperty.county}, {selectedProperty.city},{" "}
                        {selectedProperty.state} {selectedProperty.zip}
                      </p>
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

                {currentStep === 1 && <Step1Property {...stepProps} />}
                {currentStep === 2 && <Step2BasicInfo {...stepProps} />}
                {currentStep === 3 && <Step3Audience {...stepProps} />}
                {currentStep === 4 && (
                  <Step4PaymentOptions
                    formData={formData}
                    setFormData={setFormData}
                    errors={errors}
                    selectedTemplate={selectedTemplate}
                  />
                )}
                {currentStep === 5 && (
                  <Step5Picture
                    formData={formData}
                    setFormData={setFormData}
                    errors={errors}
                    selectedTemplate={selectedTemplate}
                    selectedProperty={selectedProperty}
                  />
                )}
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
