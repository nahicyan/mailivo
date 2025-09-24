// api/src/routes/analytics.routes.ts
import { Router, Request, Response } from 'express';
import { EmailTracking, IEmailTracking } from '../models/EmailTracking.model';
import { Campaign } from '../models/Campaign';
import { authenticate } from '../middleware/auth.middleware';  
import axios from 'axios';

const router = Router();

// Apply authentication middleware to all routes - ADD THIS LINE
router.use(authenticate);

// Simple user agent parsing without external dependency
function parseUserAgent(userAgent?: string) {
  if (!userAgent) return { device: 'Unknown', browser: 'Unknown', os: 'Unknown' };
  
  const isMobile = /Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  const isTablet = /iPad|Android.*Tablet|Windows.*Touch/i.test(userAgent);
  
  let deviceType = 'Desktop';
  if (isTablet) deviceType = 'Tablet';
  else if (isMobile) deviceType = 'Mobile';
  
  let browser = 'Unknown';
  if (/Chrome/i.test(userAgent)) browser = 'Chrome';
  else if (/Firefox/i.test(userAgent)) browser = 'Firefox';
  else if (/Safari/i.test(userAgent)) browser = 'Safari';
  else if (/Edge/i.test(userAgent)) browser = 'Edge';
  
  let os = 'Unknown';
  if (/Windows/i.test(userAgent)) os = 'Windows';
  else if (/Mac/i.test(userAgent)) os = 'macOS';
  else if (/Linux/i.test(userAgent)) os = 'Linux';
  else if (/Android/i.test(userAgent)) os = 'Android';
  else if (/iOS|iPhone|iPad/i.test(userAgent)) os = 'iOS';
  
  return { device: deviceType, browser, os };
}

async function fetchLandivoBuyer(buyerId: string) {
  try {
    const landivoUrl = process.env.LANDIVO_API_URL || 'https://api.landivo.com';
    const response = await axios.get(`${landivoUrl}/buyer/${buyerId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching buyer ${buyerId}:`, error);
    return null;
  }
}

// Get detailed analytics for a campaign
router.get('/campaigns/:campaignId/analytics/detailed', async (req: Request, res: Response): Promise<void> => {
  try {
    const { campaignId } = req.params;

    // Get campaign data
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      res.status(404).json({ error: 'Campaign not found' });
      return;
    }

    // Get all tracking records for this campaign
    const trackingRecords = await EmailTracking.find({ campaignId });


    // Process clicked contacts data
    const clickedContacts = await processClickedContacts(trackingRecords);
    // Process link performance
    const linkPerformance = processLinkPerformance(trackingRecords);

    // Generate timeline data (24 hours)
    const timelineData = generateTimelineData(trackingRecords);

    // Generate device data
    const deviceData = generateDeviceData(trackingRecords);

    // Generate location data
    const locationData = generateLocationData(trackingRecords);

    const analyticsData = {
      campaign,
      clickedContacts,
      linkPerformance,
      timelineData,
      deviceData,
      locationData,
    };

    res.json(analyticsData);
  } catch (error) {
    console.error('Error fetching detailed analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics data' });
  }
});

// Get detailed click information for a specific contact
router.get('/campaigns/:campaignId/analytics/contact/:contactId/clicks', async (req: Request, res: Response): Promise<void> => {
  try {
    const { campaignId, contactId } = req.params;

    // Find tracking record for this contact in this campaign
    const tracking = await EmailTracking.findOne({ campaignId, contactId });
    
    if (!tracking || !tracking.linkClicks || tracking.linkClicks.length === 0) {
      res.json([]);
      return;
    }

    // Process click details
    const clickDetails = tracking.linkClicks.map(click => {
      // Find the link metadata
      const linkMeta = tracking.links?.find(link => link.linkId === click.linkId);
      
      // Parse user agent for device info
      const parsed = parseUserAgent(click.userAgent);
      const device = `${parsed.browser} on ${parsed.os}`;

      return {
        linkId: click.linkId,
        linkText: linkMeta?.linkText || 'Untitled Link',
        originalUrl: linkMeta?.originalUrl || '#',
        clickedAt: click.clickedAt.toISOString(),
        ipAddress: click.ipAddress || 'Unknown',
        userAgent: click.userAgent || 'Unknown',
        referer: click.referer || 'Direct',
        device,
        location: extractLocationFromIP(click.ipAddress),
      };
    }).sort((a, b) => new Date(a.clickedAt).getTime() - new Date(b.clickedAt).getTime());

    res.json(clickDetails);
  } catch (error) {
    console.error('Error fetching contact click details:', error);
    res.status(500).json({ error: 'Failed to fetch contact click details' });
  }
});

