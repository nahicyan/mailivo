// api/src/routes/tracking.routes.ts
import { Router, Request, Response } from 'express';
import { EmailTracking } from '../models/EmailTracking.model';
import { Campaign } from '../models/Campaign.model';
import { logger } from '../utils/logger';
import geoip from 'geoip-lite';

const router = Router();

// Track email opens
router.get('/open/:trackingId', async (req: Request, res: Response) => {
  try {
    const { trackingId } = req.params;
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');

    // Find tracking record
    const tracking = await EmailTracking.findById(trackingId);
    if (!tracking) {
      // Return 1x1 transparent pixel even if not found
      const pixel = Buffer.from(
        'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
        'base64'
      );
      
      res.set({
        'Content-Type': 'image/gif',
        'Content-Length': pixel.length.toString(),
        'Cache-Control': 'no-store, no-cache, must-revalidate, private',
      });
      
      return res.end(pixel);
    }

    // Get location from IP
    const location = geoip.lookup(ipAddress);

    // Update tracking record
    if (!tracking.openedAt) {
      tracking.status = 'opened';
      tracking.openedAt = new Date();
      tracking.ipAddress = ipAddress;
      tracking.userAgent = userAgent;
      
      if (location) {
        tracking.location = {
          country: location.country,
          city: location.city,
        };
      }

      // Update campaign metrics
      await Campaign.findByIdAndUpdate(tracking.campaignId, {
        $inc: { 'metrics.opened': 1 }
      });
    }

    // Add to opens array for multiple opens tracking
    tracking.opens.push({
      openedAt: new Date(),
      ipAddress,
      userAgent,
    });

    await tracking.save();

    logger.info(`Email opened: ${trackingId}`, {
      campaignId: tracking.campaignId,
      contactId: tracking.contactId,
      ipAddress,
      location: location?.city,
    });

    // Return 1x1 transparent pixel
    const pixel = Buffer.from(
      'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
      'base64'
    );
    
    res.set({
      'Content-Type': 'image/gif',
      'Content-Length': pixel.length.toString(),
      'Cache-Control': 'no-store, no-cache, must-revalidate, private',
    });
    
    res.end(pixel);
  } catch (error) {
    logger.error('Error tracking email open:', error);
    
    // Still return pixel even on error
    const pixel = Buffer.from(
      'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
      'base64'
    );
    
    res.set('Content-Type', 'image/gif');
    res.end(pixel);
  }
});

// Track email clicks
router.get('/click/:trackingId', async (req: Request, res: Response) => {
  try {
    const { trackingId } = req.params;
    const { url } = req.query;
    const ipAddress = req.ip || req.connection.remoteAddress;

    if (!url) {
      return res.status(400).json({ error: 'URL parameter required' });
    }

    // Find tracking record
    const tracking = await EmailTracking.findById(trackingId);
    if (!tracking) {
      return res.redirect(url as string);
    }

    // Update tracking record
    if (!tracking.clickedAt) {
      tracking.status = 'clicked';
      tracking.clickedAt = new Date();

      // Update campaign metrics
      await Campaign.findByIdAndUpdate(tracking.campaignId, {
        $inc: { 'metrics.clicked': 1 }
      });
    }

    // Add to clicks array
    tracking.clicks.push({
      url: url as string,
      clickedAt: new Date(),
      ipAddress,
    });

    await tracking.save();

    logger.info(`Email clicked: ${trackingId}`, {
      campaignId: tracking.campaignId,
      contactId: tracking.contactId,
      url,
      ipAddress,
    });

    // Redirect to actual URL
    res.redirect(url as string);
  } catch (error) {
    logger.error('Error tracking email click:', error);
    
    // Redirect to URL even on error
    if (req.query.url) {
      res.redirect(req.query.url as string);
    } else {
      res.status(500).json({ error: 'Tracking error' });
    }
  }
});

