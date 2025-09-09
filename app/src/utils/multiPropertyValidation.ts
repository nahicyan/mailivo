// app/src/utils/multiPropertyValidation.ts - RESTRUCTURED TO MATCH SINGLE PROPERTY FORMAT

/**
 * Validates multi-property campaign step 7 (schedule)
 */
export function validateMultiPropertySchedule(
  formData: any, 
  selectedDate: Date | undefined
): { isValid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  if (!formData.emailSchedule) {
    errors.emailSchedule = 'Please select when to send the campaign';
  }

  if (formData.emailSchedule === 'scheduled') {
    if (!selectedDate) {
      errors.scheduledDate = 'Please select a date for scheduling';
    } else if (selectedDate <= new Date()) {
      errors.scheduledDate = 'Scheduled date must be in the future';
    }
  }

  if (!formData.emailVolume || formData.emailVolume < 1) {
    errors.emailVolume = 'Email volume must be at least 1';
  }

  if (!formData.selectedProperties || formData.selectedProperties.length === 0) {
    errors.properties = 'At least one property must be selected';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

// Removed - using template system instead

/**
 * Prepares multi-property campaign data - RESTRUCTURED LIKE SINGLE PROPERTY
 */
export function prepareMultiPropertyCampaignData(
  formData: any,
  selectedDate: Date | undefined,
  properties: any[] = [],
  template: any = null
) {
  const finalPropertyOrder = formData.sortedPropertyOrder?.length > 0
    ? formData.sortedPropertyOrder
    : formData.selectedProperties;

  const campaignStatus = formData.emailSchedule === 'immediate' ? 'active' : 'draft';

  // Remove duplicates from image selections
  const uniqueImageSelections = formData.multiPropertyImageSelections 
    ? formData.multiPropertyImageSelections.filter((selection: any, index: number, array: any[]) => 
        array.findIndex(s => s.propertyId === selection.propertyId) === index
      )
    : [];

  // Simple placeholder htmlContent like single property
  const htmlContent = "<p>Multi-property email content will be generated from template</p>";

  // Convert image selections to format similar to single property
  const multiPropertyImageSelections: Record<string, any> = {};
  uniqueImageSelections.forEach((selection: any, index: number) => {
    multiPropertyImageSelections[`property-${selection.propertyId}-image`] = {
      propertyId: selection.propertyId,
      imageIndex: selection.imageIndex,
      imageUrl: selection.imageUrl,
      order: index + 1
    };
  });

  // Convert payment plans to array format
  const multiPropertyPaymentPlans: any[] = [];
  if (formData.selectedPaymentPlans) {
    finalPropertyOrder.forEach((propertyId: string) => {
      const plan = formData.selectedPaymentPlans[propertyId];
      if (plan) {
        multiPropertyPaymentPlans.push({
          propertyId,
          ...plan
        });
      }
    });
  }

  // Structure like single property but with arrays
  const campaignData = {
    // Required fields
    name: formData.name,
    subject: formData.subject,
    htmlContent: htmlContent,
    
    // CHANGED: property is now array instead of string
    property: finalPropertyOrder, // Array of property IDs
    
    // Standard fields (same as single property)
    emailList: formData.emailList,
    emailTemplate: formData.emailTemplate,
    emailVolume: formData.emailVolume,
    emailAddressGroup: formData.emailAddressGroup || '',
    emailSchedule: formData.emailSchedule,
    description: formData.description,
    status: campaignStatus,
    source: 'landivo',
    scheduledDate: formData.emailSchedule === 'scheduled' 
      ? selectedDate?.toISOString() 
      : null,
    
    // CHANGED: Multiple payment plans instead of single selectedPlan
    selectedPlan: multiPropertyPaymentPlans, // Array of payment plans
    
    // Include selectedAgent if present (moved here for proper ordering)
    selectedAgent: formData.selectedAgent || null,
    
    // CHANGED: Multiple image selections (similar structure to single property)
    imageSelections: multiPropertyImageSelections,
    
    // Multi-property specific metadata (minimal)
    multiPropertyMeta: {
      type: 'multi-property',
      totalProperties: finalPropertyOrder.length,
      financingEnabled: formData.financingEnabled,
      planStrategy: formData.planStrategy,
      propertiesWithFinancing: multiPropertyPaymentPlans.length
    }
  };

  return campaignData;
}