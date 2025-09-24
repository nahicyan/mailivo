// app/src/types/analytics.ts
export interface CampaignAnalytics {
  campaign: Campaign;
  clickedContacts: ContactClick[];
  linkPerformance: LinkPerformance[];
  timelineData: TimelineData[];
  deviceData: DeviceData[];
  locationData: LocationData[];
}

export interface Campaign {
  _id: string;
  name: string;
  subject: string;
  status: string;
  createdAt: string;
  sentAt?: string;
  metrics: {
    sent: number;
    delivered: number;
    open: number;
    clicks: number;
    totalClicks: number;
    bounces: number;
    uniqueClickers: number;
    mobileOpen?: number;
    avgClicksPerLink?: number;
    clickThroughRate?: number;
    topLink?: string;
  };
}

export interface ContactClick {
  contactId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  totalClicks: number;
  uniqueLinks: number;
  firstClick: string;
  lastClick: string;
  devices: string[];
  locations: string[];
  engagementScore: number;
}

export interface ClickDetail {
  linkId: string;
  linkText: string;
  originalUrl: string;
  clickedAt: string;
  ipAddress: string;
  userAgent: string;
  referer: string;
  device: string;
  location?: string;
}

export interface LinkPerformance {
  linkId: string;
  linkText: string;
  originalUrl: string;
  clickCount: number;
  uniqueClickers: number;
  clickRate: number;
  avgTimeToClick: number;
}

export interface TimelineData {
  hour: string;
  clicks: number;
  opens: number;
}

export interface DeviceData {
  device: string;
  clicks: number;
  percentage: number;
}

export interface LocationData {
  location: string;
  clicks: number;
  percentage: number;
}

// app/src/components/analytics/AnalyticsCard.tsx
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface AnalyticsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  iconColor: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export function AnalyticsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor,
  trend,
}: AnalyticsCardProps) {
  const formatNumber = (num: string | number): string => {
    const n = typeof num === 'string' ? parseFloat(num) : num;
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
    return n.toString();
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className={`text-2xl font-bold ${iconColor.replace('h-8 w-8', 'text-lg')}`}>
              {formatNumber(value)}
            </p>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
            {trend && (
              <div className={`flex items-center text-xs ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                <span>{trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%</span>
              </div>
            )}
          </div>
          <Icon className={`h-8 w-8 ${iconColor}`} />
        </div>
      </CardContent>
    </Card>
  );
}

