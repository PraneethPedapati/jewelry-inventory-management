# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Structure

This is a monorepo jewelry inventory management system with TypeScript throughout:

- `backend/` - Express.js API server with PostgreSQL (Drizzle ORM)
- `frontend/` - React 18.3+ SPA with Vite and Tailwind CSS
- Root workspace manages both with npm workspaces

## Essential Commands

### Development
```bash
npm run dev              # Start both frontend and backend concurrently
npm run dev:backend      # Backend only (https://jewelry-inventory-management-production.up.railway.app)  
npm run dev:frontend     # Frontend only (http://localhost:5173)
```

### Building & Testing
```bash
npm run build           # Build both applications
npm run test            # Run all tests (Vitest + Playwright)
npm run lint            # ESLint across both workspaces
```

### Database Operations
```bash
npm run db:migrate      # Run Drizzle migrations
npm run db:seed         # Populate with sample data
npm run db:generate     # Generate new migration from schema changes
npm run db:studio       # Launch Drizzle Studio
```

### Workspace-Specific Commands
Backend: `npm run <command> --workspace=backend`
Frontend: `npm run <command> --workspace=frontend`

Individual workspace commands:
- Backend: `npm run type-check`, `npm run format`
- Frontend: `npm run type-check`, `npm run test:e2e`, `npm run lint:fix`

## Core Architecture

### Database Schema (Drizzle ORM)
- `products` - Complete jewelry items with auto-generated product codes
- `product_specifications` - Size/layer variants per product
- `orders` - Customer orders with WhatsApp integration
- `order_items` - Line items within orders  
- `color_themes` - Configurable UI color palettes
- `admins` - Admin authentication
- `analytics_*` - Performance tracking tables

### API Structure
- `/api/admin/*` - Protected admin endpoints (JWT auth)
- `/api/public/*` - Customer-facing endpoints
- `/api/themes` - Color theme management

### Frontend Organization
- `pages/admin/` - Admin dashboard components
- `pages/customer/` - Customer-facing pages
- `components/admin/widgets/` - Dashboard analytics widgets
- `stores/` - Zustand state management
- `services/api.ts` - Axios-based API client with caching

## Key Features

### WhatsApp Integration
Orders automatically generate WhatsApp links with formatted order details. Admin can update order statuses which trigger WhatsApp notifications.

### Dynamic Theming
Color themes stored in database, applied via CSS custom properties. Admin can switch themes real-time from settings panel.

### Analytics System
On-demand analytics refresh system with caching. Dashboard widgets auto-refresh stale data and show loading states.

### Product Code Generation
Auto-generated user-friendly product codes (e.g., "BR001", "NC045") via database sequences per product type.

## Development Notes

### Environment Setup
- Copy `backend/env.example` to `backend/.env`
- Copy `frontend/env.example` to `frontend/.env`  
- Update JWT_SECRET (min 32 chars), database URL, company details

### Testing Strategy
- Backend: Vitest for unit/integration tests
- Frontend: Vitest + Testing Library for components
- E2E: Playwright tests for complete user flows

### Code Patterns
- Controllers use Zod validation middleware
- Services contain business logic, return structured responses
- Error handling via custom error classes and global middleware
- TypeScript strict mode throughout

### Security Features
- JWT-based admin authentication with Argon2 password hashing
- Rate limiting on API endpoints
- CORS configuration for production
- Input validation with Zod schemas
- Parameterized queries prevent SQL injection
