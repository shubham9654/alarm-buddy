import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Alarm, getRepeatDays, isRepeating } from '../models/alarm';
import { formatTime } from './time';

export interface AlarmData {
  id: string;
  title: string;
  message: string;
  time: Date;
  enabled: boolean;
  repeatDays?: number[];
  snoozeInterval?: number;
}

// Configure notification handler for alarm-like behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
    priority: Notifications.AndroidNotificationPriority.MAX,
  }),
});

class AlarmService {
  private initialized = false;
  private alarmChannelId = 'alarm-channel';
  private scheduledAlarms = new Map<string, string>(); // alarmId -> notificationId

  async initialize() {
    if (this.initialized) return;
    
    try {
      // Request permissions
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Notification permissions not granted');
      }

      // Create alarm notification channel for Android
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync(this.alarmChannelId, {
          name: 'Alarm Notifications',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
          sound: 'default',
          enableLights: true,
          enableVibrate: true,
          showBadge: true,
        });
      }
      
      this.initialized = true;
      console.log('AlarmService initialized with Expo notifications');
    } catch (error) {
      console.error('Failed to initialize AlarmService:', error);
      throw error;
    }
  }

  async scheduleAlarm(alarm: Alarm): Promise<void> {
    await this.initialize();
    
    try {
      // Cancel existing alarm if it exists
      await this.cancelAlarm(alarm.id);
      
      if (!alarm.enabled) {
        console.log(`Alarm ${alarm.id} is disabled, skipping schedule`);
        return;
      }

      const alarmTime = new Date(alarm.time);
      const now = new Date();
      
      // If alarm time is in the past, schedule for next day
      if (alarmTime <= now) {
        alarmTime.setDate(alarmTime.getDate() + 1);
      }

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '🔔 Alarm',
          body: alarm.label || `Time to wake up! ${formatTime(alarm.time)}`,
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.MAX,
          categoryIdentifier: 'alarm',
          data: {
             alarmId: alarm.id,
             snoozeInterval: 5,
             type: 'alarm'
           },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: alarmTime,
          channelId: this.alarmChannelId,
        },
      });

      this.scheduledAlarms.set(alarm.id, notificationId);
      
      // Schedule repeating alarms if needed
      if (isRepeating(alarm.repeat)) {
        await this.scheduleRepeatingAlarm(alarm);
      }

      console.log(`Alarm ${alarm.id} scheduled successfully for ${alarmTime}`);
    } catch (error) {
      console.error('Failed to schedule alarm:', error);
      throw error;
    }
  }

  private async scheduleRepeatingAlarm(alarm: Alarm) {
    if (!isRepeating(alarm.repeat)) return;

    const alarmTime = new Date(alarm.time);
    const now = new Date();
    
    const repeatDays = getRepeatDays(alarm.repeat);
    const dayMap = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 };
    
    // Schedule for each repeat day in the next week
    for (const dayName of repeatDays) {
      const dayOfWeek = dayMap[dayName as keyof typeof dayMap];
      const nextAlarmDate = new Date(now);
      const daysUntilAlarm = (dayOfWeek - now.getDay() + 7) % 7;
      
      nextAlarmDate.setDate(now.getDate() + (daysUntilAlarm === 0 ? 7 : daysUntilAlarm));
      nextAlarmDate.setHours(alarmTime.getHours(), alarmTime.getMinutes(), 0, 0);

      const repeatNotificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '🔔 Alarm',
          body: alarm.label || 'Time to wake up!',
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.MAX,
          categoryIdentifier: 'alarm',
          data: {
             alarmId: alarm.id,
             snoozeInterval: 5,
             type: 'alarm',
             isRepeating: true
           },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
          weekday: dayOfWeek + 1, // Expo uses 1-7 for Sunday-Saturday
          hour: alarmTime.getHours(),
          minute: alarmTime.getMinutes(),
          channelId: this.alarmChannelId,
        },
      });

      this.scheduledAlarms.set(`${alarm.id}-${dayOfWeek}`, repeatNotificationId);
    }
  }

  async cancelAlarm(alarmId: string): Promise<void> {
    await this.initialize();
    
    try {
      // Cancel main alarm
      const notificationId = this.scheduledAlarms.get(alarmId);
      if (notificationId) {
        await Notifications.cancelScheduledNotificationAsync(notificationId);
        this.scheduledAlarms.delete(alarmId);
      }

      // Cancel repeating alarms
      for (let day = 0; day < 7; day++) {
        const repeatKey = `${alarmId}-${day}`;
        const repeatNotificationId = this.scheduledAlarms.get(repeatKey);
        if (repeatNotificationId) {
          await Notifications.cancelScheduledNotificationAsync(repeatNotificationId);
          this.scheduledAlarms.delete(repeatKey);
        }
      }

      console.log(`Alarm ${alarmId} cancelled successfully`);
    } catch (error) {
      console.error('Failed to cancel alarm:', error);
      // Don't throw error for cancellation failures as the alarm might not exist
    }
  }

  async cancelAllAlarms(): Promise<void> {
    await this.initialize();
    
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      this.scheduledAlarms.clear();
      console.log('All alarms cancelled successfully');
    } catch (error) {
      console.error('Failed to cancel all alarms:', error);
    }
  }

  async getScheduledAlarms(): Promise<any[]> {
    await this.initialize();
    
    try {
      const notifications = await Notifications.getAllScheduledNotificationsAsync();
      return notifications.filter(notification => 
        notification.content.data?.type === 'alarm'
      );
    } catch (error) {
      console.error('Failed to get scheduled alarms:', error);
      return [];
    }
  }

  async snoozeAlarm(alarmId: string, snoozeMinutes: number = 5): Promise<void> {
    try {
      const snoozeTime = new Date();
      snoozeTime.setMinutes(snoozeTime.getMinutes() + snoozeMinutes);

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '😴 Snoozed Alarm',
          body: `Alarm snoozed for ${snoozeMinutes} minutes`,
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.MAX,
          data: {
            alarmId: alarmId,
            type: 'snooze'
          },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: snoozeTime,
          channelId: this.alarmChannelId,
        },
      });

      this.scheduledAlarms.set(`${alarmId}-snooze`, notificationId);
      console.log(`Alarm ${alarmId} snoozed for ${snoozeMinutes} minutes`);
    } catch (error) {
      console.error('Error snoozing alarm:', error);
      throw error;
    }
  }

  private formatAlarmTime(date: Date): string {
    // Format: dd-MM-yyyy HH:mm:ss
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    
    return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;
  }

  // Handle alarm events
  onAlarmFired(callback: (alarm: any) => void) {
    // This would be handled by the native module's event listeners
    // The actual implementation depends on how the library exposes events
  }

  onAlarmDismissed(callback: (alarmId: string) => void) {
    // Handle alarm dismissal events
  }

  onAlarmSnoozed(callback: (alarmId: string, snoozeTime: number) => void) {
    // Handle alarm snooze events
  }

  async checkBatteryOptimization(): Promise<boolean> {
    // For Expo notifications, battery optimization is handled by the system
    // Return false to indicate no special battery optimization is needed
    return false;
  }

  async requestBatteryOptimizationExemption(): Promise<void> {
    // For Expo notifications, this would be handled by system settings
    console.log('Battery optimization exemption not needed for Expo notifications');
  }
}

export const alarmService = new AlarmService();
export default alarmService;