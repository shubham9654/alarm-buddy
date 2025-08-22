import { create } from 'zustand';
import { Settings, SettingsSchema, createDefaultSettings, migrateSettings } from '../models/settings';
import { storage } from '../lib/storage';

interface SettingsState {
  settings: Settings;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  loadSettings: () => Promise<void>;
  updateSettings: (updates: Partial<Settings>) => Promise<void>;
  resetSettings: () => Promise<void>;
  toggleTheme: () => Promise<void>;
  updateDefaultTaskType: (taskType: Settings['defaultTaskType']) => Promise<void>;
  updateDefaultDifficulty: (difficulty: Settings['defaultDifficulty']) => Promise<void>;
  updateSnoozeSettings: (enabled: boolean, minutes?: 5 | 10 | 15) => Promise<void>;
  updateSoundSettings: (enabled: boolean, volume?: number, soundName?: Settings['soundName']) => Promise<void>;
  updateVibrationSettings: (enabled: boolean, pattern?: Settings['vibrationPattern']) => Promise<void>;
  clearError: () => void;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: createDefaultSettings(),
  isLoading: false,
  error: null,

  loadSettings: async () => {
    try {
      set({ isLoading: true, error: null });
      let settings = await storage.getSettings();
      
      // Migrate settings if needed
      settings = migrateSettings(settings);
      
      set({ settings, isLoading: false });
    } catch (error) {
      console.error('Error loading settings:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load settings',
        isLoading: false,
        settings: createDefaultSettings() // Fallback to defaults
      });
    }
  },

  updateSettings: async (updates) => {
    try {
      set({ isLoading: true, error: null });
      
      const currentSettings = get().settings;
      const updatedSettings = {
        ...currentSettings,
        ...updates,
      };
      
      // Validate the updated settings
      const validatedSettings = SettingsSchema.parse(updatedSettings);
      
      // Save to storage
      await storage.saveSettings(validatedSettings);
      
      // Update state
      set({ settings: validatedSettings, isLoading: false });
    } catch (error) {
      console.error('Error updating settings:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update settings',
        isLoading: false 
      });
    }
  },

  resetSettings: async () => {
    try {
      set({ isLoading: true, error: null });
      
      const defaultSettings = createDefaultSettings();
      
      // Save to storage
      await storage.saveSettings(defaultSettings);
      
      // Update state
      set({ settings: defaultSettings, isLoading: false });
    } catch (error) {
      console.error('Error resetting settings:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to reset settings',
        isLoading: false 
      });
    }
  },

  toggleTheme: async () => {
    try {
      const currentTheme = get().settings.theme;
      const newTheme = currentTheme === 'light' ? 'dark' : currentTheme === 'dark' ? 'system' : 'light';
      
      await get().updateSettings({ theme: newTheme });
    } catch (error) {
      console.error('Error toggling theme:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to toggle theme'
      });
    }
  },

  updateDefaultTaskType: async (taskType) => {
    try {
      await get().updateSettings({ defaultTaskType: taskType });
    } catch (error) {
      console.error('Error updating default task type:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update task type'
      });
    }
  },

  updateDefaultDifficulty: async (difficulty) => {
    try {
      await get().updateSettings({ defaultDifficulty: difficulty });
    } catch (error) {
      console.error('Error updating default difficulty:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update difficulty'
      });
    }
  },

  updateSnoozeSettings: async (enabled, minutes) => {
    try {
      const updates: Partial<Settings> = { snoozeEnabled: enabled };
      if (minutes !== undefined) {
        updates.snoozeMinutes = minutes;
      }
      
      await get().updateSettings(updates);
    } catch (error) {
      console.error('Error updating snooze settings:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update snooze settings'
      });
    }
  },

  updateSoundSettings: async (enabled, volume, soundName) => {
    try {
      const updates: Partial<Settings> = { soundEnabled: enabled };
      if (volume !== undefined) {
        updates.defaultVolume = volume;
      }
      if (soundName !== undefined) {
        updates.soundName = soundName;
      }
      
      await get().updateSettings(updates);
    } catch (error) {
      console.error('Error updating sound settings:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update sound settings'
      });
    }
  },

  updateVibrationSettings: async (enabled, pattern) => {
    try {
      const updates: Partial<Settings> = { vibrationEnabled: enabled };
      if (pattern !== undefined) {
        updates.vibrationPattern = pattern;
      }
      await get().updateSettings(updates);
    } catch (error) {
      console.error('Error updating vibration settings:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update vibration settings'
      });
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));

// Helper functions for accessing settings
export const getTheme = (): Settings['theme'] => {
  return useSettingsStore.getState().settings.theme;
};

export const getDefaultTaskSettings = (): {
  taskType: Settings['defaultTaskType'];
  difficulty: Settings['defaultDifficulty'];
} => {
  const { defaultTaskType, defaultDifficulty } = useSettingsStore.getState().settings;
  return {
    taskType: defaultTaskType,
    difficulty: defaultDifficulty,
  };
};

export const getSnoozeSettings = (): {
  enabled: boolean;
  minutes: 5 | 10 | 15;
} => {
  const { snoozeEnabled, snoozeMinutes } = useSettingsStore.getState().settings;
  return {
    enabled: snoozeEnabled,
    minutes: snoozeMinutes,
  };
};

export const getAudioSettings = (): {
  soundEnabled: boolean;
  soundName: Settings['soundName'];
  vibrationEnabled: boolean;
  vibrationPattern: Settings['vibrationPattern'];
  defaultVolume: number;
} => {
  const { soundEnabled, soundName, vibrationEnabled, vibrationPattern, defaultVolume } = useSettingsStore.getState().settings;
  return {
    soundEnabled,
    soundName,
    vibrationEnabled,
    vibrationPattern,
    defaultVolume,
  };
};

// Hook for theme-aware components
export const useTheme = () => {
  const theme = useSettingsStore(state => state.settings.theme);
  const toggleTheme = useSettingsStore(state => state.toggleTheme);
  
  return {
    theme,
    toggleTheme,
    isDark: theme === 'dark',
    isLight: theme === 'light',
    isSystem: theme === 'system',
  };
};

// Hook for snooze settings
export const useSnoozeSettings = () => {
  const { snoozeEnabled, snoozeMinutes } = useSettingsStore(state => state.settings);
  const updateSnoozeSettings = useSettingsStore(state => state.updateSnoozeSettings);
  
  return {
    enabled: snoozeEnabled,
    minutes: snoozeMinutes,
    updateSettings: updateSnoozeSettings,
  };
};

// Hook for audio settings
export const useAudioSettings = () => {
  const { soundEnabled, vibrationEnabled, defaultVolume } = useSettingsStore(state => state.settings);
  const updateSoundSettings = useSettingsStore(state => state.updateSoundSettings);
  const updateVibrationSettings = useSettingsStore(state => state.updateVibrationSettings);
  
  return {
    soundEnabled,
    vibrationEnabled,
    defaultVolume,
    updateSoundSettings,
    updateVibrationSettings,
  };
};