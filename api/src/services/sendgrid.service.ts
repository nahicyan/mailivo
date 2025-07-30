// api/src/services/sendgrid.service.ts
import sgMail from '@sendgrid/mail';
import { logger } from '../utils/logger';
import { EmailOptions } from './smtp.service';

interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  provider: 'sendgrid';
}

class SendGridService {
  private isConfigured: boolean = false;

  constructor() {
    this.initializeSendGrid();
  }

  private initializeSendGrid() {
    const apiKey = process.env.SENDGRID_API_KEY;
    
    if (!apiKey) {
      logger.info('SendGrid API key not provided - service disabled');
      return;
    }

    if (!apiKey.startsWith('SG.')) {
      logger.error('Invalid SendGrid API key format - must start with "SG."');
      return;
    }

    try {
      sgMail.setApiKey(apiKey);
      this.isConfigured = true;
      logger.info('SendGrid service initialized successfully');
    } catch (error) {
      logger.error('SendGrid initialization failed:', error instanceof Error ? error.message : error);
      this.isConfigured = false;
    }
  }

  async sendEmail(options: EmailOptions): Promise<EmailResult> {
    if (!this.isConfigured) {
      return {
        success: false,
        error: 'SendGrid not configured',
        provider: 'sendgrid'
      };
    }

    try {
      const msg = this.buildSendGridMessage(options);
      const [response] = await sgMail.send(msg);
      
      const messageId = response.headers['x-message-id'] as string;
      
      logger.info('Email sent via SendGrid', {
        messageId,
        to: options.to,
        subject: options.subject,
        statusCode: response.statusCode,
      });

      return {
        success: true,
        messageId,
        provider: 'sendgrid'
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorCode = error && typeof error === 'object' && 'code' in error ? error.code : 'UNKNOWN';
      
      logger.error('SendGrid send failed:', {
        error: errorMessage,
        to: options.to,
        subject: options.subject,
        code: errorCode,
      });

      return {
        success: false,
        error: errorMessage,
        provider: 'sendgrid'
      };
    }
  }

  private buildSendGridMessage(options: EmailOptions) {
    const fromEmail = options.from || process.env.SENDGRID_FROM_EMAIL || 'noreply@mailivo.com';
    
    return {
      to: options.to,
      from: fromEmail,
      subject: options.subject,
      html: options.html,
      text: options.text || this.htmlToText(options.html),
      replyTo: options.replyTo || fromEmail,
      headers: options.headers,
      // SendGrid-specific settings
      trackingSettings: {
        clickTracking: { enable: true },
        openTracking: { enable: true },
        subscriptionTracking: { enable: false },
      },
      mailSettings: {
        sandboxMode: { 
          enable: process.env.NODE_ENV === 'development' 
        },
      },
    };
  }

  private htmlToText(html: string): string {
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/\s+/g, ' ')
      .trim();
  }

  async testConnection(): Promise<boolean> {
    if (!this.isConfigured) {
      return false;
    }

    try {
      // SendGrid doesn't have a direct test method, so we'll just verify the API key is set
      return true;
    } catch (error) {
      logger.error('SendGrid test failed:', error instanceof Error ? error.message : error);
      return false;
    }
  }

  getConnectionStatus(): { ready: boolean; config: any } {
    return {
      ready: this.isConfigured,
      config: {
        apiKeyConfigured: !!process.env.SENDGRID_API_KEY,
        fromEmail: process.env.SENDGRID_FROM_EMAIL,
        sandboxMode: process.env.NODE_ENV === 'development',
      }
    };
  }

  async checkRateLimit(): Promise<{ allowed: boolean; limit?: number }> {
    // SendGrid has generous rate limits
    return { allowed: true, limit: 600 }; // 600 emails per minute for most plans
  }
}

export const sendGridService = new SendGridService();