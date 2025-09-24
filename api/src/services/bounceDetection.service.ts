// api/src/services/bounceDetection.service.ts
import { Imap } from 'imap';
import { simpleParser } from 'mailparser';
import { EmailTracking } from '../models/EmailTracking.model';
import { Campaign } from '../models/Campaign'

class BounceDetectionService {
  private imapConfig = {
    user: process.env.BOUNCE_EMAIL,
    password: process.env.BOUNCE_PASSWORD,
    host: process.env.BOUNCE_HOST,
    port: 993,
    tls: true,
  };

  async checkBounces(): Promise<void> {
    const imap = new Imap(this.imapConfig);
    
    imap.once('ready', () => {
      imap.openBox('INBOX', false, (err: Error | null, box: any) => { // Add types
        if (err) throw err;
        
        const fetch = imap.seq.fetch('1:*', {
          bodies: '',
          markSeen: true
        });
        
        fetch.on('message', (msg: any) => { // Add type
          msg.on('body', async (stream: any) => { // Add type
            const parsed = await simpleParser(stream);
            await this.processBounceEmail(parsed);
          });
        });
      });
    });
    
    imap.connect();
  }

  private async processBounceEmail(email: any): Promise<void> {
    // Extract original message ID from bounce email
    const originalMessageId = this.extractMessageId(email);
    
    if (originalMessageId) {
      const tracking = await EmailTracking.findOne({ messageId: originalMessageId });
      
      if (tracking) {
        tracking.status = 'bounced';
        tracking.bouncedAt = new Date();
        tracking.bounceReason = this.extractBounceReason(email);
        await tracking.save();
        
        // Update campaign metrics
        await Campaign.findByIdAndUpdate(tracking.campaignId, {
          $inc: { 'metrics.bounced': 1 }
        });
      }
    }
  }

  private extractMessageId(email: any): string | null {
    // Parse bounce email headers and body for original message ID
    const messageIdMatch = email.text?.match(/Message-ID:\s*<([^>]+)>/i);
    return messageIdMatch?.[1] || null;
  }

  private extractBounceReason(email: any): string {
    // Common bounce patterns
    const patterns = [
      /mailbox.*(?:full|quota)/i,
      /user.*(?:unknown|not found)/i,
      /domain.*(?:not found|doesn't exist)/i,
      /message.*(?:rejected|blocked)/i,
    ];
    
    for (const pattern of patterns) {
      if (pattern.test(email.text)) {
        return email.text.match(pattern)[0];
      }
    }
    
    return 'Unknown bounce reason';
  }
}

// Run bounce check every 5 minutes
setInterval(() => {
  const bounceService = new BounceDetectionService();
  bounceService.checkBounces().catch(console.error);
}, 5 * 60 * 1000);