// app/src/hooks/usePropertyData.ts
import { useState, useEffect } from 'react';
import { LandivoProperty } from '@/types/landivo';

interface UsePropertyDataReturn {
  propertyData: LandivoProperty | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Custom hook to fetch and manage property data from Landivo API
 * This ensures consistent data usage across template builder and preview
 */
export function usePropertyData(): UsePropertyDataReturn {
  const [propertyData, setPropertyData] = useState<LandivoProperty | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPropertyData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('https://api.landivo.com/residency/allresd');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch properties: ${response.status}`);
      }
      
      const properties: LandivoProperty[] = await response.json();
      
      if (properties && properties.length > 0) {
        // Use the first property as requested
        setPropertyData(properties[0]);
        console.log('✅ Property data loaded:', properties[0].title);
      } else {
        throw new Error('No properties found');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('❌ Error fetching property data:', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPropertyData();
  }, []);

  return {
    propertyData,
    loading,
    error,
    refetch: fetchPropertyData
  };
}

// Alternative hook for getting a specific property by ID
export function useProperty(propertyId: string) {
  const [property, setProperty] = useState<LandivoProperty | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`https://api.landivo.com/residency/${propertyId}`);
        
        if (!response.ok) {
          throw new Error(`Property not found: ${response.status}`);
        }
        
        const propertyData = await response.json();
        setProperty(propertyData);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    if (propertyId) {
      fetchProperty();
    }
  }, [propertyId]);

  return { property, loading, error };
}