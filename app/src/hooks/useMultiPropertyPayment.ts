// app/src/hooks/useMultiPropertyPayment.ts
import { useState, useEffect } from 'react';
import { PropertyPaymentData } from '@/types/campaign';

interface UseMultiPropertyPaymentReturn {
  paymentDataMap: Record<string, PropertyPaymentData>;
  loading: boolean;
  error: string | null;
  loadingProperties: Set<string>;
}

export function useMultiPropertyPayment(propertyIds: string[]): UseMultiPropertyPaymentReturn {
  const [paymentDataMap, setPaymentDataMap] = useState<Record<string, PropertyPaymentData>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingProperties, setLoadingProperties] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!propertyIds.length) {
      setPaymentDataMap({});
      setError(null);
      setLoading(false);
      setLoadingProperties(new Set());
      return;
    }

    const fetchPropertyPayments = async () => {
      try {
        setLoading(true);
        setError(null);
        setLoadingProperties(new Set(propertyIds));
        
        // Fetch all properties concurrently
        const promises = propertyIds.map(async (propertyId) => {
          try {
            const response = await fetch(`https://api.landivo.com/residency/${propertyId}`);
            
            if (!response.ok) {
              console.warn(`Failed to fetch property ${propertyId}: ${response.status}`);
              return { propertyId, data: null, error: `HTTP ${response.status}` };
            }
            
            const data = await response.json();
            return { propertyId, data, error: null };
          } catch (err) {
            console.warn(`Error fetching property ${propertyId}:`, err);
            return { 
              propertyId, 
              data: null, 
              error: err instanceof Error ? err.message : 'Unknown error' 
            };
          }
        });

        const results = await Promise.allSettled(promises);
        
        const newPaymentDataMap: Record<string, PropertyPaymentData> = {};
        const errors: string[] = [];

        results.forEach((result, index) => {
          const propertyId = propertyIds[index];
          
          if (result.status === 'fulfilled') {
            const { data, error: fetchError } = result.value;
            if (data) {
              newPaymentDataMap[propertyId] = data;
            } else if (fetchError) {
              errors.push(`Property ${propertyId}: ${fetchError}`);
            }
          } else {
            errors.push(`Property ${propertyId}: ${result.reason}`);
          }
        });

        setPaymentDataMap(newPaymentDataMap);
        
        // Set error if any properties failed, but don't block the UI
        if (errors.length > 0) {
          console.warn('Some properties failed to load:', errors);
          // Only set error if ALL properties failed
          if (Object.keys(newPaymentDataMap).length === 0) {
            setError(`Failed to load payment data: ${errors.join(', ')}`);
          }
        }
        
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        setError(errorMessage);
        console.error('Error fetching multi-property payment data:', errorMessage);
      } finally {
        setLoading(false);
        setLoadingProperties(new Set());
      }
    };

    fetchPropertyPayments();
  }, [propertyIds.join(',')]); // Use join to create stable dependency

  return {
    paymentDataMap,
    loading,
    error,
    loadingProperties
  };
}

// Additional utility hook for single property (maintains compatibility)
export function usePropertyPaymentBulk(propertyId: string) {
  const { paymentDataMap, loading, error } = useMultiPropertyPayment(
    propertyId ? [propertyId] : []
  );

  return {
    paymentData: paymentDataMap[propertyId] || null,
    loading,
    error
  };
}