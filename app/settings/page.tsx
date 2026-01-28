'use client'
import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Save, 
  RefreshCw, 
  Database, 
  Globe, 
  Shield, 
  Bell, 
  Palette, 
  Code, 
  Key, 
  User, 
  Server, 
  Zap, 
  Trash2,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  Info,
  ExternalLink,
  Download,
  Upload,
  Lock,
  Unlock
} from 'lucide-react';
import { useTheme } from '../components/ThemeProvider';

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001';

interface SettingsData {
  general: {
    appName: string;
    version: string;
    autoSave: boolean;
    timezone: string;
  };
  api: {
    baseUrl: string;
    timeout: number;
    retryAttempts: number;
    enableCaching: boolean;
    cacheTimeout: number;
  };
  security: {
    enableTwoFactor: boolean;
    sessionTimeout: number;
    passwordPolicy: {
      minLength: number;
      requireUppercase: boolean;
      requireLowercase: boolean;
      requireNumbers: boolean;
      requireSpecialChars: boolean;
    };
  };
  appearance: {
    theme: 'light' | 'dark' | 'auto';
    primaryColor: string;
    compactMode: boolean;
    showAnimations: boolean;
  };
  notifications: {
    emailNotifications: boolean;
    pushNotifications: boolean;
    soundAlerts: boolean;
    notificationTypes: {
      errors: boolean;
      warnings: boolean;
      info: boolean;
      success: boolean;
    };
  };
  advanced: {
    debugMode: boolean;
    enableLogging: boolean;
    logLevel: 'error' | 'warn' | 'info' | 'debug';
    enableTelemetry: boolean;
    autoUpdate: boolean;
  };
}

