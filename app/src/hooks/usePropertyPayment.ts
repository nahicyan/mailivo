// app/src/hooks/usePropertyPayment.ts
import { useState, useEffect } from 'react';
import { PropertyPaymentData, PaymentPlan } from '@/types/campaign';

interface UsePropertyPaymentReturn {
  paymentData: PropertyPaymentData | null;
  paymentPlans: PaymentPlan[];
  loading: boolean;
  error: string | null;
  availablePlansCount: number;
  hasAnyPlans: boolean;
}

export function usePropertyPayment(propertyId: string): UsePropertyPaymentReturn {
  const [paymentData, setPaymentData] = useState<PropertyPaymentData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!propertyId) {
      setPaymentData(null);
      setError(null);
      return;
    }

    const fetchPropertyPayment = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`https://api.landivo.com/residency/${propertyId}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch property: ${response.status}`);
        }
        
        const data = await response.json();
        setPaymentData(data);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        setError(errorMessage);
        console.error('Error fetching property payment data:', errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchPropertyPayment();
  }, [propertyId]);

  // Process payment plans
  const paymentPlans: PaymentPlan[] = [];
  let availablePlansCount = 0;

  if (paymentData) {
    // Plan 1
    const plan1Available = paymentData.financing === 'Available';
    if (plan1Available) availablePlansCount++;
    
    paymentPlans.push({
      planNumber: 1,
      planName: 'Payment Plan 1',
      downPayment: paymentData.downPaymentOne,
      loanAmount: paymentData.loanAmountOne,
      interestRate: paymentData.interestOne,
      monthlyPayment: paymentData.monthlyPaymentOne,
      isAvailable: plan1Available
    });

    // Plan 2
    const plan2Available = paymentData.financingTwo === 'Available';
    if (plan2Available) availablePlansCount++;
    
    paymentPlans.push({
      planNumber: 2,
      planName: 'Payment Plan 2',
      downPayment: paymentData.downPaymentTwo,
      loanAmount: paymentData.loanAmountTwo,
      interestRate: paymentData.interestTwo,
      monthlyPayment: paymentData.monthlyPaymentTwo,
      isAvailable: plan2Available
    });

    // Plan 3
    const plan3Available = paymentData.financingThree === 'Available' && 
                            paymentData.monthlyPaymentThree !== null && 
                            paymentData.monthlyPaymentThree !== undefined;
    if (plan3Available) availablePlansCount++;
    
    paymentPlans.push({
      planNumber: 3,
      planName: 'Payment Plan 3',
      downPayment: paymentData.downPaymentThree || 0,
      loanAmount: paymentData.loanAmountThree || 0,
      interestRate: paymentData.interestThree,
      monthlyPayment: paymentData.monthlyPaymentThree || 0,
      isAvailable: plan3Available
    });
  }

  const hasAnyPlans = availablePlansCount > 0;

  return {
    paymentData,
    paymentPlans: paymentPlans.filter(plan => plan.isAvailable),
    loading,
    error,
    availablePlansCount,
    hasAnyPlans
  };
}