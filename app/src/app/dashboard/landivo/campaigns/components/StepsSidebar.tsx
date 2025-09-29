// app/src/app/dashboard/landivo/campaigns/components/StepsSidebar.tsx
// Shared sidebar component for both single and multi-property campaigns

import { StepDefinition } from '../lib/stepConfig';

interface Props {
  steps: StepDefinition[];
  currentStep: number;
  onStepClick?: (step: number) => void;
  title?: string;
}

export function StepsSidebar({ 
  steps, 
  currentStep, 
  onStepClick,
  title = 'Campaign Setup'
}: Props) {
  return (
    <div className="lg:col-span-1">
      <div className="bg-white rounded-lg border p-6 sticky top-8">
        <h3 className="text-lg font-semibold mb-6">{title}</h3>
        <div className="space-y-4">
          {steps.map((step, index) => {
            const stepNumber = index + 1;
            const Icon = step.icon;
            const isActive = currentStep === stepNumber;
            const isCompleted = currentStep > stepNumber;
            const isClickable = onStepClick && (isCompleted || isActive);

            return (
              <div 
                key={step.id} 
                className={`flex items-start space-x-3 ${
                  isClickable ? 'cursor-pointer hover:bg-gray-50 rounded-lg p-2 -m-2' : ''
                }`}
                onClick={isClickable ? () => onStepClick(stepNumber) : undefined}
              >
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  isCompleted ? 'bg-green-100 text-green-600' :
                  isActive ? 'bg-blue-100 text-blue-600' :
                  'bg-gray-100 text-gray-400'
                }`}>
                  {isCompleted ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <Icon className="w-4 h-4" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${
                    isActive ? 'text-blue-600' : 
                    isCompleted ? 'text-gray-900' : 
                    'text-gray-500'
                  }`}>
                    {step.title}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}