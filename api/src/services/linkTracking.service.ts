// api/src/services/linkTracking.service.ts - NEW FILE
import { parse, HTMLElement } from 'node-html-parser';
import { nanoid } from 'nanoid';
import { logger } from '../utils/logger';

interface LinkTransformOptions {
  trackingId: string;
  campaignId: string;
  contactId: string;
  baseUrl: string;
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
      
      return {
        transformedHtml: root.toString(),
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
    // - Unsubscribe links (handled separately)
    // - Mailto links
    // - Tel links
    // - Already tracked links
    // - Anchors (#)
    const skipPatterns = [
      /^mailto:/i,
      /^tel:/i,
      /^#$/,
      /\/unsubscribe/i,
      /\/public\/click\//i,
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
  
  // FIX: Use /public/click to match your routes (not /tracking/click)
  return `${this.baseTrackingUrl}/public/click/${trackingId}/${linkId}?url=${encodedUrl}`;
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