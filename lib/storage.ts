import AsyncStorage from '@react-native-async-storage/async-storage';
import { z } from 'zod';
import { Alarm, AlarmSchema } from '../models/alarm';
import { Settings, SettingsSchema, createDefaultSettings } from '../models/settings';

const STORAGE_KEYS = {
  ALARMS: '@alarm-buddy/alarms',
  SETTINGS: '@alarm-buddy/settings',
} as const;

class StorageService {
  private async setItem<T>(key: string, value: T): Promise<void> {
    try {
      const jsonValue = JSON.stringify(value);
      await AsyncStorage.setItem(key, jsonValue);
    } catch (error) {
      console.error(`Error saving ${key}:`, error);
      throw new Error(`Failed to save ${key}`);
    }
  }

  private async getItem<T>(key: string, schema: z.ZodSchema<T>, defaultValue: T): Promise<T> {
    try {
      const jsonValue = await AsyncStorage.getItem(key);
      if (jsonValue === null) {
        return defaultValue;
      }

      const parsed = JSON.parse(jsonValue);
      return schema.parse(parsed);
    } catch (error) {
      console.warn(`Error loading ${key}, using default:`, error);
      return defaultValue;
    }
  }

  private async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing ${key}:`, error);
      throw new Error(`Failed to remove ${key}`);
    }
  }

  // Alarms
  async getAlarms(): Promise<Alarm[]> {
    return this.getItem(STORAGE_KEYS.ALARMS, z.array(AlarmSchema), []);
  }

  async saveAlarms(alarms: Alarm[]): Promise<void> {
    const validatedAlarms = z.array(AlarmSchema).parse(alarms);
    await this.setItem(STORAGE_KEYS.ALARMS, validatedAlarms);
  }

  async addAlarm(alarm: Alarm): Promise<void> {
    const alarms = await this.getAlarms();
    const validatedAlarm = AlarmSchema.parse(alarm);
    alarms.push(validatedAlarm);
    await this.saveAlarms(alarms);
  }

  async updateAlarm(updatedAlarm: Alarm): Promise<void> {
    const alarms = await this.getAlarms();
    const validatedAlarm = AlarmSchema.parse(updatedAlarm);
    const index = alarms.findIndex(alarm => alarm.id === updatedAlarm.id);
    
    if (index === -1) {
      throw new Error('Alarm not found');
    }
    
    alarms[index] = validatedAlarm;
    await this.saveAlarms(alarms);
  }

  async deleteAlarm(alarmId: string): Promise<void> {
    const alarms = await this.getAlarms();
    const filteredAlarms = alarms.filter(alarm => alarm.id !== alarmId);
    await this.saveAlarms(filteredAlarms);
  }

  // Settings
  async getSettings(): Promise<Settings> {
    return this.getItem(STORAGE_KEYS.SETTINGS, SettingsSchema, createDefaultSettings());
  }

  async saveSettings(settings: Settings): Promise<void> {
    const validatedSettings = SettingsSchema.parse(settings);
    await this.setItem(STORAGE_KEYS.SETTINGS, validatedSettings);
  }

  // Utility methods
  async clearAll(): Promise<void> {
    await Promise.all([
      this.removeItem(STORAGE_KEYS.ALARMS),
      this.removeItem(STORAGE_KEYS.SETTINGS),
    ]);
  }

  async exportData(): Promise<{ alarms: Alarm[]; settings: Settings }> {
    const [alarms, settings] = await Promise.all([
      this.getAlarms(),
      this.getSettings(),
    ]);
    
    return { alarms, settings };
  }

  async importData(data: { alarms?: Alarm[]; settings?: Settings }): Promise<void> {
    const promises: Promise<void>[] = [];
    
    if (data.alarms) {
      promises.push(this.saveAlarms(data.alarms));
    }
    
    if (data.settings) {
      promises.push(this.saveSettings(data.settings));
    }
    
    await Promise.all(promises);
  }
}

export const storage = new StorageService();
export default storage;