# Environment Variables Configuration

This document describes all environment variables used in the jewelry inventory management application.

## Backend Environment Variables

Create a `.env` file in the `backend/` directory with the following variables:

### Server Configuration
```env
NODE_ENV=development
PORT=3000
```

### Database Configuration
```env
DATABASE_URL=postgresql://username:password@localhost:5432/jewelry_inventory
DB_POOL_MIN=2
DB_POOL_MAX=10
```

### Authentication
```env
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long
JWT_EXPIRATION=24h
```

### WhatsApp Integration
```env
WHATSAPP_BUSINESS_PHONE=+1234567890
```

### File Upload
```env
MAX_FILE_SIZE=5242880
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/webp
```

### External APIs (Optional)
```env
IMGUR_CLIENT_ID=your-imgur-client-id
```

### Monitoring
```env
ENABLE_TRACING=false
JAEGER_ENDPOINT=http://localhost:14268/api/traces
```

### Rate Limiting
```env
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### CORS
```env
FRONTEND_URL=http://localhost:5173
```

### Brand Configuration
```env
COMPANY_NAME=Elegant Jewelry Store
COMPANY_SHORT_NAME=EJS
COMPANY_DESCRIPTION=Premium jewelry collection with elegant designs
CONTACT_EMAIL=info@elegantjewelry.com
CONTACT_PHONE=+91-9876543210
WEBSITE=https://elegantjewelry.com
LOGO_URL=/assets/logo.svg
FAVICON_URL=/assets/favicon.svg
```

## Frontend Environment Variables

Create a `.env` file in the `frontend/` directory with the following variables:

### Brand Configuration
```env
VITE_COMPANY_NAME=Elegant Jewelry Store
VITE_COMPANY_SHORT_NAME=EJS
VITE_COMPANY_DESCRIPTION=Premium jewelry collection with elegant designs
VITE_CONTACT_EMAIL=info@elegantjewelry.com
VITE_CONTACT_PHONE=+91-9876543210
VITE_WEBSITE=https://elegantjewelry.com
VITE_LOGO_URL=/assets/logo.svg
VITE_FAVICON_URL=/assets/favicon.svg
```

### API Configuration
```env
VITE_API_BASE_URL=/api
```

### PWA Configuration
```env
VITE_PWA_NAME=Elegant Jewelry Store
VITE_PWA_SHORT_NAME=EJS
VITE_PWA_DESCRIPTION=Premium jewelry collection with elegant designs
VITE_PWA_THEME_COLOR=#8B5CF6
VITE_PWA_BACKGROUND_COLOR=#ffffff
```

## Production Environment Variables

For production deployment, update the following variables:

### Backend Production
```env
NODE_ENV=production
DATABASE_URL=your-production-database-url
JWT_SECRET=your-production-jwt-secret
WHATSAPP_BUSINESS_PHONE=your-production-whatsapp-number
FRONTEND_URL=https://yourdomain.com
COMPANY_NAME=Your Company Name
COMPANY_SHORT_NAME=YCN
COMPANY_DESCRIPTION=Your company description
CONTACT_EMAIL=info@yourcompany.com
CONTACT_PHONE=+1-234-567-8900
WEBSITE=https://yourcompany.com
LOGO_URL=https://yourdomain.com/assets/logo.svg
FAVICON_URL=https://yourdomain.com/assets/favicon.svg
```

### Frontend Production
```env
VITE_COMPANY_NAME=Your Company Name
VITE_COMPANY_SHORT_NAME=YCN
VITE_COMPANY_DESCRIPTION=Your company description
VITE_CONTACT_EMAIL=info@yourcompany.com
VITE_CONTACT_PHONE=+1-234-567-8900
VITE_WEBSITE=https://yourcompany.com
VITE_LOGO_URL=https://yourdomain.com/assets/logo.svg
VITE_FAVICON_URL=https://yourdomain.com/assets/favicon.svg
VITE_API_BASE_URL=https://yourdomain.com/api
VITE_PWA_NAME=Your Company Name
VITE_PWA_SHORT_NAME=YCN
VITE_PWA_DESCRIPTION=Your company description
VITE_PWA_THEME_COLOR=#your-primary-color
VITE_PWA_BACKGROUND_COLOR=#ffffff
```

## Asset Management

### Logo and Favicon Files

Place your logo and favicon files in the `frontend/public/assets/` directory:

- `frontend/public/assets/logo.svg` - Main logo file
- `frontend/public/assets/favicon.svg` - Favicon file

### Supported Formats

- **Logo**: SVG, PNG, JPG, WebP
- **Favicon**: SVG, ICO, PNG

### Recommended Sizes

- **Logo**: 200x200px minimum, 512x512px recommended
- **Favicon**: 32x32px, 64x64px, or 128x128px

## Color Theme System

The application uses a database-driven color theme system. Colors are stored in the `color_themes` table and can be managed through the admin interface.

### Default Theme Colors

The default theme includes these color variables:
- `primary`: #8B5CF6 (Purple)
- `secondary`: #F59E0B (Gold)
- `accent`: #EC4899 (Pink)
- `background`: #FFFFFF (White)
- `foreground`: #1F2937 (Dark Gray)
- `card`: #F9FAFB (Light Gray)
- `cardForeground`: #111827 (Dark)
- `border`: #E5E7EB (Light Border)
- `input`: #FFFFFF (White)
- `ring`: #8B5CF6 (Focus Ring)
- `muted`: #F3F4F6 (Muted Background)
- `mutedForeground`: #6B7280 (Muted Text)
- `destructive`: #EF4444 (Red)
- `destructiveForeground`: #FFFFFF (White)
- `success`: #10B981 (Green)
- `successForeground`: #FFFFFF (White)
- `warning`: #F59E0B (Amber)
- `warningForeground`: #FFFFFF (White)

## Security Considerations

1. **Never commit `.env` files** to version control
2. **Use strong JWT secrets** (minimum 32 characters)
3. **Use HTTPS in production** for all URLs
4. **Validate all environment variables** on application startup
5. **Use different secrets** for development and production

## Validation

The application validates all required environment variables on startup. If any required variables are missing or invalid, the application will:

1. Log detailed error messages
2. Exit with error code 1
3. Display which variables are missing or invalid

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check `DATABASE_URL` format
   - Ensure database is running
   - Verify credentials

2. **JWT Errors**
   - Ensure `JWT_SECRET` is at least 32 characters
   - Check `JWT_EXPIRATION` format

3. **Logo/Favicon Not Loading**
   - Verify file paths in `LOGO_URL` and `FAVICON_URL`
   - Check file permissions
   - Ensure files exist in the specified locations

4. **WhatsApp Integration Issues**
   - Verify `WHATSAPP_BUSINESS_PHONE` format
   - Check WhatsApp Business API credentials

### Environment Variable Priority

1. Environment variables (highest priority)
2. `.env` file values
3. Default values (lowest priority)

## Example Complete Configuration

### Development
```env
# Backend .env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://postgres:password@localhost:5432/jewelry_dev
JWT_SECRET=dev-secret-key-minimum-32-characters-long
WHATSAPP_BUSINESS_PHONE=+1234567890
COMPANY_NAME=Elegant Jewelry Store
COMPANY_SHORT_NAME=EJS
LOGO_URL=/assets/logo.svg
FAVICON_URL=/assets/favicon.svg

# Frontend .env
VITE_COMPANY_NAME=Elegant Jewelry Store
VITE_COMPANY_SHORT_NAME=EJS
VITE_LOGO_URL=/assets/logo.svg
VITE_FAVICON_URL=/assets/favicon.svg
VITE_PWA_THEME_COLOR=#8B5CF6
```

### Production
```env
# Backend .env
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@prod-db:5432/jewelry_prod
JWT_SECRET=prod-super-secret-key-minimum-32-characters-long
WHATSAPP_BUSINESS_PHONE=+1987654321
COMPANY_NAME=Your Jewelry Store
COMPANY_SHORT_NAME=YJS
LOGO_URL=https://yourdomain.com/assets/logo.svg
FAVICON_URL=https://yourdomain.com/assets/favicon.svg

# Frontend .env
VITE_COMPANY_NAME=Your Jewelry Store
VITE_COMPANY_SHORT_NAME=YJS
VITE_LOGO_URL=https://yourdomain.com/assets/logo.svg
VITE_FAVICON_URL=https://yourdomain.com/assets/favicon.svg
VITE_PWA_THEME_COLOR=#8B5CF6
VITE_API_BASE_URL=https://yourdomain.com/api
``` 
