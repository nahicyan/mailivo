// api/src/services/landivo.service.ts
import axios, { AxiosError } from 'axios';
import { logger } from '../utils/logger';

interface LandivoBuyer {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  buyerType?: string;
  preferredAreas?: string[];
  emailStatus: string;
  emailPermissionStatus?: string;
  createdAt: string;
  updatedAt: string;
}

interface EmailListResponse {
  id: string;
  name: string;
  description?: string;
  source: string;
  criteria: any;
  isDefault: boolean;
  color?: string;
  createdAt: string;
  updatedAt: string;
  buyers: LandivoBuyer[];
  buyerCount: number;
}

interface EmailContact {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  source: 'landivo';
  landivo_buyer_id: string;
  subscribed: boolean;
}

class LandivoService {
  private readonly apiUrl: string;
  private readonly timeout: number = 10000; // 10 seconds

  constructor() {
    this.apiUrl = process.env.LANDIVO_API_URL || 'https://api.landivo.com';
  }

  async getEmailListWithBuyers(emailListId: string): Promise<EmailContact[]> {
    try {
      logger.info(`Fetching email list ${emailListId} from Landivo...`);

      const response = await axios.get<EmailListResponse>(
        `${this.apiUrl}/email-lists/${emailListId}`,
        {
          timeout: this.timeout,
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Mailivo-Platform/1.0',
          }
        }
      );

      const emailListData = response.data;

      if (!emailListData) {
        logger.warn(`Email list ${emailListId} not found in Landivo`);
        return [];
      }

      if (!emailListData.buyers || emailListData.buyers.length === 0) {
        logger.info(`Email list ${emailListId} has no buyers`);
        return [];
      }

      // Transform Landivo buyers to email contacts
      const contacts = emailListData.buyers
        .filter(buyer => buyer.email && buyer.emailStatus === 'available')
        .map(buyer => this.transformBuyerToContact(buyer));

      logger.info(
        `Successfully fetched ${contacts.length} contacts from Landivo email list ${emailListId}`,
        {
          listName: emailListData.name,
          totalBuyers: emailListData.buyers.length,
          validContacts: contacts.length
        }
      );

      return contacts;

    } catch (error) {
      const errorMessage = this.handleLandivoError(error, emailListId);
      logger.error(`Failed to fetch email list ${emailListId}:`, errorMessage);
      throw new Error(`Landivo API error: ${errorMessage}`);
    }
  }

  private transformBuyerToContact(buyer: LandivoBuyer): EmailContact {
    return {
      email: buyer.email.trim().toLowerCase(),
      firstName: buyer.firstName || '',
      lastName: buyer.lastName || '',
      phone: buyer.phone || '',
      source: 'landivo',
      landivo_buyer_id: buyer.id,
      subscribed: buyer.emailStatus === 'available',
    };
  }

  private handleLandivoError(error: unknown, emailListId: string): string {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      
      if (axiosError.response) {
        // Server responded with error status
        const status = axiosError.response.status;
        const data = axiosError.response.data as any;
        
        switch (status) {
          case 404:
            return `Email list ${emailListId} not found`;
          case 401:
            return 'Unauthorized - check Landivo API credentials';
          case 403:
            return 'Forbidden - insufficient permissions for Landivo API';
          case 429:
            return 'Rate limited by Landivo API';
          case 500:
            return 'Landivo server error';
          default:
            return `HTTP ${status}: ${data?.message || axiosError.message}`;
        }
      } else if (axiosError.request) {
        // Request was made but no response received
        return 'No response from Landivo API - check network connectivity';
      }
    }

    return error instanceof Error ? error.message : 'Unknown error occurred';
  }

  async validateEmailList(emailListId: string): Promise<{ valid: boolean; error?: string }> {
    try {
      await axios.head(`${this.apiUrl}/email-lists/${emailListId}`, {
        timeout: 5000
      });
      return { valid: true };
    } catch (error) {
      const errorMessage = this.handleLandivoError(error, emailListId);
      return { valid: false, error: errorMessage };
    }
  }

  async getAllEmailLists(): Promise<Array<{ id: string; name: string; buyerCount: number }>> {
    try {
      logger.info('Fetching all email lists from Landivo...');

      const response = await axios.get(`${this.apiUrl}/email-lists`, {
        timeout: this.timeout
      });

      const emailLists = response.data;

      if (!Array.isArray(emailLists)) {
        logger.warn('Unexpected response format from Landivo email lists endpoint');
        return [];
      }

      return emailLists.map((list: any) => ({
        id: list.id || list._id,
        name: list.name,
        buyerCount: list.buyerCount || list.buyers?.length || 0
      }));

    } catch (error) {
      logger.error('Failed to fetch email lists from Landivo:', error);
      return [];
    }
  }

  // Health check method
  async checkConnection(): Promise<boolean> {
    try {
      await axios.get(`${this.apiUrl}/health`, { timeout: 5000 });
      return true;
    } catch (error) {
      logger.error('Landivo health check failed:', error);
      return false;
    }
  }
}

export const landivoService = new LandivoService();