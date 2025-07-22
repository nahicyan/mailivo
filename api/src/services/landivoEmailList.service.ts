// api/src/services/landivo.service.ts
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

interface BuyerEmailListRelation {
  buyerId: string;
  emailListId: string;
  createdAt: string;
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
      
      // Step 1: Fetch all EmailLists
      const emailListsResponse = await axios.get(`${this.apiUrl}/emailList/all`);
      const emailLists: LandivoEmailList[] = emailListsResponse.data;

      if (!emailLists || emailLists.length === 0) {
        logger.info('No email lists found in Landivo');
        return [];
      }

      // Step 2: Fetch all Buyers
      const buyersResponse = await axios.get(`${this.apiUrl}/buyer/all`);
      const buyers: LandivoBuyer[] = buyersResponse.data;

      // Step 3: Fetch all BuyerEmailList relationships
      const relationshipsResponse = await axios.get(`${this.apiUrl}/buyerEmailList/all`);
      const relationships: BuyerEmailListRelation[] = relationshipsResponse.data;

      // Step 4: Combine the data
      const emailListsWithBuyers: EmailListWithBuyers[] = emailLists.map((emailList: LandivoEmailList) => {
        // Find all buyers for this email list
        const buyerIds = relationships
          .filter((rel: BuyerEmailListRelation) => rel.emailListId === emailList.id)
          .map((rel: BuyerEmailListRelation) => rel.buyerId);

        const listBuyers = buyers.filter((buyer: LandivoBuyer) => buyerIds.includes(buyer.id));

        return {
          emailList,
          buyers: listBuyers,
          totalContacts: listBuyers.length
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

      // Fetch specific EmailList
      const emailListResponse = await axios.get(`${this.apiUrl}/emailList/${emailListId}`);
      const emailList: LandivoEmailList = emailListResponse.data;

      if (!emailList) {
        return null;
      }

      // Fetch relationships for this email list
      const relationshipsResponse = await axios.get(`${this.apiUrl}/buyerEmailList/byEmailList/${emailListId}`);
      const relationships: BuyerEmailListRelation[] = relationshipsResponse.data;

      // Fetch buyers for this email list
      const buyerIds = relationships.map((rel: BuyerEmailListRelation) => rel.buyerId);
      const buyersPromises = buyerIds.map((buyerId: string) => 
        axios.get(`${this.apiUrl}/buyer/${buyerId}`)
      );
      
      const buyersResponses = await Promise.all(buyersPromises);
      const buyers: LandivoBuyer[] = buyersResponses.map(response => response.data);

      return {
        emailList,
        buyers,
        totalContacts: buyers.length
      };

    } catch (error) {
      logger.error(`Error fetching email list ${emailListId} from Landivo:`, error);
      return null;
    }
  }
}

export const landivoService = new LandivoService();