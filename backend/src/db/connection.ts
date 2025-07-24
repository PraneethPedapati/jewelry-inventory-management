import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { config } from '../config/app.js';
import * as schema from './schema.js';

// Create PostgreSQL connection
const connectionString = config.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is required');
}

// Configure postgres client
const client = postgres(connectionString, {
  max: config.DB_POOL_MAX,
  idle_timeout: 20,
  connect_timeout: 10,
  ssl: config.NODE_ENV === 'production' ? 'require' : false,
});

// Create Drizzle database instance
export const db = drizzle(client, {
  schema,
  logger: config.NODE_ENV === 'development'
});

// Test database connection
export const connectDatabase = async (): Promise<void> => {
  try {
    // Test the connection with a simple query
    await client`SELECT 1 as test`;
    console.log('✅ Database connected successfully');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
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
