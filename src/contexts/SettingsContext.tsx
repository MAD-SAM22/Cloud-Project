
import React, { createContext, useContext, useEffect, useState } from 'react';
import apiClient from '@/services/apiClient';

interface SettingsState {
  apiSettings: {
    apiEndpoint: string;
    apiTimeout: string;
    enableAuthentication: boolean;
    username: string;
    password: string;
    apiKey: string;
  };
  preferences: {
    theme: string;
    refreshInterval: string;
    enableNotifications: boolean;
    notificationSound: boolean;
    autoStartContainers: boolean;
    confirmDangerous: boolean;
    defaultLogLines: string;
  };
  dockerSettings: {
    dockerHost: string;
    dockerApiVersion: string;
    registryUrl: string;
    registryUsername: string;
    registryPassword: string;
    insecureRegistry: boolean;
    pruneInterval: string;
  };
  qemuSettings: {
    qemuBinary: string;
    defaultVNCPort: string;
    vncPassword: string;
    vncKeyboardLayout: string;
    isoDirectory: string;
    vmDirectory: string;
    enableKVM: boolean;
    enableNesting: boolean;
  };
}

interface SettingsContextType {
  settings: SettingsState;
  updateApiSettings: (settings: Partial<SettingsState['apiSettings']>) => void;
  updatePreferences: (preferences: Partial<SettingsState['preferences']>) => void;
  updateDockerSettings: (settings: Partial<SettingsState['dockerSettings']>) => void;
  updateQemuSettings: (settings: Partial<SettingsState['qemuSettings']>) => void;
  saveSettings: () => void;
  isSaving: boolean;
}

const defaultSettings: SettingsState = {
  apiSettings: {
    apiEndpoint: 'http://localhost:3000',
    apiTimeout: '30',
    enableAuthentication: true,
    username: 'admin',
    password: '',
    apiKey: 'sk_12345678901234567890',
  },
  preferences: {
    theme: 'system',
    refreshInterval: '30',
    enableNotifications: true,
    notificationSound: true,
    autoStartContainers: false,
    confirmDangerous: true,
    defaultLogLines: '100',
  },
  dockerSettings: {
    dockerHost: 'unix:///var/run/docker.sock',
    dockerApiVersion: 'v1.41',
    registryUrl: 'https://index.docker.io/v1/',
    registryUsername: '',
    registryPassword: '',
    insecureRegistry: false,
    pruneInterval: 'weekly',
  },
  qemuSettings: {
    qemuBinary: '/usr/bin/qemu-system-x86_64',
    defaultVNCPort: '5900',
    vncPassword: '',
    vncKeyboardLayout: 'en-us',
    isoDirectory: '/var/lib/qemu/iso',
    vmDirectory: '/var/lib/qemu/vms',
    enableKVM: true,
    enableNesting: false,
  },
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider = ({ children }: { children: React.ReactNode }) => {
  const [settings, setSettings] = useState<SettingsState>(() => {
    // Load settings from localStorage
    const savedSettings = localStorage.getItem('appSettings');
    return savedSettings ? JSON.parse(savedSettings) : defaultSettings;
  });
  const [isSaving, setIsSaving] = useState(false);

  // Apply API settings to apiClient when they change
  useEffect(() => {
    apiClient.defaults.baseURL = settings.apiSettings.apiEndpoint;
    apiClient.defaults.timeout = parseInt(settings.apiSettings.apiTimeout, 10) * 1000;
    
    // Apply other API client settings as needed
    console.log('Applied new API settings:', settings.apiSettings);
  }, [settings.apiSettings]);

  const updateApiSettings = (newSettings: Partial<SettingsState['apiSettings']>) => {
    setSettings((prev) => ({
      ...prev,
      apiSettings: {
        ...prev.apiSettings,
        ...newSettings,
      },
    }));
  };

  const updatePreferences = (newPreferences: Partial<SettingsState['preferences']>) => {
    setSettings((prev) => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        ...newPreferences,
      },
    }));
  };

  const updateDockerSettings = (newSettings: Partial<SettingsState['dockerSettings']>) => {
    setSettings((prev) => ({
      ...prev,
      dockerSettings: {
        ...prev.dockerSettings,
        ...newSettings,
      },
    }));
  };

  const updateQemuSettings = (newSettings: Partial<SettingsState['qemuSettings']>) => {
    setSettings((prev) => ({
      ...prev,
      qemuSettings: {
        ...prev.qemuSettings,
        ...newSettings,
      },
    }));
  };

  const saveSettings = () => {
    setIsSaving(true);
    
    // Save to localStorage
    localStorage.setItem('appSettings', JSON.stringify(settings));
    
    // Simulate API call if needed
    setTimeout(() => {
      setIsSaving(false);
    }, 1000);
  };

  const value = {
    settings,
    updateApiSettings,
    updatePreferences,
    updateDockerSettings,
    updateQemuSettings,
    saveSettings,
    isSaving,
  };

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
};

export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  
  return context;
};
