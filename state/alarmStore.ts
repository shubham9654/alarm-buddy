import { create } from 'zustand';
import { Alarm, AlarmSchema, createDefaultAlarm } from '../models/alarm';
import { storageService } from '../lib/storage';
import { notificationService } from '../lib/notifications';
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
      const alarms = await storageService.getAlarms();
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
      
      // Create new alarm with default values
      const newAlarm = {
        ...createDefaultAlarm(),
        ...alarmData,
      };

      // Validate the alarm data
      const validatedAlarm = AlarmSchema.parse(newAlarm);
      
      // Save to storage
      await storageService.addAlarm(validatedAlarm);
      
      // Schedule notification if enabled
      if (validatedAlarm.enabled) {
        await notificationService.scheduleAlarm(validatedAlarm);
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
        updatedAt: new Date().toISOString(),
      };
      
      // Validate the updated alarm
      const validatedAlarm = AlarmSchema.parse(updatedAlarm);
      
      // Update in storage
      await storageService.updateAlarm(id, validatedAlarm);
      
      // Update notifications
      await notificationService.cancelAlarm(id);
      if (validatedAlarm.enabled) {
        await notificationService.scheduleAlarm(validatedAlarm);
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
      
      // Cancel notification
      await notificationService.cancelAlarm(id);
      
      // Delete from storage
      await storageService.deleteAlarm(id);
      
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
      const alarm = get().alarms.find(a => a.id === id);
      if (!alarm) {
        throw new Error('Alarm not found');
      }
      
      await get().updateAlarm(id, { enabled: !alarm.enabled });
    } catch (error) {
      console.error('Error toggling alarm:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to toggle alarm'
      });
    }
  },

  snoozeAlarm: async (id, minutes) => {
    try {
      const alarm = get().alarms.find(a => a.id === id);
      if (!alarm) {
        throw new Error('Alarm not found');
      }
      
      // Calculate snooze time
      const snoozeTime = new Date();
      snoozeTime.setMinutes(snoozeTime.getMinutes() + minutes);
      
      // Schedule snooze notification
      await notificationService.scheduleSnooze(alarm, snoozeTime);
      
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
      await notificationService.cancelAlarm(id);
      
      // If it's a one-time alarm, disable it
      const alarm = get().alarms.find(a => a.id === id);
      if (alarm && !alarm.repeat.enabled) {
        await get().updateAlarm(id, { enabled: false });
      } else if (alarm && alarm.repeat.enabled) {
        // For repeating alarms, reschedule for next occurrence
        await notificationService.scheduleAlarm(alarm);
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