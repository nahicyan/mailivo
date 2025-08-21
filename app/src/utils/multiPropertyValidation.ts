// app/src/utils/multiPropertyValidation.ts

/**
 * Validates multi-property campaign step 7 (schedule)
 */
export function validateMultiPropertySchedule(
  formData: any, 
  selectedDate: Date | undefined
): { isValid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  // Email schedule validation
  if (!formData.emailSchedule) {
    errors.emailSchedule = 'Please select when to send the campaign';
  }

  // Scheduled date validation
  if (formData.emailSchedule === 'scheduled') {
    if (!selectedDate) {
      errors.scheduledDate = 'Please select a date for scheduling';
    } else if (selectedDate <= new Date()) {
      errors.scheduledDate = 'Scheduled date must be in the future';
    }
  }

  // Email volume validation
  if (!formData.emailVolume || formData.emailVolume < 1) {
    errors.emailVolume = 'Email volume must be at least 1';
  }

  // Multi-property specific validations
  if (!formData.selectedProperties || formData.selectedProperties.length === 0) {
    errors.properties = 'At least one property must be selected';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Validates the complete multi-property campaign before submission
 */
export function validateCompleteMultiPropertyCampaign(
  formData: any,
  selectedDate: Date | undefined,
  properties: any[] = []
): { isValid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  // Step 1: Properties
  if (!formData.selectedProperties || formData.selectedProperties.length === 0) {
    errors.selectedProperties = 'Please select at least one property';
  }

  // Step 2: Basic Info
  if (!formData.name?.trim()) {
    errors.name = 'Campaign name is required';
  }
  if (!formData.description?.trim()) {
    errors.description = 'Campaign description is required';
  }

  // Step 3: Audience
  if (!formData.emailList) {
    errors.emailList = 'Please select an email list';
  }

  // Step 4: Payment Options (use existing validation)
  if (formData.financingEnabled) {
    // Import and use existing payment validation
    // This should be imported from the existing validation file
  }

  // Step 5: Pictures (optional - can proceed with defaults)

  // Step 6: Subject
  if (!formData.subject?.trim()) {
    errors.subject = 'Subject line is required';
  }

  // Step 7: Schedule
  const scheduleValidation = validateMultiPropertySchedule(formData, selectedDate);
  Object.assign(errors, scheduleValidation.errors);

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Prepares multi-property campaign data for API submission
 * COMPATIBLE WITH EXISTING BACKEND
 */
export function prepareMultiPropertyCampaignData(
  formData: any,
  selectedDate: Date | undefined
) {
  // Use sorted property order if available, otherwise use selection order
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

  // Prepare data that matches existing backend expectations
  const campaignData = {
    // Required fields that backend expects
    name: formData.name,
    property: finalPropertyOrder?.[0] || '', // First property for compatibility
    emailList: formData.emailList,
    emailTemplate: formData.emailTemplate,
    emailVolume: formData.emailVolume,
    
    // Optional fields backend handles
    description: formData.description,
    subject: formData.subject,
    emailAddressGroup: formData.emailAddressGroup || '',
    emailSchedule: formData.emailSchedule,
    status: campaignStatus,
    source: 'landivo',
    scheduledDate: formData.emailSchedule === 'scheduled'
      ? selectedDate?.toISOString()
      : null,
    
    // Store multi-property data as metadata that backend can ignore
    metadata: {
      type: 'multi-property',
      properties: finalPropertyOrder,
      selectedProperties: formData.selectedProperties,
      sortedPropertyOrder: formData.sortedPropertyOrder,
      totalProperties: finalPropertyOrder?.length || 0,
      
      // Financing data
      financingEnabled: formData.financingEnabled,
      planStrategy: formData.planStrategy,
      selectedPaymentPlans: formData.selectedPaymentPlans || {},
      customPlanSelections: formData.customPlanSelections || {},
      propertiesWithFinancing: formData.financingEnabled 
        ? Object.keys(formData.selectedPaymentPlans || {}).length 
        : 0,
      
      // Image selections (deduplicated)
      multiPropertyImageSelections: uniqueImageSelections,
      hasImageSelections: uniqueImageSelections.length > 0
    },
    
    // Legacy compatibility fields
    imageSelections: formData.imageSelections || {},
    selectedPlan: formData.selectedPlan || null
  };

  return campaignData;
}

/**
 * Get campaign summary for display
 */
export function getMultiPropertyCampaignSummary(formData: any, properties: any[] = []) {
  const selectedPropertiesData = formData.selectedProperties
    ?.map((id: string) => properties.find(p => p.id === id))
    .filter(Boolean) || [];

  const propertiesWithFinancing = formData.financingEnabled 
    ? selectedPropertiesData.filter(property => 
        formData.selectedPaymentPlans?.[property.id]
      ).length
    : 0;

  const totalValue = selectedPropertiesData.reduce(
    (sum, property) => sum + (property.askingPrice || 0), 
    0
  );

  const averagePrice = selectedPropertiesData.length > 0 
    ? totalValue / selectedPropertiesData.length 
    : 0;

  return {
    totalProperties: selectedPropertiesData.length,
    propertiesWithFinancing,
    totalValue,
    averagePrice,
    hasImages: (formData.multiPropertyImageSelections || []).length > 0,
    isValid: selectedPropertiesData.length > 0 && formData.name && formData.emailList
  };
}