export default function SettingsPage() {
  const { theme: currentTheme, setTheme: setGlobalTheme, resolvedTheme } = useTheme();
  
  // Map 'system' to 'auto' for settings display
  const mapThemeForSettings = (theme: 'light' | 'dark' | 'system'): 'light' | 'dark' | 'auto' => {
    return theme === 'system' ? 'auto' : theme;
  };
  
  // Map 'auto' to 'system' for ThemeProvider
  const mapThemeForProvider = (theme: 'light' | 'dark' | 'auto'): 'light' | 'dark' | 'system' => {
    return theme === 'auto' ? 'system' : theme;
  };

  const [settings, setSettings] = useState<SettingsData>({
    general: {
      appName: 'BRMH',
      version: '1.0.0',
      autoSave: true,
      timezone: 'UTC'
    },
    api: {
      baseUrl: API_BASE_URL,
      timeout: 30000,
      retryAttempts: 3,
      enableCaching: true,
      cacheTimeout: 300000
    },
    security: {
      enableTwoFactor: false,
      sessionTimeout: 3600,
      passwordPolicy: {
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true
      }
    },
    appearance: {
      theme: mapThemeForSettings(currentTheme),
      primaryColor: '#3B82F6',
      compactMode: false,
      showAnimations: true
    },
    notifications: {
      emailNotifications: true,
      pushNotifications: true,
      soundAlerts: false,
      notificationTypes: {
        errors: true,
        warnings: true,
        info: false,
        success: false
      }
    },
    advanced: {
      debugMode: false,
      enableLogging: true,
      logLevel: 'info',
      enableTelemetry: false,
      autoUpdate: true
    }
  });

  const [activeTab, setActiveTab] = useState('general');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');

  // Load settings from localStorage on component mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('brmh-settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings(prev => ({ ...prev, ...parsed }));
        // Sync theme from saved settings to global theme
        if (parsed.appearance?.theme) {
          const themeForProvider = mapThemeForProvider(parsed.appearance.theme);
          setGlobalTheme(themeForProvider);
        }
      } catch (error) {
        console.error('Failed to parse saved settings:', error);
      }
    } else {
      // If no saved settings, sync current global theme and language to settings
      setSettings(prev => ({
        ...prev,
        appearance: {
          ...prev.appearance,
          theme: mapThemeForSettings(currentTheme)
        },
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync theme when global theme changes (from other components)
  useEffect(() => {
    setSettings(prev => ({
      ...prev,
      appearance: {
        ...prev.appearance,
        theme: mapThemeForSettings(currentTheme)
      }
    }));
  }, [currentTheme]);

  // Track changes
  useEffect(() => {
    setHasChanges(true);
  }, [settings]);

  const handleSave = async () => {
    setIsLoading(true);
    setSaveStatus('saving');
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Save to localStorage
      localStorage.setItem('brmh-settings', JSON.stringify(settings));
      
      // Sync theme to global theme provider
      const themeForProvider = mapThemeForProvider(settings.appearance.theme);
      setGlobalTheme(themeForProvider);
      
      setSaveStatus('success');
      setHasChanges(false);
      
      // Reset success status after 3 seconds
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      setSaveStatus('error');
      console.error('Failed to save settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset all settings to default values?')) {
      const defaultSettings: SettingsData = {
        general: {
          appName: 'BRMH',
          version: '1.0.0',
          autoSave: true,
          timezone: 'UTC'
        },
        api: {
          baseUrl: API_BASE_URL,
          timeout: 30000,
          retryAttempts: 3,
          enableCaching: true,
          cacheTimeout: 300000
        },
        security: {
          enableTwoFactor: false,
          sessionTimeout: 3600,
          passwordPolicy: {
            minLength: 8,
            requireUppercase: true,
            requireLowercase: true,
            requireNumbers: true,
            requireSpecialChars: true
          }
        },
        appearance: {
          theme: 'auto',
          primaryColor: '#3B82F6',
          compactMode: false,
          showAnimations: true
        },
        notifications: {
          emailNotifications: true,
          pushNotifications: true,
          soundAlerts: false,
          notificationTypes: {
            errors: true,
            warnings: true,
            info: false,
            success: false
          }
        },
        advanced: {
          debugMode: false,
          enableLogging: true,
          logLevel: 'info',
          enableTelemetry: false,
          autoUpdate: true
        }
      };
      
      setSettings(defaultSettings);
      // Sync default theme to global theme provider
      const defaultThemeForProvider = mapThemeForProvider(defaultSettings.appearance.theme);
      setGlobalTheme(defaultThemeForProvider);
      setHasChanges(true);
    }
  };

  const exportSettings = () => {
    const dataStr = JSON.stringify(settings, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'brmh-settings.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const importSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedSettings = JSON.parse(e.target?.result as string);
          setSettings(importedSettings);
          setHasChanges(true);
        } catch (error) {
          alert('Invalid settings file format');
        }
      };
      reader.readAsText(file);
    }
  };

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'api', label: 'API', icon: Globe },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'advanced', label: 'Advanced', icon: Code }
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* Header */}
      <div className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800/50 shadow-sm px-6 py-4 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10 dark:bg-blue-500/10 border border-blue-500/20 dark:border-blue-500/20">
              <Settings className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">Settings</h1>
          </div>
          
          <div className="flex items-center gap-3">
            {saveStatus === 'success' && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-500/10 dark:bg-green-500/10 border border-green-500/20 dark:border-green-500/20 text-green-600 dark:text-green-400">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm font-medium">Settings saved successfully!</span>
              </div>
            )}
            
            {saveStatus === 'error' && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/10 dark:bg-red-500/10 border border-red-500/20 dark:border-red-500/20 text-red-600 dark:text-red-400">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm font-medium">Failed to save settings</span>
              </div>
            )}
            
            <button
              onClick={handleReset}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-50 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800/50 hover:border-gray-400 dark:hover:border-gray-600 transition-all duration-200 font-medium"
            >
              <RefreshCw className="w-4 h-4 inline mr-2" />
              Reset
            </button>
            
            <button
              onClick={handleSave}
              disabled={isLoading || !hasChanges}
              className={`px-5 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 font-medium shadow-lg ${
                isLoading || !hasChanges
                  ? 'bg-gray-200 dark:bg-gray-800 text-gray-500 dark:text-gray-500 cursor-not-allowed border border-gray-300 dark:border-gray-700'
                  : 'bg-blue-600 text-white hover:bg-blue-500 hover:shadow-blue-500/50 active:scale-95'
              }`}
            >
              {isLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-gray-50 dark:bg-gray-900/50 border-r border-gray-200 dark:border-gray-800/50 min-h-screen backdrop-blur-sm">
          <nav className="p-4">
            <ul className="space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <li key={tab.id}>
                    <button
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-200 font-medium ${
                        activeTab === tab.id
                          ? 'bg-blue-100 dark:bg-blue-600/20 text-blue-700 dark:text-blue-400 border border-blue-300 dark:border-blue-500/30 shadow-sm shadow-blue-500/10'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-700 border border-transparent'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-blue-600 dark:text-blue-400' : ''}`} />
                      {tab.label}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6 bg-white dark:bg-gray-950">
          <div className="max-w-4xl">
            {/* General Settings */}
            {activeTab === 'general' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-50 mb-1">General Settings</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">Manage your application preferences and basic settings</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-5">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Application Name
                        </label>
                        <input
                          type="text"
                          value={settings.general.appName}
                          onChange={(e) => setSettings(prev => ({
                            ...prev,
                            general: { ...prev.general, appName: e.target.value }
                          }))}
                          className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900/50 text-gray-900 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200 shadow-sm"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Timezone
                        </label>
                        <select
                          value={settings.general.timezone}
                          onChange={(e) => setSettings(prev => ({
                            ...prev,
                            general: { ...prev.general, timezone: e.target.value }
                          }))}
                          className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900/50 text-gray-900 dark:text-gray-200 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200 shadow-sm cursor-pointer"
                        >
                          <option value="UTC" className="bg-white dark:bg-gray-900">UTC</option>
                          <option value="America/New_York" className="bg-white dark:bg-gray-900">Eastern Time</option>
                          <option value="America/Chicago" className="bg-white dark:bg-gray-900">Central Time</option>
                          <option value="America/Denver" className="bg-white dark:bg-gray-900">Mountain Time</option>
                          <option value="America/Los_Angeles" className="bg-white dark:bg-gray-900">Pacific Time</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-900/30 border border-gray-200 dark:border-gray-800/50">
                        <div>
                          <label className="text-sm font-medium text-gray-900 dark:text-gray-200">Auto Save</label>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">Automatically save changes as you make them</p>
                        </div>
                        <button
                          onClick={() => setSettings(prev => ({
                            ...prev,
                            general: { ...prev.general, autoSave: !prev.general.autoSave }
                          }))}
                          className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-200 shadow-inner ${
                            settings.general.autoSave 
                              ? 'bg-blue-600 shadow-blue-500/30' 
                              : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
                          }`}
                        >
                          <span
                            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-200 ${
                              settings.general.autoSave ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                      
                      <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900/50 dark:to-gray-800/30 rounded-lg p-4 border border-gray-200 dark:border-gray-800/50 shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="p-1.5 rounded-md bg-blue-500/10 dark:bg-blue-500/10 border border-blue-500/20 dark:border-blue-500/20">
                            <Info className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                          </div>
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-200">Version Information</span>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 ml-7">Current Version: <span className="text-gray-700 dark:text-gray-300 font-medium">{settings.general.version}</span></p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* API Settings */}
            {activeTab === 'api' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-50 mb-1">API Configuration</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">Manage API endpoints and connection settings</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Base URL
                        </label>
                        <input
                          type="url"
                          value={settings.api.baseUrl}
                          onChange={(e) => setSettings(prev => ({
                            ...prev,
                            api: { ...prev.api, baseUrl: e.target.value }
                          }))}
                          className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900/50 text-gray-900 dark:text-gray-200 shadow-sm focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200"
                          placeholder="https://api.example.com"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Request Timeout (ms)
                        </label>
                        <input
                          type="number"
                          value={settings.api.timeout}
                          onChange={(e) => setSettings(prev => ({
                            ...prev,
                            api: { ...prev.api, timeout: parseInt(e.target.value) || 30000 }
                          }))}
                          className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900/50 text-gray-900 dark:text-gray-200 shadow-sm focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200"
                          min="1000"
                          max="60000"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Retry Attempts
                        </label>
                        <input
                          type="number"
                          value={settings.api.retryAttempts}
                          onChange={(e) => setSettings(prev => ({
                            ...prev,
                            api: { ...prev.api, retryAttempts: parseInt(e.target.value) || 3 }
                          }))}
                          className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900/50 text-gray-900 dark:text-gray-200 shadow-sm focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200"
                          min="0"
                          max="10"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-900/30 border border-gray-200 dark:border-gray-800/50">
                        <div>
                          <label className="text-sm font-medium text-gray-900 dark:text-gray-200">Enable Caching</label>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">Cache API responses for better performance</p>
                        </div>
                        <button
                          onClick={() => setSettings(prev => ({
                            ...prev,
                            api: { ...prev.api, enableCaching: !prev.api.enableCaching }
                          }))}
                          className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-200 shadow-inner ${
                            settings.api.enableCaching 
                              ? 'bg-blue-600 shadow-blue-500/30' 
                              : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
                          }`}
                        >
                          <span
                            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-200 ${
                              settings.api.enableCaching ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                      
                      {settings.api.enableCaching && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Cache Timeout (ms)
                          </label>
                          <input
                            type="number"
                            value={settings.api.cacheTimeout}
                            onChange={(e) => setSettings(prev => ({
                              ...prev,
                              api: { ...prev.api, cacheTimeout: parseInt(e.target.value) || 300000 }
                            }))}
                            className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900/50 text-gray-900 dark:text-gray-200 shadow-sm focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200"
                            min="60000"
                            max="3600000"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Security Settings */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-50 mb-1">Security Settings</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">Configure authentication and security policies</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-900/30 border border-gray-200 dark:border-gray-800/50">
                        <div>
                          <label className="text-sm font-medium text-gray-900 dark:text-gray-200">Two-Factor Authentication</label>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">Add an extra layer of security</p>
                        </div>
                        <button
                          onClick={() => setSettings(prev => ({
                            ...prev,
                            security: { ...prev.security, enableTwoFactor: !prev.security.enableTwoFactor }
                          }))}
                          className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-200 shadow-inner ${
                            settings.security.enableTwoFactor 
                              ? 'bg-blue-600 shadow-blue-500/30' 
                              : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
                          }`}
                        >
                          <span
                            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-200 ${
                              settings.security.enableTwoFactor ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Session Timeout (seconds)
                        </label>
                        <input
                          type="number"
                          value={settings.security.sessionTimeout}
                          onChange={(e) => setSettings(prev => ({
                            ...prev,
                            security: { ...prev.security, sessionTimeout: parseInt(e.target.value) || 3600 }
                          }))}
                          className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900/50 text-gray-900 dark:text-gray-200 shadow-sm focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200"
                          min="300"
                          max="86400"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Password Policy</label>
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Minimum Length</label>
                            <input
                              type="number"
                              value={settings.security.passwordPolicy.minLength}
                              onChange={(e) => setSettings(prev => ({
                                ...prev,
                                security: {
                                  ...prev.security,
                                  passwordPolicy: {
                                    ...prev.security.passwordPolicy,
                                    minLength: parseInt(e.target.value) || 8
                                  }
                                }
                              }))}
                              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900/50 text-gray-900 dark:text-gray-200 shadow-sm focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200"
                              min="6"
                              max="50"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            {[
                              { key: 'requireUppercase', label: 'Require uppercase letters' },
                              { key: 'requireLowercase', label: 'Require lowercase letters' },
                              { key: 'requireNumbers', label: 'Require numbers' },
                              { key: 'requireSpecialChars', label: 'Require special characters' }
                            ].map(({ key, label }) => (
                              <div key={key} className="flex items-center">
                                <input
                                  type="checkbox"
                                  id={key}
                                  checked={settings.security.passwordPolicy[key as keyof typeof settings.security.passwordPolicy] as boolean}
                                  onChange={(e) => setSettings(prev => ({
                                    ...prev,
                                    security: {
                                      ...prev.security,
                                      passwordPolicy: {
                                        ...prev.security.passwordPolicy,
                                        [key]: e.target.checked
                                      }
                                    }
                                  }))}
                                  className="h-4 w-4 text-blue-500 focus:ring-2 focus:ring-blue-500/50 border-gray-300 dark:border-gray-600 rounded bg-gray-100 dark:bg-gray-800/50 cursor-pointer"
                                />
                                <label htmlFor={key} className="ml-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">{label}</label>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Appearance Settings */}
            {activeTab === 'appearance' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-50 mb-1">Appearance Settings</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">Customize the look and feel of your application</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Theme
                        </label>
                        <select
                          value={settings.appearance.theme}
                          onChange={(e) => {
                            const newTheme = e.target.value as 'light' | 'dark' | 'auto';
                            // Update local settings
                            setSettings(prev => ({
                              ...prev,
                              appearance: { ...prev.appearance, theme: newTheme }
                            }));
                            // Immediately apply theme change globally
                            const themeForProvider = mapThemeForProvider(newTheme);
                            setGlobalTheme(themeForProvider);
                          }}
                          className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900/50 text-gray-900 dark:text-gray-200 shadow-sm focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200"
                        >
                          <option value="light" className="bg-gray-100 dark:bg-gray-800">Light</option>
                          <option value="dark" className="bg-gray-100 dark:bg-gray-800">Dark</option>
                          <option value="auto" className="bg-gray-100 dark:bg-gray-800">Auto (System)</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Primary Color
                        </label>
                        <div className="flex items-center gap-3">
                          <input
                            type="color"
                            value={settings.appearance.primaryColor}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSettings(prev => ({
                              ...prev,
                              appearance: { ...prev.appearance, primaryColor: e.target.value }
                            }))}
                            className="w-14 h-14 border border-gray-300 dark:border-gray-700 rounded-full cursor-pointer bg-transparent shadow-sm hover:border-gray-400 dark:hover:border-gray-600 transition-all"
                            style={{
                              WebkitAppearance: 'none',
                              MozAppearance: 'none',
                              appearance: 'none',
                            }}
                          />
                          <input
                            type="text"
                            value={settings.appearance.primaryColor}
                            onChange={(e) => setSettings(prev => ({
                              ...prev,
                              appearance: { ...prev.appearance, primaryColor: e.target.value }
                            }))}
                            className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900/50 text-gray-900 dark:text-gray-200 shadow-sm focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200 placeholder-gray-400 dark:placeholder-gray-500"
                            placeholder="#3B82F6"
                          />
                        </div>
                      </div>
                      
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-900/30 border border-gray-200 dark:border-gray-800/50">
                        <div>
                          <label className="text-sm font-medium text-gray-900 dark:text-gray-200">Compact Mode</label>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">Reduce spacing for more content</p>
                        </div>
                        <button
                          onClick={() => setSettings(prev => ({
                            ...prev,
                            appearance: { ...prev.appearance, compactMode: !prev.appearance.compactMode }
                          }))}
                          className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-200 shadow-inner ${
                            settings.appearance.compactMode 
                              ? 'bg-blue-600 shadow-blue-500/30' 
                              : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
                          }`}
                        >
                          <span
                            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-200 ${
                              settings.appearance.compactMode ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                      
                      <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-900/30 border border-gray-200 dark:border-gray-800/50">
                        <div>
                          <label className="text-sm font-medium text-gray-900 dark:text-gray-200">Show Animations</label>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">Enable smooth transitions and animations</p>
                        </div>
                        <button
                          onClick={() => setSettings(prev => ({
                            ...prev,
                            appearance: { ...prev.appearance, showAnimations: !prev.appearance.showAnimations }
                          }))}
                          className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-200 shadow-inner ${
                            settings.appearance.showAnimations 
                              ? 'bg-blue-600 shadow-blue-500/30' 
                              : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
                          }`}
                        >
                          <span
                            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-200 ${
                              settings.appearance.showAnimations ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Notifications Settings */}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-50 mb-1">Notification Settings</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">Manage how you receive notifications</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-900/30 border border-gray-200 dark:border-gray-800/50">
                        <div>
                          <label className="text-sm font-medium text-gray-900 dark:text-gray-200">Email Notifications</label>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">Receive notifications via email</p>
                        </div>
                        <button
                          onClick={() => setSettings(prev => ({
                            ...prev,
                            notifications: { ...prev.notifications, emailNotifications: !prev.notifications.emailNotifications }
                          }))}
                          className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-200 shadow-inner ${
                            settings.notifications.emailNotifications 
                              ? 'bg-blue-600 shadow-blue-500/30' 
                              : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
                          }`}
                        >
                          <span
                            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-200 ${
                              settings.notifications.emailNotifications ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                      
                      <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-900/30 border border-gray-200 dark:border-gray-800/50">
                        <div>
                          <label className="text-sm font-medium text-gray-900 dark:text-gray-200">Push Notifications</label>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">Receive browser push notifications</p>
                        </div>
                        <button
                          onClick={() => setSettings(prev => ({
                            ...prev,
                            notifications: { ...prev.notifications, pushNotifications: !prev.notifications.pushNotifications }
                          }))}
                          className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-200 shadow-inner ${
                            settings.notifications.pushNotifications 
                              ? 'bg-blue-600 shadow-blue-500/30' 
                              : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
                          }`}
                        >
                          <span
                            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-200 ${
                              settings.notifications.pushNotifications ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                      
                      <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-900/30 border border-gray-200 dark:border-gray-800/50">
                        <div>
                          <label className="text-sm font-medium text-gray-900 dark:text-gray-200">Sound Alerts</label>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">Play sound for notifications</p>
                        </div>
                        <button
                          onClick={() => setSettings(prev => ({
                            ...prev,
                            notifications: { ...prev.notifications, soundAlerts: !prev.notifications.soundAlerts }
                          }))}
                          className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-200 shadow-inner ${
                            settings.notifications.soundAlerts 
                              ? 'bg-blue-600 shadow-blue-500/30' 
                              : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
                          }`}
                        >
                          <span
                            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-200 ${
                              settings.notifications.soundAlerts ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Notification Types</label>
                        <div className="space-y-3">
                          {[
                            { key: 'errors', label: 'Error notifications' },
                            { key: 'warnings', label: 'Warning notifications' },
                            { key: 'info', label: 'Info notifications' },
                            { key: 'success', label: 'Success notifications' }
                          ].map(({ key, label }) => (
                            <div key={key} className="flex items-center">
                              <input
                                type="checkbox"
                                id={key}
                                checked={settings.notifications.notificationTypes[key as keyof typeof settings.notifications.notificationTypes]}
                                onChange={(e) => setSettings(prev => ({
                                  ...prev,
                                  notifications: {
                                    ...prev.notifications,
                                    notificationTypes: {
                                      ...prev.notifications.notificationTypes,
                                      [key]: e.target.checked
                                    }
                                  }
                                }))}
                                className="h-4 w-4 text-blue-600 dark:text-blue-400 focus:ring-2 focus:ring-blue-500/50 border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800/50 cursor-pointer"
                              />
                              <label htmlFor={key} className="ml-2 text-sm text-gray-700 dark:text-gray-300">{label}</label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Advanced Settings */}
            {activeTab === 'advanced' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-50 mb-1">Advanced Settings</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">Advanced configuration and developer options</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Debug Mode</label>
                          <p className="text-xs text-gray-600 dark:text-gray-400">Enable detailed logging and debugging</p>
                        </div>
                        <button
                          onClick={() => setSettings(prev => ({
                            ...prev,
                            advanced: { ...prev.advanced, debugMode: !prev.advanced.debugMode }
                          }))}
                          className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-200 shadow-inner ${
                            settings.advanced.debugMode 
                              ? 'bg-blue-600 shadow-blue-500/30' 
                              : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
                          }`}
                        >
                          <span
                            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-200 ${
                              settings.advanced.debugMode ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                      
                      <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-900/30 border border-gray-200 dark:border-gray-800/50">
                        <div>
                          <label className="text-sm font-medium text-gray-900 dark:text-gray-200">Enable Logging</label>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">Log application events and errors</p>
                        </div>
                        <button
                          onClick={() => setSettings(prev => ({
                            ...prev,
                            advanced: { ...prev.advanced, enableLogging: !prev.advanced.enableLogging }
                          }))}
                          className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-200 shadow-inner ${
                            settings.advanced.enableLogging 
                              ? 'bg-blue-600 shadow-blue-500/30' 
                              : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
                          }`}
                        >
                          <span
                            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-200 ${
                              settings.advanced.enableLogging ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                      
                      {settings.advanced.enableLogging && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Log Level
                          </label>
                          <select
                            value={settings.advanced.logLevel}
                            onChange={(e) => setSettings(prev => ({
                              ...prev,
                              advanced: { ...prev.advanced, logLevel: e.target.value as 'error' | 'warn' | 'info' | 'debug' }
                            }))}
                            className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900/50 text-gray-900 dark:text-gray-200 shadow-sm focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200"
                          >
                            <option value="error" className="bg-gray-100 dark:bg-gray-800">Error</option>
                            <option value="warn" className="bg-gray-100 dark:bg-gray-800">Warning</option>
                            <option value="info" className="bg-gray-100 dark:bg-gray-800">Info</option>
                            <option value="debug" className="bg-gray-100 dark:bg-gray-800">Debug</option>
                          </select>
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-900/30 border border-gray-200 dark:border-gray-800/50">
                        <div>
                          <label className="text-sm font-medium text-gray-900 dark:text-gray-200">Enable Telemetry</label>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">Send usage data to improve the application</p>
                        </div>
                        <button
                          onClick={() => setSettings(prev => ({
                            ...prev,
                            advanced: { ...prev.advanced, enableTelemetry: !prev.advanced.enableTelemetry }
                          }))}
                          className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-200 shadow-inner ${
                            settings.advanced.enableTelemetry 
                              ? 'bg-blue-600 shadow-blue-500/30' 
                              : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
                          }`}
                        >
                          <span
                            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-200 ${
                              settings.advanced.enableTelemetry ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                      
                      <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-900/30 border border-gray-200 dark:border-gray-800/50">
                        <div>
                          <label className="text-sm font-medium text-gray-900 dark:text-gray-200">Auto Update</label>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">Automatically check for updates</p>
                        </div>
                        <button
                          onClick={() => setSettings(prev => ({
                            ...prev,
                            advanced: { ...prev.advanced, autoUpdate: !prev.advanced.autoUpdate }
                          }))}
                          className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-200 shadow-inner ${
                            settings.advanced.autoUpdate 
                              ? 'bg-blue-600 shadow-blue-500/30' 
                              : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
                          }`}
                        >
                          <span
                            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-200 ${
                              settings.advanced.autoUpdate ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                      
                      <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900/50 dark:to-gray-800/30 rounded-lg p-4 border border-gray-200 dark:border-gray-800/50 shadow-sm">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="p-1.5 rounded-md bg-blue-500/10 dark:bg-blue-500/10 border border-blue-500/20 dark:border-blue-500/20">
                            <Info className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                          </div>
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-200">Import/Export Settings</span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={exportSettings}
                            className="flex items-center gap-2 px-4 py-2 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-200 active:scale-95"
                          >
                            <Download className="w-3.5 h-3.5" />
                            Export
                          </button>
                          <label className="flex items-center gap-2 px-4 py-2 text-xs font-medium bg-gray-200 dark:bg-gray-700 text-white rounded-lg hover:bg-gray-600 hover:shadow-lg transition-all duration-200 cursor-pointer active:scale-95">
                            <Upload className="w-3.5 h-3.5" />
                            Import
                            <input
                              type="file"
                              accept=".json"
                              onChange={importSettings}
                              className="hidden"
                            />
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
