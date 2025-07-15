// app/src/app/dashboard/landivo/page.tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building, Zap, Users, Mail } from 'lucide-react';
import Link from 'next/link';

export default function LandivoPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Landivo Integration</h1>
        <p className="text-muted-foreground">
          Manage your property marketing campaigns and buyer targeting
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Properties
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              View and manage your property listings for email campaigns
            </p>
            <Button variant="outline" className="w-full">
              View Properties
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Buyers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Manage your buyer database and segments
            </p>
            <Button variant="outline" className="w-full">
              View Buyers
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Quick Campaign
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Create campaigns for specific properties
            </p>
            <Button className="w-full">
              Create Campaign
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Properties - You can add this section */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Properties</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            Connect to Landivo to see your properties here
          </p>
        </CardContent>
      </Card>
    </div>
  );
}