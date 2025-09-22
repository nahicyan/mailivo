// api/src/services/email.service.ts
import { smtpService } from './smtp.service';
import { sendGridService } from './sendgrid.service';
import { logger } from '../utils/logger';
import { EmailOptions } from './smtp.service';

type EmailProvider = 'smtp' | 'sendgrid' | 'auto';

interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  provider: EmailProvider;
}

interface EmailServiceConfig {
  primaryProvider: EmailProvider;
  fallbackEnabled: boolean;
  spamScoreThreshold: number;
}

class EmailService {
  private config: EmailServiceConfig;

  constructor() {
    this.config = {
      primaryProvider: 'smtp', // Use SMTP as primary for now
      fallbackEnabled: true,
      spamScoreThreshold: 7,
    };
  }

  async sendEmail(options: EmailOptions): Promise<EmailResult> {
    try {
      // Add tracking pixels and unsubscribe links
      const enhancedOptions = this.enhanceEmailContent(options);
      
      // Try primary provider
      const result = await this.sendWithProvider(enhancedOptions, this.config.primaryProvider);
      
      if (result.success) {
        return result;
      }

      // Try fallback if enabled
      if (this.config.fallbackEnabled) {
        logger.info(`Primary provider failed, trying fallback`, {
          primary: this.config.primaryProvider,
          error: result.error
        });
        
        const fallbackProvider = this.config.primaryProvider === 'smtp' ? 'sendgrid' : 'smtp';
        return await this.sendWithProvider(enhancedOptions, fallbackProvider);
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Email service error:', errorMessage);
      return {
        success: false,
        error: errorMessage,
        provider: 'smtp' as const
      };
    }
  }

  private async sendWithProvider(options: EmailOptions, provider: EmailProvider): Promise<EmailResult> {
    switch (provider) {
      case 'smtp':
        return await smtpService.sendEmail(options);
      
      case 'sendgrid':
        return await sendGridService.sendEmail(options);
      
      case 'auto':
        // For now, auto means prefer SMTP
        return await smtpService.sendEmail(options);
      
      default:
        throw new Error(`Unknown email provider: ${provider}`);
    }
  }

  private enhanceEmailContent(options: EmailOptions): EmailOptions {
    const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:8000';
    
    const headers = {
      'List-Unsubscribe': `<${baseUrl}/api/via/unsubscribe>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      'X-Mailer': 'Mailivo-Platform',
      ...options.headers,
    };

    return { ...options, headers };
  }

 
/*  async addTrackingPixel(htmlContent: string, trackingId: string): Promise<string> {
     const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:8000';
    const trackingPixel = `<img src="${baseUrl}/api/via/open/${trackingId}" width="1" height="1" style="display:none;" />`;
    
    // Add tracking pixel before closing body tag
    if (htmlContent.includes('</body>')) {
      return htmlContent.replace('</body>', `${trackingPixel}</body>`);
    } else {
      return htmlContent + trackingPixel;
    } 
      // Return original content without tracking pixel
       return htmlContent;
  } */

  async checkSpamScore(content: string, subject: string): Promise<number> {
    let score = 0;
    
    // Subject line checks
    const spamTriggers = [
      'FREE', 'URGENT', '!!!', 'ACT NOW', 'CLICK HERE', 'GUARANTEE',
      'MAKE MONEY', 'NO OBLIGATION', 'RISK FREE', 'WINNER'
    ];
    
    const upperSubject = subject.toUpperCase();
    spamTriggers.forEach(trigger => {
      if (upperSubject.includes(trigger)) score += 2;
    });

    // Content checks
    const htmlContent = content.toLowerCase();
    
    // Excessive capitalization
    const capsCount = (content.match(/[A-Z]/g) || []).length;
    if (capsCount / content.length > 0.3) score += 3;

    // Suspicious phrases
    if (htmlContent.includes('click here')) score += 1;
    if (htmlContent.includes('buy now')) score += 1;
    if (htmlContent.includes('limited time')) score += 1;

    // HTML/text ratio
    const textLength = content.replace(/<[^>]*>/g, '').length;
    const htmlLength = content.length;
    if (textLength / htmlLength < 0.6) score += 2;

    // Excessive links
    const linkCount = (content.match(/<a/g) || []).length;
    if (linkCount > 10) score += 2;

    return Math.min(score, 10);
  }

  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  generateUnsubscribeLink(contactId: string, campaignId: string): string {
    const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:8000';
    const token = Buffer.from(`${contactId}:${campaignId}`).toString('base64');
    return `${baseUrl}/api/via/unsubscribe?token=${token}`;
  }

  // Configuration methods
  setPrimaryProvider(provider: EmailProvider): void {
    this.config.primaryProvider = provider;
    logger.info(`Email service primary provider set to: ${provider}`);
  }

  setFallbackEnabled(enabled: boolean): void {
    this.config.fallbackEnabled = enabled;
    logger.info(`Email service fallback ${enabled ? 'enabled' : 'disabled'}`);
  }

  // Status and testing
  async getServiceStatus() {
    const smtpStatus = smtpService.getConnectionStatus();
    const sendGridStatus = sendGridService.getConnectionStatus();
    
    return {
      primary: this.config.primaryProvider,
      fallback: this.config.fallbackEnabled,
      providers: {
        smtp: smtpStatus,
        sendgrid: sendGridStatus
      }
    };
  }

  async testConnection(provider?: EmailProvider): Promise<boolean> {
    const testProvider = provider || this.config.primaryProvider;
    
    switch (testProvider) {
      case 'smtp':
        return await smtpService.testConnection();
      case 'sendgrid':
        return await sendGridService.testConnection();
      default:
        return false;
    }
  }

  async sendTestEmail(to: string, campaignData: {
    subject: string;
    htmlContent: string;
    textContent?: string;
  }): Promise<EmailResult> {
    const testSubject = `[TEST] ${campaignData.subject}`;
    
    const testBanner = `
      <div style="background-color: #fbbf24; color: #000; padding: 10px; text-align: center; font-weight: bold;">
        This is a test email - Not sent to actual recipients
      </div>
    `;
    
    const htmlWithBanner = campaignData.htmlContent.includes('<body>')
      ? campaignData.htmlContent.replace('<body>', `<body>${testBanner}`)
      : `${testBanner}${campaignData.htmlContent}`;

    return this.sendEmail({
      to,
      subject: testSubject,
      html: htmlWithBanner,
      text: campaignData.textContent ? `[TEST EMAIL]\n\n${campaignData.textContent}` : undefined,
    });
  }

  // Domain reputation monitoring (simplified version)
  async checkDomainReputation(): Promise<{
    bounceRate: number;
    complaintRate: number;
    deliveryRate: number;
    reputationScore: number;
  }> {
    // For now, return optimistic metrics
    // In production, integrate with reputation monitoring APIs
    return {
      bounceRate: 0.02,
      complaintRate: 0.001,
      deliveryRate: 0.98,
      reputationScore: 8.5,
    };
  }
}

export const emailService = new EmailService();