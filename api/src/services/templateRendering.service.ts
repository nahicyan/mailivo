// api/src/services/templateRendering.service.ts
import axios from 'axios';
import { EmailTemplate } from '../models/EmailTemplate.model';
import { logger } from '../utils/logger';

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

interface EmailComponent {
  id: string;
  type: string;
  name: string;
  icon: string;
  props: Record<string, any>;
  order: number;
}

class TemplateRenderingService {
  private readonly landivoApiUrl: string;

  constructor() {
    this.landivoApiUrl = process.env.LANDIVO_API_URL || 'https://api.landivo.com';
  }

  async renderTemplate(templateId: string, propertyId: string, contactData: any): Promise<{
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

      // 3. Generate HTML content using template components
      const htmlContent = this.generateEmailHTML(template, propertyData, contactData);
      
      // 4. Generate text version
      const textContent = this.generateTextContent(propertyData, contactData);
      
      // 5. Generate subject with property data
      const subject = this.generateSubject(template.name, propertyData, contactData);

      return {
        subject,
        htmlContent,
        textContent
      };

    } catch (error) {
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
      return property || null;

    } catch (error) {
      logger.error(`Failed to fetch property ${propertyId}:`, error);
      return null;
    }
  }

  private generateEmailHTML(template: any, propertyData: LandivoProperty, contactData: any): string {
    // Process property data
    const processedPropertyData = this.processPropertyData(propertyData);
    
    // Sort components by order
    const sortedComponents = template.components.sort((a: EmailComponent, b: EmailComponent) => a.order - b.order);
    
    // Generate HTML for each component
    let componentsHTML = '';
    
    for (const component of sortedComponents) {
      componentsHTML += this.renderComponent(component, processedPropertyData, contactData);
    }

    // Wrap in email structure
    return `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${processedPropertyData.title}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: ${template.settings?.backgroundColor || '#f9fafb'}; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
            .component { margin-bottom: 20px; }
            .currency { color: #16a34a; font-weight: bold; }
            .highlight { background-color: #f0f9ff; padding: 15px; border-radius: 8px; margin: 10px 0; }
            .property-image { width: 100%; max-width: 500px; height: auto; border-radius: 8px; }
            .payment-box { background-color: #16a34a; color: white; padding: 20px; border-radius: 8px; text-align: center; }
            .footer { background-color: #f3f4f6; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; }
          </style>
        </head>
        <body>
          <div class="container">
            ${componentsHTML}
            <div class="footer">
              <p>You're receiving this because you're interested in real estate opportunities.</p>
              <p><a href="{{unsubscribeLink}}">Unsubscribe</a> | <a href="https://landivo.com">Visit Landivo</a></p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  private renderComponent(component: EmailComponent, propertyData: any, contactData: any): string {
    const props = { ...component.props, ...propertyData };

    switch (component.type) {
      case 'header':
        return `
          <div class="component" style="background-color: ${props.backgroundColor || '#16a34a'}; color: white; padding: 30px; text-align: center;">
            ${props.imageUrl || propertyData.primaryImageUrl ? `<img src="${props.imageUrl || propertyData.primaryImageUrl}" alt="Property" class="property-image" style="margin-bottom: 15px;" />` : ''}
            <h1 style="margin: 0; font-size: 28px;">${props.title || propertyData.title}</h1>
            <p style="margin: 10px 0 0; font-size: 16px; opacity: 0.9;">${propertyData.city}, ${propertyData.state}</p>
          </div>
        `;

      case 'property-highlights':
        return `
          <div class="component" style="padding: 20px;">
            <h2 style="color: #1f2937; margin-bottom: 20px;">Property Highlights</h2>
            <div class="highlight">
              <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px;">
                <div><strong>Size:</strong> ${propertyData.sqft?.toLocaleString()} sqft</div>
                <div><strong>Land:</strong> ${propertyData.acre} acres</div>
                <div><strong>Zoning:</strong> ${propertyData.zoning}</div>
                <div><strong>Price:</strong> <span class="currency">$${propertyData.askingPrice?.toLocaleString()}</span></div>
              </div>
              ${propertyData.financing === 'Available' ? '<p style="margin-top: 15px; color: #16a34a; font-weight: bold;">✓ Financing Available</p>' : ''}
            </div>
          </div>
        `;

      case 'property-details':
        return `
          <div class="component" style="padding: 20px;">
            <h2 style="color: #1f2937; margin-bottom: 15px;">Property Details</h2>
            <p><strong>Address:</strong> ${propertyData.streetAddress}, ${propertyData.city}, ${propertyData.state} ${propertyData.zip}</p>
            <p><strong>County:</strong> ${propertyData.county}</p>
            ${propertyData.description ? `<p><strong>Description:</strong> ${propertyData.description}</p>` : ''}
          </div>
        `;

      case 'payment-calculator':
        return `
          <div class="component" style="padding: 20px;">
            <h2 style="color: #1f2937; margin-bottom: 20px;">Payment Information</h2>
            <div class="payment-box">
              <h3 style="margin: 0 0 15px;">Monthly Payment</h3>
              <div style="font-size: 32px; font-weight: bold; margin-bottom: 15px;">$${propertyData.monthlyPaymentOne?.toLocaleString()}</div>
              <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; font-size: 14px;">
                <div>Down Payment: $${propertyData.downPaymentOne?.toLocaleString()}</div>
                <div>Loan Amount: $${propertyData.loanAmountOne?.toLocaleString()}</div>
                <div>Interest Rate: ${propertyData.interestOne}%</div>
                <div>Tax: $${propertyData.tax?.toLocaleString()}/year</div>
              </div>
            </div>
          </div>
        `;

      case 'property-image':
        if (propertyData.primaryImageUrl) {
          return `
            <div class="component" style="padding: 20px; text-align: center;">
              <img src="${propertyData.primaryImageUrl}" alt="${propertyData.title}" class="property-image" />
            </div>
          `;
        }
        return '';

      case 'buyer-guidelines':
        return `
          <div class="component" style="padding: 20px; background-color: #f8fafc;">
            <h2 style="color: #1f2937; margin-bottom: 15px;">How to Purchase</h2>
            <ol style="padding-left: 20px;">
              <li>Contact us to schedule a viewing</li>
              <li>Submit your financing application</li>
              <li>Complete the property inspection</li>
              <li>Close on your new property</li>
            </ol>
            <p style="margin-top: 15px;"><strong>Questions?</strong> Contact us at <a href="mailto:info@landivo.com">info@landivo.com</a></p>
          </div>
        `;

      default:
        return `<div class="component">${component.name} component</div>`;
    }
  }

  private processPropertyData(propertyData: LandivoProperty): any {
    let primaryImageUrl = null;
    
    try {
      if (propertyData.imageUrls) {
        const images = Array.isArray(propertyData.imageUrls)
          ? propertyData.imageUrls
          : JSON.parse(propertyData.imageUrls);
        primaryImageUrl = images.length > 0 ? `${this.landivoApiUrl}/${images[0]}` : null;
      }
    } catch (error) {
      logger.warn('Failed to parse property images:', error);
    }

    return {
      ...propertyData,
      primaryImageUrl,
      formattedPrice: propertyData.askingPrice?.toLocaleString(),
      formattedSqft: propertyData.sqft?.toLocaleString(),
      formattedMonthlyPayment: propertyData.monthlyPaymentOne?.toLocaleString(),
    };
  }

  private generateTextContent(propertyData: LandivoProperty, contactData: any): string {
    return `
${propertyData.title}
${propertyData.city}, ${propertyData.state}

Property Details:
- Address: ${propertyData.streetAddress}, ${propertyData.city}, ${propertyData.state} ${propertyData.zip}
- Size: ${propertyData.sqft?.toLocaleString()} sqft
- Land: ${propertyData.acre} acres
- Price: $${propertyData.askingPrice?.toLocaleString()}
- Monthly Payment: $${propertyData.monthlyPaymentOne?.toLocaleString()}

${propertyData.description || ''}

Contact us for more information or to schedule a viewing.

Unsubscribe: {{unsubscribeLink}}
    `.trim();
  }

  private generateSubject(templateName: string, propertyData: LandivoProperty, contactData: any): string {
    const firstName = contactData.firstName || contactData.first_name || '';
    const greeting = firstName ? `${firstName}, ` : '';
    
    return `${greeting}${propertyData.title} - ${propertyData.city}, ${propertyData.state}`;
  }
}

export const templateRenderingService = new TemplateRenderingService();