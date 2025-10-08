// app/src/app/dashboard/landivo/campaigns/create/components/EmailTemplateSelection.tsx
"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileCode, AlertCircle, RefreshCcw, Eye } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";

interface Template {
  id: string;
  name: string;
  description?: string;
  category?: string;
  type?: "single" | "multi";
  components?: any[];
  thumbnail?: string;
}

interface Props {
  formData: any;
  setFormData: (fn: (prev: any) => any) => void;
  errors: Record<string, string>;
  templates: Template[];
  templatesLoading: boolean;
  templatesError: any;
}

export function EmailTemplateSelection({ formData, setFormData, errors, templates = [], templatesLoading, templatesError }: Props) {
  // Filter to only show 'single' type templates
  const singleTemplates = React.useMemo(() => templates.filter((t) => t.type === "single"), [templates]);

  const selectedTemplate = templates.find((t) => t.id === formData.emailTemplate);
  const componentCount = selectedTemplate?.components?.length || 0;

  if (templatesError) {
    return (
      <Card>
        <CardContent className="pt-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>Failed to load email templates. Please try again.</span>
              <Button variant="outline" size="sm" onClick={() => window.location.reload()} className="ml-4">
                <RefreshCcw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileCode className="h-5 w-5" />
            <span>Select Email Template</span>
          </CardTitle>
          <div className="text-sm text-gray-600">Choose a template for your campaign email design.</div>
        </CardHeader>
      </Card>

      {/* Template Selection */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email-template">Email Template *</Label>
            <Select
              value={formData.emailTemplate}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, emailTemplate: value }))}
              disabled={templatesLoading || singleTemplates.length === 0}>
              <SelectTrigger id="email-template" className={errors.emailTemplate ? "border-red-500" : ""}>
                <SelectValue placeholder={templatesLoading ? "Loading templates..." : singleTemplates.length === 0 ? "No templates available" : "Select a template"} />
              </SelectTrigger>
              <SelectContent>
                {singleTemplates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    <div className="flex flex-col py-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{template.name}</span>
                        {template.category && (
                          <Badge variant="outline" className="text-xs">
                            {template.category}
                          </Badge>
                        )}
                      </div>
                      {template.description && <span className="text-xs text-gray-500 mt-1">{template.description}</span>}
                      <span className="text-xs text-gray-400 mt-1">{template.components?.length || 0} components</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {errors.emailTemplate && <p className="text-sm text-red-600">{errors.emailTemplate}</p>}
          </div>

          {/* Selected Template Details */}
          {selectedTemplate && (
            <>
              <Separator />
              <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-gray-900">{selectedTemplate.name}</h4>
                    {selectedTemplate.description && <p className="text-sm text-gray-600 mt-1">{selectedTemplate.description}</p>}
                  </div>
                  <Button variant="outline" size="sm" onClick={() => window.open(`/dashboard/templates/${selectedTemplate.id}`, "_blank")}>
                    <Eye className="h-4 w-4 mr-2" />
                    Preview
                  </Button>
                </div>

                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  {selectedTemplate.category && (
                    <div className="flex items-center space-x-1">
                      <span className="text-gray-500">Category:</span>
                      <Badge variant="secondary">{selectedTemplate.category}</Badge>
                    </div>
                  )}
                  <div className="flex items-center space-x-1">
                    <span className="text-gray-500">Components:</span>
                    <Badge variant="secondary">{componentCount}</Badge>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Empty State */}
          {!templatesLoading && singleTemplates.length === 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>No email templates found. Create a template to get started.</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
