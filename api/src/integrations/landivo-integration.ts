// api/src/integrations/landivo-integration.ts
import axios, { AxiosInstance } from 'axios';
import { WorkflowExecutionService } from '../services/workflow-execution-service';
import { logger } from '../utils/logger';
import { LandivoProperty, LandivoBuyer } from '../types/landivo';

// Use the existing types from your project instead of creating new ones
interface LandivoQualification {
  id: string;
  propertyId?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  qualified: boolean;
  disqualificationReason?: string;
  grossAnnualIncome?: string;
  totalMonthlyPayments?: number;
  currentCreditScore?: string;
  employmentStatus?: string;
  verifyIncome?: string;
  homeUsage?: string;
  homePurchaseTiming?: string;
  currentHomeOwnership?: string;
  createdAt: string;
  updatedAt: string;
}

interface LandivoOffer {
  id: string;
  propertyId: string;
  buyerId: string;
  offeredPrice: number;
  counteredPrice?: number;
  offerStatus: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'COUNTERED' | 'EXPIRED';
  buyerMessage?: string;
  sysMessage?: string;
  timestamp: string;
}

interface LandivoDeal {
  id: string;
  buyerId: string;
  propertyId: string;
  purchasePrice: number;
  salePrice: number;
  downPayment?: number;
  loanAmount?: number;
  interestRate?: number;
  term?: number;
  monthlyPayment?: number;
  status: 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'DEFAULTED' | 'CANCELLED';
  startDate: string;
  completionDate?: string;
}

export class LandivoIntegration {
  private axios: AxiosInstance;
  private landivoApiUrl: string;
  private workflowService: WorkflowExecutionService;

  constructor(
    workflowService: WorkflowExecutionService,
    landivoApiUrl?: string
  ) {
    this.workflowService = workflowService;
    this.landivoApiUrl = landivoApiUrl || process.env.LANDIVO_API_URL || 'http://localhost:8200';
    
    // Initialize axios instance with base configuration
    this.axios = axios.create({
      baseURL: this.landivoApiUrl,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      }
    });

    // Add request/response interceptors for logging
    this.axios.interceptors.request.use(
      (config) => {
        logger.debug(`Landivo API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        logger.error('Landivo API Request Error:', error);
        return Promise.reject(error);
      }
    );

    this.axios.interceptors.response.use(
      (response) => {
        logger.debug(`Landivo API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        logger.error(`Landivo API Response Error: ${error.response?.status} ${error.config?.url}`);
        return Promise.reject(error);
      }
    );
  }

  // ========== PROPERTY METHODS ==========

  async getAllProperties(): Promise<LandivoProperty[]> {
    try {
      const response = await this.axios.get('/residency/allresd');
      return response.data;
    } catch (error) {
      logger.error('Failed to fetch all properties:', error);
      throw new Error('Failed to fetch properties from Landivo');
    }
  }

