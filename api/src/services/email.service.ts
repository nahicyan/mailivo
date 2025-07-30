// api/src/services/email.service.ts
import nodemailer from 'nodemailer';
import sgMail from '@sendgrid/mail';
import { SentMessageInfo } from 'nodemailer/lib/smtp-transport';
import { logger } from '../utils/logger';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
  headers?: Record<string, string>;
}

interface DeliverabilityMetrics {
  bounceRate: number;
  complaintRate: number;
  deliveryRate: number;
  reputationScore: number;
}

class EmailService {
  private smtpTransporter: nodemailer.Transporter;
  private useSendGrid: boolean;

  constructor() {
    // Initialize SendGrid if API key is available
    if (process.env.SENDGRID_API_KEY) {
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);
      this.useSendGrid = true;
      logger.info('SendGrid initialized for email delivery');
    } else {
      this.useSendGrid = false;
    }

    // Initialize SMTP as fallback or primary
    this.smtpTransporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      // Deliverability optimizations
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
      rateLimit: 10, // emails per second
    });

    this.smtpTransporter.verify((error) => {
      if (error) {
        logger.error('SMTP Connection Error:', error);
      } else {
        logger.info('SMTP Server ready for emails');
      }
    });
  }

  async sendEmail(options: EmailOptions): Promise<SentMessageInfo> {
    // Add deliverability headers
    const enhancedOptions = this.addDeliverabilityHeaders(options);

    try {
      if (this.useSendGrid) {
        return await this.sendViaSendGrid(enhancedOptions);
      } else {
        return await this.sendViaSMTP(enhancedOptions);
      }
    } catch (error) {
      logger.error('Email send error:', error);
      
      // Try fallback if primary method fails
      if (this.useSendGrid) {
        logger.info('SendGrid failed, attempting SMTP fallback');
        return await this.sendViaSMTP(enhancedOptions);
      }
      
      throw error;
    }
  }

  private addDeliverabilityHeaders(options: EmailOptions): EmailOptions {
    const headers = {
      'List-Unsubscribe': `<${process.env.NEXT_PUBLIC_SERVER_URL}/unsubscribe>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      'X-Mailer': 'Mailivo-Platform',
      'X-Priority': '3',
      'X-MSMail-Priority': 'Normal',
      'Message-ID': `<${Date.now()}@${process.env.EMAIL_DOMAIN || 'mailivo.com'}>`,
      ...options.headers,
    };

    return { ...options, headers };
  }

  private async sendViaSendGrid(options: EmailOptions): Promise<SentMessageInfo> {
    const msg = {
      to: options.to,
      from: options.from || process.env.SENDGRID_FROM_EMAIL,
      subject: options.subject,
      html: options.html,
      text: options.text,
      replyTo: options.replyTo,
      headers: options.headers,
      // SendGrid-specific anti-spam features
      trackingSettings: {
        clickTracking: { enable: true },
        openTracking: { enable: true },
        subscriptionTracking: { enable: false },
      },
      mailSettings: {
        sandboxMode: { enable: process.env.NODE_ENV === 'development' },
      },
    };

    const [response] = await sgMail.send(msg);
    logger.info('Email sent via SendGrid:', response.headers['x-message-id']);
    
    return {
      messageId: response.headers['x-message-id'],
      response: response.statusCode.toString(),
    };
  }

  private async sendViaSMTP(options: EmailOptions): Promise<SentMessageInfo> {
    const mailOptions = {
      from: options.from || `"${process.env.EMAIL_FROM_NAME || 'Mailivo'}" <${process.env.SMTP_USER}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
      replyTo: options.replyTo || process.env.SMTP_USER,
      headers: options.headers,
    };

    const info = await this.smtpTransporter.sendMail(mailOptions);
    logger.info('Email sent via SMTP:', info.messageId);
    return info;
  }

  // Spam score checking before sending
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

    return Math.min(score, 10); // Cap at 10
  }

  // Domain reputation monitoring
  async checkDomainReputation(): Promise<DeliverabilityMetrics> {
    // This would integrate with reputation monitoring APIs
    // For now, return mock data structure
    return {
      bounceRate: 0.02,
      complaintRate: 0.001,
      deliveryRate: 0.98,
      reputationScore: 8.5,
    };
  }

  // Bounce handling
  async handleBounce(messageId: string, bounceType: 'hard' | 'soft', reason: string) {
    logger.warn(`Email bounce detected:`, { messageId, bounceType, reason });
    
    // Update tracking record
    // Implementation depends on your tracking system
    
    if (bounceType === 'hard') {
      // Mark contact as undeliverable
      // Add to suppression list
    }
  }

  // Rate limiting check
  async canSendEmail(): Promise<boolean> {
    // Check current sending rate vs limits
    // This would check Redis for current rate
    return true; // Simplified for now
  }

  // Bulk sending optimization
  async sendBulkEmails(emails: EmailOptions[]): Promise<SentMessageInfo[]> {
    const results: SentMessageInfo[] = [];
    const batchSize = 50; // Send in batches

    for (let i = 0; i < emails.length; i += batchSize) {
      const batch = emails.slice(i, i + batchSize);
      const batchPromises = batch.map(email => this.sendEmail(email));
      
      try {
        const batchResults = await Promise.allSettled(batchPromises);
        
        batchResults.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            results.push(result.value);
          } else {
            logger.error(`Batch email ${i + index} failed:`, result.reason);
          }
        });

        // Delay between batches to respect rate limits
        if (i + batchSize < emails.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        logger.error('Batch sending error:', error);
      }
    }

    return results;
  }

  // Email validation
  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Generate unsubscribe link
  generateUnsubscribeLink(contactId: string, campaignId: string): string {
    const token = Buffer.from(`${contactId}:${campaignId}`).toString('base64');
    return `${process.env.NEXT_PUBLIC_SERVER_URL}/unsubscribe?token=${token}`;
  }
}

export const emailService = new EmailService();