import { connectDatabase } from './connection.js';

async function testConnection() {
  try {
    console.log('🚀 Starting database connection test...');
    await connectDatabase();
    console.log('🎉 Database connection test completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('💥 Database connection test failed!');
    process.exit(1);
  }
}

testConnection(); 
