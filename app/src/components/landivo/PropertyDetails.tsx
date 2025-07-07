import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LandivoProperty } from '@/types/landivo';
import { MapPin, Square, Zap } from 'lucide-react';

interface Props {
  property: LandivoProperty;
}

const serverURL = process.env.NEXT_PUBLIC_SERVER_URL;

export function PropertyDetails({ property }: Props) {
  // Parse images safely like landivo does
  const getPropertyImage = () => {
    if (!property.imageUrls) return null;
    
    let images = [];
    try {
      images = Array.isArray(property.imageUrls)
        ? property.imageUrls
        : JSON.parse(property.imageUrls);
    } catch (error) {
      console.error("Error parsing imageUrls:", error);
      return null;
    }
    
    if (!images.length) return null;
    return `${serverURL}/${images[0]}`;
  };

  const propertyImage = getPropertyImage();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Land Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {propertyImage && (
          <div className="aspect-video rounded-lg overflow-hidden">
            <img 
              src={propertyImage}
              alt={property.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        
        <div>
          <div className="font-semibold" dangerouslySetInnerHTML={{ __html: property.title }} />
          <div className="flex items-center gap-1 text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span className="text-sm">{property.streetAddress}</span>
          </div>
        </div>

        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-1">
            <Square className="h-4 w-4" />
            <span>{property.acre} acres</span>
          </div>
          {property.sqft && (
            <div className="flex items-center gap-1">
              <Square className="h-4 w-4" />
              <span>{property.sqft.toLocaleString()} sqft</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <Zap className="h-4 w-4" />
            <span>{property.zoning}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm">
          <div><span className="font-medium">Land Type:</span> {property.landType?.join(', ')}</div>
          <div><span className="font-medium">Water:</span> {property.water || 'N/A'}</div>
          <div><span className="font-medium">Sewer:</span> {property.sewer || 'N/A'}</div>
          <div><span className="font-medium">Electric:</span> {property.electric || 'N/A'}</div>
        </div>

        <div 
          className="text-sm text-muted-foreground" 
          dangerouslySetInnerHTML={{ __html: property.description }} 
        />
      </CardContent>
    </Card>
  );
}