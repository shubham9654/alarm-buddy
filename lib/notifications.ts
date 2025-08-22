import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Alarm } from '../models/alarm';
import { getNextAlarmTime, getUpcomingAlarmTimes, getNotificationId } from './time';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

class NotificationService {
  private hasPermission = false;

  async initialize(): Promise<boolean> {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('Notification permission not granted');
        return false;
      }

      this.hasPermission = true;

      // Configure notification channel for Android
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('alarms', {
          name: 'Alarms',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
          sound: 'default',
          enableVibrate: true,
        });
      }

      return true;
    } catch (error) {
      console.error('Error initializing notifications:', error);
      return false;
    }
  }

  async scheduleAlarm(alarm: Alarm): Promise<void> {
    if (!this.hasPermission) {
      console.warn('No notification permission, cannot schedule alarm');
      return;
    }

    try {
      // Cancel existing notifications for this alarm
      await this.cancelAlarm(alarm.id);

      if (!alarm.enabled) {
        return;
      }

      const upcomingTimes = getUpcomingAlarmTimes(alarm);

      for (const [index, alarmTime] of upcomingTimes.entries()) {
        const notificationId = getNotificationId(alarm.id, index);
        
        await Notifications.scheduleNotificationAsync({
          identifier: notificationId,
          content: {
            title: 'Alarm',
            body: alarm.label || 'Time to wake up!',
            sound: alarm.sound === 'default' ? 'default' : alarm.sound,
            priority: Notifications.AndroidNotificationPriority.MAX,
            sticky: true,
            data: {
              alarmId: alarm.id,
              taskType: alarm.taskType,
              taskDifficulty: alarm.taskDifficulty,
            },
          },
          trigger: {
            date: alarmTime,
          },
        });
      }

      console.log(`Scheduled ${upcomingTimes.length} notifications for alarm: ${alarm.label}`);
    } catch (error) {
      console.error('Error scheduling alarm:', error);
      throw new Error('Failed to schedule alarm');
    }
  }

  async cancelAlarm(alarmId: string): Promise<void> {
    try {
      const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
      const alarmNotifications = scheduledNotifications.filter(notification => 
        notification.identifier.startsWith(alarmId)
      );

      const cancelPromises = alarmNotifications.map(notification => 
        Notifications.cancelScheduledNotificationAsync(notification.identifier)
      );

      await Promise.all(cancelPromises);
      console.log(`Cancelled ${alarmNotifications.length} notifications for alarm: ${alarmId}`);
    } catch (error) {
      console.error('Error cancelling alarm:', error);
      throw new Error('Failed to cancel alarm');
    }
  }

  async scheduleSnooze(alarmId: string, snoozeTime: Date, alarm: Alarm): Promise<void> {
    if (!this.hasPermission) {
      console.warn('No notification permission, cannot schedule snooze');
      return;
    }

    try {
      const notificationId = `${alarmId}-snooze-${Date.now()}`;
      
      await Notifications.scheduleNotificationAsync({
        identifier: notificationId,
        content: {
          title: 'Alarm (Snoozed)',
          body: alarm.label || 'Time to wake up!',
          sound: alarm.sound === 'default' ? 'default' : alarm.sound,
          priority: Notifications.AndroidNotificationPriority.MAX,
          sticky: true,
          data: {
            alarmId: alarm.id,
            taskType: alarm.taskType,
            taskDifficulty: alarm.taskDifficulty,
            isSnooze: true,
          },
        },
        trigger: {
          date: snoozeTime,
        },
      });

      console.log(`Scheduled snooze for alarm: ${alarm.label}`);
    } catch (error) {
      console.error('Error scheduling snooze:', error);
      throw new Error('Failed to schedule snooze');
    }
  }

  async cancelAllAlarms(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('Cancelled all scheduled notifications');
    } catch (error) {
      console.error('Error cancelling all alarms:', error);
      throw new Error('Failed to cancel all alarms');
    }
  }

  async getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error getting scheduled notifications:', error);
      return [];
    }
  }

  async reconcileAlarms(alarms: Alarm[]): Promise<void> {
    try {
      // Get all scheduled notifications
      const scheduledNotifications = await this.getScheduledNotifications();
      
      // Get all alarm IDs that should have notifications
      const enabledAlarmIds = alarms
        .filter(alarm => alarm.enabled)
        .map(alarm => alarm.id);
      
      // Cancel notifications for alarms that no longer exist or are disabled
      const notificationsToCancel = scheduledNotifications.filter(notification => {
        const alarmId = notification.identifier.split('-')[0];
        return !enabledAlarmIds.includes(alarmId);
      });
      
      for (const notification of notificationsToCancel) {
        await Notifications.cancelScheduledNotificationAsync(notification.identifier);
      }
      
      // Reschedule all enabled alarms to ensure they're up to date
      for (const alarm of alarms.filter(a => a.enabled)) {
        await this.scheduleAlarm(alarm);
      }
      
      console.log('Alarm notifications reconciled');
    } catch (error) {
      console.error('Error reconciling alarms:', error);
    }
  }

  addNotificationReceivedListener(listener: (notification: Notifications.Notification) => void) {
    return Notifications.addNotificationReceivedListener(listener);
  }

  addNotificationResponseReceivedListener(
    listener: (response: Notifications.NotificationResponse) => void
  ) {
    return Notifications.addNotificationResponseReceivedListener(listener);
  }
}

export const notificationService = new NotificationService();
export default notificationService;