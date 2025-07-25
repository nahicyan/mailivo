// Landivo integration utilities for property-based workflow automation

import { WorkflowExecutionService } from '../services/workflow-execution-service';
import { WorkflowDatabase } from '../models/workflow-database';

export interface Property {
  id: string;
  title: string;
  description: string;
  price: number;
  location: {
    address: string;
    city: string;
    state: string;
    zipCode: string;
    coordinates: { lat: number; lng: number };
  };
  details: {
    propertyType: 'apartment' | 'house' | 'condo' | 'townhouse' | 'commercial';
    bedrooms: number;
    bathrooms: number;
    squareFeet: number;
    yearBuilt?: number;
    lotSize?: number;
  };
  features: string[];
  images: Array<{
    url: string;
    caption?: string;
    isPrimary: boolean;
  }>;
  listingDate: Date;
  lastUpdated: Date;
  status: 'active' | 'pending' | 'sold' | 'off_market';
  agentId: string;
  mls?: string;
}

export interface BuyerProfile {
  id: string;
  contactId: string;
  preferences: {
    propertyTypes: string[];
    priceRange: { min: number; max: number };
    locations: Array<{
      city: string;
      state: string;
      radius: number; // miles
    }>;
    bedrooms: { min?: number; max?: number };
    bathrooms: { min?: number; max?: number };
    squareFeet: { min?: number; max?: number };
    features: string[];
  };
  searchCriteria: {
    isActive: boolean;
    urgency: 'low' | 'medium' | 'high';
    timeline: string;
    budget: {
      preApprovalAmount?: number;
      downPayment?: number;
      monthlyPayment?: number;
    };
  };
  engagement: {
    lastActivity: Date;
    propertiesViewed: string[];
    favoritedProperties: string[];
    inquiriesSent: number;
    emailEngagement: {
      opens: number;
      clicks: number;
      lastOpen?: Date;
      lastClick?: Date;
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface PropertyAlert {
  id: string;
  buyerProfileId: string;
  propertyId: string;
  alertType: 'new_listing' | 'price_change' | 'status_change' | 'similar_property';
  priority: 'low' | 'medium' | 'high';
  matchScore: number; // 0-100
  triggerData: {
    previousPrice?: number;
    newPrice?: number;
    previousStatus?: string;
    newStatus?: string;
    changedAt: Date;
  };
  sentAt?: Date;
  viewedAt?: Date;
  clickedAt?: Date;
  inquirySent?: boolean;
  createdAt: Date;
}

export class LandivoWorkflowIntegration {
  private workflowService: WorkflowExecutionService;
  private landivoAPI: LandivoAPI;

  constructor(workflowService: WorkflowExecutionService, landivoAPI: LandivoAPI) {
    this.workflowService = workflowService;
    this.landivoAPI = landivoAPI;
  }

  // Initialize Landivo webhook handlers
  async setupWebhookHandlers(): Promise<void> {
    // Property lifecycle webhooks
    this.landivoAPI.onPropertyAdded(this.handleNewProperty.bind(this));
    this.landivoAPI.onPropertyUpdated(this.handlePropertyUpdate.bind(this));
    this.landivoAPI.onPropertyStatusChanged(this.handlePropertyStatusChange.bind(this));
    this.landivoAPI.onPriceChanged(this.handlePriceChange.bind(this));

    // Contact/Buyer webhooks
    this.landivoAPI.onBuyerRegistered(this.handleNewBuyer.bind(this));
    this.landivoAPI.onBuyerPreferencesUpdated(this.handleBuyerPreferencesUpdate.bind(this));
    this.landivoAPI.onPropertyViewed(this.handlePropertyViewed.bind(this));
    this.landivoAPI.onPropertyFavorited(this.handlePropertyFavorited.bind(this));
    this.landivoAPI.onInquirySent(this.handleInquirySent.bind(this));

    console.log('Landivo webhook handlers initialized');
  }

  // Handle new property listings
  private async handleNewProperty(property: Property): Promise<void> {
    console.log(`New property added: ${property.id} - ${property.title}`);

    try {
      // Find matching buyer profiles
      const matchingBuyers = await this.findMatchingBuyers(property);
      
      if (matchingBuyers.length === 0) {
        console.log(`No matching buyers found for property ${property.id}`);
        return;
      }

      // Find active property alert workflows
      const alertWorkflows = await WorkflowDatabase.getActiveWorkflows('property_alerts');
      
      for (const workflow of alertWorkflows) {
        // Trigger workflow for each matching buyer
        const contactIds = matchingBuyers.map(buyer => buyer.contactId);
        
        await this.workflowService.executeWorkflow(
          workflow.id,
          contactIds,
          {
            trigger: 'new_property_match',
            property,
            matchingBuyers: matchingBuyers.map(buyer => ({
              buyerProfileId: buyer.id,
              contactId: buyer.contactId,
              matchScore: this.calculateMatchScore(property, buyer)
            }))
          },
          {
            priority: this.calculateAlertPriority(property, matchingBuyers),
            batchSize: 50
          }
        );
      }

      // Create property alerts for tracking
      await this.createPropertyAlerts(property, matchingBuyers, 'new_listing');

      console.log(`Triggered workflows for ${matchingBuyers.length} matching buyers`);

    } catch (error) {
      console.error('Error handling new property:', error);
    }
  }

  // Handle property updates (price changes, status changes, etc.)
  private async handlePropertyUpdate(
    property: Property, 
    changes: { field: string; oldValue: any; newValue: any }[]
  ): Promise<void> {
    console.log(`Property updated: ${property.id}`, changes);

    // Check if this is a significant change that should trigger alerts
    const significantChanges = changes.filter(change => 
      ['price', 'status', 'details.bedrooms', 'details.bathrooms'].includes(change.field)
    );

    if (significantChanges.length === 0) {
      return;
    }

    try {
      // Find buyers who have shown interest in this property
      const interestedBuyers = await this.findInterestedBuyers(property.id);
      
      // Also find new matching buyers if price dropped significantly
      const priceChange = changes.find(c => c.field === 'price');
      let newMatchingBuyers: BuyerProfile[] = [];
      
      if (priceChange && priceChange.newValue < priceChange.oldValue * 0.95) {
        // 5% or more price drop - find new potential matches
        newMatchingBuyers = await this.findMatchingBuyers(property);
      }

      const allTargetBuyers = [...interestedBuyers, ...newMatchingBuyers];
      
      if (allTargetBuyers.length === 0) {
        return;
      }

      // Trigger update workflows
      const updateWorkflows = await WorkflowDatabase.getActiveWorkflows('property_alerts');
      
      for (const workflow of updateWorkflows) {
        const contactIds = allTargetBuyers.map(buyer => buyer.contactId);
        
        await this.workflowService.executeWorkflow(
          workflow.id,
          contactIds,
          {
            trigger: 'property_update',
            property,
            changes: significantChanges,
            updateType: priceChange ? 'price_change' : 'details_change'
          },
          {
            priority: priceChange ? 2 : 1, // Higher priority for price changes
            batchSize: 25
          }
        );
      }

      // Create update alerts
      const alertType = priceChange ? 'price_change' : 'status_change';
      await this.createPropertyAlerts(property, allTargetBuyers, alertType);

    } catch (error) {
      console.error('Error handling property update:', error);
    }
  }

  // Handle new buyer registration
  private async handleNewBuyer(buyer: BuyerProfile): Promise<void> {
    console.log(`New buyer registered: ${buyer.id}`);

    try {
      // Find welcome series workflows
      const welcomeWorkflows = await WorkflowDatabase.getActiveWorkflows('welcome_series');
      
      for (const workflow of welcomeWorkflows) {
        await this.workflowService.executeWorkflow(
          workflow.id,
          [buyer.contactId],
          {
            trigger: 'buyer_registered',
            buyerProfile: buyer,
            registrationDate: new Date()
          },
          {
            priority: 1,
            delay: 300000 // 5 minute delay to allow for profile completion
          }
        );
      }

      // Find initial property matches
      const matchingProperties = await this.findMatchingProperties(buyer);
      
      if (matchingProperties.length > 0) {
        // Trigger initial property recommendation workflow
        const recommendationWorkflows = await WorkflowDatabase.getActiveWorkflows('property_alerts');
        
        for (const workflow of recommendationWorkflows) {
          await this.workflowService.executeWorkflow(
            workflow.id,
            [buyer.contactId],
            {
              trigger: 'initial_property_recommendations',
              buyerProfile: buyer,
              recommendedProperties: matchingProperties.slice(0, 10), // Top 10 matches
              isInitialRecommendation: true
            },
            {
              priority: 0,
              delay: 3600000 // 1 hour delay after registration
            }
          );
        }
      }

    } catch (error) {
      console.error('Error handling new buyer:', error);
    }
  }

  // Handle buyer preference updates
  private async handleBuyerPreferencesUpdate(
    buyer: BuyerProfile,
    previousPreferences: BuyerProfile['preferences']
  ): Promise<void> {
    console.log(`Buyer preferences updated: ${buyer.id}`);

    try {
      // Check if preferences changed significantly
      const significantChange = this.hasSignificantPreferenceChange(
        previousPreferences,
        buyer.preferences
      );

      if (!significantChange) {
        return;
      }

      // Find new matching properties based on updated preferences
      const matchingProperties = await this.findMatchingProperties(buyer);
      
      if (matchingProperties.length > 0) {
        // Trigger updated recommendations workflow
        const updateWorkflows = await WorkflowDatabase.getActiveWorkflows('lead_nurturing');
        
        for (const workflow of updateWorkflows) {
          await this.workflowService.executeWorkflow(
            workflow.id,
            [buyer.contactId],
            {
              trigger: 'preferences_updated',
              buyerProfile: buyer,
              previousPreferences,
              newMatchingProperties: matchingProperties.slice(0, 8),
              preferenceUpdateDate: new Date()
            },
            {
              priority: 1,
              delay: 1800000 // 30 minute delay
            }
          );
        }
      }

    } catch (error) {
      console.error('Error handling buyer preferences update:', error);
    }
  }

  // Handle property viewing events
  private async handlePropertyViewed(
    propertyId: string,
    buyerId: string,
    viewData: { source: string; duration?: number; device?: string }
  ): Promise<void> {
    console.log(`Property viewed: ${propertyId} by buyer ${buyerId}`);

    try {
      const buyer = await this.landivoAPI.getBuyerProfile(buyerId);
      const property = await this.landivoAPI.getProperty(propertyId);
      
      if (!buyer || !property) {
        return;
      }

      // Update buyer engagement data
      await this.updateBuyerEngagement(buyerId, {
        lastActivity: new Date(),
        propertiesViewed: [propertyId]
      });

      // Find engagement-based workflows
      const engagementWorkflows = await WorkflowDatabase.getActiveWorkflows('lead_nurturing');
      
      for (const workflow of engagementWorkflows) {
        await this.workflowService.executeWorkflow(
          workflow.id,
          [buyer.contactId],
          {
            trigger: 'property_viewed',
            property,
            buyerProfile: buyer,
            viewData,
            viewedAt: new Date()
          },
          {
            priority: 2, // High priority for engagement events
            delay: 1800000 // 30 minute delay for follow-up
          }
        );
      }

      // Find similar properties for recommendations
      const similarProperties = await this.findSimilarProperties(property, buyer);
      
      if (similarProperties.length > 0) {
        // Trigger similar property recommendations
        await this.workflowService.executeWorkflow(
          engagementWorkflows[0]?.id, // Use first available workflow
          [buyer.contactId],
          {
            trigger: 'similar_property_recommendations',
            viewedProperty: property,
            similarProperties: similarProperties.slice(0, 5),
            buyerProfile: buyer
          },
          {
            priority: 1,
            delay: 7200000 // 2 hour delay
          }
        );
      }

    } catch (error) {
      console.error('Error handling property viewed:', error);
    }
  }

  // Utility methods for matching and scoring

  private async findMatchingBuyers(property: Property): Promise<BuyerProfile[]> {
    // This would query your buyer database to find profiles that match the property
    const buyers = await this.landivoAPI.getBuyerProfiles({
      propertyTypes: property.details.propertyType,
      priceRange: { min: property.price * 0.8, max: property.price * 1.2 },
      location: property.location.city,
      bedrooms: property.details.bedrooms,
      bathrooms: property.details.bathrooms
    });

    return buyers.filter(buyer => {
      const matchScore = this.calculateMatchScore(property, buyer);
      return matchScore >= 70; // Only high-confidence matches
    });
  }

  private async findMatchingProperties(buyer: BuyerProfile): Promise<Property[]> {
    const properties = await this.landivoAPI.getProperties({
      propertyTypes: buyer.preferences.propertyTypes,
      priceRange: buyer.preferences.priceRange,
      locations: buyer.preferences.locations,
      bedrooms: buyer.preferences.bedrooms,
      bathrooms: buyer.preferences.bathrooms,
      squareFeet: buyer.preferences.squareFeet,
      status: 'active'
    });

    return properties.filter(property => {
      const matchScore = this.calculateMatchScore(property, buyer);
      return matchScore >= 60; // Broader match criteria for recommendations
    });
  }

  private calculateMatchScore(property: Property, buyer: BuyerProfile): number {
    let score = 0;
    let factors = 0;

    // Property type match (25% weight)
    if (buyer.preferences.propertyTypes.includes(property.details.propertyType)) {
      score += 25;
    }
    factors += 25;

    // Price range match (30% weight)
    if (property.price >= buyer.preferences.priceRange.min && 
        property.price <= buyer.preferences.priceRange.max) {
      score += 30;
    } else if (property.price <= buyer.preferences.priceRange.max * 1.1) {
      score += 20; // Partial credit if slightly over budget
    }
    factors += 30;

    // Location match (20% weight)
    const locationMatch = buyer.preferences.locations.some(loc => 
      property.location.city.toLowerCase() === loc.city.toLowerCase() &&
      property.location.state.toLowerCase() === loc.state.toLowerCase()
    );
    if (locationMatch) {
      score += 20;
    }
    factors += 20;

    // Bedroom match (15% weight)
    if (buyer.preferences.bedrooms.min && buyer.preferences.bedrooms.max) {
      if (property.details.bedrooms >= buyer.preferences.bedrooms.min && 
          property.details.bedrooms <= buyer.preferences.bedrooms.max) {
        score += 15;
      }
    } else if (buyer.preferences.bedrooms.min && 
               property.details.bedrooms >= buyer.preferences.bedrooms.min) {
      score += 15;
    }
    factors += 15;

    // Bathroom match (10% weight)
    if (buyer.preferences.bathrooms.min && 
        property.details.bathrooms >= buyer.preferences.bathrooms.min) {
      score += 10;
    }
    factors += 10;

    return Math.round((score / factors) * 100);
  }

  private calculateAlertPriority(property: Property, buyers: BuyerProfile[]): number {
    // Higher priority for expensive properties or high-engagement buyers
    let priority = 0;
    
    if (property.price > 1000000) priority += 1; // Luxury properties
    if (buyers.some(b => b.searchCriteria.urgency === 'high')) priority += 2;
    if (buyers.length > 10) priority += 1; // High demand
    
    return Math.min(priority, 3); // Max priority of 3
  }

  private async createPropertyAlerts(
    property: Property,
    buyers: BuyerProfile[],
    alertType: PropertyAlert['alertType']
  ): Promise<void> {
    const alerts: Partial<PropertyAlert>[] = buyers.map(buyer => ({
      buyerProfileId: buyer.id,
      propertyId: property.id,
      alertType,
      priority: this.calculateBuyerPriority(buyer),
      matchScore: this.calculateMatchScore(property, buyer),
      triggerData: {
        changedAt: new Date()
      },
      createdAt: new Date()
    }));

    await this.landivoAPI.createPropertyAlerts(alerts);
  }

  private calculateBuyerPriority(buyer: BuyerProfile): 'low' | 'medium' | 'high' {
    if (buyer.searchCriteria.urgency === 'high') return 'high';
    if (buyer.engagement.emailEngagement.opens > 10 && 
        buyer.engagement.propertiesViewed.length > 5) return 'high';
    if (buyer.engagement.emailEngagement.opens > 5) return 'medium';
    return 'low';
  }

  private hasSignificantPreferenceChange(
    previous: BuyerProfile['preferences'],
    current: BuyerProfile['preferences']
  ): boolean {
    // Check for significant changes in key preferences
    if (previous.priceRange.min !== current.priceRange.min ||
        previous.priceRange.max !== current.priceRange.max) return true;
    
    if (JSON.stringify(previous.propertyTypes) !== JSON.stringify(current.propertyTypes)) return true;
    if (JSON.stringify(previous.locations) !== JSON.stringify(current.locations)) return true;
    
    return false;
  }

  private async findInterestedBuyers(propertyId: string): Promise<BuyerProfile[]> {
    // Find buyers who have viewed, favorited, or inquired about this property
    return await this.landivoAPI.getBuyerProfiles({
      interestedInProperty: propertyId
    });
  }

  private async findSimilarProperties(
    property: Property,
    buyer: BuyerProfile
  ): Promise<Property[]> {
    return await this.landivoAPI.getProperties({
      similarTo: property.id,
      propertyTypes: [property.details.propertyType],
      priceRange: {
        min: property.price * 0.8,
        max: property.price * 1.2
      },
      location: property.location.city,
      maxResults: 10
    });
  }

  private async updateBuyerEngagement(
    buyerId: string,
    engagement: Partial<BuyerProfile['engagement']>
  ): Promise<void> {
    await this.landivoAPI.updateBuyerEngagement(buyerId, engagement);
  }

  // Additional handlers for completeness
  private async handlePropertyStatusChange(property: Property, oldStatus: string): Promise<void> {
    // Handle when properties go off market, pending, sold, etc.
    console.log(`Property status changed: ${property.id} from ${oldStatus} to ${property.status}`);
  }

  private async handlePriceChange(property: Property, oldPrice: number): Promise<void> {
    // Handle price changes specifically
    console.log(`Property price changed: ${property.id} from $${oldPrice} to $${property.price}`);
  }

  private async handlePropertyFavorited(propertyId: string, buyerId: string): Promise<void> {
    // Handle when buyers favorite properties
    console.log(`Property favorited: ${propertyId} by buyer ${buyerId}`);
  }

  private async handleInquirySent(propertyId: string, buyerId: string): Promise<void> {
    // Handle when buyers send inquiries
    console.log(`Inquiry sent for property: ${propertyId} by buyer ${buyerId}`);
  }
}

// Landivo API interface (to be implemented)
interface LandivoAPI {
  getProperty(id: string): Promise<Property | null>;
  getProperties(filters: any): Promise<Property[]>;
  getBuyerProfile(id: string): Promise<BuyerProfile | null>;
  getBuyerProfiles(filters: any): Promise<BuyerProfile[]>;
  createPropertyAlerts(alerts: Partial<PropertyAlert>[]): Promise<void>;
  updateBuyerEngagement(buyerId: string, engagement: Partial<BuyerProfile['engagement']>): Promise<void>;
  
  // Webhook event handlers
  onPropertyAdded(handler: (property: Property) => void): void;
  onPropertyUpdated(handler: (property: Property, changes: any[]) => void): void;
  onPropertyStatusChanged(handler: (property: Property, oldStatus: string) => void): void;
  onPriceChanged(handler: (property: Property, oldPrice: number) => void): void;
  onBuyerRegistered(handler: (buyer: BuyerProfile) => void): void;
  onBuyerPreferencesUpdated(handler: (buyer: BuyerProfile, previousPreferences: any) => void): void;
  onPropertyViewed(handler: (propertyId: string, buyerId: string, viewData: any) => void): void;
  onPropertyFavorited(handler: (propertyId: string, buyerId: string) => void): void;
  onInquirySent(handler: (propertyId: string, buyerId: string) => void): void;
}