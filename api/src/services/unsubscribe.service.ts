// api/src/services/unsubscribe.service.ts - NEW FILE
import { nanoid } from 'nanoid';
import { logger } from '../utils/logger';

interface UnsubscribeLink {
  linkId: string;
  originalUrl: string;
  trackingUrl: string;
  linkText: string;
  componentType: string;
}

interface UnsubscribeOptions {
  buyerId: string;
  trackingId: string;
  campaignId: string;
}

/**
 * Service for generating tracked unsubscribe links and headers
 */
class UnsubscribeService {
  private readonly landivoFrontendUrl: string;
  private readonly apiUrl: string;

  constructor() {
    // Landivo frontend URL from environment
    this.landivoFrontendUrl = process.env.LANDIVO_PUBLIC_URL || 'https://landivo.com';
    this.apiUrl = process.env.API_URL || 'https://api.mailivo.landivo.com';
  }

  /**
   * Generate unsubscribe link data with tracking
   */
  generateUnsubscribeLink(options: UnsubscribeOptions): UnsubscribeLink {
    const { buyerId, trackingId } = options;
    
    // Generate unique link ID for tracking
    const linkId = `unsub_${nanoid(10)}`;
    
    // Original unsubscribe URL on Landivo frontend
    const originalUrl = `${this.landivoFrontendUrl}/unsubscribe/${buyerId}`;
    
    // Tracked URL that redirects through our tracking system
    const encodedUrl = encodeURIComponent(originalUrl);
    const trackingUrl = `${this.apiUrl}/via/click/${trackingId}/${linkId}?url=${encodedUrl}`;
    
    logger.info('Generated unsubscribe link', {
      buyerId,
      trackingId,
      linkId,
      originalUrl,
    });

    return {
      linkId,
      originalUrl,
      trackingUrl,
      linkText: 'Unsubscribe',
      componentType: 'unsubscribe',
    };
  }

  /**
   * Generate RFC 2369 compliant List-Unsubscribe headers
   * Returns both HTTP and mailto methods for better compatibility
   */
  generateUnsubscribeHeaders(options: UnsubscribeOptions): Record<string, string> {
    const unsubLink = this.generateUnsubscribeLink(options);
    
    // RFC 2369 List-Unsubscribe header with HTTP method
    // Format: <http://example.com/unsubscribe>
    const listUnsubscribe = `<${unsubLink.trackingUrl}>`;
    
    // RFC 8058 List-Unsubscribe-Post header for one-click unsubscribe
    // This enables Gmail's one-click unsubscribe button
    const listUnsubscribePost = 'List-Unsubscribe=One-Click';

    logger.debug('Generated unsubscribe headers', {
      buyerId: options.buyerId,
      trackingId: options.trackingId,
      listUnsubscribe,
    });

    return {
      'List-Unsubscribe': listUnsubscribe,
      'List-Unsubscribe-Post': listUnsubscribePost,
    };
  }

  /**
   * Add unsubscribe link to email HTML footer
   * This provides a visible unsubscribe option in addition to headers
   */
  addUnsubscribeLinkToHTML(htmlContent: string, unsubscribeUrl: string): string {
    // Unsubscribe footer HTML
    const unsubscribeFooter = `
      <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 12px; color: #6b7280;">
        <p style="margin: 0;">
          If you no longer wish to receive these emails, you can 
          <a href="${unsubscribeUrl}" style="color: #3b82f6; text-decoration: underline;">unsubscribe here</a>.
        </p>
      </div>
    `;

    // Try to insert before closing body tag, otherwise append
    if (htmlContent.includes('</body>')) {
      return htmlContent.replace('</body>', `${unsubscribeFooter}</body>`);
    } else {
      return `${htmlContent}${unsubscribeFooter}`;
    }
  }

  /**
   * Validate buyer ID format
   */
  validateBuyerId(buyerId: string): boolean {
    // MongoDB ObjectId format: 24 character hex string
    const objectIdRegex = /^[a-f\d]{24}$/i;
    return objectIdRegex.test(buyerId);
  }

  /**
   * Get unsubscribe status URL for buyer
   * (Useful for checking if already unsubscribed)
   */
  getUnsubscribeStatusUrl(buyerId: string): string {
    return `${this.landivoFrontendUrl}/unsubscribe/status/${buyerId}`;
  }
}

export const unsubscribeService = new UnsubscribeService();