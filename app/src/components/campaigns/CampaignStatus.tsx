'use client';

import React, { useEffect, useState } from 'react';
import { 
  List, 
  Send, 
  Mail, 
  MailOpen, 
  MousePointer, 
  MailX,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';

// Types
interface CampaignStats {
  queued: number;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  total?: number;
}

interface EmailTracking {
  _id: string;
  campaignId: string;
  contactId: string;
  status: string;
  sentAt?: Date | string;
  deliveredAt?: Date | string;
  openedAt?: Date | string;
  clickedAt?: Date | string;
  bouncedAt?: Date | string;
  [key: string]: any;
}

interface StatusNode {
  id: string;
  label: string;
  count: number | string;
  icon: React.ComponentType<{ className?: string }>;
  isActive: boolean;
  color: string;
  bgColor: string;
}

interface CampaignStatusProps {
  campaignId?: string;
  stats?: CampaignStats;
  trackingData?: EmailTracking[];
  loading?: boolean;
  className?: string;
  showPercentages?: boolean;
}

// Helper function to calculate stats from tracking data
const calculateStatsFromTracking = (trackingData: EmailTracking[]): CampaignStats => {
  const stats: CampaignStats = {
    queued: 0,
    sent: 0,
    delivered: 0,
    opened: 0,
    clicked: 0,
    bounced: 0,
    total: trackingData.length
  };

  trackingData.forEach((tracking) => {
    // Count by status
    if (tracking.status === 'queued') stats.queued++;
    if (tracking.status === 'bounced') stats.bounced++;
    
    // Count by timestamps (more accurate)
    if (tracking.sentAt) stats.sent++;
    if (tracking.deliveredAt) stats.delivered++;
    if (tracking.openedAt || tracking.clickedAt) stats.opened++; // clicked implies opened
    if (tracking.clickedAt) stats.clicked++;
  });

  return stats;
};

// Format number with commas
const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('en-US').format(num);
};

