// Fix imports
import Imap from 'imap'; // Default import, not named
import { simpleParser, ParsedMail } from 'mailparser'; // ParsedMail type exists
import { EmailTracking } from '../models/EmailTracking.model';
import { Campaign } from '../models/Campaign';

class BounceDetectionService {
  private imapConfig = {
    user: process.env.BOUNCE_EMAIL || '',
    password: process.env.BOUNCE_PASSWORD || '',
    host: process.env.BOUNCE_HOST || '',
    port: 993,
    tls: true,
  };

  async checkBounces(): Promise<void> {
    const imap = new Imap(this.imapConfig);
    
    imap.once('ready', () => {
      imap.openBox('INBOX', false, (err: Error | null, _box: any) => { // Prefix with underscore
        if (err) throw err;
        
        const fetch = imap.seq.fetch('1:*', {
          bodies: '',
          markSeen: true
        });
        
        fetch.on('message', (msg: any) => {
          msg.on('body', async (stream: any) => {
            const parsed: ParsedMail = await simpleParser(stream);
            await this.processBounceEmail(parsed);
          });
        });
      });
    });
    
    imap.connect();
  }

  private async processBounceEmail(email: ParsedMail): Promise<void> { // Use ParsedMail type
    const originalMessageId = this.extractMessageId(email);
    
    if (originalMessageId) {
      const tracking = await EmailTracking.findOne({ messageId: originalMessageId });
      
      if (tracking) {
        tracking.status = 'bounced';
        tracking.bouncedAt = new Date();
        tracking.bounceReason = this.extractBounceReason(email);
        await tracking.save();
        
        await Campaign.findByIdAndUpdate(tracking.campaignId, {
          $inc: { 'metrics.bounced': 1 }
        });
      }
    }
  }

  private extractMessageId(email: ParsedMail): string | null {
    const messageIdMatch = email.text?.match(/Message-ID:\s*<([^>]+)>/i);
    return messageIdMatch?.[1] || null;
  }

  private extractBounceReason(email: ParsedMail): string {
    const patterns = [
      /mailbox.*(?:full|quota)/i,
      /user.*(?:unknown|not found)/i,
      /domain.*(?:not found|doesn't exist)/i,
      /message.*(?:rejected|blocked)/i,
    ];
    
    const text = email.text || '';
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) return match[0];
    }
    
    return 'Unknown bounce reason';
  }
}

export const bounceDetectionService = new BounceDetectionService();