// Helper function to process clicked contacts
async function processClickedContacts(trackingRecords: IEmailTracking[]) {
  const contactClickData = new Map();

  // Get unique contact IDs that have clicks
  const clickedContactIds = trackingRecords
    .filter(record => record.linkClicks && record.linkClicks.length > 0)
    .map(record => record.contactId);

  // Fetch buyer details from Landivo
  const buyerPromises = clickedContactIds.map(id => fetchLandivoBuyer(id));
  const buyers = await Promise.all(buyerPromises);
  
  // Create a map of buyer data
  const buyerMap = new Map();
  buyers.forEach(buyer => {
    if (buyer && buyer.id) {
      buyerMap.set(buyer.id, buyer);
    }
  });

  // Process tracking records
  trackingRecords.forEach(record => {
    if (!record.linkClicks || record.linkClicks.length === 0) return;

    const contactId = record.contactId;
    const buyer = buyerMap.get(contactId);
    
    if (!buyer) return;

    const existing = contactClickData.get(contactId) || {
      contactId,
      email: buyer.email,
      firstName: buyer.firstName || '',
      lastName: buyer.lastName || '',
      totalClicks: 0,
      uniqueLinks: new Set(),
      clickTimes: [],
      devices: new Set(),
      locations: new Set(),
    };

    record.linkClicks.forEach((click: any) => {
      existing.totalClicks++;
      existing.uniqueLinks.add(click.linkId);
      existing.clickTimes.push(click.clickedAt);
      
      const parsed = parseUserAgent(click.userAgent);
      existing.devices.add(parsed.device);

      if (click.ipAddress) {
        existing.locations.add(extractLocationFromIP(click.ipAddress) || 'Unknown');
      }
    });

    contactClickData.set(contactId, existing);
  });

  // Convert to final format
  return Array.from(contactClickData.values()).map(contact => {
    const sortedTimes = contact.clickTimes.sort();
    const engagementScore = Math.min(100, (contact.totalClicks * 10) + (contact.uniqueLinks.size * 20));

    return {
      contactId: contact.contactId,
      email: contact.email,
      firstName: contact.firstName,
      lastName: contact.lastName,
      totalClicks: contact.totalClicks,
      uniqueLinks: contact.uniqueLinks.size,
      firstClick: sortedTimes[0]?.toISOString() || '',
      lastClick: sortedTimes[sortedTimes.length - 1]?.toISOString() || '',
      devices: Array.from(contact.devices),
      locations: Array.from(contact.locations),
      engagementScore,
    };
  }).sort((a, b) => b.totalClicks - a.totalClicks);
}

// Helper function to process link performance
function processLinkPerformance(trackingRecords: IEmailTracking[]) {
  const linkStats = new Map();

  trackingRecords.forEach(record => {
    if (!record.linkClicks || !record.links) return;

    record.linkClicks.forEach((click: any) => {
      const linkMeta = record.links.find((link: any) => link.linkId === click.linkId);
      if (!linkMeta) return;

      const existing = linkStats.get(click.linkId) || {
        linkId: click.linkId,
        linkText: linkMeta.linkText,
        originalUrl: linkMeta.originalUrl,
        clickCount: 0,
        uniqueClickers: new Set(),
        clickTimes: [],
      };

      existing.clickCount++;
      existing.uniqueClickers.add(record.contactId);
      existing.clickTimes.push(click.clickedAt);

      linkStats.set(click.linkId, existing);
    });
  });

  // Calculate total recipients for click rate
  const totalRecipients = trackingRecords.length;

  return Array.from(linkStats.values()).map(link => ({
    linkId: link.linkId,
    linkText: link.linkText,
    originalUrl: link.originalUrl,
    clickCount: link.clickCount,
    uniqueClickers: link.uniqueClickers.size,
    clickRate: totalRecipients > 0 ? 
      (link.uniqueClickers.size / totalRecipients) * 100 : 0,
    avgTimeToClick: calculateAverageTimeToClick(link.clickTimes),
  })).sort((a, b) => b.clickCount - a.clickCount);
}

