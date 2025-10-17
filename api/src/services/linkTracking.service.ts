// api/src/services/linkTracking.service.ts - UPDATED
import { parse, HTMLElement } from 'node-html-parser';
import { nanoid } from 'nanoid';
import { logger } from '../utils/logger';
import { unsubscribeService } from './unsubscribe.service';

interface LinkTransformOptions {
  trackingId: string;
  campaignId: string;
  contactId: string;
  baseUrl: string;
  buyerId?: string; // NEW: Optional buyer ID for unsubscribe
}

interface ExtractedLink {
  linkId: string;
  originalUrl: string;
  trackingUrl: string;
  linkText: string;
  componentType?: string;
  componentId?: string;
  position: number;
}

export class LinkTrackingService {
  private readonly baseTrackingUrl: string;

  constructor() {
    this.baseTrackingUrl = process.env.API_URL || 'https://api.mailivo.landivo.com';
  }

  /**
   * Transform all links in HTML content to tracking links
   * NOW INCLUDES unsubscribe link injection
   */
  async transformLinks(
    htmlContent: string,
    options: LinkTransformOptions
  ): Promise<{
    transformedHtml: string;
    extractedLinks: ExtractedLink[];
  }> {
    try {
      const root = parse(htmlContent);
      const extractedLinks: ExtractedLink[] = [];
      let linkPosition = 0;

      // Find all anchor tags
      const anchors = root.querySelectorAll('a');
      
      for (const anchor of anchors) {
        const originalUrl = anchor.getAttribute('href');
        
        if (!originalUrl || this.shouldSkipLink(originalUrl)) {
          continue;
        }

        // Generate unique link ID
        const linkId = this.generateLinkId();
        
        // Extract link metadata
        const linkText = anchor.innerText || anchor.innerHTML || '';
        const componentInfo = this.extractComponentInfo(anchor);
        
        // Create tracking URL
        const trackingUrl = this.createTrackingUrl({
          trackingId: options.trackingId,
          linkId,
          originalUrl,
        });
        
        // Store extracted link data
        extractedLinks.push({
          linkId,
          originalUrl,
          trackingUrl,
          linkText: linkText.substring(0, 100), // Limit text length
          componentType: componentInfo.type,
          componentId: componentInfo.id,
          position: linkPosition++,
        });
        
        // Replace href with tracking URL
        anchor.setAttribute('href', trackingUrl);
        
        // Add tracking attributes
        anchor.setAttribute('data-link-id', linkId);
        anchor.setAttribute('data-tracked', 'true');
      }

      // NEW: Add unsubscribe link if buyerId provided
      let finalHtml = root.toString();
      if (options.buyerId || options.contactId) {
        const buyerId = options.buyerId || options.contactId;
        
        // Generate unsubscribe link data
        const unsubLink = unsubscribeService.generateUnsubscribeLink({
          buyerId,
          trackingId: options.trackingId,
          campaignId: options.campaignId,
        });

        // Add to extracted links
        extractedLinks.push({
          linkId: unsubLink.linkId,
          originalUrl: unsubLink.originalUrl,
          trackingUrl: unsubLink.trackingUrl,
          linkText: unsubLink.linkText,
          componentType: unsubLink.componentType,
          position: linkPosition++,
        });

        // Add visual unsubscribe link to HTML footer
        finalHtml = unsubscribeService.addUnsubscribeLinkToHTML(
          finalHtml,
          unsubLink.trackingUrl
        );

        logger.info('Added unsubscribe link to email', {
          trackingId: options.trackingId,
          buyerId,
          linkId: unsubLink.linkId,
        });
      }
      
      return {
        transformedHtml: finalHtml,
        extractedLinks,
      };
    } catch (error) {
      logger.error('Link transformation failed:', error);
      // Return original HTML if transformation fails
      return {
        transformedHtml: htmlContent,
        extractedLinks: [],
      };
    }
  }

  /**
   * Check if link should be tracked
   */
  private shouldSkipLink(url: string): boolean {
    // Skip tracking for:
    // - Unsubscribe links (handled separately now)
    // - Mailto links
    // - Tel links
    // - Already tracked links
    // - Anchors (#)
    const skipPatterns = [
      /^mailto:/i,
      /^tel:/i,
      /^#$/,
      /\/via\/click\//i, // Already tracked
    ];
    
    return skipPatterns.some(pattern => pattern.test(url));
  }

  /**
   * Extract component info from anchor element
   */
  private extractComponentInfo(anchor: HTMLElement): {
    type?: string;
    id?: string;
  } {
    // Walk up DOM tree to find component markers
    let parent = anchor.parentNode;
    let depth = 0;
    const maxDepth = 5;
    
    while (parent && depth < maxDepth) {
      const dataComponent = parent.getAttribute?.('data-component-type');
      const dataId = parent.getAttribute?.('data-component-id');
      
      if (dataComponent) {
        return {
          type: dataComponent,
          id: dataId || undefined,
        };
      }
      
      parent = parent.parentNode;
      depth++;
    }
    
    return {};
  }

  /**
   * Generate unique link ID
   */
  private generateLinkId(): string {
    return nanoid(10); // Short, URL-safe ID
  }

  /**
   * Create tracking URL
   */
  private createTrackingUrl(params: {
    trackingId: string;
    linkId: string;
    originalUrl: string;
  }): string {
    const { trackingId, linkId, originalUrl } = params;
    
    // Encode the original URL
    const encodedUrl = encodeURIComponent(originalUrl);
    
    // Use /via/click to match routes
    return `${this.baseTrackingUrl}/via/click/${trackingId}/${linkId}?url=${encodedUrl}`;
  }

  /**
   * Decode tracking URL to get original URL
   */
  decodeTrackingUrl(trackingUrl: string): {
    trackingId?: string;
    linkId?: string;
    originalUrl?: string;
  } {
    try {
      const url = new URL(trackingUrl);
      const pathParts = url.pathname.split('/');
      
      return {
        trackingId: pathParts[3],
        linkId: pathParts[4],
        originalUrl: url.searchParams.get('url') || undefined,
      };
    } catch {
      return {};
    }
  }
}

export const linkTrackingService = new LinkTrackingService();