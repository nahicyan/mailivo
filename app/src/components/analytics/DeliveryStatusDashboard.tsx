import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCcw, CheckCircle, XCircle, AlertCircle, Clock } from 'lucide-react';

const DeliveryStatusDashboard = ({ campaignId = '68d59db25a2ca7ee45b925cd' }) => {
  const [deliveryData, setDeliveryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState(null);

  const fetchDeliveryStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/delivery/campaign/${campaignId}`);
      const data = await response.json();
      setDeliveryData(data);
    } catch (error) {
      console.error('Failed to fetch delivery status:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSyncStatus = async () => {
    try {
      const response = await fetch('/api/mailcow/status');
      const data = await response.json();
      setSyncStatus(data);
    } catch (error) {
      console.error('Failed to fetch sync status:', error);
    }
  };

  const triggerSync = async () => {
    try {
      setSyncing(true);
      const response = await fetch('/api/mailcow/sync', { method: 'POST' });
      const result = await response.json();
      
      if (result.success) {
        alert(`Sync completed! Processed: ${result.processed}, Updated: ${result.updated}`);
        await fetchDeliveryStatus();
      } else {
        alert(`Sync failed: ${result.error}`);
      }
    } catch (error) {
      alert('Sync error: ' + error.message);
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    fetchDeliveryStatus();
    fetchSyncStatus();
    const interval = setInterval(fetchDeliveryStatus, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [campaignId]);

  const getStatusBadge = (status) => {
    const variants = {
      delivered: { color: 'bg-green-500', icon: CheckCircle },
      bounced: { color: 'bg-red-500', icon: XCircle },
      failed: { color: 'bg-red-600', icon: XCircle },
      sent: { color: 'bg-blue-500', icon: Clock },
      clicked: { color: 'bg-purple-500', icon: CheckCircle },
      opened: { color: 'bg-indigo-500', icon: CheckCircle },
      queued: { color: 'bg-gray-400', icon: Clock },
    };
    
    const variant = variants[status] || { color: 'bg-gray-400', icon: AlertCircle };
    const Icon = variant.icon;
    
    return (
      <Badge className={`${variant.color} text-white flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {status}
      </Badge>
    );
  };

  const getBounceTypeBadge = (type) => {
    if (!type) return null;
    const color = type === 'hard' ? 'bg-red-600' : 'bg-orange-500';
    return <Badge className={`${color} text-white ml-2`}>{type} bounce</Badge>;
  };

  if (loading) return <div className="p-4">Loading delivery status...</div>;
  if (!deliveryData) return <div className="p-4">No data available</div>;

  const { stats, records } = deliveryData;
  const deliveryRate = stats.total > 0 ? ((stats.delivered / stats.total) * 100).toFixed(1) : 0;
  const bounceRate = stats.total > 0 ? ((stats.bounced / stats.total) * 100).toFixed(1) : 0;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Sync Status Bar */}
      <Card className="bg-gray-50">
        <CardContent className="p-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-600">Mailcow Sync Status</p>
              {syncStatus && (
                <p className="text-xs text-gray-500">
                  Last sync: {new Date(syncStatus.lastSync).toLocaleString()}
                </p>
              )}
            </div>
            <Button 
              onClick={triggerSync} 
              disabled={syncing}
              className="flex items-center gap-2"
            >
              <RefreshCcw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Syncing...' : 'Sync Now'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Sent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Delivered</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.delivered}</div>
            <p className="text-xs text-gray-500">{deliveryRate}% rate</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Bounced</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.bounced}</div>
            <p className="text-xs text-gray-500">
              Hard: {stats.hardBounces}, Soft: {stats.softBounces}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Bounce Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${bounceRate > 2 ? 'text-red-600' : 'text-green-600'}`}>
              {bounceRate}%
            </div>
            <p className="text-xs text-gray-500">
              {bounceRate > 2 ? 'Above threshold' : 'Healthy'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Bounce Alert */}
      {bounceRate > 2 && (
        <Alert className="border-orange-300 bg-orange-50">
          <AlertCircle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            Your bounce rate is {bounceRate}% which is above the recommended 2% threshold. 
            Review hard bounces and clean your email list.
          </AlertDescription>
        </Alert>
      )}

      {/* Detailed Records */}
      <Card>
        <CardHeader>
          <CardTitle>Email Delivery Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Email</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">Message ID</th>
                  <th className="text-left p-2">Delivered</th>
                  <th className="text-left p-2">Bounce Info</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record, idx) => (
                  <tr key={idx} className="border-b hover:bg-gray-50">
                    <td className="p-2">
                      <span className="font-mono text-xs">
                        {record.contactEmail || 'Unknown'}
                      </span>
                    </td>
                    <td className="p-2">
                      <div className="flex items-center">
                        {getStatusBadge(record.status)}
                        {record.bounceType && getBounceTypeBadge(record.bounceType)}
                      </div>
                    </td>
                    <td className="p-2">
                      <span className="font-mono text-xs text-gray-500">
                        {record.messageId ? record.messageId.substring(0, 20) + '...' : 'N/A'}
                      </span>
                    </td>
                    <td className="p-2">
                      {record.deliveredAt ? (
                        <span className="text-green-600 text-xs">
                          {new Date(record.deliveredAt).toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="p-2">
                      {record.bouncedAt ? (
                        <div>
                          <p className="text-xs text-red-600">
                            {new Date(record.bouncedAt).toLocaleString()}
                          </p>
                          {record.bounceReason && (
                            <p className="text-xs text-gray-500 truncate max-w-xs" title={record.bounceReason}>
                              {record.bounceReason}
                            </p>
                          )}
                          {record.dsn && (
                            <span className="text-xs font-mono text-gray-400">DSN: {record.dsn}</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* No Delivery Data Warning */}
      {stats.delivered === 0 && stats.total > 0 && (
        <Alert className="border-yellow-300 bg-yellow-50">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            No delivery confirmations received yet. This could mean:
            <ul className="list-disc ml-5 mt-2">
              <li>Emails are still in transit</li>
              <li>Mailcow sync hasn't run yet (click "Sync Now")</li>
              <li>Mailcow API connection needs configuration</li>
            </ul>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default DeliveryStatusDashboard;