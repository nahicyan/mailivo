// app/src/emails/components/PaymentCalculator.tsx
import { Section, Heading, Button } from '@react-email/components';

interface PaymentPlan {
  monthly: number;
  loan: number;
  down: number;
  interest: number;
}

interface PaymentCalculatorProps {
  plan: PaymentPlan;
  propertyTax?: number;
  serviceFee?: number;
  backgroundColor?: string;
  buttonColor?: string;
  multipleePlans?: boolean;
  propertyId?: string;
}

export function PaymentCalculator({ 
  plan, 
  propertyTax = 0, 
  serviceFee = 35,
  backgroundColor = 'white',
  buttonColor = '#16a34a',
  multipleePlans = false,
  propertyId
}: PaymentCalculatorProps) {
  return (
    <Section className="px-6 py-6" style={{ backgroundColor }}>
      <Heading className="text-gray-900 text-lg font-semibold mb-6">
        Payment Calculator
      </Heading>
      
      {/* Payment Circle */}
      <div className="text-center mb-6">
        <div className="w-48 h-48 rounded-full border-4 inline-flex items-center justify-center bg-white mx-auto"
             style={{ borderColor: buttonColor }}>
          <div className="text-center">
            <div className="text-3xl font-bold" style={{ color: buttonColor }}>
              ${plan.monthly?.toLocaleString()}
            </div>
            <div className="text-lg font-medium" style={{ color: buttonColor }}>/mo</div>
          </div>
        </div>
      </div>

      {/* Payment Details Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="flex justify-between py-2">
          <span className="text-gray-600">Monthly Payment</span>
          <span className="text-gray-900 font-semibold">${plan.monthly?.toLocaleString()}/mo</span>
        </div>
        
        <div className="flex justify-between py-2">
          <span className="text-gray-600">Loan Amount</span>
          <span className="text-gray-900 font-semibold">${plan.loan?.toLocaleString()}</span>
        </div>
        
        <div className="flex justify-between py-2">
          <span className="text-gray-600">Down Payment</span>
          <span className="text-gray-900 font-semibold">${plan.down?.toLocaleString()}</span>
        </div>
        
        <div className="flex justify-between py-2">
          <span className="text-gray-600">Property Tax</span>
          <span className="text-gray-900 font-semibold">${Math.round(propertyTax / 12)}/mo</span>
        </div>
        
        <div className="flex justify-between py-2">
          <span className="text-gray-600">Interest Rate</span>
          <span className="text-gray-900 font-semibold">{plan.interest}% APR</span>
        </div>
        
        <div className="flex justify-between py-2">
          <span className="text-gray-600">Service Fee</span>
          <span className="text-gray-900 font-semibold">${serviceFee}/mo</span>
        </div>
      </div>

      {/* Benefits */}
      <div className="mb-6 space-y-2">
        <div className="flex items-center gap-2 text-sm" style={{ color: buttonColor }}>
          <span>✓</span>
          <span>Takes About 2 Minutes</span>
        </div>
        <div className="flex items-center gap-2 text-sm" style={{ color: buttonColor }}>
          <span>✓</span>
          <span>Won't affect your credit score</span>
        </div>
      </div>

      {/* Get Pre-Qualified Button */}
      <Button 
        href="https://landivo.com/pre-qualify" 
        className="w-full text-white py-3 px-6 rounded-lg text-base font-semibold hover:opacity-90 transition-opacity no-underline text-center"
        style={{ backgroundColor: buttonColor }}
      >
        Get Pre-Qualified
      </Button>

      {/* Multiple Plans Button */}
      {multipleePlans && propertyId && (
        <div className="text-center mt-4">
          <Button
            href={`https://landivo.com/properties/${propertyId}`}
            className="bg-white px-6 py-2 rounded-md text-sm font-medium border hover:bg-gray-50 transition-colors no-underline"
            style={{ 
              color: buttonColor, 
              borderColor: buttonColor 
            }}
          >
            View More Payment Plans
          </Button>
        </div>
      )}
    </Section>
  );
}