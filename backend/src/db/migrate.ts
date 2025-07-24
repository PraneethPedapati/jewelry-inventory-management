import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { db } from './connection.js';
import { config } from '../config/app.js';

const runMigrations = async (): Promise<void> => {
  try {
    console.log('🔄 Starting database migration...');

    await migrate(db, {
      migrationsFolder: './src/db/migrations',
    });

    console.log('✅ Database migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
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
