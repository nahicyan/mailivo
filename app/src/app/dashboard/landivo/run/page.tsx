'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PropertyActionMenu } from '@/components/landivo/PropertyActionMenu';
import { useLandivoProperties } from '@/hooks/useLandivoProperties';
import { Building, ArrowLeft, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import Link from 'next/link';

export default function LandivoPropertiesListPage() {
  const { data: properties, isLoading, error } = useLandivoProperties();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredProperties = properties?.filter(property => 
    property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    property.streetAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
    property.city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading properties...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Link href="/dashboard/landivo" className="hover:text-foreground">
              Landivo
            </Link>
            <span>/</span>
            <span>Create Campaign</span>
          </div>
          <h1 className="text-3xl font-bold">Select Property for Campaign</h1>
          <p className="text-muted-foreground">
            Choose a property to create a targeted email campaign
          </p>
        </div>
        <Link href="/dashboard/landivo">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Landivo
          </Button>
        </Link>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search properties..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Properties Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredProperties?.map((property) => (
          <PropertyCard key={property.id} property={property} />
        ))}
      </div>

      {filteredProperties?.length === 0 && (
        <div className="text-center py-12">
          <Building className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-2 text-sm font-semibold">No properties found</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {searchTerm ? 'Try adjusting your search terms.' : 'No properties available.'}
          </p>
        </div>
      )}
    </div>
  );
}

function PropertyCard({ property }: { property: any }) {
  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);

  return (
    <Card className="group hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg line-clamp-2">
              {property.title || property.streetAddress}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {property.streetAddress}
            </p>
            <p className="text-sm text-muted-foreground">
              {property.city}, {property.state}
            </p>
          </div>
          <PropertyActionMenu property={property} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold">
              {formatCurrency(property.askingPrice)}
            </span>
            <Badge variant={property.status === 'Available' ? 'default' : 'secondary'}>
              {property.status}
            </Badge>
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-muted-foreground">Acres:</span>
              <span className="ml-1 font-medium">{property.acre}</span>
            </div>
            {property.sqft && (
              <div>
                <span className="text-muted-foreground">Sqft:</span>
                <span className="ml-1 font-medium">{property.sqft.toLocaleString()}</span>
              </div>
            )}
          </div>

          <div className="pt-2 border-t">
            <Link href={`/dashboard/landivo/run/${property.id}`}>
              <Button className="w-full" size="sm">
                Create Campaign
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}