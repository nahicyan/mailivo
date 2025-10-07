// app/src/components/templates/TemplateTypeDialog.tsx
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
import { Building, Building2 } from 'lucide-react';

interface TemplateTypeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TemplateTypeDialog({ open, onOpenChange }: TemplateTypeDialogProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<'single' | 'multi' | null>(null);

  const handleContinue = () => {
    if (selected) {
      router.push(`/dashboard/landivo/campaigns/templates/create?type=${selected}`);
      onOpenChange(false);
      setSelected(null); // Reset for next time
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
    setSelected(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create Email Template</DialogTitle>
          <DialogDescription>
            Choose the template type based on how many properties you want to feature in your emails.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 py-4">
          {/* Single Property Option */}
          <Card
            className={`cursor-pointer transition-all ${
              selected === 'single'
                ? 'border-blue-500 ring-2 ring-blue-200 bg-blue-50'
                : 'hover:border-blue-300 hover:bg-blue-50/50'
            }`}
            onClick={() => setSelected('single')}
          >
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className={`p-4 rounded-full ${
                  selected === 'single' ? 'bg-blue-500' : 'bg-gray-100'
                }`}>
                  <Building className={`h-8 w-8 ${
                    selected === 'single' ? 'text-white' : 'text-gray-600'
                  }`} />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Single Property</h3>
                  <p className="text-sm text-muted-foreground">
                    Feature one property per email with detailed information, images, and payment calculations.
                  </p>
                </div>
                <div className="text-xs text-muted-foreground pt-2 border-t w-full">
                  Best for: Property listings, open houses, featured properties
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Multi Property Option */}
          <Card
            className={`cursor-pointer transition-all ${
              selected === 'multi'
                ? 'border-green-500 ring-2 ring-green-200 bg-green-50'
                : 'hover:border-green-300 hover:bg-green-50/50'
            }`}
            onClick={() => setSelected('multi')}
          >
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className={`p-4 rounded-full ${
                  selected === 'multi' ? 'bg-green-500' : 'bg-gray-100'
                }`}>
                  <Building2 className={`h-8 w-8 ${
                    selected === 'multi' ? 'text-white' : 'text-gray-600'
                  }`} />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Multi Property</h3>
                  <p className="text-sm text-muted-foreground">
                    Showcase multiple properties in a single email with property rows and grid layouts.
                  </p>
                </div>
                <div className="text-xs text-muted-foreground pt-2 border-t w-full">
                  Best for: Newsletters, property digests, portfolio showcases
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleContinue} disabled={!selected}>
            Continue
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}