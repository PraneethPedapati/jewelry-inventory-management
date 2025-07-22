import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import { getThemes, getActiveTheme, setActiveTheme } from '@/controllers/theme.controller.js';

// Load environment variables
dotenv.config();

class Application {
  public app: express.Application;

  constructor() {
    this.app = express();
    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeMiddleware(): void {
    // Security middleware
    this.app.use(helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:", "http:"],
          connectSrc: ["'self'", "https://api.imgur.com"],
        },
      },
    }));

    // CORS configuration
    this.app.use(cors({
      origin: process.env.NODE_ENV === 'production'
        ? [process.env.FRONTEND_URL || 'https://your-domain.vercel.app']
        : true,
      credentials: true,
      optionsSuccessStatus: 200
    }));

    // General middleware
    this.app.use(compression());
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Request logging in development
    if (process.env.NODE_ENV === 'development') {
      this.app.use((req, res, next) => {
        console.log(`${req.method} ${req.path}`);
        next();
      });
    }
  }

  private initializeRoutes(): void {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        message: '🎨 Jewelry Inventory Management API - Color Palettes Ready!'
      });
    });

    // Theme API routes
    this.app.get('/api/themes', getThemes);
    this.app.get('/api/themes/active', getActiveTheme);
    this.app.post('/api/themes/activate', setActiveTheme);

    this.app.get('/api/products', (req, res) => {
      res.json({
        success: true,
        data: {
          products: [
            {
              id: '1',
              name: 'Butterfly Dream Chain',
              charmDescription: 'Delicate butterfly charm with crystal accents',
              chainDescription: 'Sterling silver curb chain',
              basePrice: 45.00,
              images: ['https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400']
            },
            {
              id: '2',
              name: 'Heart Lock Bracelet',
              charmDescription: 'Heart-shaped lock charm with key detail',
              chainDescription: 'Rose gold plated cable chain',
              basePrice: 35.00,
              images: ['https://images.unsplash.com/photo-1611955167811-4711904bb9f8?w=400']
            }
          ],
          message: 'Sample jewelry products (database connection pending)'
        }
      });
    });

    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        success: false,
        error: 'Route not found',
        path: req.originalUrl
      });
    });
  }

  private initializeErrorHandling(): void {
    this.app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
      console.error('Error occurred:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error.message
      });
    });
  }

  public async start(): Promise<void> {
    try {
      const PORT = process.env.PORT || 3000;

      this.app.listen(PORT, () => {
        console.log(`🚀 Jewelry Inventory API running on port ${PORT}`);
        console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`🎨 Color palettes: Ready to configure!`);
        console.log(`📱 Health check: http://localhost:${PORT}/health`);
      });
    } catch (error) {
      console.error('Failed to start application:', error);
      process.exit(1);
    }
  }
}

// Start application
const application = new Application();
application.start();

export default application.app; 
