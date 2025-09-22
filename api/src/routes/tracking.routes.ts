// api/src/routes/tracking.routes.ts
import { Router, Request, Response } from 'express';
import { EmailTracking } from '../models/EmailTracking.model';
import { Campaign } from '../models/Campaign';
import { Contact } from '../models/Contact.model';
import { logger } from '../utils/logger';
//import { linkTrackingService } from '../services/linkTracking.service';

const router = Router();

// Track email opens
/* router.get('/open/:trackingId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { trackingId } = req.params;
    const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
    const userAgent = req.get('User-Agent') || '';

    // Find tracking record
    const tracking = await EmailTracking.findById(trackingId);
    
    // Always return tracking pixel regardless of tracking record status
    const pixel = Buffer.from(
      'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
      'base64'
    );
    
    res.set({
      'Content-Type': 'image/gif',
      'Content-Length': pixel.length.toString(),
      'Cache-Control': 'no-store, no-cache, must-revalidate, private',
    });

    if (!tracking) {
      res.end(pixel);
      return;
    }

    // Update tracking record only if not already opened
    if (!tracking.openedAt) {
      tracking.status = 'opened';
      tracking.openedAt = new Date();
      tracking.ipAddress = ipAddress;
      tracking.userAgent = userAgent;

      // Update campaign metrics
      await Campaign.findByIdAndUpdate(tracking.campaignId, {
        $inc: { 
          'metrics.opened': 1,
          'metrics.open': 1 // Legacy support
        }
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
    });

    res.end(pixel);
  } catch (error) {
    logger.error('Error tracking email open:', error);
    
    // Return pixel even on error
    const pixel = Buffer.from(
      'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
      'base64'
    );
    
    res.set('Content-Type', 'image/gif');
    res.end(pixel);
  }
}); */

// Track email clicks
router.get('/click/:trackingId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { trackingId } = req.params;
    const { url } = req.query;
    const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';

    if (!url || typeof url !== 'string') {
      res.status(400).json({ error: 'URL parameter required' });
      return;
    }

    // Find tracking record - try both trackingId and _id for backwards compatibility
    const tracking = await EmailTracking.findOne({ 
      $or: [
        { trackingId: trackingId },
        { _id: trackingId }
      ]
    });
    
    if (tracking) {
      // Update tracking record only if not already clicked
      if (!tracking.clickedAt) {
        tracking.status = 'clicked';
        tracking.clickedAt = new Date();

        // Update campaign metrics
        await Campaign.findByIdAndUpdate(tracking.campaignId, {
          $inc: { 
            'metrics.clicked': 1,
            'metrics.clicks': 1 // Legacy support
          }
        });
      }

      // Add to clicks array
      tracking.clicks.push({
        url: url,
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
    }

    // Redirect to actual URL
    res.redirect(url);
  } catch (error) {
    logger.error('Error tracking email click:', error);
    
    // Redirect to URL even on error if it exists
    if (req.query.url && typeof req.query.url === 'string') {
      res.redirect(req.query.url);
    } else {
      res.status(500).json({ error: 'Tracking error' });
    }
  }
});

// Unsubscribe endpoint
router.get('/unsubscribe', async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.query;
    
    if (!token || typeof token !== 'string') {
      res.status(400).send('Invalid unsubscribe link');
      return;
    }

    // Decode token
    const decoded = Buffer.from(token, 'base64').toString();
    const [contactId, campaignId] = decoded.split(':');

    // Find and update contact
    const contact = await Contact.findByIdAndUpdate(contactId, {
      subscribed: false,
      unsubscribedAt: new Date(),
      unsubscribeSource: campaignId,
    });

    if (!contact) {
      res.status(404).send('Contact not found');
      return;
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
router.post('/webhooks/sendgrid', async (req: Request, res: Response): Promise<void> => {
  try {
    const events = req.body;

    if (!Array.isArray(events)) {
      res.status(400).json({ error: 'Invalid webhook payload' });
      return;
    }

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
async function processWebhookEvent(event: any): Promise<void> {
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
          $inc: { 
            'metrics.delivered': 1,
            'metrics.successfulDeliveries': 1 // Legacy support
          }
        });
        break;

      case 'bounce':
        tracking.status = 'bounced';
        tracking.bouncedAt = new Date(timestamp * 1000);
        tracking.bounceReason = reason;
        
        await Campaign.findByIdAndUpdate(tracking.campaignId, {
          $inc: { 
            'metrics.bounced': 1,
            'metrics.bounces': 1 // Legacy support
          }
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
            $inc: { 
              'metrics.opened': 1,
              'metrics.open': 1 // Legacy support
            }
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
            $inc: { 
              'metrics.clicked': 1,
              'metrics.clicks': 1 // Legacy support
            }
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

// Enhanced click tracking with link-specific analytics

router.get('/click/:trackingId/:linkId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { trackingId, linkId } = req.params;
    const { url } = req.query;
    const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
    const userAgent = req.get('User-Agent') || '';
    const referer = req.get('Referer') || '';

    if (!url || typeof url !== 'string') {
      res.status(400).json({ error: 'URL parameter required' });
      return;
    }

    const tracking = await EmailTracking.findOne({ trackingId });
    
    if (tracking) {
      // Update general click status if first click
      if (!tracking.clickedAt) {
        tracking.status = 'clicked';
        tracking.clickedAt = new Date();

        await Campaign.findByIdAndUpdate(tracking.campaignId, {
          $inc: { 'metrics.clicked': 1 }
        });
      }

      // Track link-specific click
      tracking.linkClicks.push({
        linkId,
        clickedAt: new Date(),
        ipAddress,
        userAgent,
        referer,
      });

      // FIX: Handle uniqueIPs as an array, not a Set
      const linkStat = tracking.linkStats.get(linkId) || {
        clickCount: 0,
        uniqueIPs: [], // Array, not Set
        firstClick: undefined,
        lastClick: undefined
      };

      linkStat.clickCount++;
      linkStat.lastClick = new Date();
      if (!linkStat.firstClick) {
        linkStat.firstClick = new Date();
      }
      
      // FIX: Add IP to array if not already present
      if (!linkStat.uniqueIPs.includes(ipAddress)) {
        linkStat.uniqueIPs.push(ipAddress);
      }

      tracking.linkStats.set(linkId, linkStat);
      
      await tracking.save();

      logger.info(`Email link clicked: ${trackingId}/${linkId}`, {
        campaignId: tracking.campaignId,
        contactId: tracking.contactId,
        linkId,
        url,
        ipAddress,
      });
    }

    res.redirect(url);
  } catch (error) {
    logger.error('Error tracking click:', error);
    
    if (req.query.url && typeof req.query.url === 'string') {
      res.redirect(req.query.url);
    } else {
      res.status(500).json({ error: 'Tracking error' });
    }
  }
});

export default router;