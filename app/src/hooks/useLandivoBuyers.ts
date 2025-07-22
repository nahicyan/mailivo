import { useQuery } from '@tanstack/react-query';
import { LandivoBuyer } from '@/types/landivo';

const landivoAPI_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'https://api.landivo.com';

async function fetchLandivoBuyers(): Promise<LandivoBuyer[]> {
  const response = await fetch(`${landivoAPI_URL}/api/buyer`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    }
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch buyers');
  }
  
  return response.json();
}

export function useLandivoBuyers() {
  return useQuery({
    queryKey: ['landivo-buyers'],
    queryFn: fetchLandivoBuyers,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error) => {
      return error.message.includes('404') ? false : failureCount < 3;
    }
  });
}