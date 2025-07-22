import { useQuery } from '@tanstack/react-query';

export interface EmailList {
  id: string;
  name: string;
  description: string;
  totalContacts: number;
  lastSyncAt: string;
  buyerCriteria?: {
    qualified?: boolean;
    minPrice?: number;
    maxPrice?: number;
    minIncome?: number;
    creditScore?: number;
  };
}

const landivoAPI_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'https://api.landivo.com';

async function fetchEmailLists(): Promise<EmailList[]> {
  const response = await fetch(`${landivoAPI_URL}/api/email-lists`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    }
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch email lists');
  }
  
  return response.json();
}

export function useEmailLists() {
  return useQuery({
    queryKey: ['email-lists'],
    queryFn: fetchEmailLists,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error) => {
      return error.message.includes('404') ? false : failureCount < 3;
    }
  });
}