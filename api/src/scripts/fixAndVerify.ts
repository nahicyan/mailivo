// api/src/scripts/fixAndVerify.ts
// Run: npx ts-node src/scripts/fixAndVerify.ts

import mongoose from 'mongoose';
import { EmailTracking } from '../models/EmailTracking.model';
import dotenv from 'dotenv';

dotenv.config();

async function fixAndVerify() {
  await mongoose.connect(process.env.MONGODB_URI || '');
  console.log('Connected to MongoDB\n');
  
  // 1. FIX EXISTING RECORDS
  console.log('📝 FIXING EXISTING RECORDS...\n');
  
  // Known email mappings
  const emailMappings: Record<string, string> = {
    '6890bfa3ed25cd806c0dc621': 'nathan@landersinvestment.com',
    '6890bfc3ed25cd806c0dc622': 'alpha@texsoil.net'
  };
  
  // Fix recent records
  const recentRecords = await EmailTracking.find({
    createdAt: { $gte: new Date(Date.now() - 48 * 60 * 60 * 1000) }
  });
  
  for (const record of recentRecords) {
    const contactId = record.contactId as string;
    if (!record.contactEmail && emailMappings[contactId]) {
      record.contactEmail = emailMappings[contactId];
      await record.save();
      console.log(`✅ Fixed: ${record.trackingId} -> ${record.contactEmail}`);
    }
  }
  
  // 2. VERIFY THE FIX
  console.log('\n🔍 VERIFYING RECORDS:\n');
  
  const updatedRecords = await EmailTracking.find({
    messageId: { $exists: true }
  }).sort({ createdAt: -1 }).limit(5);
  
  for (const record of updatedRecords) {
    console.log(`TrackingId: ${record.trackingId}`);
    console.log(`  Email: ${record.contactEmail || '❌ MISSING'}`);
    console.log(`  MessageId: ${record.messageId}`);
    console.log(`  Status: ${record.status}`);
    console.log('');
  }
  
  // 3. CHECK YOUR IMPLEMENTATION
  console.log('⚠️  CRITICAL: Check these files:\n');
  
  console.log('1. api/src/services/processors/campaignProcessor.service.ts');
  console.log('   Look for this line in createEmailJobs:');
  console.log('   const trackingId = await this.emailJobProcessor.createTrackingRecord(');
  console.log('     campaign._id.toString(),');
  console.log('     contactId,');
  console.log('     contactEmail  // ← THIS MUST BE HERE');
  console.log('   );\n');
  
  console.log('2. api/src/services/processors/emailJobProcessor.service.ts');
  console.log('   createTrackingRecord must have:');
  console.log('   async createTrackingRecord(');
  console.log('     campaignId: string,');
  console.log('     contactId: string,');
  console.log('     contactEmail?: string  // ← THIS PARAMETER');
  console.log('   )');
  console.log('   And must save it:');
  console.log('   contactEmail: contactEmail || "",  // ← STORING IT\n');
  
  // 4. TEST WITH MAILCOW
  console.log('🔄 Now testing Mailcow sync...\n');
  
  const { mailcowStatusService } = require('../services/mailcow/mailcowStatus.service');
  
  // Reset to reprocess last 2 hours
  const Redis = require('ioredis');
  const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
  await redis.set('mailcow:last_processed_time', (Date.now() - 2 * 60 * 60 * 1000).toString());
  console.log('Reset sync time to 2 hours ago\n');
  
  const result = await mailcowStatusService.syncStatuses();
  console.log(`Sync Result:`);
  console.log(`  Processed: ${result.processed}`);
  console.log(`  Updated: ${result.updated}`);
  console.log(`  Matched by Email: ${result.matchedByEmail || 0}\n`);
  
  // 5. CHECK FINAL STATUS
  const finalCheck = await EmailTracking.findOne({
    messageId: '<1758890435014-cp5pck4s1@mailivo.com>'
  });
  
  if (finalCheck) {
    console.log('✅ FINAL STATUS:');
    console.log(`  Email: ${finalCheck.contactEmail}`);
    console.log(`  Status: ${finalCheck.status}`);
    console.log(`  Delivered: ${finalCheck.deliveredAt ? '✅' : '❌'}`);
  }
  
  redis.disconnect();
  process.exit(0);
}

fixAndVerify().catch(console.error);