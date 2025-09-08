// app/src/app/dashboard/landivo/campaigns/create-multi/components/StepsSidebar.tsx
import { Building, FileText, Users, Clock, Camera, Mail, User, CreditCard } from 'lucide-react';

interface Props {
    currentStep: number;
    onStepClick?: (step: number) => void;
    isMultiProperty?: boolean;
    showAgentProfileStep?: boolean; // New prop to conditionally show agent step
}

export function StepsSidebar({ currentStep, onStepClick, isMultiProperty = false, showAgentProfileStep = false }: Props) {
    // Base steps that are always present
    const baseSteps = [
        { number: 1, title: 'Property', icon: Building, description: isMultiProperty ? 'Select properties' : 'Select target property' },
        { number: 2, title: 'Basic Info', icon: FileText, description: 'Campaign name and description' },
        { number: 3, title: 'Audience', icon: Users, description: 'Choose email list and template' },
    ];

    // Conditional agent profile step
    const agentStep = showAgentProfileStep ? [
        { number: 4, title: 'Agent Profile', icon: User, description: 'Select agent contact info' }
    ] : [];

    // Remaining steps (numbers adjusted based on whether agent step is present)
    const offset = showAgentProfileStep ? 1 : 0;
    const remainingSteps = [
        { number: 4 + offset, title: 'Payment Options', icon: CreditCard, description: 'Select payment plan' },
        { number: 5 + offset, title: 'Pictures', icon: Camera, description: 'Select property images' },
        { number: 6 + offset, title: 'Subject', icon: Mail, description: 'Create email subject line' },
        { number: 7 + offset, title: 'Schedule', icon: Clock, description: 'Set timing and volume' }
    ];

    // Combine all steps
    const steps = [...baseSteps, ...agentStep, ...remainingSteps];

    return (
        <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border p-6 sticky top-8">
                <h3 className="text-lg font-semibold mb-6">
                    {isMultiProperty ? 'Multi-Property Campaign' : 'Campaign Setup'}
                </h3>
                <div className="space-y-4">
                    {steps.map((step) => {
                        const Icon = step.icon;
                        const isActive = currentStep === step.number;
                        const isCompleted = currentStep > step.number;
                        const isClickable = onStepClick && (isCompleted || isActive);

                        return (
                            <div 
                                key={step.number} 
                                className={`flex items-start space-x-3 ${
                                    isClickable ? 'cursor-pointer hover:bg-gray-50 rounded-lg p-2 -m-2' : ''
                                }`}
                                onClick={isClickable ? () => onStepClick(step.number) : undefined}
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
                                        isCompleted ? 'text-green-600' : 
                                        'text-gray-500'
                                    }`}>
                                        {step.title}
                                    </p>
                                    <p className="text-xs text-gray-400">
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