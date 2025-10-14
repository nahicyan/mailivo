// app/src/components/automation/trigger/PropertyUpdateDiscountConfig.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { History, Smile } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import EmojiPicker from "emoji-picker-react";
import axios from "axios";

/**
 * CONSTANTS
 */
const ADDRESS_FORMAT_TEMPLATES = ["{county}", "{city}", "{state}", "{state} {zip}", "{city} {zip}", "{county}, {state} {zip}", "{city}, {state} {zip}", "{county}, {city}, {state} {zip}"];

const DISCOUNT_PREFIXES = [
  "Price Drop Alert 🔻 ",
  "Just Reduced ",
  "New Low Price ",
  "Deal Alert 🚨 ",
  "Investor Special 🏠 ",
  "Discounted Deal 🏷️ ",
  "Priced to Sell ",
  "Exclusive Deal ",
  "Below Market Value ",
  "Price Improvement ",
];

/**
 * HOOKS
 */

/**
 * Hook for managing discount subject bypass toggle
 */
export function useDiscountSubjectToggle(initialValue?: string) {
  const [useBypass, setUseBypass] = useState(initialValue === "bypass");

  const handleToggleChange = (bypass: boolean, updateConfig: (updates: any) => void) => {
    setUseBypass(bypass);
    updateConfig({ subject: bypass ? "bypass" : "" });
  };

  return {
    useBypass,
    setUseBypass,
    handleToggleChange,
  };
}

/**
 * Hook for loading subject templates
 */
export function useSubjectTemplates() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/subject-templates`);
        if (response.data.success) {
          const enabled = response.data.templates.filter((t: any) => t.isEnabled);
          setTemplates(enabled);
        }
      } catch (err) {
        console.error("Error loading templates:", err);
        setError("Failed to load templates");
      } finally {
        setLoading(false);
      }
    };

    fetchTemplates();
  }, []);

  return { templates, loading, error };
}

/**
 * Hook for loading past campaigns for a property
 */
export function usePastCampaigns(propertyId?: string) {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCampaigns = async () => {
      if (!propertyId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/campaigns/subjects/${propertyId}`);

        if (response.data.success && response.data.subjects) {
          setCampaigns(response.data.subjects);
        }
      } catch (err) {
        console.error("Error loading past campaigns:", err);
        setError("Failed to load past campaigns");
      } finally {
        setLoading(false);
      }
    };

    fetchCampaigns();
  }, [propertyId]);

  return { campaigns, loading, error };
}

/**
 * COMPONENTS
 */

/**
 * Bypass toggle component
 */
interface DiscountBypassToggleProps {
  useBypass: boolean;
  onToggleChange: (bypass: boolean) => void;
}

export function DiscountBypassToggle({ useBypass, onToggleChange }: DiscountBypassToggleProps) {
  return (
    <div className="flex items-center justify-between">
      <Label>Email Subject *</Label>
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">{useBypass ? "Use From Landivo" : "Custom"}</span>
        <Switch checked={useBypass} onCheckedChange={onToggleChange} />
      </div>
    </div>
  );
}

/**
 * Bypass info badge
 */
export function DiscountBypassBadge() {
  return (
    <div className="p-3 bg-muted rounded-md">
      <div className="flex items-center gap-2">
        <Badge variant="secondary">Bypass</Badge>
        <span className="text-sm text-muted-foreground">Subject will be pulled from Landivo discount data</span>
      </div>
    </div>
  );
}

/**
 * Past subject selector component
 */
interface PastSubjectSelectorProps {
  campaigns: any[];
  selectedValue: string;
  onSelect: (value: string) => void;
  loading?: boolean;
}

