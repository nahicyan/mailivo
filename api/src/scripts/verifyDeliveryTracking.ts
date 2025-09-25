// api/src/scripts/verifyDeliveryTracking.ts
// Run with: npx ts-node src/scripts/verifyDeliveryTracking.ts

import { mailcowStatusService } from '../services/mailcow/mailcowStatus.service';
import { EmailTracking } from '../models/EmailTracking.model';
import { Campaign } from '../models/Campaign';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

async function verifySetup() {
  console.log('🔍 Delivery Tracking Verification\n');
  
  // 1. Check environment variables
  console.log('1️⃣ Environment Configuration:');
  const requiredVars = [
    'MAILCOW_API_URL',
    'MAILCOW_API_KEY',
    'MAILCOW_SYNC_ENABLED'
  ];
  
  let configValid = true;
  requiredVars.forEach(varName => {
    const value = process.env[varName];
    if (!value) {
      console.log(`   ❌ ${varName}: NOT SET`);
      configValid = false;
    } else {
      console.log(`   ✅ ${varName}: ${varName.includes('KEY') ? '***' : value}`);
    }
  });
  
  if (!configValid) {
    console.log('\n⚠️  Missing required environment variables!');
    return;
  }
  
  // 2. Test Mailcow API connection
  console.log('\n2️⃣ Testing Mailcow API Connection:');
  try {
    const url = `${process.env.MAILCOW_API_URL}/api/v1/get/logs/postfix/1`;
    const response = await axios.get(url, {
      headers: { 'X-API-Key': process.env.MAILCOW_API_KEY },
      timeout: 5000
    });
    console.log(`   ✅ Connected to Mailcow API`);
    console.log(`   📊 Sample log entry available: ${response.data.length > 0 ? 'Yes' : 'No'}`);
  } catch (error: any) {
    console.log(`   ❌ Failed to connect: ${error.message}`);
    console.log(`   Check your MAILCOW_API_URL and MAILCOW_API_KEY`);
    return;
  }
  
  // 3. Connect to MongoDB
  console.log('\n3️⃣ Connecting to MongoDB:');
  try {
    await mongoose.connect(process.env.MONGODB_URI || '');
    console.log('   ✅ Connected to MongoDB');
  } catch (error: any) {
    console.log(`   ❌ MongoDB connection failed: ${error.message}`);
    return;
  }
  
  // 4. Check recent email tracking records
  console.log('\n4️⃣ Recent Email Tracking Records:');
  const recentTracking = await EmailTracking.find({})
    .sort({ createdAt: -1 })
    .limit(5)
    .select('messageId status deliveredAt bouncedAt contactEmail');
  
  if (recentTracking.length === 0) {
    console.log('   No tracking records found');
  } else {
    recentTracking.forEach(record => {
      console.log(`   📧 ${record.contactEmail || 'unknown'}`);
      console.log(`      MessageId: ${record.messageId || 'NOT SET'}`);
      console.log(`      Status: ${record.status}`);
      console.log(`      Delivered: ${record.deliveredAt ? '✅' : '❌'}`);
      console.log(`      Bounced: ${record.bouncedAt ? '⚠️' : '✅'}\n`);
    });
  }
  
  // 5. Run a test sync
  console.log('5️⃣ Running Test Sync:');
  try {
    const result = await mailcowStatusService.syncStatuses();
    console.log(`   ✅ Sync completed`);
    console.log(`   📊 Processed: ${result.processed} logs`);
    console.log(`   🔄 Updated: ${result.updated} records`);
    
    if (result.processed === 0) {
      console.log('\n   ℹ️  No new logs to process. This could mean:');
      console.log('      - No recent email activity on Mailcow');
      console.log('      - Logs already processed');
      console.log('      - Check MAILCOW_LOGS_PER_BATCH setting');
    }
  } catch (error: any) {
    console.log(`   ❌ Sync failed: ${error.message}`);
  }
  
  // 6. Check campaign metrics
  console.log('\n6️⃣ Campaign Metrics Update:');
  const campaign = await Campaign.findOne({})
    .sort({ createdAt: -1 })
    .select('name metrics');
  
  if (campaign) {
    console.log(`   Campaign: ${campaign.name}`);
    console.log(`   Sent: ${campaign.metrics.sent}`);
    console.log(`   Delivered: ${campaign.metrics.delivered || 0}`);
    console.log(`   Bounced: ${campaign.metrics.bounced || 0}`);
    console.log(`   Failed: ${campaign.metrics.failed || 0}`);
  }
  
  // 7. Manual messageId lookup test
  console.log('\n7️⃣ Testing MessageId Lookup:');
  const testMessageId = '<1758830011652-vog4j6ql3@mailivo.com>';
  const testRecord = await EmailTracking.findOne({ messageId: testMessageId });
  
  if (testRecord) {
    console.log(`   ✅ Found record for ${testMessageId}`);
    console.log(`   Current status: ${testRecord.status}`);
    
    // Simulate what would happen if Mailcow reported delivery
    console.log('\n   📝 Simulating delivery update...');
    testRecord.status = 'delivered';
    testRecord.deliveredAt = new Date();
    await testRecord.save();
    console.log('   ✅ Status updated to "delivered"');
  } else {
    console.log(`   ❌ No record found for ${testMessageId}`);
  }
  
  console.log('\n✨ Verification Complete!\n');
  process.exit(0);
}

verifySetup().catch(console.error);