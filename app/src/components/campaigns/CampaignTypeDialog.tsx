// components/campaigns/CampaignTypeDialog.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Building2, 
  Building, 
  ArrowRight,
  Home
} from 'lucide-react';

interface CampaignTypeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CampaignTypeDialog({ open, onOpenChange }: CampaignTypeDialogProps) {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState<'single' | 'multiple' | null>(null);

  const handleContinue = () => {
    if (!selectedType) return;
    
    const path = selectedType === 'single' 
      ? '/dashboard/landivo/campaigns/create'
      : '/dashboard/landivo/campaigns/create-multi';
      
    router.push(path);
    onOpenChange(false);
    setSelectedType(null);
  };

  const handleCancel = () => {
    onOpenChange(false);
    setSelectedType(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Choose Campaign Type
          </DialogTitle>
          <DialogDescription>
            Select the type of property campaign you'd like to create
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          {/* Single Property Option */}
          <Card 
            className={`cursor-pointer transition-all hover:shadow-md ${
              selectedType === 'single' 
                ? 'ring-2 ring-primary border-primary bg-primary/5' 
                : 'hover:border-primary/50'
            }`}
            onClick={() => setSelectedType('single')}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    selectedType === 'single' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted'
                  }`}>
                    <Home className="h-5 w-5" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm">Single Property</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Create a campaign for one specific property listing
                  </p>
                  <div className="text-xs text-muted-foreground mt-2">
                    Perfect for individual property promotions and targeted outreach
                  </div>
                </div>
                {selectedType === 'single' && (
                  <ArrowRight className="h-4 w-4 text-primary flex-shrink-0 mt-1" />
                )}
              </div>
            </CardContent>
          </Card>

          {/* Multiple Property Option */}
          <Card 
            className={`cursor-pointer transition-all hover:shadow-md ${
              selectedType === 'multiple' 
                ? 'ring-2 ring-primary border-primary bg-primary/5' 
                : 'hover:border-primary/50'
            }`}
            onClick={() => setSelectedType('multiple')}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    selectedType === 'multiple' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted'
                  }`}>
                    <Building className="h-5 w-5" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm">Multiple Properties</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Create a campaign featuring multiple property listings
                  </p>
                  <div className="text-xs text-muted-foreground mt-2">
                    Ideal for market updates, portfolio showcases, and bulk promotions
                  </div>
                </div>
                {selectedType === 'multiple' && (
                  <ArrowRight className="h-4 w-4 text-primary flex-shrink-0 mt-1" />
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button 
            onClick={handleContinue}
            disabled={!selectedType}
          >
            Continue
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}