import { useQuery } from '@tanstack/react-query';
import { landivoClient } from '@/lib/landivo/client';
import { LandivoProperty } from '@/types/landivo';

export function useLandivoProperty(id: string) {
  return useQuery<LandivoProperty>({
    queryKey: ['landivo-property', id],
    queryFn: () => landivoClient.getProperty(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useLandivoPropertyBuyers(propertyId: string) {
  return useQuery({
    queryKey: ['landivo-property-buyers', propertyId],
    queryFn: () => landivoClient.getPropertyBuyers(propertyId),
    enabled: !!propertyId,
  });
}