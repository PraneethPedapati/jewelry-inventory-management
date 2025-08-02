<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" class="logo" width="120"/>

# High Level Design Document

## Jewelry Inventory Management Application

**Document Version:** 2.0
**Date:** July 22, 2025
**Project:** Jewelry Inventory Management System
**Author:** Development Team

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Architecture Overview](#2-architecture-overview)
3. [Technology Stack](#3-technology-stack)
4. [System Components](#4-system-components)
5. [Data Flow Architecture](#5-data-flow-architecture)
6. [Deployment Architecture](#6-deployment-architecture)
7. [Cost Analysis](#7-cost-analysis)
8. [Non-Functional Requirements](#8-non-functional-requirements)
9. [Risk Assessment](#9-risk-assessment)
10. [Future Scalability](#10-future-scalability)

## 1. System Overview

### 1.1 Purpose

The Jewelry Inventory Management Application is a mobile-first web-based system designed to manage complete jewelry product inventory (charm+chain combinations) with WhatsApp-integrated order processing. The system serves two distinct user interfaces:

- **Admin Portal**: For inventory management, order status updates, and business analytics
- **Customer Portal**: For complete jewelry browsing, specification selection, and WhatsApp-based ordering


### 1.2 Business Flow

**Customer Journey:**

1. **Product Browsing**: View complete jewelry pieces (charm+chain combinations)
2. **Specification Selection**: Choose size (S/M/L) for bracelets/anklets OR layers (Single/Double/Triple) for chains
3. **Cart Management**: Add complete products with chosen specifications
4. **Checkout**: Enter customer details (name, email, address, contact)
5. **WhatsApp Integration**: Automatic redirect with pre-filled complete order message
6. **Order Placement**: Customer sends WhatsApp message to business

**Admin Workflow:**

1. **Order Reception**: Receive complete jewelry orders via WhatsApp
2. **Payment Processing**: Manual QR code sharing via WhatsApp chat
3. **Order Management**: Update order status in system
4. **Customer Communication**: Send status updates via WhatsApp integration

### 1.3 Product Structure

**Complete Jewelry Products:**
Each product is a **complete jewelry piece** consisting of:

- **Fixed Charm**: Decorative element (part of product definition)
- **Fixed Chain**: Base chain type (part of product definition)
- **User Specification**: Size or layer selection

**Product Categories \& Specifications:**

```
├── Chain Type (Charm + Chain Combination)
│   └── Specifications: Single Layer, Double Layer, Triple Layer
└── Bracelet/Anklet Type (Charm + Chain Combination)  
    └── Specifications: Size S, Size M, Size L
```


### 1.4 Key Features

**Admin Features:**

- Complete jewelry product CRUD operations with specifications
- Order status management (view and update only)
- WhatsApp integration for customer communication
- Dashboard analytics for product specifications popularity
- Real-time inventory tracking by specification

**Customer Features:**

- Mobile-optimized complete jewelry catalog
- Specification-based selection (size OR layers)
- Shopping cart with specification management
- WhatsApp-integrated checkout with complete order details


### 1.5 System Boundaries

- **In Scope**: Complete product management, WhatsApp integration, specification tracking, mobile optimization
- **Out of Scope**: Direct payment processing, separate charm/chain inventory, multi-vendor support


## 2. Architecture Overview

### 2.1 Architecture Pattern

**Mobile-First Three-Tier Architecture with Observability**

- **Presentation Layer**: Responsive React.js applications with TypeScript
- **Business Logic Layer**: Node.js 20 LTS/Express.js REST API with observability
- **Data Layer**: PostgreSQL database with external image storage



### 2.2 System Architecture Diagram

```
┌─────────────────┐    ┌─────────────────┐
│   Admin Panel   │    │  Customer App   │
│  (React + TS)   │    │ (Mobile-First)  │
└─────────┬───────┘    └─────────┬───────┘
          │                      │
          └──────────┬───────────┘
                     │ HTTPS/REST API
          ┌──────────▼───────────┐
          │   Node.js 20 LTS     │
          
          └──────────┬───────────┘
                     │
          ┌──────────▼───────────┐    ┌─────────────┐
          │   PostgreSQL 16      │    │   Imgur     │
          │     (Neon)           │    │  (Images)   │
          └──────────────────────┘    └─────────────┘
                     │
          
```


## 3. Technology Stack

### 3.1 Frontend Technologies (Latest 2025)

| Component | Technology | Version | Purpose |
| :-- | :-- | :-- | :-- |
| **Framework** | React.js | 18.3+ | Mobile-First UI Development |
| **Language** | TypeScript | 5.5+ | Type Safety & Developer Experience |
| **Build Tool** | Vite | 5.x | Fast Development & Build |
| **Styling** | Tailwind CSS | 3.4+ | Mobile Responsive Design |
| **State Management** | Zustand | 4.x | Lightweight State Management |
| **Routing** | React Router | 6.x | Client-side Navigation |
| **UI Components** | Shadcn/UI | Latest | Modern Component Library |
| **HTTP Client** | Axios | 1.7+ | HTTP Requests |
| **PWA** | Vite PWA Plugin | 0.20+ | App-like Experience |
| **Form Management** | React Hook Form | 7.5+ | Form State Management |

### 3.2 Backend Technologies (Latest 2025)

| Component | Technology | Version | Purpose |
| :-- | :-- | :-- | :-- |
| **Runtime** | Node.js | 20.15 LTS | Stable Production Runtime |
| **Framework** | Express.js | 4.19+ | Web Framework |
| **Language** | TypeScript | 5.5+ | Type Safety |
| **Authentication** | Jose (JWT) | 5.x | Modern JWT Library |
| **Password Hashing** | Argon2 | 0.41+ | Modern Password Hashing |
| **File Upload** | Multer | 1.4+ | Image Processing |
| **Validation** | Zod | 3.23+ | TypeScript-first Validation |
| **Database ORM** | Drizzle ORM | 0.32+ | Type-safe Database Access |
| **CORS** | cors | 2.8+ | Cross-Origin Support |
| **Excel Export** | exceljs | 4.4+ | Exporting data to Excel |

### 3.3 Database & Storage (Latest 2025)

| Component | Service | Version | Purpose |
| :-- | :-- | :-- | :-- |
| **Primary Database** | Neon PostgreSQL | 16+ | Complete Jewelry Product Data |
| **Image Storage** | Imgur API | v3 | Product Images |
| **Session Storage** | JWT Tokens | - | Admin Authentication |
| **Caching** | Redis | 7.x | Performance Optimization |

### 3.4 DevOps & Hosting (Latest 2025)

| Component | Service | Plan | Purpose |
| :-- | :-- | :-- | :-- |
| **Frontend Hosting** | Vercel | Free | Mobile-Optimized Hosting |
| **Backend Hosting** | Railway | Free (500 hrs) | API Hosting |
| **Version Control** | GitHub | Free | Code Repository |
| **CI/CD** | GitHub Actions | Free | Automated Testing & Deployment |

## 4. System Components

### 4.1 Frontend Components

#### 4.1.1 Admin Portal (TypeScript + Shadcn/UI)

- **Dashboard**: Product specification analytics, order KPIs, sales trends
- **Product Management**: Complete jewelry CRUD with specification pricing
- **Order Management**: WhatsApp-integrated status updates
- **Authentication**: Secure TypeScript-based login system


#### 4.1.2 Customer Portal (Mobile-First PWA)

- **Product Catalog**: Grid view of complete jewelry pieces
- **Product Details**: Specification selection (sizes OR layers)
- **Shopping Cart**: Touch-optimized specification management
- **Checkout Form**: Customer detail collection with validation
- **WhatsApp Integration**: Automatic redirect with complete order details


### 4.2 Backend Components

#### 4.2.1 API Modules (TypeScript)

- **Authentication Module**: Modern JWT with Argon2 hashing
- **Product Module**: Complete jewelry CRUD with specifications
- **Order Module**: WhatsApp-integrated order processing with tracing[^1]
- **WhatsApp Module**: Complete order message formatting
- **Upload Module**: Image handling via Imgur API
- **Analytics Module**: Specification popularity tracking



#### 4.2.2 Database Schema (Complete Products)

```sql
-- Complete Jewelry Product Structure
├── admins (admin authentication)
├── color_themes (configurable color palettes)
├── product_code_sequences (for generating unique product codes)
├── product_categories (product categories)
├── products (complete jewelry products)
├── orders (customer orders)
├── order_items (items within an order)
├── order_status_history (history of order status changes)
├── expense_categories (expense categories)
├── expenses (business expenses)
├── analytics_cache (cache for analytics data)
├── analytics_metadata (metadata for analytics)
└── analytics_history (history of analytics data)
```


## 5. Data Flow Architecture

### 5.1 Customer Order Flow (Complete Products)

```
Browse Complete Jewelry → Select Specification (Size OR Layers) → 
Add to Cart with Specs → Checkout Form → 
WhatsApp Message with Complete Order → Customer Sends Message
```


### 5.2 Admin Order Processing Flow

```
Receive WhatsApp Order → Update Status (Traced) → 
Send Payment QR → Receive Payment → 
Mark Confirmed (Monitored) → Process Order → 
Send Status via WhatsApp
```


### 5.3 API Endpoints Structure (TypeScript)

```typescript
// Public Endpoints
interface PublicAPI {
  'GET /api/products': Product[]
  'GET /api/products/:id': Product
  'GET /api/product-types': ProductType[]
  'POST /api/orders': Order
  'GET /api/brand-config': BrandConfig
  'GET /api/themes': Theme[]
}

// Protected Admin Endpoints
interface AdminAPI {
  'POST /api/admin/auth/login': AuthResponse
  'GET /api/admin/auth/profile': AdminProfile
  'POST /api/admin/auth/change-password': StatusResponse
  'GET /api/admin/dashboard': DashboardStats
  'GET /api/admin/products': Product[]
  'GET /api/admin/products/stats': ProductStats
  'GET /api/admin/products/:id': Product
  'POST /api/admin/products': Product
  'PUT /api/admin/products/:id': Product
  'DELETE /api/admin/products/:id': StatusResponse
  'GET /api/admin/orders': Order[]
  'GET /api/admin/orders/stats': OrderStats
  'GET /api/admin/orders/export': File
  'GET /api/admin/orders/:id': Order
  'POST /api/admin/orders': Order
  'PUT /api/admin/orders/:id': Order
  'DELETE /api/admin/orders/:id': StatusResponse
  'POST /api/admin/orders/:id/approve': StatusResponse
  'POST /api/admin/orders/:id/send-payment-qr': StatusResponse
  'POST /api/admin/orders/:id/confirm-payment': StatusResponse
  'POST /api/admin/orders/:id/send-whatsapp': StatusResponse
  'POST /api/admin/orders/:id/status-whatsapp': StatusResponse
  'GET /api/admin/orders/find/:orderCode': Order
  'POST /api/admin/orders/delete-stale': StatusResponse
  'GET /api/admin/expenses': Expense[]
  'GET /api/admin/expenses/categories': ExpenseCategory[]
  'GET /api/admin/expenses/stats': ExpenseStats
  'GET /api/admin/expenses/:id': Expense
  'POST /api/admin/expenses': Expense
  'PUT /api/admin/expenses/:id': Expense
  'DELETE /api/admin/expenses/:id': StatusResponse
  'GET /api/admin/analytics': Analytics
  'POST /api/admin/analytics/refresh': StatusResponse
  'GET /api/admin/analytics/status': AnalyticsStatus
  'GET /api/admin/dashboard/widgets': DashboardWidgets
  'POST /api/admin/dashboard/widgets/refresh': StatusResponse
  'GET /api/admin/dashboard/debug/aov': DebugAOV
}
```


## 6. Deployment Architecture

### 6.1 Modern Deployment Strategy

- **Frontend**: TypeScript-compiled React app on Vercel with PWA
- **Backend**: Node.js 20 LTS container on Railway 
- **Database**: PostgreSQL 16 on Neon with connection pooling
- **Monitoring**: Self-hosted Jaeger 
- **Images**: Optimized uploads to Imgur via API


### 6.2 Environment Configuration

```
Development Environment:
├── Node.js 20 LTS + TypeScript
├── PostgreSQL 16 (local)

└── Hot module replacement (Vite)

Production Environment:
├── Vercel (PWA Frontend)

├── Neon (PostgreSQL 16)

└── Imgur (Optimized Images)
```


## 7. Cost Analysis

### 7.1 Initial Development Phase (0-3 months)

| Service | Plan | Monthly Cost | Annual Cost |
| :-- | :-- | :-- | :-- |
| Vercel | Free | \$0 | \$0 |
| Railway | Free (500 hrs) | \$0 | \$0 |
| Neon PostgreSQL | Free (0.5GB) | \$0 | \$0 |
| Imgur | Free | \$0 | \$0 |

| Domain (Optional) | - | \$1.25 | \$15 |
| **Total** |  | **\$0-1.25** | **\$0-15** |

### 7.2 Growth Phase (500+ monthly customers)

| Service | Plan | Monthly Cost | Annual Cost |
| :-- | :-- | :-- | :-- |
| Vercel | Pro | \$20 | \$240 |
| Railway | Hobby | \$5 | \$60 |
| Neon PostgreSQL | Launch | \$19 | \$228 |
| Imgur | Free | \$0 | \$0 |
| Redis (Railway) | \$3 | \$36 |  |
| **Total** |  | **\$47** | **\$564** |

### 7.3 Scale Phase (2000+ monthly customers)

| Service | Plan | Monthly Cost | Annual Cost |
| :-- | :-- | :-- | :-- |
| Vercel | Pro | \$20 | \$240 |
| Railway | Pro | \$20 | \$240 |
| Neon PostgreSQL | Scale | \$69 | \$828 |
| Cloudinary | Basic | \$99 | \$1,188 |
| Redis Pro | \$15 | \$180 |  |
| **Total** |  | **\$223** | **\$2,676** |

## 8. Non-Functional Requirements

### 8.1 Performance Requirements (Mobile-Optimized)

| Metric | Target | Method |
| :-- | :-- | :-- |
| **Mobile Page Load** | < 1.5 seconds | PWA + Image optimization |
| **API Response Time** | < 200ms | Node.js 20 performance + caching |
| **Mobile Users** | 90%+ support | Mobile-first design |
| **Uptime** | 99.9% | Modern hosting + monitoring |

### 8.2 Modern Development Standards

- **TypeScript Coverage**: 100% type safety
- **Code Quality**: ESLint + Prettier + Husky
- **Testing**: Vitest + Playwright for E2E

- **Security**: Modern authentication + input validation


### 8.3 Mobile Excellence

- **PWA Features**: Offline support, installable app
- **Touch Optimization**: 44px minimum touch targets
- **Performance**: Core Web Vitals optimization
- **Accessibility**: WCAG 2.1 AA compliance


## 9. Risk Assessment

### 9.1 Technical Risks (2025 Context)

| Risk | Impact | Probability | Mitigation |
| :-- | :-- | :-- | :-- |
| **Node.js 20 Compatibility** | Low | Low | LTS stability, thorough testing |
| **TypeScript Migration** | Medium | Low | Gradual adoption, strong typing |
| **PWA Adoption** | Medium | Medium | Progressive enhancement |


### 9.2 Business Risks

| Risk | Impact | Probability | Mitigation |
| :-- | :-- | :-- | :-- |
| **Complete Product Complexity** | Medium | Low | Clear specification UI |
| **Mobile-first Adoption** | High | Low | Extensive mobile testing |
| **WhatsApp Integration** | High | Medium | Fallback communication methods |

## 10. Future Scalability

### 10.1 Immediate Enhancements (Q4 2025)

- **Advanced Analytics**: Specification popularity tracking
- **Bulk Operations**: Admin efficiency for specification management
- **Enhanced PWA**: Push notifications for order updates
- **A/B Testing**: Specification selection optimization


### 10.2 Long-term Vision (2026+)

- **AI Recommendations**: Specification suggestions based on customer preferences

- **Real-time Inventory**: Live specification availability updates
- **International Expansion**: Multi-currency, multi-language support


### 10.3 Technical Evolution

- **Edge Computing**: Closer data processing with Vercel Edge Functions
- **Advanced Caching**: Specification-aware caching strategies
- **Microservices**: Gradual service decomposition
- **Machine Learning**: Demand forecasting for specifications


## Conclusion

This updated High Level Design leverages the latest 2025 technologies including Node.js 20 LTS, TypeScript 5.5+, and modern React patterns. The complete jewelry product model (charm+chain combinations) simplifies both customer experience and inventory management while maintaining scalability.

The architecture prioritizes mobile-first design, type safety, observability, and modern development practices, providing a solid foundation for sustainable growth.

**Next Steps:**

1. TypeScript-first Low Level Design (LLD) creation
2. Complete product database schema with specifications

4. PWA implementation roadmap
5. Mobile-first UI/UX design system development

<div style="text-align: center">⁂</div>



