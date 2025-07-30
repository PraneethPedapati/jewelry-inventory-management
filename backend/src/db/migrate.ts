import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { db } from './connection';
import { config } from '../config/app';
import { sql } from 'drizzle-orm';

const runMigrations = async (): Promise<void> => {
  try {
    console.log('🔄 Starting database migration...');

    await migrate(db, {
      migrationsFolder: './src/db/migrations',
    });

    // Create analytics cache table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS analytics_cache (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        cache_key VARCHAR(255) UNIQUE NOT NULL,
        cache_data JSONB NOT NULL,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    // Drop system_configs table if it exists (brand config moved to env vars)
    await db.execute(sql`
      DROP TABLE IF EXISTS system_configs CASCADE
    `);

    console.log('✅ Database migration completed successfully');
  } catch (error) {
    console.error('❌ Database migration failed:', error);
    process.exit(1);
  }
};

// Run migrations if this script is called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigrations()
    .then(() => {
      console.log('📝 Migration process finished');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration process failed:', error);
      process.exit(1);
    });
} 
