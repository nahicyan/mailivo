// api/src/services/automation-matcher.service.ts
import axios from 'axios';
import { logger } from '../utils/logger';

const LANDIVO_API_URL = process.env.LANDIVO_API_URL || 'https://api.landivo.com';

class AutomationMatcherService {
  /**
   * Evaluate if an automation matches the incoming trigger data
   */
  async evaluateAutomation(automation: any, triggerData: any): Promise<boolean> {
    try {
      // Check if conditions exist
      if (!automation.conditions || automation.conditions.length === 0) {
        // No conditions = always match
        return true;
      }

      // Evaluate all conditions
      for (const condition of automation.conditions) {
        const matches = await this.evaluateCondition(condition, triggerData, automation.userId);
        if (!matches) {
          return false; // All conditions must match
        }
      }

      return true;
    } catch (error: any) {
      logger.error('Automation evaluation failed', { 
        automationId: automation._id, 
        error: error.message 
      });
      return false;
    }
  }

  /**
   * Evaluate a single condition
   */
  private async evaluateCondition(
    condition: any, 
    triggerData: any, 
    userId: string
  ): Promise<boolean> {
    const { category, conditions: filters, matchAll = true } = condition;

    let entities: any[] = [];

    // Fetch entities based on category
    switch (category) {
      case 'property_data':
        if (!triggerData.propertyIds || triggerData.propertyIds.length === 0) {
          return false;
        }
        entities = await this.fetchProperties(triggerData.propertyIds);
        break;

      case 'campaign_data':
        if (!triggerData.campaignId) {
          return false;
        }
        entities = await this.fetchCampaigns([triggerData.campaignId], userId);
        break;

      case 'buyer_data':
        if (!triggerData.buyerId) {
          return false;
        }
        entities = await this.fetchBuyers([triggerData.buyerId]);
        break;

      default:
        return true;
    }

    if (entities.length === 0) {
      return false;
    }

    // Apply filters to entities
    const results = entities.map(entity => 
      this.applyFilters(entity, filters, matchAll)
    );

    // At least one entity must match
    return results.some(r => r);
  }

  /**
   * Apply filters to an entity
   */
  private applyFilters(entity: any, filters: any[], matchAll: boolean): boolean {
    const results = filters.map(filter => {
      const value = this.getNestedValue(entity, filter.field);
      return this.compareValues(value, filter.operator, filter.value, filter.secondValue);
    });

    return matchAll ? results.every(r => r) : results.some(r => r);
  }

  /**
   * Get nested value from object using dot notation
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  /**
   * Compare values based on operator
   */
  private compareValues(
    entityValue: any,
    operator: string,
    filterValue: any,
    secondValue?: any
  ): boolean {
    switch (operator) {
      case 'equals':
        return entityValue == filterValue;

      case 'not_equals':
        return entityValue != filterValue;

      case 'contains':
        return String(entityValue).toLowerCase().includes(String(filterValue).toLowerCase());

      case 'not_contains':
        return !String(entityValue).toLowerCase().includes(String(filterValue).toLowerCase());

      case 'starts_with':
        return String(entityValue).toLowerCase().startsWith(String(filterValue).toLowerCase());

      case 'ends_with':
        return String(entityValue).toLowerCase().endsWith(String(filterValue).toLowerCase());

      case 'greater_than':
        return Number(entityValue) > Number(filterValue);

      case 'less_than':
        return Number(entityValue) < Number(filterValue);

      case 'greater_than_or_equal':
        return Number(entityValue) >= Number(filterValue);

      case 'less_than_or_equal':
        return Number(entityValue) <= Number(filterValue);

      case 'between':
        return Number(entityValue) >= Number(filterValue) && 
               Number(entityValue) <= Number(secondValue);

      case 'in':
        return Array.isArray(filterValue) && filterValue.includes(entityValue);

      case 'not_in':
        return Array.isArray(filterValue) && !filterValue.includes(entityValue);

      case 'is_empty':
        return !entityValue || entityValue === '' || 
               (Array.isArray(entityValue) && entityValue.length === 0);

      case 'is_not_empty':
        return !!entityValue && entityValue !== '' && 
               (!Array.isArray(entityValue) || entityValue.length > 0);

      default:
        logger.warn(`Unknown operator: ${operator}`);
        return false;
    }
  }

  /**
   * Fetch property data from Landivo API
   */
  private async fetchProperties(propertyIds: string[]): Promise<any[]> {
    try {
      const properties = await Promise.all(
        propertyIds.map(async (id) => {
          try {
            const response = await axios.get(`${LANDIVO_API_URL}/residency/get/${id}`);
            return response.data;
          } catch (error) {
            logger.error(`Failed to fetch property ${id}`, { error });
            return null;
          }
        })
      );

      return properties.filter(p => p !== null);
    } catch (error: any) {
      logger.error('Failed to fetch properties', { error: error.message });
      return [];
    }
  }

  /**
   * Fetch campaign data
   */
  private async fetchCampaigns(campaignIds: string[], userId: string): Promise<any[]> {
    try {
      // Import Campaign model here to avoid circular dependencies
      const { Campaign } = require('../models/Campaign');
      
      const campaigns = await Campaign.find({
        _id: { $in: campaignIds },
        userId
      }).lean();

      return campaigns;
    } catch (error: any) {
      logger.error('Failed to fetch campaigns', { error: error.message });
      return [];
    }
  }

  /**
   * Fetch buyer data from Landivo API
   */
  private async fetchBuyers(buyerIds: string[]): Promise<any[]> {
    try {
      const buyers = await Promise.all(
        buyerIds.map(async (id) => {
          try {
            const response = await axios.get(`${LANDIVO_API_URL}/buyers/${id}`);
            return response.data;
          } catch (error) {
            logger.error(`Failed to fetch buyer ${id}`, { error });
            return null;
          }
        })
      );

      return buyers.filter(b => b !== null);
    } catch (error: any) {
      logger.error('Failed to fetch buyers', { error: error.message });
      return [];
    }
  }
}

export const automationMatcherService = new AutomationMatcherService();