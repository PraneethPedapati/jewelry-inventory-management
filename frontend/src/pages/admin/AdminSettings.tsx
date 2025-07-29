import React, { useState } from 'react';
import { useThemeStore } from '@/stores/theme.store';
import { toast } from 'sonner';

// UI Components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Palette, Eye, Save, Plus, Trash2, RefreshCw, Type, Settings2 } from 'lucide-react';

import type { ColorTheme } from '@/stores/theme.store';

// Import default theme for fallback
const defaultTheme: ColorTheme = {
  id: 'default',
  name: 'default',
  displayName: 'Default Jewelry Theme',
  isActive: true,
  isDefault: true,
  colors: {
    primary: '#8B5CF6',
    secondary: '#F59E0B',
    accent: '#EC4899',
    background: '#FFFFFF',
    foreground: '#1F2937',
    card: '#F9FAFB',
    cardForeground: '#111827',
    border: '#E5E7EB',
    input: '#FFFFFF',
    ring: '#8B5CF6',
    muted: '#F3F4F6',
    mutedForeground: '#6B7280',
    destructive: '#EF4444',
    destructiveForeground: '#FFFFFF',
    success: '#10B981',
    successForeground: '#FFFFFF',
    warning: '#F59E0B',
    warningForeground: '#FFFFFF'
  },
  description: 'Default elegant theme'
};

