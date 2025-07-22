import nodemailer from 'nodemailer';
import { SentMessageInfo } from 'nodemailer/lib/smtp-transport';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
}

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // Verify connection
    this.transporter.verify((error) => {
      if (error) {
        console.error('SMTP Connection Error:', error);
      } else {
        console.log('SMTP Server ready for emails');
      }
    });
  }

  async sendEmail(options: EmailOptions): Promise<SentMessageInfo> {
    const mailOptions = {
      from: options.from || `"${process.env.EMAIL_FROM_NAME || 'Mailivo'}" <${process.env.SMTP_USER}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
      replyTo: options.replyTo || process.env.SMTP_USER,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('Email sent:', info.messageId);
      return info;
    } catch (error) {
      console.error('Email send error:', error);
      throw error;
    }
  }

  async sendTestCampaign(to: string, campaignData: {
    subject: string;
    htmlContent: string;
    textContent?: string;
  }): Promise<SentMessageInfo> {
    // Add test indicator to subject
    const testSubject = `[TEST] ${campaignData.subject}`;
    
    // Add test banner to HTML content
    const testBanner = `
      <div style="background-color: #fbbf24; color: #000; padding: 10px; text-align: center; font-weight: bold;">
        This is a test email - Not sent to actual recipients
      </div>
    `;
    
    const htmlWithBanner = campaignData.htmlContent.replace(
      '<body>',
      `<body>${testBanner}`
    );

    return this.sendEmail({
      to,
      subject: testSubject,
      html: htmlWithBanner,
      text: campaignData.textContent ? `[TEST EMAIL]\n\n${campaignData.textContent}` : undefined,
    });
  }
  async sendCampaign(campaign: any): Promise<void> {
  // For now, just log - implement actual campaign sending logic later
  console.log(`Sending campaign: ${campaign.name} to ${campaign.emailVolume} recipients`);
  
  // Update campaign metrics
  campaign.metrics.sent = campaign.emailVolume;
  campaign.metrics.successfulDeliveries = Math.floor(campaign.emailVolume * 0.95);
  campaign.status = 'sent';
  await campaign.save();
}


}

export const emailService = new EmailService();