// api/src/services/templateRendering.service.ts
import axios from 'axios';
import { EmailTemplate } from '../models/EmailTemplate.model';
import { logger } from '../utils/logger';
import { getComponent, componentRegistry } from '@landivo/email-template';
import { render } from '@react-email/render';
import React from 'react';

interface LandivoProperty {
  id: string;
  title: string;
  streetAddress: string;
  city: string;
  state: string;
  zip: string;
  county: string;
  sqft: number;
  acre: number;
  zoning: string;
  landType: string[];
  askingPrice: number;
  monthlyPaymentOne: number;
  downPaymentOne: number;
  loanAmountOne: number;
  interestOne: number;
  monthlyPaymentTwo: number;
  downPaymentTwo: number;
  loanAmountTwo: number;
  interestTwo: number;
  monthlyPaymentThree: number;
  downPaymentThree: number;
  loanAmountThree: number;
  interestThree: number;
  tax: number;
  serviceFee: number;
  financing: string;
  financingTwo: string;
  financingThree: string;
  description: string;
  status: string;
  imageUrls: string;
  createdAt: string;
  updatedAt: string;
}

interface ContactData {
  email: string;
  firstName?: string;
  lastName?: string;
  preferences?: Record<string, any>;
  [key: string]: any;
}

interface CampaignData {
  selectedPlan?: {
    planNumber: number;
    planName: string;
    downPayment: number;
    loanAmount: number;
    interestRate: number;
    monthlyPayment: number;
  } | Array<{
    propertyId: string;
    planNumber: number;
    planName: string;
    downPayment: number;
    loanAmount: number;
    interestRate: number;
    monthlyPayment: number;
    isAvailable: boolean;
  }> | null;
  imageSelections?: Record<string, {
    name?: string;
    propertyId?: string;  // For multi-property
    imageIndex: number;
    imageUrl?: string;    // For multi-property
    order: number;
  }>;
  [key: string]: any;
}

interface EmailComponent {
  id: string;
  type: string;
  name: string;
  icon: string;
  props: Record<string, any>;
  order: number;
}

interface ProcessedPropertyData extends LandivoProperty {
  primaryImageUrl?: string;
  formattedPrice: string;
  formattedSqft: string;
  formattedMonthlyPayment: string;
  disPrice?: number;
  minPrice?: number;
}

interface ProcessedMultiPropertyData {
  properties: ProcessedPropertyData[];
  selectedPlans: Array<{
    propertyId: string;
    planNumber: number;
    planName: string;
    downPayment: number;
    loanAmount: number;
    interestRate: number;
    monthlyPayment: number;
    isAvailable: boolean;
  }>;
  imageSelections: Record<string, {
    propertyId: string;
    imageIndex: number;
    imageUrl?: string;
    order: number;
  }>;
}

class TemplateRenderingService {
  private readonly landivoApiUrl: string;

  constructor() {
    this.landivoApiUrl = process.env.LANDIVO_API_URL || 'https://api.landivo.com';
  }

  async renderTemplate(
    templateId: string, 
    property: string | string[], 
    contactData: ContactData, 
    campaignSubject?: string,
    campaignData?: CampaignData
  ): Promise<{
    subject: string;
    htmlContent: string;
    textContent: string;
  }> {
    try {
      // 1. Fetch template from database
      const template = await EmailTemplate.findById(templateId);
      if (!template) {
        throw new Error(`Template ${templateId} not found`);
      }

      // 2. Determine if this is single or multi-property campaign
      const isMultiProperty = Array.isArray(property);

      if (isMultiProperty) {
        return await this.renderMultiPropertyTemplate(
          template,
          property as string[],
          contactData,
          campaignSubject,
          campaignData
        );
      } else {
        return await this.renderSinglePropertyTemplate(
          template,
          property as string,
          contactData,
          campaignSubject,
          campaignData
        );
      }

    } catch (error: any) {
      logger.error('Template rendering failed:', error);
      throw new Error(`Template rendering failed: ${error.message}`);
    }
  }

