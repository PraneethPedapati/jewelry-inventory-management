import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, LogIn, AlertCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { authService, type AdminLoginRequest } from '@/services/api';
import { env } from '@/config/env';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

interface AdminLoginProps {
  onLogin: (isLoggedIn: boolean) => void;
}

const AdminLogin: React.FC<AdminLoginProps> = ({ onLogin }) => {
  const [formData, setFormData] = useState<AdminLoginRequest>({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Set document title
  useDocumentTitle('Admin Login');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Validate form data
      if (!formData.email || !formData.password) {
        setError('Please fill in all fields');
        return;
      }

      if (!formData.email.includes('@')) {
        setError('Please enter a valid email address');
        return;
      }

      const response = await authService.login(formData);

      // Store token and admin info
      localStorage.setItem('admin_token', response.token);
      localStorage.setItem('admin_info', JSON.stringify(response.admin));

      // Show success message
      toast.success(`Welcome back, ${response.admin.name}! 👋`);

      // Update authentication state
      onLogin(true);

      // Navigate to dashboard
      navigate('/admin/dashboard');
    } catch (error: any) {
      console.error('Login failed:', error);
      // Error handling is now done in the API service with toast notifications
      setError('Login failed. Please check your credentials and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof AdminLoginRequest, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (error) setError('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      {/* Back Button */}
      <div className="absolute top-6 left-6">
        <Link
          to="/shop/products"
          className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Store
        </Link>
      </div>

      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-primary rounded-full flex items-center justify-center">
            <LogIn className="w-8 h-8 text-primary-foreground" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">{env.VITE_COMPANY_NAME}</CardTitle>
            <CardDescription className="text-muted-foreground">
              Access the {env.VITE_COMPANY_SHORT_NAME} admin panel
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-destructive" />
                <span className="text-sm text-destructive">{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                disabled={isLoading}
                autoComplete="email"
                className={error && !formData.email ? 'border-destructive' : ''}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  disabled={isLoading}
                  autoComplete="current-password"
                  className={`pr-10 ${error && !formData.password ? 'border-destructive' : ''}`}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || !formData.email || !formData.password}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4 mr-2" />
                  Sign In
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground text-center mb-2">
              Demo Credentials:
            </p>
            <div className="text-xs text-muted-foreground space-y-1">
              <p><strong>Email:</strong> admin@example.com</p>
              <p><strong>Password:</strong> admin123!@#</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLogin; 
