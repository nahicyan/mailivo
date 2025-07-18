'use client';

import { use } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLandivoProperty, useLandivoPropertyBuyers } from '@/hooks/useLandivoProperty';
import { PropertyDetails } from '@/components/landivo/PropertyDetails';
import { BuyersList } from '@/components/landivo/BuyersList';
import { CampaignPreview } from '@/components/campaigns/CampaignPreview';
import { Mail, Users, MapPin, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface Props {
  params: Promise<{ id: string }>;
}

const serverURL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:5000';

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(amount);
}

// Helper function to strip HTML tags for title display
function stripHtml(html: string): string {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '').trim();
}

export default function CampaignRunPage({ params }: Props) {
  const { id } = use(params);
  const { data: property, isLoading: propertyLoading, error } = useLandivoProperty(id);
  const { data: buyers, isLoading: buyersLoading } = useLandivoPropertyBuyers(id);

  if (propertyLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading property data...</p>
        </div>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="text-center py-12">
        <MapPin className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-2 text-sm font-semibold">Property not found</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Could not load property with ID: {id}
        </p>
        <Link href="/dashboard/campaigns">
          <Button className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Campaigns
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Link href="/dashboard/campaigns" className="hover:text-foreground">
              Campaigns
            </Link>
            <span>/</span>
            <span>Run Campaign</span>
          </div>
          <h1 className="text-3xl font-bold">Create Campaign for {property.streetAddress}</h1>
          <div className="text-muted-foreground" dangerouslySetInnerHTML={{ __html: property.title }} />
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline">
            <Users className="mr-2 h-4 w-4" />
            {buyers?.length || 0} Potential Buyers
          </Button>
          <Button>
            <Mail className="mr-2 h-4 w-4" />
            Create Campaign
          </Button>
        </div>
      </div>

      {/* Property Overview */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Asking Price</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(property.askingPrice)}</div>
            <Badge variant={property.status === 'Available' ? 'default' : 'secondary'}>
              {property.status}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Land Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 text-sm">
              <div>{property.acre} acres</div>
              {property.sqft && <div>{property.sqft.toLocaleString()} sqft</div>}
              <div className="text-muted-foreground">{property.streetAddress}</div>
              <div className="text-muted-foreground">{property.city}, {property.state}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Marketing Reach</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{buyers?.length || 0}</div>
            <p className="text-sm text-muted-foreground">potential buyers</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <PropertyDetails property={property} />
          <BuyersList buyers={buyers || []} isLoading={buyersLoading} />
        </div>
        
        <div>
          <CampaignPreview property={property} buyers={buyers || []} />
        </div>
      </div>
    </div>
  );
}