const CampaignStatus: React.FC<CampaignStatusProps> = ({
  campaignId,
  stats: propStats,
  trackingData,
  loading = false,
  className,
  showPercentages = false
}) => {
  const [stats, setStats] = useState<CampaignStats>(propStats || {
    queued: 0,
    sent: 0,
    delivered: 0,
    opened: 0,
    clicked: 0,
    bounced: 0
  });
  const [isLoading, setIsLoading] = useState(loading);

  // Fetch stats from API if campaignId is provided
  useEffect(() => {
    if (campaignId && !propStats && !trackingData) {
      fetchCampaignStats(campaignId);
    } else if (trackingData && !propStats) {
      const calculatedStats = calculateStatsFromTracking(trackingData);
      setStats(calculatedStats);
    }
  }, [campaignId, propStats, trackingData]);

  const fetchCampaignStats = async (id: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/campaigns/${id}/stats`);
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching campaign stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Update stats when props change
  useEffect(() => {
    if (propStats) {
      setStats(propStats);
    }
  }, [propStats]);

  // Define the main flow nodes
  const mainFlowNodes: StatusNode[] = [
    {
      id: 'queued',
      label: 'Queued',
      count: formatNumber(stats.queued),
      icon: List,
      isActive: stats.queued > 0,
      color: 'text-gray-700',
      bgColor: 'bg-gray-900'
    },
    {
      id: 'sent',
      label: 'Sent',
      count: formatNumber(stats.sent),
      icon: Send,
      isActive: stats.sent > 0,
      color: 'text-gray-700',
      bgColor: 'bg-gray-900'
    },
    {
      id: 'delivered',
      label: 'Delivered',
      count: formatNumber(stats.delivered),
      icon: Mail,
      isActive: stats.delivered > 0,
      color: 'text-gray-700',
      bgColor: 'bg-gray-900'
    },
    {
      id: 'opened',
      label: 'Opened',
      count: formatNumber(stats.opened),
      icon: MailOpen,
      isActive: stats.opened > 0,
      color: 'text-gray-700',
      bgColor: 'bg-gray-900'
    },
    {
      id: 'clicked',
      label: 'Clicked',
      count: stats.clicked > 0 ? formatNumber(stats.clicked) : 'No',
      icon: MousePointer,
      isActive: stats.clicked > 0,
      color: stats.clicked > 0 ? 'text-gray-700' : 'text-gray-400',
      bgColor: stats.clicked > 0 ? 'bg-gray-900' : 'bg-gray-300'
    }
  ];

  // Calculate percentages if needed
  const getPercentage = (value: number, total: number): string => {
    if (total === 0) return '0%';
    return `${((value / total) * 100).toFixed(1)}%`;
  };

  if (isLoading) {
    return (
      <Card className={cn("p-8", className)}>
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-500">Loading campaign statistics...</span>
        </div>
      </Card>
    );
  }

  return (
    <Card className={cn("p-8 bg-white", className)}>
      <div className="space-y-8">
        {/* Main Flow */}
        <div className="relative">
          <div className="flex items-center justify-between">
            {mainFlowNodes.map((node, index) => {
              const Icon = node.icon;
              const isLast = index === mainFlowNodes.length - 1;
              
              return (
                <React.Fragment key={node.id}>
                  {/* Node */}
                  <div className="flex flex-col items-center z-10">
                    <div className={cn(
                      "w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200",
                      node.bgColor,
                      node.isActive ? 'shadow-lg' : 'opacity-60'
                    )}>
                      <Icon className={cn("w-6 h-6 text-white", node.id === 'clicked' && !node.isActive && 'text-gray-500')} />
                    </div>
                    <div className="mt-3 text-center">
                      <div className={cn(
                        "text-2xl font-bold",
                        node.color
                      )}>
                        {node.count}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {node.label}
                        {showPercentages && stats.total && node.id !== 'clicked' && (
                          <span className="text-xs text-gray-400 block">
                            ({getPercentage(
                              stats[node.id as keyof CampaignStats] as number, 
                              stats.total
                            )})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Connector Line */}
                  {!isLast && (
                    <div className="flex-1 h-px bg-gray-300 -mt-7 mx-2" />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Bounced Status (Below with branch) */}
        {stats.bounced > 0 && (
          <div className="relative">
            {/* Branch Line from Delivered */}
            <div className="absolute left-1/2 -top-8 w-px h-8 bg-gray-300" 
                 style={{ left: 'calc(50% - 110px)' }} />
            
            <div className="flex justify-center" style={{ marginLeft: '-110px' }}>
              <div className="flex flex-col items-center">
                <div className="w-14 h-14 rounded-full bg-gray-900 flex items-center justify-center shadow-lg">
                  <MailX className="w-6 h-6 text-white" />
                </div>
                <div className="mt-3 text-center">
                  <div className="text-2xl font-bold text-gray-700">
                    {formatNumber(stats.bounced)}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    Bounced
                    {showPercentages && stats.sent > 0 && (
                      <span className="text-xs text-gray-400 block">
                        ({getPercentage(stats.bounced, stats.sent)})
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Summary Stats */}
        {showPercentages && stats.sent > 0 && (
          <div className="pt-6 border-t border-gray-200">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Delivery Rate:</span>
                <span className="ml-2 font-semibold text-green-600">
                  {getPercentage(stats.delivered, stats.sent)}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Open Rate:</span>
                <span className="ml-2 font-semibold text-blue-600">
                  {getPercentage(stats.opened, stats.delivered)}
                </span>
              </div>
              <div>
                <span className="text-gray-500">CTR:</span>
                <span className="ml-2 font-semibold text-purple-600">
                  {getPercentage(stats.clicked, stats.opened)}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Bounce Rate:</span>
                <span className="ml-2 font-semibold text-red-600">
                  {getPercentage(stats.bounced, stats.sent)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default CampaignStatus;