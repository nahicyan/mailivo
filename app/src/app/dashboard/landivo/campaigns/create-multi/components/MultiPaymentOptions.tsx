// app/src/app/dashboard/landivo/campaigns/create-multi/components/Step4PaymentOptions.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { CreditCard, AlertCircle, Loader2, TrendingDown, TrendingUp } from 'lucide-react';
import { useMultiPropertyPayment } from '@/hooks/useMultiPropertyPayment';
import { PaymentPlan } from '@/types/campaign';

interface Props {
  formData: any;
  setFormData: (fn: (prev: any) => any) => void;
  errors: Record<string, string>;
  selectedTemplate?: any;
  properties?: any[];
}

type PlanSelectionStrategy = 
  | 'plan-1' 
  | 'plan-2' 
  | 'plan-3' 
  | 'monthly-low' 
  | 'monthly-high' 
  | 'down-payment-low' 
  | 'down-payment-high' 
  | 'interest-low' 
  | 'interest-high';

export function MultiPaymentOptions({ 
  formData, 
  setFormData, 
  errors, 
  selectedTemplate,
  properties = []
}: Props) {
  // Financing toggle state
  const [financingEnabled, setFinancingEnabled] = useState(
    formData.financingEnabled ?? false
  );
  
  // Plan selection strategy
  const [planStrategy, setPlanStrategy] = useState<PlanSelectionStrategy>(
    formData.planStrategy ?? 'plan-1'
  );

  // Custom plan selections for properties with 3+ plans when plan-3 selected
  const [customPlanSelections, setCustomPlanSelections] = useState<Record<string, number>>(
    formData.customPlanSelections ?? {}
  );

  // Check if template has payment-calculator components
  const paymentCalculatorComponents = useMemo(() => {
    if (!selectedTemplate?.components) return [];
    return selectedTemplate.components
      .filter((component: any) => component.type === 'payment-calculator')
      .sort((a: any, b: any) => a.order - b.order);
  }, [selectedTemplate]);

  // Get selected properties data
  const selectedPropertiesData = useMemo(() => {
    if (!properties || !formData.selectedProperties?.length) return [];
    return formData.selectedProperties
      .map((id: string) => properties.find((p: any) => p.id === id))
      .filter(Boolean);
  }, [properties, formData.selectedProperties]);

  // Filter properties with financing available
  const propertiesWithFinancing = useMemo(() => {
    return selectedPropertiesData.filter((property: any) =>
      property?.financing === 'Available'
    );
  }, [selectedPropertiesData]);

  // Fetch payment data for properties with financing
  const { 
    paymentDataMap, 
    loading, 
    error 
  } = useMultiPropertyPayment(
    financingEnabled ? propertiesWithFinancing.map(p => p.id) : []
  );

  // Format currency helper
  const formatCurrency = (amount: number | null | undefined) => {
    if (amount == null) return 'N/A';
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD', 
      minimumFractionDigits: 0 
    }).format(amount);
  };

  // Format percentage helper
  const formatPercentage = (rate: number | null | undefined) => {
    if (rate == null) return 'N/A';
    return `${rate}%`;
  };

  // Get available plans for a property
  const getAvailablePlans = (propertyId: string): PaymentPlan[] => {
    const paymentData = paymentDataMap[propertyId];
    if (!paymentData) return [];

    const plans: PaymentPlan[] = [];

    // Plan 1
    if (paymentData.financing === 'Available') {
      plans.push({
        planNumber: 1,
        planName: 'Payment Plan 1',
        downPayment: paymentData.downPaymentOne,
        loanAmount: paymentData.loanAmountOne,
        interestRate: paymentData.interestOne,
        monthlyPayment: paymentData.monthlyPaymentOne,
        isAvailable: true
      });
    }

    // Plan 2
    if (paymentData.financingTwo === 'Available') {
      plans.push({
        planNumber: 2,
        planName: 'Payment Plan 2',
        downPayment: paymentData.downPaymentTwo,
        loanAmount: paymentData.loanAmountTwo,
        interestRate: paymentData.interestTwo,
        monthlyPayment: paymentData.monthlyPaymentTwo,
        isAvailable: true
      });
    }

    // Plan 3
    if (paymentData.financingThree === 'Available' && 
        paymentData.monthlyPaymentThree != null) {
      plans.push({
        planNumber: 3,
        planName: 'Payment Plan 3',
        downPayment: paymentData.downPaymentThree || 0,
        loanAmount: paymentData.loanAmountThree || 0,
        interestRate: paymentData.interestThree,
        monthlyPayment: paymentData.monthlyPaymentThree,
        isAvailable: true
      });
    }

    return plans;
  };

  // Select plan based on strategy
  const selectPlanByStrategy = (
    plans: PaymentPlan[], 
    strategy: PlanSelectionStrategy,
    propertyId: string
  ): PaymentPlan | null => {
    if (!plans.length) return null;

    switch (strategy) {
      case 'plan-1':
        return plans.find(p => p.planNumber === 1) || plans[0];
      
      case 'plan-2':
        return plans.find(p => p.planNumber === 2) || plans[0];
      
      case 'plan-3':
        const plan3 = plans.find(p => p.planNumber === 3);
        if (plan3) return plan3;
        
        // If no plan 3 but multiple plans available, use custom selection
        if (plans.length > 1) {
          const customSelection = customPlanSelections[propertyId];
          return plans.find(p => p.planNumber === customSelection) || plans[0];
        }
        return plans[0];
      
      case 'monthly-low':
        return plans.reduce((lowest, current) => 
          current.monthlyPayment < lowest.monthlyPayment ? current : lowest
        );
      
      case 'monthly-high':
        return plans.reduce((highest, current) => 
          current.monthlyPayment > highest.monthlyPayment ? current : highest
        );
      
      case 'down-payment-low':
        return plans.reduce((lowest, current) => 
          current.downPayment < lowest.downPayment ? current : lowest
        );
      
      case 'down-payment-high':
        return plans.reduce((highest, current) => 
          current.downPayment > highest.downPayment ? current : highest
        );
      
      case 'interest-low':
        return plans.reduce((lowest, current) => 
          current.interestRate < lowest.interestRate ? current : lowest
        );
      
      case 'interest-high':
        return plans.reduce((highest, current) => 
          current.interestRate > highest.interestRate ? current : highest
        );
      
      default:
        return plans[0];
    }
  };

  // Calculate selected plans for all properties
  const selectedPlansMap = useMemo(() => {
    const plansMap: Record<string, PaymentPlan | null> = {};
    
    propertiesWithFinancing.forEach(property => {
      const plans = getAvailablePlans(property.id);
      plansMap[property.id] = selectPlanByStrategy(plans, planStrategy, property.id);
    });
    
    return plansMap;
  }, [propertiesWithFinancing, paymentDataMap, planStrategy, customPlanSelections]);

  // Update form data when financing toggle or selections change
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      financingEnabled,
      planStrategy,
      customPlanSelections,
      selectedPaymentPlans: financingEnabled ? selectedPlansMap : {}
    }));
  }, [financingEnabled, planStrategy, customPlanSelections]); // Removed selectedPlansMap and setFormData to prevent infinite loop

  // Handle financing toggle
  const handleFinancingToggle = (enabled: boolean) => {
    setFinancingEnabled(enabled);
    if (!enabled) {
      // Clear all payment selections when financing is disabled
      setFormData(prev => ({
        ...prev,
        financingEnabled: false,
        selectedPaymentPlans: {}
      }));
    }
  };

  // Handle plan strategy change
  const handlePlanStrategyChange = (strategy: PlanSelectionStrategy) => {
    setPlanStrategy(strategy);
  };

  // Handle custom plan selection for specific property
  const handleCustomPlanSelection = (propertyId: string, planNumber: number) => {
    setCustomPlanSelections(prev => ({
      ...prev,
      [propertyId]: planNumber
    }));
  };

  // Validation check
  const isValid = () => {
    if (!financingEnabled) return true; // Always valid when financing disabled
    
    // Check if we have any properties with financing
    if (propertiesWithFinancing.length === 0) return true;
    
    // Check if all properties with financing have valid plan selections
    return propertiesWithFinancing.every(property => {
      const selectedPlan = selectedPlansMap[property.id];
      return selectedPlan && selectedPlan.monthlyPayment > 0;
    });
  };

  // Render main content
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CreditCard className="h-5 w-5" />
            <span>Payment Options</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Loading payment options...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <CreditCard className="h-5 w-5" />
          <span>Payment Options</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Financing Toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label htmlFor="financing-toggle" className="text-base font-medium">
              Enable Financing
            </Label>
            <p className="text-sm text-gray-600">
              Include financing options for properties in this campaign
            </p>
          </div>
          <Switch
            id="financing-toggle"
            checked={financingEnabled}
            onCheckedChange={handleFinancingToggle}
          />
        </div>

        {/* Template Info */}
        {paymentCalculatorComponents.length > 0 && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center space-x-2 mb-1">
              <Badge variant="outline">Template Component</Badge>
            </div>
            <p className="text-sm">
              Template has {paymentCalculatorComponents.length} payment calculator component(s)
            </p>
          </div>
        )}

        {/* Financing Section */}
        {financingEnabled && (
          <div className="space-y-4">
            {/* Properties with financing check */}
            {propertiesWithFinancing.length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  None of the selected properties have financing available. 
                  You can still proceed with the campaign.
                </AlertDescription>
              </Alert>
            ) : (
              <>
                {/* Plan Selection Strategy */}
                <div className="space-y-2">
                  <Label className="text-base font-medium">
                    Plan Selection Strategy
                  </Label>
                  <p className="text-sm text-gray-600">
                    Choose how to select payment plans for properties with financing
                  </p>
                  <Select 
                    value={planStrategy} 
                    onValueChange={handlePlanStrategyChange}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="plan-1">Plan 1</SelectItem>
                      <SelectItem value="plan-2">Plan 2 (fallback to Plan 1)</SelectItem>
                      <SelectItem value="plan-3">Plan 3 (requires validation)</SelectItem>
                      <SelectItem value="monthly-low">
                        <div className="flex items-center space-x-2">
                          <TrendingDown className="h-4 w-4" />
                          <span>Lowest Monthly Payment</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="monthly-high">
                        <div className="flex items-center space-x-2">
                          <TrendingUp className="h-4 w-4" />
                          <span>Highest Monthly Payment</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="down-payment-low">Lowest Down Payment</SelectItem>
                      <SelectItem value="down-payment-high">Highest Down Payment</SelectItem>
                      <SelectItem value="interest-low">Lowest Interest Rate</SelectItem>
                      <SelectItem value="interest-high">Highest Interest Rate</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Properties Table */}
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Property Address</TableHead>
                        <TableHead>Monthly Payment</TableHead>
                        <TableHead>Selected Plan</TableHead>
                        {planStrategy === 'plan-3' && <TableHead>Custom Selection</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                     {propertiesWithFinancing.map((property: any) => {
                        const plans = getAvailablePlans(property.id);
                        const selectedPlan = selectedPlansMap[property.id];
                        const fullAddress = `${property.streetAddress}, ${property.city}, ${property.state} ${property.zip}`;
                        
                        return (
                          <TableRow key={property.id}>
                            <TableCell className="font-medium">
                              {fullAddress}
                            </TableCell>
                            <TableCell>
                              {selectedPlan ? formatCurrency(selectedPlan.monthlyPayment) : 'N/A'}
                            </TableCell>
                            <TableCell>
                              {selectedPlan ? (
                                <Badge variant="outline">
                                  {selectedPlan.planName}
                                </Badge>
                              ) : (
                                <Badge variant="destructive">No Plan Available</Badge>
                              )}
                            </TableCell>
                            {planStrategy === 'plan-3' && (
                              <TableCell>
                                {plans.length > 1 && !plans.find(p => p.planNumber === 3) ? (
                                  <Select
                                    value={customPlanSelections[property.id]?.toString() || '1'}
                                    onValueChange={(value) => 
                                      handleCustomPlanSelection(property.id, parseInt(value))
                                    }
                                  >
                                    <SelectTrigger className="w-32">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {plans.map(plan => (
                                        <SelectItem 
                                          key={plan.planNumber} 
                                          value={plan.planNumber.toString()}
                                        >
                                          Plan {plan.planNumber}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                ) : (
                                  <span className="text-sm text-gray-500">-</span>
                                )}
                              </TableCell>
                            )}
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                {/* Summary */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium mb-2">Summary</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Properties with Financing:</span>
                      <div className="font-medium">{propertiesWithFinancing.length}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Strategy:</span>
                      <div className="font-medium">
                        {planStrategy.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-600">Valid Selections:</span>
                      <div className="font-medium">
                        {Object.values(selectedPlansMap).filter(Boolean).length}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-600">Status:</span>
                      <div className={`font-medium ${isValid() ? 'text-green-600' : 'text-red-600'}`}>
                        {isValid() ? 'Ready' : 'Invalid'}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Validation Errors */}
        {errors.paymentPlans && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{errors.paymentPlans}</AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Error loading payment data: {error}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}