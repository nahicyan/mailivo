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
  tax: number;
  serviceFee: number;
  financing: string;
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
}

class TemplateRenderingService {
  private readonly landivoApiUrl: string;

  constructor() {
    this.landivoApiUrl = process.env.LANDIVO_API_URL || 'https://api.landivo.com';
  }

  async renderTemplate(templateId: string, propertyId: string, contactData: ContactData): Promise<{
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

      // 2. Fetch property data from Landivo
      const propertyData = await this.fetchPropertyData(propertyId);
      if (!propertyData) {
        throw new Error(`Property ${propertyId} not found`);
      }

      // 3. Process property data
      const processedPropertyData = this.processPropertyData(propertyData);

      // 4. Generate HTML content using React Email
      const htmlContent = await this.generateEmailHTML(template, processedPropertyData, contactData);
      
      // 5. Generate text version
      const textContent = this.generateTextContent(template, processedPropertyData, contactData);
      
      // 6. Generate subject with property data
      const subject = this.generateSubject(template.name, processedPropertyData, contactData);

      return {
        subject,
        htmlContent,
        textContent
      };

    } catch (error: any) {
      logger.error('Template rendering failed:', error);
      throw error;
    }
  }

  private async fetchPropertyData(propertyId: string): Promise<LandivoProperty | null> {
    try {
      const response = await axios.get(`${this.landivoApiUrl}/residency/allresd`);
      const properties = response.data;
      
      if (!Array.isArray(properties)) {
        logger.error('Invalid properties response from Landivo');
        return null;
      }

      const property = properties.find((p: any) => p.id === propertyId);
      if (!property) {
        logger.warn(`Property ${propertyId} not found in Landivo`);
        return null;
      }

      return property;

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
    contactData: ContactData
  ): Promise<string> {
    try {
      // Sort components by order
      const sortedComponents = template.components.sort((a: EmailComponent, b: EmailComponent) => a.order - b.order);
      
      // Create React elements for each component
      const renderedComponents = sortedComponents.map((component: EmailComponent) => 
        this.renderComponentToReact(component, propertyData, contactData)
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

  private renderComponentToReact(
    component: EmailComponent, 
    propertyData: ProcessedPropertyData, 
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
      const finalProps = {
        ...componentMeta.defaultProps,
        ...component.props,
        // Inject property data as props for components that need it
        propertyData,
        contactData,
        // Common data that all components might use
        property: propertyData,
        contact: contactData,
      };

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

  private generateTextContent(
    template: any,
    propertyData: ProcessedPropertyData, 
    contactData: ContactData
  ): string {
    try {
      const components = template.components.sort((a: EmailComponent, b: EmailComponent) => a.order - b.order);
      
      let textContent = '';

      // Generate text content based on components
      for (const component of components) {
        const componentMeta = getComponent(component.type);
        if (!componentMeta) continue;

        const textRepresentation = this.renderComponentToText(component, componentMeta, propertyData, contactData);
        if (textRepresentation) {
          textContent += textRepresentation + '\n\n';
        }
      }

      // Add standard footer
      textContent += '\n---\n';
      textContent += 'Contact us for more information or to schedule a viewing.\n';
      textContent += 'Unsubscribe: {{unsubscribeLink}}\n';
      textContent += 'Visit us: https://landivo.com\n';

      return textContent.trim();

    } catch (error: any) {
      logger.error('Failed to generate text content:', error);
      throw new Error(`Text content generation failed: ${error.message}`);
    }
  }

  private renderComponentToText(
    component: EmailComponent,
    componentMeta: any,
    propertyData: ProcessedPropertyData,
    contactData: ContactData
  ): string {
    const finalProps = {
      ...componentMeta.defaultProps,
      ...component.props,
      propertyData,
      contactData,
      property: propertyData,
      contact: contactData,
    };

    // Try to extract text from component props in order of preference
    const textFields = ['text', 'title', 'content', 'label', 'heading'];
    
    for (const field of textFields) {
      if (finalProps[field] && typeof finalProps[field] === 'string') {
        return finalProps[field];
      }
    }

    // If no text fields found, return component display name
    return `[${componentMeta.displayName || component.name}]`;
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