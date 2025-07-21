import { useQuery } from '@tanstack/react-query';
import { LandivoProperty } from '@/types/landivo';

const serverURL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:5000';

async function fetchLandivoProperties(): Promise<LandivoProperty[]> {
  const response = await fetch(`${serverURL}/residency/allresd/`, {
    credentials: 'include',
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch properties');
  }
  
  return response.json();
}

export function useLandivoProperties() {
  return useQuery({
    queryKey: ['landivo-properties'],
    queryFn: fetchLandivoProperties,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}