// api/src/services/emailImageService.ts
import { render } from '@react-email/render';
import React from 'react';
import { getComponent } from '@landivo/email-template';
import { logger } from '../utils/logger';

export class EmailImageService {
  /**
   * Convert image URLs to base64 for email embedding
   */
  async embedImageAsBase64(imageUrl: string): Promise<string> {
    try {
      const response = await fetch(imageUrl);
      const buffer = await response.arrayBuffer();
      const base64 = Buffer.from(buffer).toString('base64');
      const mimeType = response.headers.get('content-type') || 'image/jpeg';
      return `data:${mimeType};base64,${base64}`;
    } catch (error) {
      console.error('Failed to convert image to base64:', error);
      return imageUrl; // Fallback to original URL
    }
  }

  /**
   * Process static image component for email rendering
   */
  async processStaticImageForEmail(componentProps: any): Promise<string> {
    try {
      // Get the StaticImage component from registry
      const componentMeta = getComponent('static-image');
      if (!componentMeta) {
        logger.warn('StaticImage component not found in registry');
        return '';
      }

      const props = { ...componentMeta.defaultProps, ...componentProps };

      // Option 1: Embed as base64 for better email client support
      if (props.embedAsBase64 && props.imageUrl) {
        props.imageUrl = await this.embedImageAsBase64(props.imageUrl);
      }

      // Option 2: Ensure absolute URLs
      if (props.imageUrl && !props.imageUrl.startsWith('http') && !props.imageUrl.startsWith('data:')) {
        props.imageUrl = `${process.env.API_URL || 'http://localhost:3001'}${props.imageUrl}`;
      }

      // Create React element using component from registry
      const element = React.createElement(componentMeta.component, props);
      
      // Render to HTML
      const html = await render(element, { pretty: false });

      return html;
    } catch (error) {
      console.error('Failed to process static image:', error);
      return '';
    }
  }

  /**
   * Optimize image HTML for email clients
   */
  optimizeImageHtml(html: string): string {
    // Add MSO (Outlook) specific fixes
    const msoFix = `
      <!--[if mso]>
      <style type="text/css">
        img { width: auto !important; max-width: 100% !important; }
      </style>
      <![endif]-->
    `;

    // Inline critical styles for better email client support
    const optimized = html.replace(
      /<img([^>]+)>/gi,
      (match, attributes) => {
        // Ensure display:block for proper rendering
        if (!attributes.includes('style=')) {
          return `<img${attributes} style="display:block;border:0;outline:none;text-decoration:none;">`;
        }
        return match.replace('style="', 'style="display:block;border:0;outline:none;text-decoration:none;');
      }
    );

    return msoFix + optimized;
  }

/**
 * Process image component in template rendering context
 */
renderImageComponent(component: any, propertyData?: any, contactData?: any): React.ReactElement | null {
  try {
    const componentMeta = getComponent('static-image');
    if (!componentMeta) {
      logger.warn('StaticImage component not found in registry');
      return null;
    }

    // Merge props with context data
    const finalProps = {
      ...componentMeta.defaultProps,
      ...component.props,
      propertyData,
      contactData,
    };

    // Ensure absolute URLs for images
    if (finalProps.imageUrl && !finalProps.imageUrl.startsWith('http')) {
      finalProps.imageUrl = `${process.env.API_URL || 'http://localhost:3001'}${finalProps.imageUrl}`;
    }

    return React.createElement(componentMeta.component, {
      key: component.id,
      ...finalProps
    });
  } catch (error) {
    logger.error('Failed to render image component:', error);
    return null;
  }
}
}

export const emailImageService = new EmailImageService();
