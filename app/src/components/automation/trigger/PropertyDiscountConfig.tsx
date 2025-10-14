// app/src/components/automation/trigger/PropertyDiscountConfig.tsx
"use client";

import React, { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { History, Tag } from "lucide-react";
import axios from "axios";

const DISCOUNT_PREFIXES = [
  'Price Drop Alert 🔻 ',
  'Just Reduced ',
  'New Low Price ',
  'Deal Alert 🚨 ',
  'Investor Special 🏠 ',
  'Discounted Deal 🏷️ ',
  'Priced to Sell ',
  'Exclusive Deal ',
  'Below Market Value ',
  'Price Improvement '
];

interface PastSubject {
  title: string;
  subject: string;
}

interface PropertyDiscountSubjectSelectorProps {
  propertyId?: string;
  value: string;
  useFromLandivo: boolean;
  onChange: (value: string) => void;
}

export function PropertyDiscountSubjectSelector({
  propertyId,
  value,
  useFromLandivo,
  onChange
}: PropertyDiscountSubjectSelectorProps) {
  const [pastSubjects, setPastSubjects] = useState<PastSubject[]>([]);
  const [loadingPastSubjects, setLoadingPastSubjects] = useState(false);
  const [selectedPastSubject, setSelectedPastSubject] = useState("");
  const [selectedPrefix, setSelectedPrefix] = useState(DISCOUNT_PREFIXES[0]);
  const [baseSubject, setBaseSubject] = useState("");

  // Fetch past subjects when propertyId is available
  useEffect(() => {
    if (!propertyId || useFromLandivo) return;

    const fetchPastSubjects = async () => {
      setLoadingPastSubjects(true);
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/campaigns/subjects/${propertyId}`
        );
        
        if (response.data.success && response.data.subjects) {
          setPastSubjects(response.data.subjects);
        }
      } catch (error) {
        console.error("Error loading past subjects:", error);
      } finally {
        setLoadingPastSubjects(false);
      }
    };

    fetchPastSubjects();
  }, [propertyId, useFromLandivo]);

  const handlePastSubjectChange = (subjectValue: string) => {
    const [title, subject] = subjectValue.split('|||');
    setSelectedPastSubject(subjectValue);
    setBaseSubject(subject);
    setSelectedPrefix(DISCOUNT_PREFIXES[0]);
    
    const finalSubject = DISCOUNT_PREFIXES[0] + subject;
    onChange(finalSubject);
  };

  const handlePrefixChange = (prefix: string) => {
    setSelectedPrefix(prefix);
    
    if (baseSubject) {
      const finalSubject = prefix + baseSubject;
      onChange(finalSubject);
    }
  };

  if (useFromLandivo) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Past Subject Selector */}
      {pastSubjects.length > 0 && (
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Select Past Subject (Optional)
          </Label>
          <Select value={selectedPastSubject} onValueChange={handlePastSubjectChange}>
            <SelectTrigger>
              <SelectValue placeholder="Choose from past campaigns..." />
            </SelectTrigger>
            <SelectContent className="max-w-[500px]">
              {pastSubjects.map((item, index) => (
                <SelectItem 
                  key={index} 
                  value={`${item.title}|||${item.subject}`}
                  className="cursor-pointer"
                >
                  <div className="flex flex-col gap-0.5 py-1">
                    <span className="text-sm font-medium">
                      {item.subject}
                    </span>
                    <span className="text-xs text-muted-foreground truncate">
                      {item.title}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Previously used subjects for this property
          </p>
        </div>
      )}

      {/* Discount Prefix Selector */}
      {selectedPastSubject && (
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Tag className="h-4 w-4" />
            Discount Prefix
          </Label>
          <Select value={selectedPrefix} onValueChange={handlePrefixChange}>
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
          <p className="text-xs text-muted-foreground">
            This prefix will be added to the beginning of your subject line
          </p>
        </div>
      )}

      {loadingPastSubjects && (
        <Alert>
          <AlertDescription className="text-sm">
            Loading past subjects...
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

export default PropertyDiscountSubjectSelector;