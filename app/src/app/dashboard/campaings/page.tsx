// app/src/app/dashboard/campaigns/page.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCampaigns } from '@/hooks/useCampaigns';
import { Plus, Mail, Users, TrendingUp } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function CampaignsPage() {
  const [filters, setFilters] = useState({ status: '', page: 1 });
  const { data: campaignsData, isLoading } = useCampaigns(filters);

  if (isLoading) {
    return <div>Loading campaigns...</div>;
  }

  const campaigns = campaignsData?.campaigns || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Campaigns</h1>
          <p className="text-muted-foreground">
            Manage your email marketing campaigns
          </p>
        </div>
        <Link href="/dashboard/campaigns/create">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Campaign
          </Button>
        </Link>
      </div>

      <div className="grid gap-4">
        {campaigns.map((campaign: any) => (
          <Card key={campaign._id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{campaign.name}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {campaign.subject}
                  </p>
                </div>
                <Badge variant={
                  campaign.status === 'sent' ? 'default' :
                  campaign.status === 'draft' ? 'secondary' :
                  campaign.status === 'sending' ? 'destructive' : 'outline'
                }>
                  {campaign.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {campaign.metrics.sent || 0} sent
                </div>
                <div className="flex items-center gap-1">
                  <Mail className="h-4 w-4" />
                  {campaign.metrics.opened || 0} opened
                </div>
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-4 w-4" />
                  {campaign.metrics.clicked || 0} clicked
                </div>
                <div className="ml-auto">
                  {formatDistanceToNow(new Date(campaign.created_at), { addSuffix: true })}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {campaigns.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <Mail className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No campaigns yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first email campaign to get started
              </p>
              <Link href="/dashboard/campaigns/create">
                <Button>Create Campaign</Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}