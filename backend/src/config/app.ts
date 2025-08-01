import { z } from 'zod';
import dotenv from 'dotenv';

// Load environment variables before parsing
dotenv.config();

const ConfigSchema = z.object({
  // Server
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(val => parseInt(val)).default('3000'),

  // Database
  DATABASE_URL: z.string().url(),
  DB_POOL_MIN: z.string().transform(val => parseInt(val)).default('2'),
  DB_POOL_MAX: z.string().transform(val => parseInt(val)).default('10'),

  // Authentication
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRATION: z.string().default('24h'),

  // Redis (optional)
  REDIS_HOST: z.string().optional(),
  REDIS_PORT: z.string().transform(val => parseInt(val)).optional(),
  REDIS_PASSWORD: z.string().optional(),

  // WhatsApp
  WHATSAPP_BUSINESS_PHONE: z.string(),

  // Order Configuration
  ORDER_VALIDITY_HOURS: z.string().transform(val => parseInt(val)).default('2'),

  // Payment Configuration
  BUSINESS_UPI_ID: z.string().default('yourstore@paytm'),

  // File Upload
  MAX_FILE_SIZE: z.string().transform(val => parseInt(val)).default('5242880'), // 5MB
  ALLOWED_FILE_TYPES: z.string().default('image/jpeg,image/png,image/webp'),

  // External APIs
  IMGUR_CLIENT_ID: z.string().optional(),

  // ImgBB Image Hosting
  IMGBB_API_KEY: z.string().optional(),
  IMGBB_EXPIRATION: z.string().optional(),

  // Monitoring
  ENABLE_TRACING: z.string().transform(val => val === 'true').default('false'),
  JAEGER_ENDPOINT: z.string().optional(),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().transform(val => parseInt(val)).default('900000'), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(val => parseInt(val)).default('100'),

  // CORS
  FRONTEND_URL: z.string().optional(),

  // Brand Configuration
  COMPANY_NAME: z.string().default('Elegant Jewelry Store'),
  COMPANY_SHORT_NAME: z.string().default('EJS'),
  COMPANY_DESCRIPTION: z.string().default('Premium jewelry collection with elegant designs'),
  CONTACT_EMAIL: z.string().email().default('info@elegantjewelry.com'),
  CONTACT_PHONE: z.string().default('+91-9876543210'),
  WEBSITE: z.string().url().default('https://elegantjewelry.com'),
  LOGO_URL: z.string().default('/assets/logo.svg'),
  FAVICON_URL: z.string().default('/assets/favicon.svg'),
  // PRIMARY_COLOR: z.string().trim().regex(/^#[0-9A-F]{6}$/i).default('#6366f1'),
  // SECONDARY_COLOR: z.string().trim().regex(/^#[0-9A-F]{6}$/i).default('#8b5cf6'),
});

export type Config = z.infer<typeof ConfigSchema>;

export const config: Config = ConfigSchema.parse(process.env);

// Validate critical configuration
export const validateConfig = (): void => {
  try {
    ConfigSchema.parse(process.env);
    console.log('✅ Configuration validated successfully');
  } catch (error) {
    console.error('❌ Configuration validation failed:', error);
    if (error instanceof z.ZodError) {
      console.error('Missing or invalid environment variables:');
      error.errors.forEach(err => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
    }
    process.exit(1);
  }
};

// Environment-specific configurations
type Environment = 'development' | 'production' | 'test';

interface EnvironmentConfig {
  database: {
    ssl: boolean;
    pool: {
      min: number;
      max: number;
    };
  };
  cache: {
    enabled: boolean;
    defaultTtl: number;
  };
  logging: {
    level: string;
    format: string;
  };
  performance: {
    enableTracing: boolean;
    enableProfiling: boolean;
  };
}

const environments: Record<Environment, EnvironmentConfig> = {
  development: {
    database: {
      ssl: false,
      pool: { min: 2, max: 5 }
    },
    cache: {
      enabled: false,
      defaultTtl: 60
    },
    logging: {
      level: 'debug',
      format: 'pretty'
    },
    performance: {
      enableTracing: true,
      enableProfiling: false
    }
  },

  production: {
    database: {
      ssl: true,
      pool: { min: 5, max: 20 }
    },
    cache: {
      enabled: true,
      defaultTtl: 300
    },
    logging: {
      level: 'info',
      format: 'json'
    },
    performance: {
      enableTracing: true,
      enableProfiling: true
    }
  },

  test: {
    database: {
      ssl: false,
      pool: { min: 1, max: 3 }
    },
    cache: {
      enabled: false,
      defaultTtl: 1
    },
    logging: {
      level: 'error',
      format: 'simple'
    },
    performance: {
      enableTracing: false,
      enableProfiling: false
    }
  }
};

export const getEnvironmentConfig = (env: Environment): EnvironmentConfig => {
  return environments[env];
};

export const environmentConfig = getEnvironmentConfig(config.NODE_ENV); 
