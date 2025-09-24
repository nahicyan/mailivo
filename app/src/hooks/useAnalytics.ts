// app/src/hooks/useAnalytics.ts
import { useState, useEffect } from 'react';
import { CampaignAnalytics, ClickDetail } from '@/types/analytics';

export function useAnalytics(campaignId: string) {
  const [data, setData] = useState<CampaignAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.mailivo.landivo.com';

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/analytics/campaigns/${campaignId}/analytics/detailed`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
        },
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch analytics');
      const analyticsData = await response.json();
      setData(analyticsData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchContactDetails = async (contactId: string): Promise<ClickDetail[]> => {
    try {
      const response = await fetch(`${API_URL}/analytics/campaigns/${campaignId}/analytics/contact/${contactId}/clicks`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
        },
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch contact details');
      return await response.json();
    } catch (err) {
      console.error('Error fetching contact details:', err);
      return [];
    }
  };

  useEffect(() => {
    if (campaignId) {
      fetchAnalyticsData();
    }
  }, [campaignId]);

  return {
    data,
    loading,
    error,
    refetch: fetchAnalyticsData,
    fetchContactDetails,
  };
}