  async getProperty(id: string): Promise<LandivoProperty | null> {
    try {
      const response = await this.axios.get(`/residency/${id}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      logger.error(`Failed to fetch property ${id}:`, error);
      throw new Error(`Failed to fetch property: ${error.message}`);
    }
  }

  async getPropertiesByIds(ids: string[]): Promise<LandivoProperty[]> {
    try {
      const promises = ids.map(id => this.getProperty(id));
      const results = await Promise.allSettled(promises);
      
      return results
        .filter(result => result.status === 'fulfilled' && result.value !== null)
        .map(result => (result as PromiseFulfilledResult<LandivoProperty>).value);
    } catch (error) {
      logger.error('Failed to fetch multiple properties:', error);
      throw new Error('Failed to fetch properties from Landivo');
    }
  }

  async searchProperties(filters: {
    city?: string;
    state?: string;
    minPrice?: number;
    maxPrice?: number;
    landType?: string[];
    status?: string;
  }): Promise<LandivoProperty[]> {
    try {
      const properties = await this.getAllProperties();
      
      return properties.filter(property => {
        if (filters.city && property.city.toLowerCase() !== filters.city.toLowerCase()) return false;
        if (filters.state && property.state.toLowerCase() !== filters.state.toLowerCase()) return false;
        if (filters.minPrice && property.askingPrice < filters.minPrice) return false;
        if (filters.maxPrice && property.askingPrice > filters.maxPrice) return false;
        if (filters.status && property.status !== filters.status) return false;
        if (filters.landType && filters.landType.length > 0) {
          const hasMatchingType = filters.landType.some(type => 
            property.landType.includes(type)
          );
          if (!hasMatchingType) return false;
        }
        return true;
      });
    } catch (error) {
      logger.error('Failed to search properties:', error);
      throw new Error('Failed to search properties');
    }
  }

  // ========== BUYER METHODS ==========

  async getAllBuyers(): Promise<LandivoBuyer[]> {
    try {
      const response = await this.axios.get('/buyer');
      return response.data;
    } catch (error) {
      logger.error('Failed to fetch all buyers:', error);
      throw new Error('Failed to fetch buyers from Landivo');
    }
  }

  async getBuyer(id: string): Promise<LandivoBuyer | null> {
    try {
      const response = await this.axios.get(`/buyer/${id}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      logger.error(`Failed to fetch buyer ${id}:`, error);
      throw new Error(`Failed to fetch buyer: ${error.message}`);
    }
  }

  async getBuyersByProperty(propertyId: string): Promise<LandivoBuyer[]> {
    try {
      const response = await this.axios.get(`/buyer/property/${propertyId}`);
      return response.data;
    } catch (error) {
      logger.error(`Failed to fetch buyers for property ${propertyId}:`, error);
      return [];
    }
  }

  async getBuyerByEmail(email: string): Promise<LandivoBuyer | null> {
    try {
      const buyers = await this.getAllBuyers();
      return buyers.find(buyer => buyer.email === email) || null;
    } catch (error) {
      logger.error(`Failed to fetch buyer by email ${email}:`, error);
      return null;
    }
  }

  // ========== QUALIFICATION METHODS ==========

  async getQualification(id: string): Promise<LandivoQualification | null> {
    try {
      const response = await this.axios.get(`/qualification/${id}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      logger.error(`Failed to fetch qualification ${id}:`, error);
      throw new Error(`Failed to fetch qualification: ${error.message}`);
    }
  }

  async getQualificationsByProperty(propertyId: string): Promise<LandivoQualification[]> {
    try {
      const response = await this.axios.get(`/qualification/property/${propertyId}`);
      return response.data;
    } catch (error) {
      logger.error(`Failed to fetch qualifications for property ${propertyId}:`, error);
      return [];
    }
  }

  async submitQualification(qualificationData: Partial<LandivoQualification>): Promise<LandivoQualification> {
    try {
      const response = await this.axios.post('/qualification/submit', qualificationData);
      
      // Trigger workflow if qualified
      if (response.data.qualified && qualificationData.propertyId) {
        await this.workflowService.executeWorkflow({
          trigger: 'qualification_submitted',
          data: {
            qualification: response.data,
            propertyId: qualificationData.propertyId,
            buyerEmail: qualificationData.email
          }
        });
      }
      
      return response.data;
    } catch (error) {
      logger.error('Failed to submit qualification:', error);
      throw new Error('Failed to submit qualification');
    }
  }

  // ========== OFFER METHODS ==========

  async makeOffer(offerData: {
    propertyId: string;
    buyerId: string;
    offeredPrice: number;
    buyerMessage?: string;
  }): Promise<LandivoOffer> {
    try {
      const response = await this.axios.post('/offer/makeOffer', offerData);
      
      // Trigger workflow for new offer
      await this.workflowService.executeWorkflow({
        trigger: 'offer_submitted',
        data: {
          offer: response.data,
          propertyId: offerData.propertyId,
          buyerId: offerData.buyerId
        }
      });
      
      return response.data;
    } catch (error) {
      logger.error('Failed to make offer:', error);
      throw new Error('Failed to submit offer');
    }
  }

  async getOffersByProperty(propertyId: string): Promise<LandivoOffer[]> {
    try {
      const response = await this.axios.get(`/offer/property/${propertyId}`);
      return response.data;
    } catch (error) {
      logger.error(`Failed to fetch offers for property ${propertyId}:`, error);
      return [];
    }
  }

  // ========== DEAL METHODS ==========

  async getDealsByProperty(propertyId: string): Promise<LandivoDeal[]> {
    try {
      const response = await this.axios.get(`/deal/property/${propertyId}`);
      return response.data;
    } catch (error) {
      logger.error(`Failed to fetch deals for property ${propertyId}:`, error);
      return [];
    }
  }

  async getDealsByBuyer(buyerId: string): Promise<LandivoDeal[]> {
    try {
      const response = await this.axios.get(`/deal/buyer/${buyerId}`);
      return response.data;
    } catch (error) {
      logger.error(`Failed to fetch deals for buyer ${buyerId}:`, error);
      return [];
    }
  }

  // ========== WORKFLOW INTEGRATION ==========

  async onPropertyAdded(property: LandivoProperty): Promise<void> {
    await this.workflowService.executeWorkflow({
      trigger: 'property_added',
      data: { property }
    });
  }

  async onBuyerRegistered(buyer: LandivoBuyer): Promise<void> {
    await this.workflowService.executeWorkflow({
      trigger: 'buyer_registered',
      data: { buyer }
    });
  }

  async onOfferStatusChanged(offer: LandivoOffer, previousStatus: string): Promise<void> {
    await this.workflowService.executeWorkflow({
      trigger: 'offer_status_changed',
      data: {
        offer,
        previousStatus,
        newStatus: offer.offerStatus
      }
    });
  }

  async onDealCreated(deal: LandivoDeal): Promise<void> {
    await this.workflowService.executeWorkflow({
      trigger: 'deal_created',
      data: { deal }
    });
  }

  // ========== UTILITY METHODS ==========

  async syncProperties(): Promise<{ count: number; lastSync: string }> {
    try {
      const properties = await this.getAllProperties();
      
      // Process each property for workflow triggers
      for (const property of properties) {
        // Check if this is a new property and trigger workflow
        // This would typically check against a local cache or database
        // For now, we'll just log
        logger.info(`Synced property: ${property.id} - ${property.title}`);
      }
      
      return {
        count: properties.length,
        lastSync: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Failed to sync properties:', error);
      throw new Error('Failed to sync properties from Landivo');
    }
  }

  async syncBuyers(): Promise<{ count: number; lastSync: string }> {
    try {
      const buyers = await this.getAllBuyers();
      
      logger.info(`Synced ${buyers.length} buyers from Landivo`);
      
      return {
        count: buyers.length,
        lastSync: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Failed to sync buyers:', error);
      throw new Error('Failed to sync buyers from Landivo');
    }
  }

  // Health check for Landivo API connection
  async healthCheck(): Promise<{ status: string; message: string }> {
    try {
      await this.axios.get('/health', { timeout: 5000 });
      return { status: 'healthy', message: 'Landivo API is accessible' };
    } catch (error) {
      return { status: 'unhealthy', message: 'Landivo API is not accessible' };
    }
  }
}

// Export singleton instance
export const landivoIntegration = new LandivoIntegration(
  new WorkflowExecutionService()
);

export default landivoIntegration;