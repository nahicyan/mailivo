// app/src/utils/paymentValidation.ts

/**
 * Validates payment options step for multi-property campaigns
 */
export function validatePaymentOptions(formData: any, properties: any[] = []): { 
  isValid: boolean; 
  errors: Record<string, string> 
} {
  const errors: Record<string, string> = {};

  // If financing is disabled, always valid
  if (!formData.financingEnabled) {
    return { isValid: true, errors };
  }

  // Get properties with financing available
  const selectedPropertiesData = formData.selectedProperties
    ?.map((id: string) => properties.find(p => p.id === id))
    .filter(Boolean) || [];

  const propertiesWithFinancing = selectedPropertiesData.filter(
    (property: any) => property?.financing === 'Available'
  );

  // If no properties have financing, it's valid (user can still proceed)
  if (propertiesWithFinancing.length === 0) {
    return { isValid: true, errors };
  }

  // Check if we have valid plan selections for all properties with financing
  const selectedPaymentPlans = formData.selectedPaymentPlans || {};
  
  const hasInvalidSelections = propertiesWithFinancing.some((property: any) => {
    const plan = selectedPaymentPlans[property.id];
    return !plan || !plan.monthlyPayment || plan.monthlyPayment <= 0;
  });

  if (hasInvalidSelections) {
    errors.paymentPlans = 'Please ensure all properties with financing have valid payment plans selected.';
  }

  // Validate Plan 3 strategy with custom selections
  if (formData.planStrategy === 'plan-3') {
    const needsCustomSelection = propertiesWithFinancing.some((property: any) => {
      const plan = selectedPaymentPlans[property.id];
      // Check if this property has multiple plans but no plan 3
      // This would require custom selection validation
      return plan && plan.planNumber !== 3 && !formData.customPlanSelections?.[property.id];
    });

    if (needsCustomSelection) {
      errors.paymentPlans = 'Plan 3 strategy requires custom plan selection for properties without Plan 3.';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Get summary statistics for payment options
 */
export function getPaymentOptionsSummary(formData: any, properties: any[] = []) {
  if (!formData.financingEnabled) {
    return {
      financingEnabled: false,
      propertiesWithFinancing: 0,
      totalProperties: formData.selectedProperties?.length || 0,
      validSelections: 0,
      planStrategy: null
    };
  }

  const selectedPropertiesData = formData.selectedProperties
    ?.map((id: string) => properties.find(p => p.id === id))
    .filter(Boolean) || [];

  const propertiesWithFinancing = selectedPropertiesData.filter(
    (property: any) => property?.financing === 'Available'
  );

  const selectedPaymentPlans = formData.selectedPaymentPlans || {};
  const validSelections = propertiesWithFinancing.filter((property: any) => {
    const plan = selectedPaymentPlans[property.id];
    return plan && plan.monthlyPayment > 0;
  }).length;

  return {
    financingEnabled: true,
    propertiesWithFinancing: propertiesWithFinancing.length,
    totalProperties: selectedPropertiesData.length,
    validSelections,
    planStrategy: formData.planStrategy,
    isComplete: validSelections === propertiesWithFinancing.length
  };
}

/**
 * Format plan strategy for display
 */
export function formatPlanStrategy(strategy: string): string {
  const strategyMap: Record<string, string> = {
    'plan-1': 'Plan 1',
    'plan-2': 'Plan 2 (with fallback)',
    'plan-3': 'Plan 3 (with validation)',
    'monthly-low': 'Lowest Monthly Payment',
    'monthly-high': 'Highest Monthly Payment',
    'down-payment-low': 'Lowest Down Payment',
    'down-payment-high': 'Highest Down Payment',
    'interest-low': 'Lowest Interest Rate',
    'interest-high': 'Highest Interest Rate'
  };

  return strategyMap[strategy] || strategy;
}