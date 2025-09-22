// api/src/utils/userAgentParser.ts
import UAParser from 'ua-parser-js';

export interface DeviceInfo {
  deviceType: 'desktop' | 'mobile' | 'tablet' | 'unknown';
  browser: string;
  browserVersion: string;
  os: string;
  osVersion: string;
  emailClient?: string;
}

export function parseUserAgent(userAgent: string): DeviceInfo {
   const parser = new (UAParser as any)(userAgent);
  const result = parser.getResult();
  
  // Determine device type
  let deviceType: DeviceInfo['deviceType'] = 'unknown';
  if (result.device.type === 'mobile') {
    deviceType = 'mobile';
  } else if (result.device.type === 'tablet') {
    deviceType = 'tablet';
  } else if (!result.device.type && result.os.name) {
    // Desktop browsers typically don't have device.type
    deviceType = 'desktop';
  }

  // Detect email clients
  const emailClient = detectEmailClient(userAgent);

  return {
    deviceType,
    browser: result.browser.name || 'Unknown',
    browserVersion: result.browser.version || '',
    os: result.os.name || 'Unknown',
    osVersion: result.os.version || '',
    emailClient
  };
}

function detectEmailClient(userAgent: string): string | undefined {
  const emailClients = [
    { pattern: /Outlook/i, name: 'Outlook' },
    { pattern: /Thunderbird/i, name: 'Thunderbird' },
    { pattern: /AppleMail/i, name: 'Apple Mail' },
    { pattern: /AirMail/i, name: 'Airmail' },
    { pattern: /Microsoft Outlook/i, name: 'Outlook' },
    { pattern: /Yahoo/i, name: 'Yahoo Mail' },
    { pattern: /Gmail/i, name: 'Gmail' },
    { pattern: /Android.*Email/i, name: 'Android Email' },
    { pattern: /iPhone.*Mail/i, name: 'iOS Mail' },
  ];

  for (const client of emailClients) {
    if (client.pattern.test(userAgent)) {
      return client.name;
    }
  }
  
  return undefined;
}