// api/src/services/tracking/aggregation.service.ts

import { Model } from 'mongoose';

interface TrackingDoc {
  contactId: string;
  sentAt?: Date;
  deliveredAt?: Date;
  openedAt?: Date;
  clickedAt?: Date;
  bouncedAt?: Date;
}

interface ContactsByStatus {
  sent: string[];
  delivered: string[];
  opened: string[];
  clicked: string[];
  bounced: string[];
}

interface ContactsByStatusWithCounts {
  data: ContactsByStatus;
  counts: {
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    bounced: number;
  };
}

export const getContactsByStatus = async (
  TrackingModel: Model<any>,
  campaignId?: string
): Promise<ContactsByStatus> => {
  const query = campaignId ? { campaignId } : {};

  const trackingDocs = await TrackingModel.find(query)
    .select('contactId sentAt deliveredAt openedAt clickedAt bouncedAt')
    .lean<TrackingDoc[]>();

  const statusMap = {
    sent: new Set<string>(),
    delivered: new Set<string>(),
    opened: new Set<string>(),
    clicked: new Set<string>(),
    bounced: new Set<string>(),
  };

  trackingDocs.forEach((doc) => {
    if (doc.sentAt) statusMap.sent.add(doc.contactId);
    if (doc.deliveredAt) statusMap.delivered.add(doc.contactId);
    if (doc.openedAt) statusMap.opened.add(doc.contactId);
    if (doc.clickedAt) statusMap.clicked.add(doc.contactId);
    if (doc.bouncedAt) statusMap.bounced.add(doc.contactId);
  });

  return {
    sent: Array.from(statusMap.sent),
    delivered: Array.from(statusMap.delivered),
    opened: Array.from(statusMap.opened),
    clicked: Array.from(statusMap.clicked),
    bounced: Array.from(statusMap.bounced),
  };
};

export const getContactsByStatusWithCounts = async (
  TrackingModel: Model<any>,
  campaignId?: string
): Promise<ContactsByStatusWithCounts> => {
  const contacts = await getContactsByStatus(TrackingModel, campaignId);

  return {
    data: contacts,
    counts: {
      sent: contacts.sent.length,
      delivered: contacts.delivered.length,
      opened: contacts.opened.length,
      clicked: contacts.clicked.length,
      bounced: contacts.bounced.length,
    },
  };
};