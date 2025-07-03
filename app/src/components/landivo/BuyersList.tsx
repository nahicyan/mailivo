import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LandivoBuyer } from '@/types/landivo';
import { Users, Mail, Phone } from 'lucide-react';

interface Props {
  buyers: LandivoBuyer[];
  isLoading: boolean;
}

export function BuyersList({ buyers, isLoading }: Props) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Potential Buyers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">Loading buyers...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Potential Buyers ({buyers.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {buyers.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            No potential buyers found for this property.
          </div>
        ) : (
          <div className="space-y-3">
            {buyers.slice(0, 5).map((buyer) => (
              <div key={buyer._id} className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <div className="font-medium">{buyer.name}</div>
                  <div className="text-sm text-muted-foreground flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {buyer.email}
                    </span>
                    <span className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {buyer.phone}
                    </span>
                  </div>
                </div>
                <Badge variant={buyer.isQualified ? 'default' : 'secondary'}>
                  {buyer.isQualified ? 'Qualified' : 'Unqualified'}
                </Badge>
              </div>
            ))}
            {buyers.length > 5 && (
              <div className="text-center text-sm text-muted-foreground">
                +{buyers.length - 5} more buyers
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}