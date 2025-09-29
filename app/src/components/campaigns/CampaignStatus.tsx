// app/src/components/campaigns/CampaignStatus.tsx
import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Send,
  CheckCircle,
  AlertCircle,
  Clock,
  Mail,
  MousePointer,
  Eye,
} from "lucide-react";

interface CampaignMetrics {
  total: number;
  queued: number;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  failed: number;
  dropped: number;
  rejected: number;
  deferred: number;
  complaints: number;
  unsubscribed: number;
  deliveryRate: number;
  openRate: number;
  clickRate: number;
  bounceRate: number;
  complaintRate: number;
  unsubscribeRate: number;
}

interface CampaignStatusProps {
  campaignId?: string;
  showAllCampaigns?: boolean;
}

export function CampaignStatus({
  campaignId,
  showAllCampaigns = false,
}: CampaignStatusProps) {
  const [metrics, setMetrics] = useState<CampaignMetrics | null>(null);
  const [realtimeData, setRealtimeData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setLoading(true);
        setError(null);

        if (showAllCampaigns) {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/tracking/campaign/${campaignId}/metrics`,
            {
              credentials: "include",
            }
          );
          const data = await response.json();
          const aggregated: CampaignMetrics = {
            total: 0,
            queued: 0,
            sent: 0,
            delivered: 0,
            opened: 0,
            clicked: 0,
            bounced: 0,
            failed: 0,
            dropped: 0,
            rejected: 0,
            deferred: 0,
            complaints: 0,
            unsubscribed: 0,
            deliveryRate: 0,
            openRate: 0,
            clickRate: 0,
            bounceRate: 0,
            complaintRate: 0,
            unsubscribeRate: 0,
          };

          // Aggregate data from all campaigns
          if (response.data.campaigns) {
            for (const campaign of response.data.campaigns) {
              if (campaign.metrics) {
                aggregated.total += campaign.metrics.totalRecipients || 0;
                aggregated.sent += campaign.metrics.sent || 0;
                aggregated.delivered += campaign.metrics.delivered || 0;
                aggregated.opened += campaign.metrics.opened || 0;
                aggregated.clicked += campaign.metrics.clicked || 0;
                aggregated.bounced += campaign.metrics.bounced || 0;
                aggregated.failed += campaign.metrics.failed || 0;
                aggregated.complaints += campaign.metrics.complaints || 0;
                aggregated.unsubscribed += campaign.metrics.unsubscribed || 0;
              }
            }

            // Calculate rates
            if (aggregated.total > 0) {
              aggregated.deliveryRate =
                (aggregated.delivered / aggregated.total) * 100;
              aggregated.bounceRate =
                (aggregated.bounced / aggregated.total) * 100;
            }
            if (aggregated.delivered > 0) {
              aggregated.openRate =
                (aggregated.opened / aggregated.delivered) * 100;
              aggregated.clickRate =
                (aggregated.clicked / aggregated.delivered) * 100;
              aggregated.complaintRate =
                (aggregated.complaints / aggregated.delivered) * 100;
              aggregated.unsubscribeRate =
                (aggregated.unsubscribed / aggregated.delivered) * 100;
            }
          }

          setMetrics(aggregated);
        } else if (campaignId) {
          // Fetch metrics for specific campaign using new endpoint
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/tracking/campaign/${campaignId}/metrics`,
            {
              credentials: "include",
            }
          );
          const data = await response.json();
          setMetrics(response.data.metrics);
          setRealtimeData(response.data.realtime);
        }
      } catch (err: any) {
        console.error("Error fetching metrics:", err);
        setError(
          err.response?.data?.error || "Failed to load campaign metrics"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();

    // Poll for updates every 30 seconds if showing single campaign
    const interval =
      campaignId && !showAllCampaigns
        ? setInterval(fetchMetrics, 30000)
        : undefined;

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [campaignId, showAllCampaigns]);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="text-center text-muted-foreground">
            Loading metrics...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="text-center text-red-500">{error}</div>
        </CardContent>
      </Card>
    );
  }

  if (!metrics) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="text-center text-muted-foreground">
            No metrics available
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "bg-green-500";
      case "opened":
        return "bg-blue-500";
      case "clicked":
        return "bg-purple-500";
      case "bounced":
        return "bg-red-500";
      case "failed":
        return "bg-red-600";
      case "sent":
        return "bg-yellow-500";
      case "queued":
        return "bg-gray-400";
      default:
        return "bg-gray-300";
    }
  };

  const progressValue =
    metrics.total > 0
      ? ((metrics.delivered + metrics.bounced + metrics.failed) /
          metrics.total) *
        100
      : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          {showAllCampaigns ? "All Campaigns Status" : "Campaign Status"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progress</span>
            <span>{progressValue.toFixed(1)}%</span>
          </div>
          <Progress value={progressValue} className="h-2" />
        </div>

        {/* Status Badges */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-gray-500" />
            <div>
              <div className="text-xs text-muted-foreground">Queued</div>
              <div className="font-semibold">{metrics.queued}</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Send className="h-4 w-4 text-yellow-500" />
            <div>
              <div className="text-xs text-muted-foreground">Sent</div>
              <div className="font-semibold">{metrics.sent}</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <div>
              <div className="text-xs text-muted-foreground">Delivered</div>
              <div className="font-semibold">{metrics.delivered}</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <div>
              <div className="text-xs text-muted-foreground">Bounced</div>
              <div className="font-semibold">{metrics.bounced}</div>
            </div>
          </div>
        </div>

        {/* Engagement Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4 border-t">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-blue-500" />
            <div>
              <div className="text-xs text-muted-foreground">Opened</div>
              <div className="font-semibold">{metrics.opened}</div>
              <div className="text-xs text-muted-foreground">
                {metrics.openRate.toFixed(1)}%
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <MousePointer className="h-4 w-4 text-purple-500" />
            <div>
              <div className="text-xs text-muted-foreground">Clicked</div>
              <div className="font-semibold">{metrics.clicked}</div>
              <div className="text-xs text-muted-foreground">
                {metrics.clickRate.toFixed(1)}%
              </div>
            </div>
          </div>

          <div>
            <div className="text-xs text-muted-foreground">Unsubscribed</div>
            <div className="font-semibold">{metrics.unsubscribed}</div>
            <div className="text-xs text-muted-foreground">
              {metrics.unsubscribeRate.toFixed(1)}%
            </div>
          </div>

          <div>
            <div className="text-xs text-muted-foreground">Complaints</div>
            <div className="font-semibold">{metrics.complaints}</div>
            <div className="text-xs text-muted-foreground">
              {metrics.complaintRate.toFixed(1)}%
            </div>
          </div>
        </div>

        {/* Detailed Status */}
        <div className="space-y-2 pt-4 border-t">
          <div className="text-sm font-medium">Detailed Status</div>
          <div className="grid grid-cols-2 gap-2">
            <Badge variant="outline" className="justify-between">
              <span>Total Recipients</span>
              <span>{metrics.total}</span>
            </Badge>
            <Badge variant="outline" className="justify-between">
              <span>Delivery Rate</span>
              <span>{metrics.deliveryRate.toFixed(1)}%</span>
            </Badge>
            {metrics.deferred > 0 && (
              <Badge variant="outline" className="justify-between">
                <span>Deferred</span>
                <span>{metrics.deferred}</span>
              </Badge>
            )}
            {metrics.dropped > 0 && (
              <Badge variant="outline" className="justify-between">
                <span>Dropped</span>
                <span>{metrics.dropped}</span>
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
