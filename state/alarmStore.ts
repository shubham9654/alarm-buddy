import { create } from 'zustand';
import { Alarm, AlarmSchema, createDefaultAlarm, isRepeating } from '../models/alarm';
import { storage } from '../lib/storage';
import { alarmService } from '../lib/alarmService';
import { getNextAlarmTime } from '../lib/time';

interface AlarmState {
  alarms: Alarm[];
  isLoading: boolean;
  error: string | null;
  nextAlarm: Alarm | null;
  
  // Actions
  loadAlarms: () => Promise<void>;
  addAlarm: (alarm: Omit<Alarm, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateAlarm: (id: string, updates: Partial<Alarm>) => Promise<void>;
  deleteAlarm: (id: string) => Promise<void>;
  toggleAlarm: (id: string) => Promise<void>;
  snoozeAlarm: (id: string, minutes: number) => Promise<void>;
  dismissAlarm: (id: string) => Promise<void>;
  refreshNextAlarm: () => void;
  clearError: () => void;
}

export const useAlarmStore = create<AlarmState>((set, get) => ({
  alarms: [],
  isLoading: false,
  error: null,
  nextAlarm: null,

  loadAlarms: async () => {
    try {
      set({ isLoading: true, error: null });
      const alarms = await storage.getAlarms();
      
      // Reschedule alarms for all enabled alarms
      for (const alarm of alarms.filter(a => a.enabled)) {
        try {
          await alarmService.scheduleAlarm(alarm);
        } catch (error) {
          console.error(`Failed to reschedule alarm ${alarm.id}:`, error);
        }
      }
      
      set({ alarms, isLoading: false });
      get().refreshNextAlarm();
    } catch (error) {
      console.error('Error loading alarms:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load alarms',
        isLoading: false 
      });
    }
  },

  addAlarm: async (alarmData) => {
    try {
      set({ isLoading: true, error: null });
      
      // Generate unique ID and timestamps
      const now = Date.now();
      const id = `alarm_${now}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Create new alarm with default values
      const newAlarm = {
        ...createDefaultAlarm(),
        ...alarmData,
        id,
        createdAt: now,
        updatedAt: now,
      };

      // Validate the alarm data
      const validatedAlarm = AlarmSchema.parse(newAlarm);
      
      // Save to storage
      await storage.addAlarm(validatedAlarm);
      
      // Schedule alarm using react-native-alarm-notification
      if (validatedAlarm.enabled) {
        try {
          await alarmService.scheduleAlarm(validatedAlarm);
          console.log('Alarm scheduled successfully');
        } catch (error) {
          console.error('Failed to schedule alarm:', error);
          throw error;
        }
      }
      
      // Update state
      const updatedAlarms = [...get().alarms, validatedAlarm];
      set({ alarms: updatedAlarms, isLoading: false });
      get().refreshNextAlarm();
    } catch (error) {
      console.error('Error adding alarm:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to add alarm',
        isLoading: false 
      });
    }
  },

  updateAlarm: async (id, updates) => {
    try {
      set({ isLoading: true, error: null });
      
      const currentAlarms = get().alarms;
      const alarmIndex = currentAlarms.findIndex(alarm => alarm.id === id);
      
      if (alarmIndex === -1) {
        throw new Error('Alarm not found');
      }
      
      const updatedAlarm = {
        ...currentAlarms[alarmIndex],
        ...updates,
        updatedAt: Date.now(),
      };
      
      // Validate the updated alarm
      const validatedAlarm = AlarmSchema.parse(updatedAlarm);
      
      // Update in storage
      await storage.updateAlarm(validatedAlarm);
      
      // Cancel existing alarm
      const existingAlarm = currentAlarms[alarmIndex];
      if (existingAlarm) {
        try {
          await alarmService.cancelAlarm(existingAlarm.id);
        } catch (error) {
          console.error('Failed to cancel existing alarm:', error);
        }
      }
      
      // Schedule new alarm if enabled
      if (validatedAlarm.enabled) {
        try {
          await alarmService.scheduleAlarm(validatedAlarm);
          console.log('Updated alarm scheduled successfully');
        } catch (error) {
          console.error('Failed to schedule updated alarm:', error);
        }
      }
      
      // Update state
      const newAlarms = [...currentAlarms];
      newAlarms[alarmIndex] = validatedAlarm;
      set({ alarms: newAlarms, isLoading: false });
      get().refreshNextAlarm();
    } catch (error) {
      console.error('Error updating alarm:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update alarm',
        isLoading: false 
      });
    }
  },

  deleteAlarm: async (id) => {
    try {
      set({ isLoading: true, error: null });
      
      // Cancel alarm
      try {
        await alarmService.cancelAlarm(id);
      } catch (error) {
        console.error('Failed to cancel alarm:', error);
      }
      
      // Delete from storage
      await storage.deleteAlarm(id);
      
      // Update state
      const updatedAlarms = get().alarms.filter(alarm => alarm.id !== id);
      set({ alarms: updatedAlarms, isLoading: false });
      get().refreshNextAlarm();
    } catch (error) {
      console.error('Error deleting alarm:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to delete alarm',
        isLoading: false 
      });
    }
  },

  toggleAlarm: async (id) => {
    try {
      set({ isLoading: true, error: null });
      
      const alarm = get().alarms.find(a => a.id === id);
      if (!alarm) {
        throw new Error('Alarm not found');
      }
      
      const updatedAlarm = { ...alarm, enabled: !alarm.enabled };
      
      // Update storage
      await storage.updateAlarm(updatedAlarm);
      
      // Cancel existing alarm
      try {
        await alarmService.cancelAlarm(alarm.id);
      } catch (error) {
        console.error('Failed to cancel existing alarm:', error);
      }
      
      // Schedule alarm if now enabled
      if (updatedAlarm.enabled) {
        try {
          await alarmService.scheduleAlarm(updatedAlarm);
          console.log('Toggled alarm scheduled successfully');
        } catch (error) {
          console.error('Failed to schedule toggled alarm:', error);
        }
      }
      
      // Update state
      const updatedAlarms = get().alarms.map(a => 
        a.id === id ? updatedAlarm : a
      );
      set({ alarms: updatedAlarms, isLoading: false });
      get().refreshNextAlarm();
    } catch (error) {
      console.error('Error toggling alarm:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to toggle alarm',
        isLoading: false 
      });
    }
  },

  snoozeAlarm: async (id, minutes) => {
    try {
      const alarm = get().alarms.find(a => a.id === id);
      if (!alarm) {
        throw new Error('Alarm not found');
      }
      
      // Use the new snoozeAlarm method from alarmService
      await alarmService.snoozeAlarm(id, minutes);
      
      console.log(`Alarm snoozed for ${minutes} minutes`);
    } catch (error) {
      console.error('Error snoozing alarm:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to snooze alarm'
      });
    }
  },

  dismissAlarm: async (id) => {
    try {
      // Cancel any pending notifications for this alarm
      await alarmService.cancelAlarm(id);
      
      // If it's a one-time alarm, disable it
      const alarm = get().alarms.find(a => a.id === id);
      if (alarm && !isRepeating(alarm.repeat)) {
        await get().updateAlarm(id, { enabled: false });
      } else if (alarm && isRepeating(alarm.repeat)) {
        // For repeating alarms, reschedule for next occurrence
        await alarmService.scheduleAlarm(alarm);
      }
      
      console.log('Alarm dismissed');
    } catch (error) {
      console.error('Error dismissing alarm:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to dismiss alarm'
      });
    }
  },

  refreshNextAlarm: () => {
    const { alarms } = get();
    const enabledAlarms = alarms.filter(alarm => alarm.enabled);
    
    if (enabledAlarms.length === 0) {
      set({ nextAlarm: null });
      return;
    }
    
    // Find the next alarm to ring
    let nextAlarm: Alarm | null = null;
    let nextTime: Date | null = null;
    
    for (const alarm of enabledAlarms) {
      const alarmTime = getNextAlarmTime(alarm);
      if (alarmTime && (!nextTime || alarmTime < nextTime)) {
        nextTime = alarmTime;
        nextAlarm = alarm;
      }
    }
    
    set({ nextAlarm });
  },

  clearError: () => {
    set({ error: null });
  },
}));

// Helper function to get alarm by ID
export const getAlarmById = (id: string): Alarm | undefined => {
  return useAlarmStore.getState().alarms.find(alarm => alarm.id === id);
};

// Helper function to get enabled alarms
export const getEnabledAlarms = (): Alarm[] => {
  return useAlarmStore.getState().alarms.filter(alarm => alarm.enabled);
};

// Helper function to get alarms count
export const getAlarmsCount = (): { total: number; enabled: number } => {
  const alarms = useAlarmStore.getState().alarms;
  return {
    total: alarms.length,
    enabled: alarms.filter(alarm => alarm.enabled).length,
  };
};