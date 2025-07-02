// api/src/services/email.service.ts
import sgMail from '@sendgrid/mail';
import nodemailer from 'nodemailer';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

// Fallback SMTP transporter
const smtpTransporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

interface EmailData {
  to: string;
  from: string;
  subject: string;
  html: string;
  trackingId?: string;
}

export const emailService = {
  async sendEmail(emailData: EmailData) {
    const { to, from, subject, html, trackingId } = emailData;

    // Add tracking pixel if trackingId provided
    const htmlWithTracking = trackingId ? 
      html + `<img src="${process.env.API_URL}/api/email/track/${trackingId}" width="1" height="1" style="display:none;" />` : 
      html;

    try {
      // Try SendGrid first
      await sgMail.send({
        to,
        from,
        subject,
        html: htmlWithTracking,
      });
      return { success: true, provider: 'sendgrid' };
    } catch (error) {
      console.warn('SendGrid failed, trying SMTP:', error);
      
      // Fallback to SMTP
      try {
        await smtpTransporter.sendMail({
          to,
          from,
          subject,
          html: htmlWithTracking,
        });
        return { success: true, provider: 'smtp' };
      } catch (smtpError) {
        console.error('Both email providers failed:', smtpError);
        throw new Error('Failed to send email');
      }
    }
  },

  async sendBulkEmails(emails: EmailData[]) {
    const results = await Promise.allSettled(
      emails.map(email => this.sendEmail(email))
    );
    
    return {
      sent: results.filter(r => r.status === 'fulfilled').length,
      failed: results.filter(r => r.status === 'rejected').length,
      results
    };
  }
};