export function PastSubjectSelector({ campaigns, selectedValue, onSelect, loading }: PastSubjectSelectorProps) {
  if (loading || campaigns.length === 0) return null;

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-2">
        <History className="h-4 w-4" />
        Select a Past Subject
      </Label>
      <Select value={selectedValue} onValueChange={onSelect}>
        <SelectTrigger>
          <SelectValue placeholder="Choose from past campaigns..." />
        </SelectTrigger>
        <SelectContent className="max-w-[500px]">
          {campaigns.map((item: any, index: number) => (
            <SelectItem key={index} value={`${item.title}|||${item.subject}`}>
              <div className="flex flex-col gap-0.5 py-1">
                <span className="text-sm font-medium">{item.subject}</span>
                <span className="text-xs text-muted-foreground">{item.title}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground">Previously used subjects for this property</p>
    </div>
  );
}

/**
 * Discount prefix selector component
 */
interface DiscountPrefixSelectorProps {
  selectedPrefix: string;
  onSelect: (prefix: string) => void;
  show: boolean;
}

export function DiscountPrefixSelector({ selectedPrefix, onSelect, show }: DiscountPrefixSelectorProps) {
  if (!show) return null;

  return (
    <div className="space-y-2">
      <Label>Discount Prefix</Label>
      <Select value={selectedPrefix} onValueChange={onSelect}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {DISCOUNT_PREFIXES.map((prefix, index) => (
            <SelectItem key={index} value={prefix}>
              {prefix.trim()}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground">Prefix added to beginning of subject line</p>
    </div>
  );
}

/**
 * Subject template selector component
 */
interface SubjectTemplateSelectorProps {
  templates: any[];
  selectedValue: string;
  onSelect: (templateId: string) => void;
  loading?: boolean;
}

export function SubjectTemplateSelector({ templates, selectedValue, onSelect, loading }: SubjectTemplateSelectorProps) {
  if (loading || templates.length === 0) return null;

  return (
    <div className="space-y-2">
      <Label>Select a Template</Label>
      <Select value={selectedValue} onValueChange={onSelect}>
        <SelectTrigger>
          <SelectValue placeholder="Choose a template..." />
        </SelectTrigger>
        <SelectContent>
          {templates.map((template: any) => (
            <SelectItem key={template._id} value={template._id}>
              {template.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

/**
 * Address format selector component
 */
interface AddressFormatSelectorProps {
  selectedFormat: string;
  onSelect: (format: string) => void;
  show: boolean;
}

export function AddressFormatSelector({ selectedFormat, onSelect, show }: AddressFormatSelectorProps) {
  if (!show) return null;

  return (
    <div className="space-y-2">
      <Label>Address Format *</Label>
      <Select value={selectedFormat} onValueChange={onSelect}>
        <SelectTrigger>
          <SelectValue placeholder="Select address format..." />
        </SelectTrigger>
        <SelectContent>
          {ADDRESS_FORMAT_TEMPLATES.map((template, index) => (
            <SelectItem key={index} value={template}>
              {template}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

/**
 * Subject editor with emoji picker
 */
interface SubjectEditorProps {
  content: string;
  onContentChange: (content: string) => void;
  charCount: number;
  maxChars?: number;
}

export function SubjectEditor({ content, onContentChange, charCount, maxChars = 100 }: SubjectEditorProps) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

  const handleContentInput = (e: React.FormEvent<HTMLDivElement>) => {
    const newContent = e.currentTarget.textContent || "";
    onContentChange(newContent);
  };

  const handleEmojiSelect = (emojiData: any) => {
    if (editorRef.current) {
      const currentContent = editorRef.current.textContent || "";
      const newContent = currentContent + emojiData.emoji;
      editorRef.current.textContent = newContent;
      onContentChange(newContent);
    }
    setShowEmojiPicker(false);
  };

  useEffect(() => {
    if (editorRef.current && editorRef.current.textContent !== content) {
      editorRef.current.textContent = content;
    }
  }, [content]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>Subject Line</Label>
        <div className="flex items-center gap-2">
          <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm">
                <Smile className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <EmojiPicker onEmojiClick={handleEmojiSelect} />
            </PopoverContent>
          </Popover>
          <span className="text-xs text-muted-foreground">
            {charCount}/{maxChars}
          </span>
        </div>
      </div>
      <div
        ref={editorRef}
        contentEditable
        onInput={handleContentInput}
        className="min-h-[60px] p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
        suppressContentEditableWarning
      />
    </div>
  );
}

/**
 * MAIN COMPONENT
 */
interface PropertyUpdateDiscountConfigProps {
  value: string;
  onChange: (value: string) => void;
  propertyId?: string;
}

export function PropertyUpdateDiscountConfig({ value, onChange, propertyId }: PropertyUpdateDiscountConfigProps) {
  const [useBypass, setUseBypass] = useState(value === "bypass");
  const { templates, loading: templatesLoading } = useSubjectTemplates();
  const { campaigns, loading: campaignsLoading } = usePastCampaigns(propertyId);
  const [selectedSubjectTemplate, setSelectedSubjectTemplate] = useState("");
  const [selectedPastSubject, setSelectedPastSubject] = useState("");
  const [selectedPrefix, setSelectedPrefix] = useState(DISCOUNT_PREFIXES[0]);
  const [baseSubject, setBaseSubject] = useState("");
  const [selectedAddressTemplate, setSelectedAddressTemplate] = useState("");
  const [templateRequiresAddress, setTemplateRequiresAddress] = useState(false);
  const [charCount, setCharCount] = useState(0);

  const handleToggleChange = (bypass: boolean) => {
    setUseBypass(bypass);
    onChange(bypass ? "bypass" : "");
  };

  const handlePastSubjectChange = (value: string) => {
    const [title, subject] = value.split("|||");
    setSelectedPastSubject(value);
    setSelectedSubjectTemplate("");
    setTemplateRequiresAddress(false);
    setBaseSubject(subject);
    setSelectedPrefix(DISCOUNT_PREFIXES[0]);

    const finalSubject = DISCOUNT_PREFIXES[0] + subject;
    updateContent(finalSubject);
  };

  const handlePrefixChange = (prefix: string) => {
    setSelectedPrefix(prefix);
    if (baseSubject) {
      const finalSubject = prefix + baseSubject;
      updateContent(finalSubject);
    }
  };

  const handleSubjectTemplateChange = (templateId: string) => {
    setSelectedSubjectTemplate(templateId);
    setSelectedPastSubject("");

    const template = templates.find((t) => t._id === templateId);
    if (template) {
      const requiresAddress = /{county}|{city}|{state}|{zip}/.test(template.content);
      setTemplateRequiresAddress(requiresAddress);

      if (!requiresAddress) {
        setSelectedAddressTemplate("");
        updateContent(template.content);
      } else {
        setSelectedAddressTemplate("");
      }
    }
  };

  const updateContent = (content: string) => {
    setCharCount(content.length);
    onChange(content);
  };

  return (
    <div className="space-y-4">
      <DiscountBypassToggle useBypass={useBypass} onToggleChange={handleToggleChange} />

      {useBypass ? (
        <DiscountBypassBadge />
      ) : (
        <Card>
          <CardContent className="pt-6 space-y-4">
            <PastSubjectSelector campaigns={campaigns} selectedValue={selectedPastSubject} onSelect={handlePastSubjectChange} loading={campaignsLoading} />

            <DiscountPrefixSelector selectedPrefix={selectedPrefix} onSelect={handlePrefixChange} show={!!selectedPastSubject} />

            <SubjectTemplateSelector templates={templates} selectedValue={selectedSubjectTemplate} onSelect={handleSubjectTemplateChange} loading={templatesLoading} />

            <AddressFormatSelector selectedFormat={selectedAddressTemplate} onSelect={setSelectedAddressTemplate} show={templateRequiresAddress} />

            <SubjectEditor content={value !== "bypass" ? value : ""} onContentChange={updateContent} charCount={charCount} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/**
 * EXPORTED CONSTANTS
 */
export { ADDRESS_FORMAT_TEMPLATES, DISCOUNT_PREFIXES };
