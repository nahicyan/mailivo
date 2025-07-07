import { useQuery } from '@tanstack/react-query';
import { landivoClient } from '@/lib/landivo/client';
import { LandivoProperty } from '@/types/landivo';

export function useLandivoProperty(id: string) {
  return useQuery<LandivoProperty>({
    queryKey: ['landivo-property', id],
    queryFn: () => landivoClient.getProperty(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    retry: (failureCount, error) => {
      // Don't retry on 404 errors
      return error.message.includes('404') ? false : failureCount < 3;
    }
  });
}

export function useLandivoPropertyBuyers(propertyId: string) {
  return useQuery({
    queryKey: ['landivo-property-buyers', propertyId],
    queryFn: () => landivoClient.getPropertyBuyers(propertyId),
    enabled: !!propertyId,
  });
}