  private async renderSinglePropertyTemplate(
    template: any,
    propertyId: string,
    contactData: ContactData,
    campaignSubject?: string,
    campaignData?: CampaignData
  ): Promise<{
    subject: string;
    htmlContent: string;
    textContent: string;
  }> {
    // Fetch and process single property data
    const propertyData = await this.fetchPropertyData(propertyId);
    if (!propertyData) {
      throw new Error(`Property ${propertyId} not found`);
    }

    const processedPropertyData = this.processPropertyData(propertyData);

    // Generate HTML content using React Email
    const htmlContent = await this.generateEmailHTML(template, processedPropertyData, contactData, campaignData);

    // Generate text version
    const textContent = this.generateTextContent(template, processedPropertyData, contactData, campaignData);

    // Generate subject
    const subject = campaignSubject || this.generateSubject(template.name, processedPropertyData, contactData);

    return {
      subject,
      htmlContent,
      textContent
    };
  }

  private async renderMultiPropertyTemplate(
    template: any,
    propertyIds: string[],
    contactData: ContactData,
    campaignSubject?: string,
    campaignData?: CampaignData
  ): Promise<{
    subject: string;
    htmlContent: string;
    textContent: string;
  }> {
    // Fetch all properties
    const propertyPromises = propertyIds.map(id => this.fetchPropertyData(id));
    const propertyResults = await Promise.allSettled(propertyPromises);

    // Process successful property fetches
    const properties: ProcessedPropertyData[] = [];
    propertyResults.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value) {
        properties.push(this.processPropertyData(result.value));
      } else {
        logger.warn(`Failed to fetch property ${propertyIds[index]}:`, 
          result.status === 'rejected' ? result.reason : 'Property not found');
      }
    });

    if (properties.length === 0) {
      throw new Error('No properties could be loaded for multi-property campaign');
    }

    // Process multi-property campaign data
    const multiPropertyData: ProcessedMultiPropertyData = {
      properties,
      selectedPlans: this.processMultiPropertyPlans(campaignData?.selectedPlan as any, propertyIds),
      imageSelections: this.processMultiPropertyImages(campaignData?.imageSelections || {})
    };

    // Generate HTML content using React Email
    const htmlContent = await this.generateMultiPropertyEmailHTML(template, multiPropertyData, contactData);

    // Generate text version
    const textContent = this.generateMultiPropertyTextContent(template, multiPropertyData, contactData);

    // Generate subject (use first property for subject generation)
    const subject = campaignSubject || this.generateSubject(template.name, properties[0], contactData);

    return {
      subject,
      htmlContent,
      textContent
    };
  }

  private processMultiPropertyPlans(
    selectedPlan: Array<{
      propertyId: string;
      planNumber: number;
      planName: string;
      downPayment: number;
      loanAmount: number;
      interestRate: number;
      monthlyPayment: number;
      isAvailable: boolean;
    }> | null,
    propertyIds: string[]
  ): Array<any> {
    if (!selectedPlan || !Array.isArray(selectedPlan)) {
      return [];
    }
    return selectedPlan.filter(plan => propertyIds.includes(plan.propertyId));
  }

  private processMultiPropertyImages(
    imageSelections: Record<string, any>
  ): Record<string, any> {
    const processed: Record<string, any> = {};
    
    Object.entries(imageSelections).forEach(([key, selection]) => {
      if (selection.propertyId) {
        processed[key] = selection;
      }
    });
    
    return processed;
  }

  private async fetchPropertyData(propertyId: string): Promise<LandivoProperty | null> {
    try {
      const response = await axios.get(`${this.landivoApiUrl}/residency/${propertyId}`, {
        timeout: 10000,
      });
      return response.data;
    } catch (error: any) {
      logger.error(`Failed to fetch property ${propertyId}:`, error);
      throw new Error(`Failed to fetch property data: ${error.message}`);
    }
  }

  private processPropertyData(propertyData: LandivoProperty): ProcessedPropertyData {
    let primaryImageUrl: string | undefined;

    try {
      if (propertyData.imageUrls) {
        const images = Array.isArray(propertyData.imageUrls)
          ? propertyData.imageUrls
          : JSON.parse(propertyData.imageUrls);
        primaryImageUrl = images.length > 0 ? `${this.landivoApiUrl}/${images[0]}` : undefined;
      }
    } catch (error: any) {
      logger.warn('Failed to parse property images:', error);
    }

    return {
      ...propertyData,
      primaryImageUrl,
      formattedPrice: propertyData.askingPrice?.toLocaleString() || '0',
      formattedSqft: propertyData.sqft?.toLocaleString() || '0',
      formattedMonthlyPayment: propertyData.monthlyPaymentOne?.toLocaleString() || '0',
    };
  }

  private async generateEmailHTML(
    template: any,
    propertyData: ProcessedPropertyData,
    contactData: ContactData,
    campaignData?: CampaignData
  ): Promise<string> {
    try {
      // Sort components by order
      const sortedComponents = template.components.sort((a: EmailComponent, b: EmailComponent) => a.order - b.order);

      // Create React elements for each component
      const renderedComponents = sortedComponents.map((component: EmailComponent) =>
        this.renderComponentToReact(component, propertyData, contactData, campaignData)
      ).filter(Boolean);

      // Create the email structure with React Email
      const emailElement = React.createElement(
        'div',
        { style: { fontFamily: 'Arial, sans-serif', backgroundColor: template.settings?.backgroundColor || '#ffffff' } },
        ...renderedComponents
      );

      // Render to HTML using React Email
      const htmlContent = await render(emailElement, {
        pretty: false,
      });

      return htmlContent;

    } catch (error: any) {
      logger.error('Failed to generate HTML content:', error);
      throw new Error(`Template rendering failed: ${error.message}`);
    }
  }

  private async generateMultiPropertyEmailHTML(
    template: any,
    multiPropertyData: ProcessedMultiPropertyData,
    contactData: ContactData
  ): Promise<string> {
    try {
      // Sort components by order
      const sortedComponents = template.components.sort((a: EmailComponent, b: EmailComponent) => a.order - b.order);

      // Create React elements for each component
      const renderedComponents = sortedComponents.map((component: EmailComponent) =>
        this.renderMultiPropertyComponentToReact(component, multiPropertyData, contactData)
      ).filter(Boolean);

      // Create the email structure with React Email
      const emailElement = React.createElement(
        'div',
        { style: { fontFamily: 'Arial, sans-serif', backgroundColor: template.settings?.backgroundColor || '#ffffff' } },
        ...renderedComponents
      );

      // Render to HTML using React Email
      const htmlContent = await render(emailElement, {
        pretty: false,
      });

      return htmlContent;

    } catch (error: any) {
      logger.error('Failed to generate multi-property HTML content:', error);
      throw new Error(`Multi-property template rendering failed: ${error.message}`);
    }
  }

  private renderComponentToReact(
    component: EmailComponent,
    propertyData: ProcessedPropertyData,
    contactData: ContactData,
    campaignData?: CampaignData
  ): React.ReactElement | null {
    try {
      // Get component metadata from registry
      const componentMeta = getComponent(component.type);
      if (!componentMeta) {
        logger.warn(`Unknown component type: ${component.type}`);
        return null;
      }

      // Merge default props with component props and context data
      const finalProps: any = {
        ...componentMeta.defaultProps,
        ...component.props,
        // Inject property data as props for components that need it
        propertyData,
        contactData,
        // Common data that all components might use
        property: propertyData,
        contact: contactData,
      };

      // Handle payment-calculator specific logic
      if (component.type === 'payment-calculator' && campaignData?.selectedPlan) {
        const plan = campaignData.selectedPlan as any;
        finalProps.selectedPlan = plan.planNumber?.toString();
        logger.info(`Setting payment calculator to plan ${plan.planNumber}`, {
          componentId: component.id,
          planNumber: plan.planNumber,
          planName: plan.planName
        });
      }

      // Handle property-image specific logic
      if (component.type === 'property-image' && campaignData?.imageSelections) {
        const imageSelection = campaignData.imageSelections[component.id];
        if (imageSelection) {
          finalProps.imageIndex = imageSelection.imageIndex;
          logger.info(`Setting property image index to ${imageSelection.imageIndex}`, {
            componentId: component.id,
            imageIndex: imageSelection.imageIndex,
            imageName: imageSelection.name
          });
        }
      }

      // Create React element using the component from registry
      return React.createElement(componentMeta.component, {
        key: component.id,
        ...finalProps
      });

    } catch (error: any) {
      logger.error(`Failed to render component ${component.type}:`, error);
      return null;
    }
  }

  private renderMultiPropertyComponentToReact(
    component: EmailComponent,
    multiPropertyData: ProcessedMultiPropertyData,
    contactData: ContactData
  ): React.ReactElement | null {
    try {
      // Get component metadata from registry
      const componentMeta = getComponent(component.type);
      if (!componentMeta) {
        logger.warn(`Unknown component type: ${component.type}`);
        return null;
      }

      // Merge default props with component props and context data
      const finalProps: any = {
        ...componentMeta.defaultProps,
        ...component.props,
        contactData,
        contact: contactData,
      };

      // Handle properties-row component specifically for multi-property campaigns
      if (component.type === 'properties-row') {
        // Transform processed property data for PropertiesRow component
        const propertiesForComponent = multiPropertyData.properties.map((property, _index) => {
          // Find the selected plan for this property
          const selectedPlan = multiPropertyData.selectedPlans.find(
            plan => plan.propertyId === property.id
          );

          // Find image selection for this property
          const imageSelection = Object.values(multiPropertyData.imageSelections).find(
            (selection: any) => selection.propertyId === property.id
          ) as any;

          // Parse imageUrls to get available images
          let imageUrls: string[] = [];
          try {
            imageUrls = typeof property.imageUrls === 'string' 
              ? JSON.parse(property.imageUrls)
              : property.imageUrls || [];
          } catch {
            imageUrls = [];
          }

          // Build the property object for PropertiesRow
          return {
            id: property.id,
            images: imageUrls.map(url => `${this.landivoApiUrl}/${url}`),
            imageUrls: imageUrls.map(url => `${this.landivoApiUrl}/${url}`),
            county: property.county,
            city: property.city,
            state: property.state,
            zip: property.zip,
            streetAddress: property.streetAddress,
            acre: property.acre,
            askingPrice: property.askingPrice,
            disPrice: property.disPrice || property.askingPrice,
            minPrice: property.minPrice || property.askingPrice,
            monthlyPayment: selectedPlan?.monthlyPayment || property.monthlyPaymentOne,
            planName: selectedPlan?.planName,
            title: property.title,
            // Add selected image index if available
            selectedImageIndex: imageSelection?.imageIndex || 0
          };
        });

        finalProps.properties = propertiesForComponent;

        logger.info(`Rendering properties-row with ${propertiesForComponent.length} properties`, {
          componentId: component.id,
          propertyCount: propertiesForComponent.length,
          propertyIds: propertiesForComponent.map(p => p.id)
        });

      } else {
        // For non-properties-row components, use the first property as primary data
        const primaryProperty = multiPropertyData.properties[0];
        finalProps.propertyData = primaryProperty;
        finalProps.property = primaryProperty;

        // Handle payment-calculator for multi-property (use first property's plan)
        if (component.type === 'payment-calculator' && multiPropertyData.selectedPlans.length > 0) {
          const firstPlan = multiPropertyData.selectedPlans[0];
          finalProps.selectedPlan = firstPlan.planNumber?.toString();
          logger.info(`Setting payment calculator to first property's plan ${firstPlan.planNumber}`, {
            componentId: component.id,
            propertyId: firstPlan.propertyId,
            planNumber: firstPlan.planNumber
          });
        }

        // Handle property-image for multi-property (use first property's image)
        if (component.type === 'property-image') {
          const firstPropertyImageSelection = Object.values(multiPropertyData.imageSelections)
            .find((selection: any) => selection.propertyId === primaryProperty.id) as any;
          
          if (firstPropertyImageSelection) {
            finalProps.imageIndex = firstPropertyImageSelection.imageIndex;
            logger.info(`Setting property image index to ${firstPropertyImageSelection.imageIndex}`, {
              componentId: component.id,
              propertyId: primaryProperty.id,
              imageIndex: firstPropertyImageSelection.imageIndex
            });
          }
        }
      }

      // Create React element using the component from registry
      return React.createElement(componentMeta.component, {
        key: component.id,
        ...finalProps
      });

    } catch (error: any) {
      logger.error(`Failed to render multi-property component ${component.type}:`, error);
      return null;
    }
  }

  private generateTextContent(
    template: any,
    propertyData: ProcessedPropertyData,
    contactData: ContactData,
    _campaignData?: CampaignData
  ): string {
    // Generate text content for single property
    const textParts = template.components
      .sort((a: EmailComponent, b: EmailComponent) => a.order - b.order)
      .map((component: EmailComponent) => {
        const componentMeta = getComponent(component.type);
        if (!componentMeta) return '';
        
        return this.renderComponentToText(component, componentMeta, propertyData, contactData);
      })
      .filter(Boolean);

    return textParts.join('\n\n');
  }

  private generateMultiPropertyTextContent(
    template: any,
    multiPropertyData: ProcessedMultiPropertyData,
    contactData: ContactData
  ): string {
    // Generate text content for multi-property
    const textParts = template.components
      .sort((a: EmailComponent, b: EmailComponent) => a.order - b.order)
      .map((component: EmailComponent) => {
        const componentMeta = getComponent(component.type);
        if (!componentMeta) return '';
        
        if (component.type === 'properties-row') {
          // Generate text for all properties
          return multiPropertyData.properties.map(property => 
            `${property.title} - ${property.city}, ${property.state} ${property.zip} - $${property.formattedPrice}`
          ).join('\n');
        } else {
          // Use first property for other components
          return this.renderComponentToText(component, componentMeta, multiPropertyData.properties[0], contactData);
        }
      })
      .filter(Boolean);

    return textParts.join('\n\n');
  }

  private renderComponentToText(component: any, _componentMeta: any, propertyData: any, _contactData: any): string {
    switch (component.type) {
      case 'header':
        return component.props.text || '';
      case 'property-image':
        return `[Image: ${propertyData.title}]`;
      case 'properties-row':
        return `Properties: ${propertyData.title} - ${propertyData.city}, ${propertyData.state}`;
      case 'payment-calculator':
        return `Monthly Payment: $${propertyData.formattedMonthlyPayment}`;
      default:
        return '';
    }
  }

  private generateSubject(_templateName: string, propertyData: ProcessedPropertyData, contactData: ContactData): string {
    const firstName = contactData.firstName || contactData.first_name || '';
    const greeting = firstName ? `${firstName}, ` : '';

    // Simple subject generation using template name and property data
    return `${greeting}${propertyData.title} - ${propertyData.city}, ${propertyData.state}`;
  }

  // Public method to test component rendering
  async testComponentRendering(componentType: string, props: Record<string, any>): Promise<{
    htmlContent: string;
    textContent: string;
  }> {
    try {
      const componentMeta = getComponent(componentType);
      if (!componentMeta) {
        throw new Error(`Component type ${componentType} not found in registry`);
      }

      const finalProps = { ...componentMeta.defaultProps, ...props };
      const reactElement = React.createElement(componentMeta.component, finalProps);
      const htmlContent = await render(reactElement);

      // Generate text using same modular approach
      const mockComponent = { id: 'test', type: componentType, name: 'Test', icon: '', props, order: 0 };
      const textContent = this.renderComponentToText(mockComponent, componentMeta, {} as any, {} as any);

      return { htmlContent, textContent };

    } catch (error: any) {
      logger.error(`Failed to test render component ${componentType}:`, error);
      throw error;
    }
  }

  // Get available component types from registry
  getAvailableComponents(): string[] {
    return Object.keys(componentRegistry);
  }
}

export const templateRenderingService = new TemplateRenderingService();