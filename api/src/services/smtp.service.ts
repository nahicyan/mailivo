// api/src/services/smtp.service.ts
import nodemailer from 'nodemailer';
import { SentMessageInfo } from 'nodemailer/lib/smtp-transport';
import { logger } from '../utils/logger';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
  headers?: Record<string, string>;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  provider: 'smtp' | 'sendgrid';
}

class SMTPService {
  private transporter!: nodemailer.Transporter;
  private isReady: boolean = false;

  constructor() {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      // Connection pool settings for better performance
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
      rateLimit: 10, // emails per second
    });

    // Verify connection on startup
    this.verifyConnection();
  }

  private async verifyConnection(): Promise<void> {
    try {
      await this.transporter.verify();
      this.isReady = true;
      logger.info('SMTP connection verified successfully', {
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        user: process.env.SMTP_USER,
      });
    } catch (error) {
      this.isReady = false;
      logger.error('SMTP connection verification failed:', error instanceof Error ? error.message : error);
    }
  }

  async sendEmail(options: EmailOptions): Promise<EmailResult> {
    if (!this.isReady) {
      logger.warn('SMTP not ready, attempting to reconnect...');
      await this.verifyConnection();
      
      if (!this.isReady) {
        return {
          success: false,
          error: 'SMTP service not available',
          provider: 'smtp'
        };
      }
    }

    try {
      const enhancedOptions = this.addDeliverabilityHeaders(options);
      const mailOptions = this.buildMailOptions(enhancedOptions);
      
      const info: SentMessageInfo = await this.transporter.sendMail(mailOptions);
      
      logger.info('Email sent via SMTP', {
        messageId: info.messageId,
        to: options.to,
        subject: options.subject,
        accepted: info.accepted,
        rejected: info.rejected,
      });

      return {
        success: true,
        messageId: info.messageId,
        provider: 'smtp'
      };

    } catch (error) {
      logger.error('SMTP send failed:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        to: options.to,
        subject: options.subject,
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        provider: 'smtp'
      };
    }
  }

  private addDeliverabilityHeaders(options: EmailOptions): EmailOptions {
    const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:8000';
    const returnPath = process.env.SMTP_USER || 'noreply@mailivo.com';
    
    const headers = {
      'List-Unsubscribe': `<${baseUrl}/api/track/unsubscribe>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      'X-Mailer': 'Mailivo-Platform',
      'X-Priority': '3',
      'X-MSMail-Priority': 'Normal',
      'Message-ID': `<${Date.now()}-${Math.random().toString(36).substr(2, 9)}@${process.env.EMAIL_DOMAIN || 'mailivo.com'}>`,
      'Return-Path': returnPath,
      ...options.headers,
    };

    return { ...options, headers };
  }

  private buildMailOptions(options: EmailOptions) {
    const fromName = process.env.EMAIL_FROM_NAME || 'Mailivo';
    const fromEmail = process.env.SMTP_USER;
    
    return {
      from: options.from || `"${fromName}" <${fromEmail}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || this.htmlToText(options.html),
      replyTo: options.replyTo || fromEmail,
      headers: options.headers,
    };
  }

  private htmlToText(html: string): string {
    // Simple HTML to text conversion
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
    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      logger.error('SMTP test connection failed:', error);
      return false;
    }
  }

  getConnectionStatus(): { ready: boolean; config: any } {
    return {
      ready: this.isReady,
      config: {
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: process.env.SMTP_PORT === '465',
        user: process.env.SMTP_USER,
      }
    };
  }

  // Rate limiting check
  async checkRateLimit(): Promise<{ allowed: boolean; limit?: number }> {
    // Simple rate limiting - in production you'd use Redis
    return { allowed: true, limit: 10 };
  }

  // Close connections gracefully
  async close(): Promise<void> {
    try {
      this.transporter.close();
      this.isReady = false;
      logger.info('SMTP connection closed');
    } catch (error) {
      logger.error('Error closing SMTP connection:', error);
    }
  }
}

export const smtpService = new SMTPService();