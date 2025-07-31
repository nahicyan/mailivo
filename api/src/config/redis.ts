// api/src/config/redis.ts
import { Redis } from 'ioredis';

let redisClient: Redis | null = null;

export const connectRedis = async (): Promise<Redis> => {
  try {
    // Parse Redis URL or use individual config
    const redisUrl = process.env.REDIS_URL;
    const redisHost = process.env.REDIS_HOST || 'localhost';
    const redisPort = parseInt(process.env.REDIS_PORT || '6379');
    const redisPassword = process.env.REDIS_PASSWORD;
    
    // Create Redis client
    if (redisUrl) {
      redisClient = new Redis(redisUrl, {
        connectTimeout: 5000,
        lazyConnect: true,
        maxRetriesPerRequest: 3,
      });
    } else {
      redisClient = new Redis({
        host: redisHost,
        port: redisPort,
        password: redisPassword,
        connectTimeout: 5000,
        lazyConnect: true,
        maxRetriesPerRequest: 3,
      });
    }
    
    // Test connection
    await redisClient.ping();
    
    console.log(`✅ Redis Connected: ${redisUrl || `${redisHost}:${redisPort}`}`);
    
    // Set up error handlers
    redisClient.on('error', (error) => {
      console.error('❌ Redis Connection Error:', error);
    });
    redisClient.on('connect', () => {
      console.log('🔄 Redis Connected');
    });
    redisClient.on('ready', () => {
      console.log('✅ Redis Ready');
    });
    redisClient.on('close', () => {
      console.log('⚠️  Redis Connection Closed');
    });
    redisClient.on('reconnecting', () => {
      console.log('🔄 Redis Reconnecting...');
    });
    
    return redisClient;
  } catch (error) {
    console.error('❌ Failed to connect to Redis:', error);
    console.error('💥 Application will crash because Redis is required for:');
    console.error('   - Email queue processing');
    console.error('   - Campaign management'); 
    console.error('   - Workflow automation');
    console.error('   - Background job processing');
    console.error('');
    console.error('🔧 Please ensure Redis is running and accessible at:');
    if (process.env.REDIS_URL) {
      console.error(`   ${process.env.REDIS_URL}`);
    } else {
      console.error(`   ${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || '6379'}`);
    }
    
    // Crash the application
    process.exit(1);
  }
};

export const getRedisClient = (): Redis => {
  if (!redisClient) {
    throw new Error('Redis client not initialized. Call connectRedis() first.');
  }
  return redisClient;
};

export const disconnectRedis = async (): Promise<void> => {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    console.log('🔌 Redis Disconnected');
  }
};