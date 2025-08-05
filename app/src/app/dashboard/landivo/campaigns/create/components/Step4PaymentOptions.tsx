// app/src/app/dashboard/landivo/campaigns/create/components/Step4PaymentOptions.tsx
import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CreditCard, AlertCircle, DollarSign, Loader2 } from 'lucide-react';
import { usePropertyPayment } from '@/hooks/usePropertyPayment';
import { PaymentPlan } from '@/types/campaign';

interface Props {
  formData: any;
  setFormData: (fn: (prev: any) => any) => void;
  errors: Record<string, string>;
}

export function Step4PaymentOptions({ formData, setFormData, errors }: Props) {
  const { 
    paymentData, 
    paymentPlans, 
    loading, 
    error, 
    availablePlansCount, 
    hasAnyPlans 
  } = usePropertyPayment(formData.property);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD', 
      minimumFractionDigits: 0 
    }).format(amount);

  const formatPercentage = (rate: number) => `${rate}%`;

  // Auto-select single plan or clear selection when plans change
  useEffect(() => {
    if (!hasAnyPlans) {
      // No plans available, clear selection
      setFormData(prev => ({
        ...prev,
        selectedPlan: null
      }));
    } else if (availablePlansCount === 1 && paymentPlans.length > 0) {
      // Only one plan available, auto-select it
      const singlePlan = paymentPlans[0];
      setFormData(prev => ({
        ...prev,
        selectedPlan: {
          planNumber: singlePlan.planNumber,
          planName: singlePlan.planName,
          downPayment: singlePlan.downPayment,
          loanAmount: singlePlan.loanAmount,
          interestRate: singlePlan.interestRate,
          monthlyPayment: singlePlan.monthlyPayment
        }
      }));
    }
  }, [hasAnyPlans, availablePlansCount, paymentPlans, setFormData]);

  const handlePlanSelection = (planNumber: string) => {
    const selectedPlan = paymentPlans.find(plan => plan.planNumber === parseInt(planNumber));
    if (selectedPlan) {
      setFormData(prev => ({
        ...prev,
        selectedPlan: {
          planNumber: selectedPlan.planNumber,
          planName: selectedPlan.planName,
          downPayment: selectedPlan.downPayment,
          loanAmount: selectedPlan.loanAmount,
          interestRate: selectedPlan.interestRate,
          monthlyPayment: selectedPlan.monthlyPayment
        }
      }));
    }
  };

  const renderPaymentPlanCard = (plan: PaymentPlan, isSelected: boolean, showRadio: boolean = true) => (
    <div key={plan.planNumber} 
         className={`p-4 border rounded-lg transition-colors ${
           isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
         }`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          {showRadio && (
            <RadioGroupItem value={plan.planNumber.toString()} />
          )}
          <div>
            <h3 className={`font-semibold ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
              {plan.planName}
            </h3>
            <Badge variant={isSelected ? 'default' : 'secondary'} className="text-xs mt-1">
              {formatPercentage(plan.interestRate)} APR
            </Badge>
          </div>
        </div>
        <div className="text-right">
          <div className={`text-lg font-bold ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
            {formatCurrency(plan.monthlyPayment)}/month
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-4 text-sm">
        <div>
          <span className="text-gray-500">Down Payment</span>
          <div className="font-medium">{formatCurrency(plan.downPayment)}</div>
        </div>
        <div>
          <span className="text-gray-500">Loan Amount</span>
          <div className="font-medium">{formatCurrency(plan.loanAmount)}</div>
        </div>
        <div>
          <span className="text-gray-500">Interest Rate</span>
          <div className="font-medium">{formatPercentage(plan.interestRate)}</div>
        </div>
      </div>
    </div>
  );

  if (!formData.property) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CreditCard className="h-5 w-5" />
            <span>Payment Options</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please select a property first to view available payment options.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CreditCard className="h-5 w-5" />
            <span>Payment Options</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            <span className="ml-3 text-gray-600">Loading payment options...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CreditCard className="h-5 w-5" />
            <span>Payment Options</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load payment options: {error}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // No financing available
  if (!hasAnyPlans) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CreditCard className="h-5 w-5" />
            <span>Payment Options</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <DollarSign className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Financing Not Available
            </h3>
            <p className="text-gray-500">
              Financing is not available on this property. Please contact us for cash purchase options.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Single plan available
  if (availablePlansCount === 1) {
    const singlePlan = paymentPlans[0];
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CreditCard className="h-5 w-5" />
            <span>Payment Options</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Only {singlePlan.planName} is available for this property and has been automatically selected.
            </AlertDescription>
          </Alert>
          
          {renderPaymentPlanCard(singlePlan, true, false)}
        </CardContent>
      </Card>
    );
  }

  // Multiple plans available
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <CreditCard className="h-5 w-5" />
          <span>Payment Options</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label className="text-base font-medium">
            Choose Payment Plan ({availablePlansCount} available)
          </Label>
          <p className="text-sm text-gray-600">
            Select the financing option that works best for your budget.
          </p>
        </div>

        <RadioGroup 
          value={formData.selectedPlan?.planNumber?.toString() || ''} 
          onValueChange={handlePlanSelection}
          className="space-y-4"
        >
          {paymentPlans.map(plan => 
            renderPaymentPlanCard(
              plan, 
              formData.selectedPlan?.planNumber === plan.planNumber,
              true
            )
          )}
        </RadioGroup>

        {errors.selectedPlan && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{errors.selectedPlan}</AlertDescription>
          </Alert>
        )}

        {paymentData && (
          <div className="p-3 bg-gray-50 border border-gray-200 rounded text-xs">
            <p><strong>Property Details:</strong></p>
            <p>Asking Price: {formatCurrency(paymentData.askingPrice)}</p>
            <p>Service Fee: ${paymentData.serviceFee}</p>
            <p>Term: {paymentData.term} months</p>
            {paymentData.hoaMonthly && (
              <p>HOA Monthly: {formatCurrency(paymentData.hoaMonthly)}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}