const AdminSettings: React.FC = () => {
  const {
    activeTheme,
    availableThemes,
    isLoading,
    isUpdating,
    setActiveTheme,
    updateThemeColors,
    createTheme,
    updateTheme,
    deleteTheme,
    resetToDefault
  } = useThemeStore();

  const [selectedTheme, setSelectedTheme] = useState<ColorTheme | null>(activeTheme);
  const [editingColors, setEditingColors] = useState<Partial<ColorTheme['colors']>>({});
  const [newThemeName, setNewThemeName] = useState('');

  // Font management state
  const [selectedFont, setSelectedFont] = useState('Roboto Flex');
  const availableFonts = [
    'Roboto Flex',
    'Inter',
    'Open Sans',
    'Lato',
    'Montserrat',
    'Poppins'
  ];

  // Handle theme selection
  const handleThemeSelect = (theme: ColorTheme) => {
    setSelectedTheme(theme);
    setEditingColors(theme.colors);
  };

  // Apply theme as active
  const handleApplyTheme = async (theme: ColorTheme) => {
    try {
      setActiveTheme(theme);
      toast.success(`Applied "${theme.displayName}" theme successfully! 🎨`);
    } catch (error) {
      toast.error('Failed to apply theme');
    }
  };

  // Update color values
  const handleColorChange = (colorKey: keyof ColorTheme['colors'], value: string) => {
    setEditingColors(prev => ({
      ...prev,
      [colorKey]: value
    }));
  };

  // Save color changes
  const handleSaveColors = async () => {
    if (!selectedTheme || !editingColors) return;

    try {
      if (selectedTheme.id === activeTheme?.id) {
        // Update active theme colors immediately
        updateThemeColors(editingColors);
      }

      await updateTheme(selectedTheme.id, { colors: editingColors as ColorTheme['colors'] });
      toast.success('Theme colors updated successfully! ✨');
    } catch (error) {
      toast.error('Failed to update theme colors');
    }
  };

  // Create new theme
  const handleCreateTheme = async () => {
    if (!newThemeName.trim()) {
      toast.error('Please enter a theme name');
      return;
    }

    try {
      const newTheme: Omit<ColorTheme, 'id'> = {
        name: newThemeName.toLowerCase().replace(/\s+/g, '-'),
        displayName: newThemeName,
        isActive: false,
        isDefault: false,
        colors: activeTheme?.colors || defaultTheme.colors,
        description: `Custom theme: ${newThemeName}`
      };

      await createTheme(newTheme);
      setNewThemeName('');
      toast.success(`Created "${newThemeName}" theme successfully! 🎉`);
    } catch (error) {
      toast.error('Failed to create theme');
    }
  };

  // Delete theme
  const handleDeleteTheme = async (theme: ColorTheme) => {
    if (theme.isDefault) {
      toast.error('Cannot delete default theme');
      return;
    }

    if (theme.id === activeTheme?.id) {
      toast.error('Cannot delete active theme');
      return;
    }

    try {
      await deleteTheme(theme.id);
      toast.success(`Deleted "${theme.displayName}" theme`);
    } catch (error) {
      toast.error('Failed to delete theme');
    }
  };

  // Handle font selection
  const handleFontChange = (font: string) => {
    setSelectedFont(font);
    // Apply font globally
    document.documentElement.style.setProperty('--font-family', `'${font}', 'Inter', system-ui, sans-serif`);
    document.body.style.fontFamily = `'${font}', 'Inter', system-ui, sans-serif`;

    // Apply to all text elements
    const allElements = document.querySelectorAll('*');
    allElements.forEach((element) => {
      if (element instanceof HTMLElement) {
        element.style.fontFamily = `'${font}', 'Inter', system-ui, sans-serif`;
      }
    });

    localStorage.setItem('selected-font', font);
    toast.success(`Font changed to ${font}! ✨`);
  };

  // Color input component
  const ColorInput: React.FC<{
    label: string;
    colorKey: keyof ColorTheme['colors'];
    value: string;
  }> = ({ label, colorKey, value }) => (
    <div className="space-y-2">
      <Label htmlFor={colorKey}>{label}</Label>
      <div className="flex gap-2">
        <Input
          id={colorKey}
          type="color"
          value={value}
          onChange={(e) => handleColorChange(colorKey, e.target.value)}
          className="w-16 h-10 p-1 border rounded"
        />
        <Input
          type="text"
          value={value}
          onChange={(e) => handleColorChange(colorKey, e.target.value)}
          className="flex-1 font-mono text-sm"
          placeholder="#000000"
        />
      </div>
    </div>
  );

  // Initialize font on load
  React.useEffect(() => {
    const savedFont = localStorage.getItem('selected-font');
    if (savedFont && availableFonts.includes(savedFont)) {
      setSelectedFont(savedFont);
      handleFontChange(savedFont);
    } else {
      // Set default font
      handleFontChange('Roboto Flex');
    }
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin" />
        <span className="ml-2">Loading settings...</span>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Settings2 className="w-8 h-8" />
            Settings
          </h1>
          <p className="text-muted-foreground mt-2">
            Customize your store's appearance and preferences
          </p>
        </div>
      </div>

      <Tabs defaultValue="themes" className="space-y-6">
        <TabsList>
          <TabsTrigger value="themes">Themes</TabsTrigger>
          <TabsTrigger value="fonts">Fonts</TabsTrigger>
        </TabsList>

        {/* Theme Management Tab */}
        <TabsContent value="themes" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold flex items-center gap-2">
                <Palette className="w-6 h-6" />
                Color Theme Management
              </h2>
              <p className="text-muted-foreground">
                Customize your store's color palette and create custom themes
              </p>
            </div>
            <Button onClick={resetToDefault} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Reset to Default
            </Button>
          </div>

          <Tabs defaultValue="available" className="space-y-4">
            <TabsList>
              <TabsTrigger value="available">Available Themes</TabsTrigger>
              <TabsTrigger value="editor">Color Editor</TabsTrigger>
              <TabsTrigger value="create">Create New</TabsTrigger>
            </TabsList>

            {/* Available Themes */}
            <TabsContent value="available" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {availableThemes.map((theme) => (
                  <Card
                    key={theme.id}
                    className={`cursor-pointer transition-all ${theme.id === activeTheme?.id ? 'ring-2 ring-primary' : ''
                      }`}
                    onClick={() => handleThemeSelect(theme)}
                  >
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{theme.displayName}</CardTitle>
                          <CardDescription>{theme.description}</CardDescription>
                        </div>
                        <div className="flex gap-1">
                          {theme.isActive && <Badge variant="default">Active</Badge>}
                          {theme.isDefault && <Badge variant="secondary">Default</Badge>}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {/* Color Preview */}
                      <div className="flex gap-1 mb-4">
                        {Object.entries(theme.colors).slice(0, 8).map(([key, color]) => (
                          <div
                            key={key}
                            className="w-6 h-6 rounded border border-gray-200"
                            style={{ backgroundColor: color }}
                            title={`${key}: ${color}`}
                          />
                        ))}
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleApplyTheme(theme);
                          }}
                          disabled={theme.id === activeTheme?.id}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          {theme.id === activeTheme?.id ? 'Active' : 'Apply'}
                        </Button>

                        {!theme.isDefault && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteTheme(theme);
                            }}
                            disabled={theme.id === activeTheme?.id}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Color Editor */}
            <TabsContent value="editor" className="space-y-4">
              {selectedTheme ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Edit Colors - {selectedTheme.displayName}</CardTitle>
                      <CardDescription>
                        Customize individual color values for this theme
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 gap-4">
                        <ColorInput label="Primary" colorKey="primary" value={editingColors.primary || selectedTheme.colors.primary} />
                        <ColorInput label="Secondary" colorKey="secondary" value={editingColors.secondary || selectedTheme.colors.secondary} />
                        <ColorInput label="Accent" colorKey="accent" value={editingColors.accent || selectedTheme.colors.accent} />
                        <ColorInput label="Background" colorKey="background" value={editingColors.background || selectedTheme.colors.background} />
                        <ColorInput label="Foreground" colorKey="foreground" value={editingColors.foreground || selectedTheme.colors.foreground} />
                        <ColorInput label="Card" colorKey="card" value={editingColors.card || selectedTheme.colors.card} />
                        <ColorInput label="Border" colorKey="border" value={editingColors.border || selectedTheme.colors.border} />
                        <ColorInput label="Success" colorKey="success" value={editingColors.success || selectedTheme.colors.success} />
                        <ColorInput label="Warning" colorKey="warning" value={editingColors.warning || selectedTheme.colors.warning} />
                        <ColorInput label="Destructive" colorKey="destructive" value={editingColors.destructive || selectedTheme.colors.destructive} />
                      </div>

                      <Button
                        onClick={handleSaveColors}
                        disabled={isUpdating}
                        className="w-full"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        {isUpdating ? 'Saving...' : 'Save Changes'}
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Live Preview</CardTitle>
                      <CardDescription>
                        See how your changes will look
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div
                        className="p-4 rounded-lg border"
                        style={{
                          backgroundColor: editingColors.background || selectedTheme.colors.background,
                          color: editingColors.foreground || selectedTheme.colors.foreground,
                        }}
                      >
                        <div className="space-y-3">
                          <h3
                            style={{ color: editingColors.primary || selectedTheme.colors.primary }}
                            className="text-lg font-semibold"
                          >
                            Store Preview
                          </h3>
                          <div
                            className="p-3 rounded"
                            style={{
                              backgroundColor: editingColors.card || selectedTheme.colors.card,
                              borderColor: editingColors.border || selectedTheme.colors.border,
                            }}
                          >
                            <p>This is how your store will look with the new colors.</p>
                            <div className="flex gap-2 mt-3">
                              <button
                                className="px-3 py-1 rounded text-sm"
                                style={{
                                  backgroundColor: editingColors.primary || selectedTheme.colors.primary,
                                  color: '#ffffff'
                                }}
                              >
                                Primary Button
                              </button>
                              <button
                                className="px-3 py-1 rounded text-sm"
                                style={{
                                  backgroundColor: editingColors.secondary || selectedTheme.colors.secondary,
                                  color: '#ffffff'
                                }}
                              >
                                Secondary
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <Card>
                  <CardContent className="text-center py-8">
                    <Palette className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">
                      Select a theme from the "Available Themes" tab to start editing colors
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Create New Theme */}
            <TabsContent value="create" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Create New Theme</CardTitle>
                  <CardDescription>
                    Create a custom color theme for your store
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="theme-name">Theme Name</Label>
                    <Input
                      id="theme-name"
                      value={newThemeName}
                      onChange={(e) => setNewThemeName(e.target.value)}
                      placeholder="e.g., Summer Collection, Holiday Special"
                    />
                  </div>

                  <p className="text-sm text-muted-foreground">
                    The new theme will start with colors from your currently active theme.
                    You can then customize it in the Color Editor tab.
                  </p>

                  <Button
                    onClick={handleCreateTheme}
                    disabled={!newThemeName.trim() || isUpdating}
                    className="w-full"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Theme
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* Font Management Tab */}
        <TabsContent value="fonts" className="space-y-4">
          <div>
            <h2 className="text-2xl font-semibold flex items-center gap-2 mb-2">
              <Type className="w-6 h-6" />
              Font Management
            </h2>
            <p className="text-muted-foreground">
              Choose the typography for your store
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Font Selection</CardTitle>
              <CardDescription>
                Select a font family for your store. Default: Roboto Flex
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {availableFonts.map((font) => (
                  <Card
                    key={font}
                    className={`cursor-pointer transition-all border-2 ${selectedFont === font ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                      }`}
                    onClick={() => handleFontChange(font)}
                  >
                    <CardContent className="p-4 text-center">
                      <div className="mb-2">
                        <h3 className="text-lg font-semibold" style={{ fontFamily: font }}>
                          {font}
                        </h3>
                        <div style={{ fontFamily: font }} className="mt-3 space-y-2">
                          <p className="text-base">
                            Elegant Jewelry Collection
                          </p>
                          <p className="text-sm text-muted-foreground">
                            The quick brown fox jumps over the lazy dog
                          </p>
                          <p className="text-xs">
                            0123456789 ABCDEFGHIJKLMNOPQRSTUVWXYZ
                          </p>
                        </div>
                      </div>
                      {selectedFont === font && (
                        <Badge variant="default" className="mt-2">
                          Active
                        </Badge>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="mt-6 p-4 bg-muted rounded-lg">
                <h4 className="font-semibold mb-2">Preview</h4>
                <div style={{ fontFamily: selectedFont }}>
                  <h2 className="text-2xl font-bold mb-2">Elegant Jewelry Collection</h2>
                  <p className="text-lg mb-2">Discover our handcrafted pieces</p>
                  <p className="text-base">
                    Each piece in our collection is carefully crafted with attention to detail,
                    using only the finest materials and traditional techniques.
                  </p>
                  <div className="flex gap-2 mt-4">
                    <button className="px-4 py-2 bg-primary text-primary-foreground rounded">
                      Shop Now
                    </button>
                    <button className="px-4 py-2 border border-border rounded">
                      Learn More
                    </button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminSettings; 
