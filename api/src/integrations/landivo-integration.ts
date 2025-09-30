import axios, { AxiosInstance } from 'axios';
import { WorkflowExecutionService } from '../services/workflow-execution-service';
import { logger } from '../utils/logger';
import { LandivoProperty, LandivoBuyer } from '../types/landivo';


export interface LandivoResidency {
  id: string;
  title: string;
  description: string;
  streetAddress: string;
  city: string;
  state: string;
  zip: string;
  county: string;
  sqft?: number; // Optional as per Prisma schema
  acre: number;
  askingPrice: number;
  financing: string;
  financingTwo?: string;
  financingThree?: string;
  monthlyPaymentOne?: number;
  monthlyPaymentTwo?: number;
  monthlyPaymentThree?: number;
  downPaymentOne?: number;
  downPaymentTwo?: number;
  downPaymentThree?: number;
  loanAmountOne?: number;
  loanAmountTwo?: number;
  loanAmountThree?: number;
  interestOne?: number;
  interestTwo?: number;
  interestThree?: number;
  status: string;
  imageUrls?: any; // Json type in Prisma
  landType: string[];
  zoning: string;
  latitude: number;
  longitude: number;
  apnOrPin: string;
  profileId?: string;
  createdAt: Date;
  updatedAt: Date;
}

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
    
    this.axios = axios.create({
      baseURL: this.landivoApiUrl,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      }
    });

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

  async submitQualification(qualificationData: Partial<LandivoQualification>, workflowId?: string): Promise<LandivoQualification> {
    try {
      const response = await this.axios.post('/qualification/submit', qualificationData);
      
      if (response.data.qualified && qualificationData.propertyId && workflowId) {
        await this.workflowService.executeWorkflow(
          workflowId,
          [response.data.id],
          {
            qualification: response.data,
            propertyId: qualificationData.propertyId,
            buyerEmail: qualificationData.email
          }
        );
      }
      
      return response.data;
    } catch (error) {
      logger.error('Failed to submit qualification:', error);
      throw new Error('Failed to submit qualification');
    }
  }

  async makeOffer(offerData: {
    propertyId: string;
    buyerId: string;
    offeredPrice: number;
    buyerMessage?: string;
  }, workflowId?: string): Promise<LandivoOffer> {
    try {
      const response = await this.axios.post('/offer/makeOffer', offerData);
      
      if (workflowId) {
        await this.workflowService.executeWorkflow(
          workflowId,
          [offerData.buyerId],
          {
            offer: response.data,
            propertyId: offerData.propertyId,
            buyerId: offerData.buyerId
          }
        );
      }
      
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

  async onPropertyAdded(property: LandivoProperty, workflowId?: string): Promise<void> {
    if (!workflowId) {
      logger.info('No workflow configured for property_added trigger');
      return;
    }
    
    const buyers = await this.getAllBuyers();
    const interestedBuyerIds = buyers
      .filter(buyer => {
        // Check if buyer has preferredAreas property
        const areas = (buyer as any).preferredAreas || [];
        return areas.includes(property.city) || areas.includes(property.state);
      })
      .map(buyer => buyer.id);
    
    if (interestedBuyerIds.length > 0) {
      await this.workflowService.executeWorkflow(
        workflowId,
        interestedBuyerIds,
        { property }
      );
    }
  }

  async onBuyerRegistered(buyer: LandivoBuyer, workflowId?: string): Promise<void> {
    if (!workflowId) {
      logger.info('No workflow configured for buyer_registered trigger');
      return;
    }
    
    await this.workflowService.executeWorkflow(
      workflowId,
      [buyer.id],
      { buyer }
    );
  }

  async onOfferStatusChanged(offer: LandivoOffer, previousStatus: string, workflowId?: string): Promise<void> {
    if (!workflowId) {
      logger.info('No workflow configured for offer_status_changed trigger');
      return;
    }
    
    await this.workflowService.executeWorkflow(
      workflowId,
      [offer.buyerId],
      {
        offer,
        previousStatus,
        newStatus: offer.offerStatus
      }
    );
  }

  async onDealCreated(deal: LandivoDeal, workflowId?: string): Promise<void> {
    if (!workflowId) {
      logger.info('No workflow configured for deal_created trigger');
      return;
    }
    
    await this.workflowService.executeWorkflow(
      workflowId,
      [deal.buyerId],
      { deal }
    );
  }

  async syncProperties(): Promise<{ count: number; lastSync: string }> {
    try {
      const properties = await this.getAllProperties();
      
      for (const property of properties) {
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

  async healthCheck(): Promise<{ status: string; message: string }> {
    try {
      await this.axios.get('/health', { timeout: 5000 });
      return { status: 'healthy', message: 'Landivo API is accessible' };
    } catch (error) {
      return { status: 'unhealthy', message: 'Landivo API is not accessible' };
    }
  }
}

export default LandivoIntegration;