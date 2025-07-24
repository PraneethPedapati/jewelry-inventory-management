# Brand Configuration System

This document explains how to use the centralized brand configuration system that allows you to change your company name and logo in one place and have it update throughout the entire application.

## 🎯 Overview

The brand configuration system provides:
- **Centralized Management**: Change company name and logo in one place
- **Real-time Updates**: Changes apply immediately across the application
- **Database Persistence**: Settings are saved to the database
- **Fallback Support**: Default values if configuration is missing

## 📁 Files Involved

### Frontend Files
- `frontend/src/stores/brand.store.ts` - Zustand store for brand configuration
- `frontend/src/components/ui/Logo.tsx` - Reusable logo component
- `frontend/src/components/ui/LogoUpload.tsx` - Logo upload component
- `frontend/src/pages/admin/AdminSettings.tsx` - Brand configuration UI
- `frontend/src/App.tsx` - Initializes brand configuration on app start

### Backend Files
- `backend/src/controllers/config.controller.ts` - API endpoints for brand config
- `backend/src/routes/public.routes.ts` - Routes for brand config API
- `backend/src/services/whatsapp.service.ts` - Uses dynamic company name
- `backend/src/db/seed.ts` - Default brand configuration

### Sample Assets
- `frontend/public/logo.svg` - Sample logo file
- `frontend/public/favicon.svg` - Sample favicon

## 🚀 How to Use

### 1. Access Brand Configuration
1. Go to Admin Panel → Settings
2. Click on the "Brand" tab
3. You'll see two sections:
   - **Company Information**: Name, contact details, description
   - **Visual Identity**: Logo, colors, favicon

### 2. Update Company Information
- **Company Name**: The main name displayed throughout the app
- **Short Name**: Used for logo initials (e.g., "EJS" for "Elegant Jewelry Store")
- **Description**: Brief description of your business
- **Contact Details**: Email, phone, website

### 3. Update Visual Identity
- **Logo**: Upload or provide URL for your company logo
- **Logo Alt Text**: Accessibility text for the logo
- **Favicon**: URL for the browser tab icon
- **Primary/Secondary Colors**: Brand colors used throughout the app

### 4. Preview Changes
The configuration page includes a preview section showing how your brand will appear in:
- Header navigation
- Contact information
- WhatsApp messages

### 5. Save Changes
Click "Save Brand Configuration" to persist your changes to the database.

## 🔄 Automatic Updates

Once you save the brand configuration, the following areas update automatically:

### Frontend Updates
- **Admin Header**: Logo and company name in admin panel
- **Customer Header**: Logo and company name in customer-facing pages
- **Document Title**: Browser tab title
- **Favicon**: Browser tab icon
- **PWA Manifest**: App name and description

### Backend Updates
- **WhatsApp Messages**: Company name in all automated messages
- **Order Notifications**: Branded order confirmations
- **System Messages**: Company name in system alerts

## 🎨 Logo Component Usage

The `Logo` component can be used throughout the application:

```tsx
import Logo from '@/components/ui/Logo';

// Full logo with text
<Logo size="lg" variant="full" />

// Icon only
<Logo size="md" variant="icon" />

// Text only
<Logo size="lg" variant="text" />

// Custom size
<Logo size="xl" variant="full" showText={false} />
```

### Available Props
- `size`: 'sm' | 'md' | 'lg' | 'xl'
- `variant`: 'text' | 'icon' | 'full'
- `showText`: boolean (for full variant)
- `className`: additional CSS classes

## 🔧 API Endpoints

### Get Brand Configuration
```
GET /api/config/brand
```

### Update Brand Configuration
```
POST /api/config/brand
Content-Type: application/json

{
  "companyName": "Your Company Name",
  "companyShortName": "YCN",
  "logoUrl": "https://example.com/logo.png",
  "logoAlt": "Your Company Logo",
  "faviconUrl": "https://example.com/favicon.ico",
  "primaryColor": "#6366f1",
  "secondaryColor": "#8b5cf6",
  "description": "Your company description",
  "contactEmail": "info@yourcompany.com",
  "contactPhone": "+1-234-567-8900",
  "website": "https://yourcompany.com"
}
```

### Reset to Default
```
DELETE /api/config/brand
```

## 🗄️ Database Schema

Brand configuration is stored in the `system_configs` table:

```sql
CREATE TABLE system_configs (
  key VARCHAR(100) PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

The brand configuration is stored with key `'brand_config'` and contains all the brand settings as JSON.

## 🎯 Benefits

1. **Single Source of Truth**: All brand information in one place
2. **Consistent Branding**: Automatic updates across all touchpoints
3. **Easy Maintenance**: No need to update multiple files
4. **Professional Appearance**: Consistent company identity
5. **Scalable**: Easy to add new brand elements

## 🔮 Future Enhancements

Potential improvements to the brand configuration system:
- **Logo Variants**: Different logo versions (light/dark, horizontal/vertical)
- **Brand Guidelines**: Color palette, typography, spacing rules
- **Multi-language Support**: Company names in different languages
- **Brand Templates**: Pre-built brand configurations
- **Version History**: Track changes to brand configuration
- **Approval Workflow**: Require approval for brand changes

## 🛠️ Troubleshooting

### Logo Not Displaying
1. Check if the logo URL is accessible
2. Verify the image format is supported (PNG, JPG, SVG)
3. Check browser console for errors

### Changes Not Saving
1. Ensure you're logged in as admin
2. Check network tab for API errors
3. Verify database connection

### WhatsApp Messages Not Updated
1. Restart the backend server
2. Check if brand config is properly loaded
3. Verify the company name is not empty

## 📝 Example Configuration

Here's an example of a complete brand configuration:

```json
{
  "companyName": "Elegant Jewelry Store",
  "companyShortName": "EJS",
  "logoUrl": "/logo.png",
  "logoAlt": "Elegant Jewelry Store Logo",
  "faviconUrl": "/favicon.ico",
  "primaryColor": "#6366f1",
  "secondaryColor": "#8b5cf6",
  "description": "Premium jewelry collection with elegant designs",
  "contactEmail": "info@elegantjewelry.com",
  "contactPhone": "+91-9876543210",
  "website": "https://elegantjewelry.com"
}
```

This configuration will update all references throughout the application automatically! 
