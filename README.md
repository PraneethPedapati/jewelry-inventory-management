# Jewelry Inventory Management System

A modern, mobile-first jewelry inventory management application with WhatsApp integration for seamless order processing.

## 🌟 Features

- **Complete Jewelry Management**: Manage charm+chain combinations with specifications
- **Mobile-First Design**: PWA with app-like experience
- **WhatsApp Integration**: Automated order processing and status updates
- **Configurable Color Palettes**: Customizable branding and themes
- **Admin Dashboard**: Comprehensive order and inventory management
- **Customer Portal**: Intuitive browsing and ordering experience
- **Real-time Analytics**: Product popularity and sales insights
- **Type-Safe Development**: Full TypeScript implementation

## 🏗️ Architecture

### Technology Stack

- **Frontend**: React 18.3+, TypeScript 5.5+, Vite, Tailwind CSS, Zustand
- **Backend**: Node.js 20 LTS, Express.js, TypeScript, Drizzle ORM
- **Database**: PostgreSQL 16 (Neon)
- **Cache**: Redis
- **Monitoring**: OpenTelemetry + Jaeger
- **Hosting**: Vercel (Frontend) + Railway (Backend)

### Project Structure

```
jewelry-inventory-management/
├── backend/                 # Node.js API server
│   ├── src/
│   │   ├── controllers/     # Request handlers
│   │   ├── services/        # Business logic
│   │   ├── db/             # Database layer
│   │   ├── middleware/     # Express middleware
│   │   ├── routes/         # API routes
│   │   ├── types/          # TypeScript definitions
│   │   ├── utils/          # Utility functions
│   │   └── config/         # Configuration
│   └── package.json
├── frontend/               # React application
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── services/       # API services
│   │   ├── stores/         # Zustand stores
│   │   ├── types/          # TypeScript definitions
│   │   └── utils/          # Utility functions
│   └── package.json
└── docs/                   # Documentation
```

## 🚀 Quick Start

### Prerequisites

- Node.js 20+ LTS
- PostgreSQL 16+
- Redis (optional, for caching)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd jewelry-inventory-management
   ```

2. **Install dependencies**
   ```bash
   npm run setup
   ```

3. **Environment Setup**
   ```bash
   # Backend environment
   cp backend/.env.example backend/.env
   
   # Frontend environment  
   cp frontend/.env.example frontend/.env
   ```

4. **Database Setup**
   ```bash
   npm run setup:backend
   npm run db:migrate
   npm run db:seed
   ```

5. **Start Development**
   ```bash
   npm run dev
   ```

   The application will be available at:
   - Frontend: http://localhost:5173
   - Backend: http://localhost:3000

## 📊 Database Schema

### Core Tables

- **products**: Complete jewelry items (charm + chain combinations)
- **product_specifications**: Size/layer specifications for products
- **orders**: Customer orders with WhatsApp integration
- **order_items**: Individual items within orders
- **color_themes**: Configurable color palettes
- **admins**: Admin user authentication

## 🎨 Color Palette System

The application supports configurable color palettes:

- **Admin Control**: Change themes from admin dashboard
- **Real-time Updates**: Colors update across the application instantly
- **Multiple Themes**: Support for seasonal/promotional themes
- **Brand Consistency**: Maintain consistent branding

## 📱 WhatsApp Integration

### Customer Flow
1. Browse products and select specifications
2. Add items to cart
3. Fill checkout form
4. Automatic WhatsApp redirect with order details

### Admin Flow
1. Receive orders via WhatsApp
2. Update order status in admin panel
3. Send status updates via WhatsApp integration

## 🔧 Development

### Available Scripts

```bash
# Development
npm run dev              # Start both frontend and backend
npm run dev:backend      # Start only backend
npm run dev:frontend     # Start only frontend

# Building
npm run build           # Build both applications
npm run build:backend   # Build backend only
npm run build:frontend  # Build frontend only

# Testing
npm run test            # Run all tests
npm run test:backend    # Run backend tests
npm run test:frontend   # Run frontend tests

# Linting
npm run lint            # Lint all code
npm run lint:fix        # Fix linting issues
```

### Database Commands

```bash
npm run db:migrate      # Run database migrations
npm run db:seed         # Seed database with sample data
npm run db:reset        # Reset database (development only)
npm run db:generate     # Generate new migration
```

## 🚢 Deployment

### Production Environment

1. **Backend**: Deploy to Railway
2. **Frontend**: Deploy to Vercel
3. **Database**: PostgreSQL on Neon
4. **Monitoring**: Jaeger for distributed tracing

### Environment Variables

See individual workspace README files for detailed environment configuration.

## 📋 API Documentation

The API documentation is available at `/api/docs` when running in development mode.

### Key Endpoints

- `GET /api/products` - List products with specifications
- `POST /api/orders` - Create new order
- `GET /api/admin/dashboard` - Admin analytics
- `PUT /api/admin/orders/:id/status` - Update order status

## 🧪 Testing

The project includes comprehensive testing:

- **Unit Tests**: Service and utility function testing
- **Integration Tests**: API endpoint testing
- **E2E Tests**: Complete user flow testing with Playwright

## 📈 Performance

- **Caching**: Redis-based caching for frequently accessed data
- **Image Optimization**: Automatic image compression and format conversion
- **Database Optimization**: Proper indexing and query optimization
- **CDN Integration**: Static asset delivery optimization

## 🔐 Security

- **Authentication**: JWT-based admin authentication
- **Input Validation**: Zod schema validation
- **Rate Limiting**: API endpoint protection
- **CORS Configuration**: Secure cross-origin requests
- **SQL Injection Protection**: Parameterized queries with Drizzle ORM

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation in the `/docs` folder
- Review the API documentation at `/api/docs` 