// Helper function to generate timeline data
function generateTimelineData(trackingRecords: IEmailTracking[]) {
  const hourlyData = new Map();

  // Initialize 24 hours
  for (let i = 0; i < 24; i++) {
    const hour = i.toString().padStart(2, '0') + ':00';
    hourlyData.set(hour, { hour, clicks: 0, opens: 0 });
  }

  trackingRecords.forEach(record => {
    // Process opens
    if (record.openedAt) {
      const hour = new Date(record.openedAt).getHours().toString().padStart(2, '0') + ':00';
      const existing = hourlyData.get(hour);
      if (existing) {
        existing.opens++;
      }
    }

    // Process clicks
    if (record.linkClicks) {
      record.linkClicks.forEach((click: any) => {
        const hour = new Date(click.clickedAt).getHours().toString().padStart(2, '0') + ':00';
        const existing = hourlyData.get(hour);
        if (existing) {
          existing.clicks++;
        }
      });
    }
  });

  return Array.from(hourlyData.values());
}

// Helper function to generate device data
function generateDeviceData(trackingRecords: IEmailTracking[]) {
  const deviceStats = new Map();
  let totalClicks = 0;

  trackingRecords.forEach(record => {
    if (!record.linkClicks) return;

    record.linkClicks.forEach((click: any) => {
      const parsed = parseUserAgent(click.userAgent);
      const deviceType = parsed.device;

      deviceStats.set(deviceType, (deviceStats.get(deviceType) || 0) + 1);
      totalClicks++;
    });
  });

  return Array.from(deviceStats.entries()).map(([device, clicks]) => ({
    device,
    clicks,
    percentage: totalClicks > 0 ? (clicks / totalClicks) * 100 : 0,
  }));
}

// Helper function to generate location data
function generateLocationData(trackingRecords: IEmailTracking[]) {
  const locationStats = new Map();
  let totalClicks = 0;

  trackingRecords.forEach(record => {
    if (!record.linkClicks) return;

    record.linkClicks.forEach((click: any) => {
      const location = extractLocationFromIP(click.ipAddress) || 'Unknown';
      locationStats.set(location, (locationStats.get(location) || 0) + 1);
      totalClicks++;
    });
  });

  return Array.from(locationStats.entries())
    .map(([location, clicks]) => ({
      location,
      clicks,
      percentage: totalClicks > 0 ? (clicks / totalClicks) * 100 : 0,
    }))
    .sort((a, b) => b.clicks - a.clicks);
}

// Helper function to calculate engagement score
/* function calculateEngagementScore(totalClicks: number, uniqueLinks: number): number {
  const clickScore = Math.min(totalClicks * 0.5, 5);
  const diversityScore = Math.min(uniqueLinks * 1, 5);
  return clickScore + diversityScore;
} */

// Helper function to calculate average time to click
function calculateAverageTimeToClick(clickTimes: Date[]): number {
  if (clickTimes.length === 0) return 0;
  
  const sortedTimes = clickTimes.sort((a, b) => a.getTime() - b.getTime());
  const firstClick = sortedTimes[0];
  const avgTime = sortedTimes.reduce((sum, time) => {
    return sum + (time.getTime() - firstClick.getTime());
  }, 0) / sortedTimes.length;
  
  return avgTime / (1000 * 60 * 60); // Convert to hours
}

// Placeholder function for IP geolocation
function extractLocationFromIP(ipAddress: string | undefined): string | null {
  if (!ipAddress || ipAddress === 'unknown') return null;
  
  if (ipAddress.startsWith('192.168') || ipAddress.startsWith('10.') || ipAddress.startsWith('172.')) {
    return 'Local Network';
  }
  
  // Mock locations based on IP ranges
  const mockLocations = [
    'New York, US', 'Los Angeles, US', 'London, UK', 'Toronto, CA',
    'Sydney, AU', 'Tokyo, JP', 'Berlin, DE', 'Paris, FR',
  ];
  
  const hash = ipAddress.split('.').reduce((acc, part) => acc + parseInt(part, 10), 0);
  return mockLocations[hash % mockLocations.length];
}

export default router;