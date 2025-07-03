import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LandivoProperty } from '@/types/landivo';
import { MapPin, Bed, Bath, Square } from 'lucide-react';

interface Props {
  property: LandivoProperty;
}

export function PropertyDetails({ property }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Property Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {property.images.length > 0 && (
          <div className="aspect-video rounded-lg overflow-hidden">
            <img 
              src={property.images[0]} 
              alt={property.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        
        <div>
          <h3 className="font-semibold">{property.title}</h3>
          <div className="flex items-center gap-1 text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span className="text-sm">{property.location.address}</span>
          </div>
        </div>

        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-1">
            <Bed className="h-4 w-4" />
            <span>{property.features.bedrooms} beds</span>
          </div>
          <div className="flex items-center gap-1">
            <Bath className="h-4 w-4" />
            <span>{property.features.bathrooms} baths</span>
          </div>
          <div className="flex items-center gap-1">
            <Square className="h-4 w-4" />
            <span>{property.features.sqft.toLocaleString()} sqft</span>
          </div>
        </div>

        <p className="text-sm text-muted-foreground">{property.description}</p>
      </CardContent>
    </Card>
  );
}