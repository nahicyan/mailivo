import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LandivoProperty, LandivoBuyer } from '@/types/landivo';
import { Mail, Users, Eye, Send } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface Props {
  property: LandivoProperty;
  buyers: LandivoBuyer[];
}

export function CampaignPreview({ property, buyers }: Props) {
  const qualifiedBuyers = buyers.filter(buyer => buyer.isQualified);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-5 w-5" />
          Campaign Preview
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Email Subject Preview */}
        <div>
          <label className="text-sm font-medium">Subject Line</label>
          <div className="mt-1 p-3 bg-muted rounded-md text-sm">
            🏠 New Listing: {property.title} - {formatCurrency(property.price)}
          </div>
        </div>

        {/* Email Content Preview */}
        <div>
          <label className="text-sm font-medium">Email Preview</label>
          <div className="mt-1 p-4 bg-muted rounded-md text-sm space-y-3">
            <div className="font-semibold">New Property Alert!</div>
            
            <div className="space-y-2">
              <div className="font-medium">{property.title}</div>
              <div className="text-muted-foreground">{property.location.address}</div>
              <div className="font-semibold text-lg">{formatCurrency(property.price)}</div>
            </div>

            <div className="flex gap-4 text-xs">
              <span>{property.features.bedrooms} beds</span>
              <span>{property.features.bathrooms} baths</span>
              <span>{property.features.sqft.toLocaleString()} sqft</span>
            </div>

            {property.images.length > 0 && (
              <div className="aspect-video bg-gray-200 rounded flex items-center justify-center text-xs text-muted-foreground">
                Property Image
              </div>
            )}

            <div className="text-xs text-muted-foreground">
              {property.description.substring(0, 150)}...
            </div>

            <Button size="sm" className="w-full">
              View Full Details
            </Button>
          </div>
        </div>

        {/* Campaign Settings */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Recipients</span>
            <Badge variant="outline">
              <Users className="h-3 w-3 mr-1" />
              {qualifiedBuyers.length} qualified buyers
            </Badge>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Send Time</span>
            <span className="text-sm text-muted-foreground">Immediately</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Template</span>
            <span className="text-sm text-muted-foreground">Property Alert</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4">
          <Button variant="outline" size="sm" className="flex-1">
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button size="sm" className="flex-1">
            <Send className="h-4 w-4 mr-2" />
            Send Campaign
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}