import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { Button } from './button';
import { Input } from './input';
import { Label } from './label';

interface LogoUploadProps {
  value: string;
  onChange: (url: string) => void;
  onAltTextChange: (alt: string) => void;
  altText: string;
  className?: string;
}

const LogoUpload: React.FC<LogoUploadProps> = ({
  value,
  onChange,
  onAltTextChange,
  altText,
  className = ''
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(value);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('File size must be less than 2MB');
      return;
    }

    setIsUploading(true);

    try {
      // For demo purposes, we'll create a local URL
      // In production, you'd upload to your server or CDN
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      onChange(url);

      // Update alt text if not set
      if (!altText) {
        onAltTextChange(file.name.replace(/\.[^/.]+$/, ''));
      }
    } catch (error) {
      console.error('Error uploading logo:', error);
      alert('Failed to upload logo. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleUrlChange = (url: string) => {
    setPreviewUrl(url);
    onChange(url);
  };

  const handleRemoveLogo = () => {
    setPreviewUrl('');
    onChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Logo Preview */}
      {previewUrl && (
        <div className="flex items-center justify-center p-4 border-2 border-dashed border-border rounded-lg bg-muted/20">
          <div className="relative">
            <img
              src={previewUrl}
              alt={altText || 'Logo preview'}
              className="max-w-full max-h-32 object-contain"
              onError={() => setPreviewUrl('')}
            />
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="absolute -top-2 -right-2 h-6 w-6 p-0"
              onClick={handleRemoveLogo}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}

      {/* Upload Section */}
      {!previewUrl && (
        <div className="flex items-center justify-center p-6 border-2 border-dashed border-border rounded-lg bg-muted/20">
          <div className="text-center">
            <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <div className="space-y-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                <Upload className="h-4 w-4 mr-2" />
                {isUploading ? 'Uploading...' : 'Upload Logo'}
              </Button>
              <p className="text-xs text-muted-foreground">
                PNG, JPG, SVG up to 2MB
              </p>
            </div>
          </div>
        </div>
      )}

      {/* File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* URL Input */}
      <div className="space-y-2">
        <Label htmlFor="logoUrl">Logo URL</Label>
        <Input
          id="logoUrl"
          value={value}
          onChange={(e) => handleUrlChange(e.target.value)}
          placeholder="https://example.com/logo.png"
        />
      </div>

      {/* Alt Text Input */}
      <div className="space-y-2">
        <Label htmlFor="logoAlt">Logo Alt Text</Label>
        <Input
          id="logoAlt"
          value={altText}
          onChange={(e) => onAltTextChange(e.target.value)}
          placeholder="Company Logo"
        />
      </div>
    </div>
  );
};

export default LogoUpload; 
