// api/src/services/landivoEmailList.service.ts
import axios from 'axios';
import { logger } from '../utils/logger';

interface LandivoEmailList {
  id: string;
  name: string;
  description?: string;
  source: string;
  criteria: any;
  createdAt: string;
  totalContacts?: number;
}

interface LandivoBuyer {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  qualified: boolean;
  buyerType?: string;
  grossAnnualIncome?: string;
  currentCreditScore?: string;
}

interface EmailListWithBuyers {
  emailList: LandivoEmailList;
  buyers: LandivoBuyer[];
  totalContacts: number;
}

class LandivoService {
  private readonly apiUrl: string;

  constructor() {
    this.apiUrl = process.env.LANDIVO_API_URL || 'https://api.landivo.com';
  }

  async getAllEmailLists(): Promise<EmailListWithBuyers[]> {
    try {
      logger.info('Fetching email lists from Landivo...');
      
      // Fetch all EmailLists
      const emailListsResponse = await axios.get(`${this.apiUrl}/email-lists`);
      const emailLists: LandivoEmailList[] = emailListsResponse.data;

      // Debug log to see the actual structure
      if (emailLists.length > 0) {
        logger.info('Sample email list structure:', JSON.stringify(emailLists[0], null, 2));
      }

      if (!emailLists || emailLists.length === 0) {
        logger.info('No email lists found in Landivo');
        return [];
      }

      // Transform email lists - check if buyers data is already included
      const emailListsWithBuyers: EmailListWithBuyers[] = emailLists.map((emailList: any) => {
        // Handle both possible data structures
        const id = emailList.id || emailList._id;
        const buyers = emailList.buyers || [];
        const totalContacts = emailList.totalContacts || emailList.buyerCount || buyers.length || 0;

        return {
          emailList: {
            id,
            name: emailList.name,
            description: emailList.description,
            source: emailList.source || 'manual',
            criteria: emailList.criteria || {},
            createdAt: emailList.createdAt,
            totalContacts
          },
          buyers: buyers,
          totalContacts: totalContacts
        };
      });

      logger.info(`Successfully loaded ${emailListsWithBuyers.length} email lists from Landivo`);
      return emailListsWithBuyers;

    } catch (error) {
      logger.error('Error fetching email lists from Landivo:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Failed to fetch email lists from Landivo: ${errorMessage}`);
    }
  }

  async getEmailListById(emailListId: string): Promise<EmailListWithBuyers | null> {
    try {
      logger.info(`Fetching email list ${emailListId} from Landivo...`);

      // Fetch specific EmailList - FIXED ENDPOINT
      const emailListResponse = await axios.get(`${this.apiUrl}/email-lists/${emailListId}`);
      const emailList: LandivoEmailList = emailListResponse.data;

      if (!emailList) {
        return null;
      }

      return {
        emailList: {
          ...emailList,
          id: emailList.id || (emailList as any)._id
        },
        buyers: [], // Will populate once we know the correct endpoint
        totalContacts: 0
      };

    } catch (error) {
      logger.error(`Error fetching email list ${emailListId} from Landivo:`, error);
      return null;
    }
  }
}

export const landivoService = new LandivoService();