// Unsubscribe endpoint
router.get('/unsubscribe', async (req: Request, res: Response) => {
  try {
    const { token } = req.query;
    
    if (!token) {
      return res.status(400).send('Invalid unsubscribe link');
    }

    // Decode token
    const decoded = Buffer.from(token as string, 'base64').toString();
    const [contactId, campaignId] = decoded.split(':');

    // Find and update contact
    const Contact = require('../models/Contact.model').Contact;
    const contact = await Contact.findByIdAndUpdate(contactId, {
      subscribed: false,
      unsubscribedAt: new Date(),
      unsubscribeSource: campaignId,
    });

    if (!contact) {
      return res.status(404).send('Contact not found');
    }

    logger.info(`Contact unsubscribed: ${contactId}`, { campaignId });

    // Simple unsubscribe confirmation page
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Unsubscribed</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            .container { max-width: 500px; margin: 0 auto; }
            .success { color: #28a745; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1 class="success">✓ Unsubscribed Successfully</h1>
            <p>You have been unsubscribed from our mailing list.</p>
            <p>Email: ${contact.email}</p>
            <p>If this was a mistake, please contact us.</p>
          </div>
        </body>
      </html>
    `);
  } catch (error) {
    logger.error('Error processing unsubscribe:', error);
    res.status(500).send('Error processing unsubscribe request');
  }
});

// SendGrid webhook handler
router.post('/webhooks/sendgrid', async (req: Request, res: Response) => {
  try {
    const events = req.body;

    for (const event of events) {
      await processWebhookEvent(event);
    }

    res.status(200).send('OK');
  } catch (error) {
    logger.error('Error processing SendGrid webhook:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Process webhook events
async function processWebhookEvent(event: any) {
  try {
    const { event: eventType, email, timestamp, reason, sg_message_id } = event;

    // Find tracking record by message ID
    const tracking = await EmailTracking.findOne({ 
      messageId: sg_message_id 
    });

    if (!tracking) {
      logger.warn(`Tracking record not found for message: ${sg_message_id}`);
      return;
    }

    switch (eventType) {
      case 'delivered':
        tracking.status = 'delivered';
        tracking.deliveredAt = new Date(timestamp * 1000);
        
        await Campaign.findByIdAndUpdate(tracking.campaignId, {
          $inc: { 'metrics.delivered': 1 }
        });
        break;

      case 'bounce':
        tracking.status = 'bounced';
        tracking.bouncedAt = new Date(timestamp * 1000);
        tracking.bounceReason = reason;
        
        await Campaign.findByIdAndUpdate(tracking.campaignId, {
          $inc: { 'metrics.bounced': 1 }
        });
        break;

      case 'dropped':
        tracking.status = 'failed';
        tracking.error = reason;
        break;

      case 'spamreport':
        await Campaign.findByIdAndUpdate(tracking.campaignId, {
          $inc: { 'metrics.complained': 1 }
        });
        break;

      case 'open':
        if (!tracking.openedAt) {
          tracking.status = 'opened';
          tracking.openedAt = new Date(timestamp * 1000);
          
          await Campaign.findByIdAndUpdate(tracking.campaignId, {
            $inc: { 'metrics.opened': 1 }
          });
        }

        tracking.opens.push({
          openedAt: new Date(timestamp * 1000),
          ipAddress: event.ip,
          userAgent: event.useragent,
        });
        break;

      case 'click':
        if (!tracking.clickedAt) {
          tracking.status = 'clicked';
          tracking.clickedAt = new Date(timestamp * 1000);
          
          await Campaign.findByIdAndUpdate(tracking.campaignId, {
            $inc: { 'metrics.clicked': 1 }
          });
        }

        tracking.clicks.push({
          url: event.url,
          clickedAt: new Date(timestamp * 1000),
          ipAddress: event.ip,
        });
        break;
    }

    await tracking.save();

    logger.info(`Webhook event processed: ${eventType}`, {
      messageId: sg_message_id,
      email,
      campaignId: tracking.campaignId,
    });
  } catch (error) {
    logger.error('Error processing webhook event:', error);
  }
}

export default router;