import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { config } from '../config/app.js';
import * as schema from './schema.js';

// Create PostgreSQL connection
const connectionString = config.DATABASE_URL;

// Log connection string (masked for security)
if (connectionString) {
  // const maskedUrl = connectionString.replace(/:([^:@]+)@/, ':****@');
  // console.log('🔗 Database URL:', maskedUrl);
} else {
  console.log('❌ DATABASE_URL is not set');
}

if (!connectionString) {
  throw new Error('DATABASE_URL is required');
}

// Configure postgres client
const client = postgres(connectionString, {
  max: config.DB_POOL_MAX,
  idle_timeout: 20,
  connect_timeout: 10,
  ssl: 'require', // Force SSL for Neon database
});

// Create Drizzle database instance
export const db = drizzle(client, {
  schema,
  logger: false
});

// Test database connection
export const connectDatabase = async (): Promise<void> => {
  try {
    console.log('🔄 Attempting to connect to database...');

    // Test the connection with a simple query
    await client`SELECT 1 as test`;
    console.log('✅ Database connected successfully');

  } catch (error) {
    console.error('❌ Database connection failed:');
    console.error('Error type:', error instanceof Error ? error.constructor.name : typeof error);
    console.error('Error message:', error instanceof Error ? error.message : String(error));
    console.error('Error code:', (error as any)?.code || 'Unknown');
    console.error('Full error:', error);
    throw error;
  }
};

// Graceful shutdown
export const closeDatabase = async (): Promise<void> => {
  try {
    await client.end();
    console.log('📝 Database connection closed');
  } catch (error) {
    console.error('Error closing database connection:', error);
  }
};

// Handle process termination
process.on('SIGINT', async () => {
  await closeDatabase();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await closeDatabase();
  process.exit(0);
}); 
