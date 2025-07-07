import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LandivoProperty, LandivoBuyer } from '@/types/landivo';
import { formatCurrency } from '@/lib/utils';
import { Mail, MapPin, Square, Zap, Users } from 'lucide-react';

interface Props {
  property: LandivoProperty;
  buyers: LandivoBuyer[];
}

export function CampaignPreview({ property, buyers }: Props) {
  const qualifiedBuyers = buyers.filter(buyer => buyer.qualified);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Campaign Preview
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Email Preview */}
        <div className="border rounded-lg p-4 bg-gray-50">
          <div className="text-sm text-gray-600 mb-2">Subject: New Land Available - {property.city}, {property.state}</div>
          
          <div className="bg-white border rounded p-4 text-sm">
            <h3 className="font-bold text-lg mb-2">{property.title}</h3>
            
            {property.imageUrls && property.imageUrls[0] && (
              <img 
                src={property.imageUrls[0]} 
                alt="Property" 
                className="w-full h-32 object-cover rounded mb-3"
              />
            )}
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>{property.streetAddress}, {property.city}, {property.state}</span>
              </div>
              
              <div className="flex gap-4">
                <div className="flex items-center gap-1">
                  <Square className="h-4 w-4" />
                  <span>{property.acre} acres</span>
                </div>
                <div className="flex items-center gap-1">
                  <Zap className="h-4 w-4" />
                  <span>{property.zoning}</span>
                </div>
              </div>
              
              <div className="text-lg font-bold text-green-600">
                {formatCurrency(property.askingPrice)}
              </div>
              
              {property.financing && (
                <div className="bg-blue-50 p-2 rounded">
                  <strong>Financing Available:</strong> {property.financing}
                  {property.monthlyPaymentOne && (
                    <div>From {formatCurrency(property.monthlyPaymentOne)}/month</div>
                  )}
                </div>
              )}
              
              <p className="text-gray-600">{property.description.substring(0, 150)}...</p>
              
              <Button className="w-full mt-3">View Full Details</Button>
            </div>
          </div>
        </div>

        {/* Campaign Stats */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="font-medium">Total Recipients</div>
            <div className="text-2xl font-bold">{buyers.length}</div>
          </div>
          <div>
            <div className="font-medium">Qualified Buyers</div>
            <div className="text-2xl font-bold text-green-600">{qualifiedBuyers.length}</div>
          </div>
        </div>

        {/* Financing Options Preview */}
        {property.financing && (
          <div className="space-y-2">
            <div className="font-medium">Financing Options</div>
            <div className="space-y-1 text-sm">
              {property.monthlyPaymentOne && (
                <div className="flex justify-between">
                  <span>Option 1:</span>
                  <span>{formatCurrency(property.monthlyPaymentOne)}/month</span>
                </div>
              )}
              {property.monthlyPaymentTwo && (
                <div className="flex justify-between">
                  <span>Option 2:</span>
                  <span>{formatCurrency(property.monthlyPaymentTwo)}/month</span>
                </div>
              )}
              {property.monthlyPaymentThree && (
                <div className="flex justify-between">
                  <span>Option 3:</span>
                  <span>{formatCurrency(property.monthlyPaymentThree)}/month</span>
                </div>
              )}
            </div>
          </div>
        )}

        <Button className="w-full">
          Send Campaign to {buyers.length} Buyers
        </Button>
      </CardContent>
    </Card>
  );
}