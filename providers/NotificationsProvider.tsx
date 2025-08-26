import React, { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { notificationService } from '../lib/notifications';
import { useAlarmStore } from '../state/alarmStore';
import { useSettingsStore } from '../state/settingsStore';
import { alarmService } from '../lib/alarmService';



interface NotificationsContextType {
  hasPermission: boolean;
  isInitialized: boolean;
  requestPermission: () => Promise<boolean>;
  checkPermission: () => Promise<boolean>;
  currentRingingAlarm: string | null;
  setCurrentRingingAlarm: (alarmId: string | null) => void;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

interface NotificationsProviderProps {
  children: React.ReactNode;
}

export const NotificationsProvider: React.FC<NotificationsProviderProps> = ({ children }) => {
  const [hasPermission, setHasPermission] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [currentRingingAlarm, setCurrentRingingAlarm] = useState<string | null>(null);
  const { dismissAlarm, snoozeAlarm, alarms } = useAlarmStore();
  const { settings } = useSettingsStore();

  useEffect(() => {
    initializeNotifications();
    
    // Initialize alarm service for background operation
    alarmService.initialize().then(() => {
      console.log('Alarm service initialized successfully');
    }).catch((error: any) => {
      console.error('Failed to initialize alarm service:', error);
    });
  }, []);

  const initializeNotifications = async () => {
    try {
      // Initialize notification service
      await notificationService.initialize();
      
      // Check initial permission status
      const permission = await checkPermission();
      setHasPermission(permission);
      
      // Set up notification handlers
      setupNotificationHandlers();
      
      setIsInitialized(true);
      console.log('Notifications initialized successfully');
    } catch (error) {
      console.error('Error initializing notifications:', error);
      setIsInitialized(true); // Still mark as initialized to prevent infinite loops
    }
  };

  const setupNotificationHandlers = () => {
    // Handle notifications received while app is in foreground
    Notifications.setNotificationHandler({
      handleNotification: async (notification) => {
        const isAlarmNotification = notification.request.content.data?.type === 'alarm';
        
        return {
          shouldShowAlert: isAlarmNotification,
          shouldPlaySound: isAlarmNotification,
          shouldSetBadge: false,
          shouldShowBanner: isAlarmNotification,
          shouldShowList: isAlarmNotification,
        };
      },
    });

    // Handle notification responses (when user taps notification)
    const responseSubscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const { notification } = response;
        const { data } = notification.request.content;
        
        if (data?.type === 'alarm' && data?.alarmId) {
          const alarmId = data.alarmId as string;
          const action = response.actionIdentifier;
          
          switch (action) {
            case 'snooze':
              if (settings.snoozeEnabled) {
                const alarm = alarms.find(a => a.id === alarmId);
                if (alarm) {
                  snoozeAlarm(alarmId, settings.snoozeMinutes);
                  // Schedule the snooze notification
                  const snoozeTime = new Date(Date.now() + settings.snoozeMinutes * 60 * 1000);
                  notificationService.scheduleSnooze(alarmId, snoozeTime, alarm);
                }
              }
              setCurrentRingingAlarm(null);
              break;
            case 'dismiss':
              dismissAlarm(alarmId);
              setCurrentRingingAlarm(null);
              break;
            case Notifications.DEFAULT_ACTION_IDENTIFIER:
              // Navigate to ring screen when notification is tapped
              if (currentRingingAlarm !== alarmId) {
                setCurrentRingingAlarm(alarmId);
                router.push(`/alarm/ring?alarmId=${alarmId}`);
              }
              break;
            default:
              console.log('Unknown notification action:', action);
          }
        }
      }
    );

    // Handle notifications received while app is running
    const receivedSubscription = Notifications.addNotificationReceivedListener(
      (notification) => {
        const { data } = notification.request.content;
        
        if (data?.type === 'alarm' && data?.alarmId) {
          console.log('Alarm notification received:', notification.request.content.title);
          const alarmId = data.alarmId as string;
          // Only navigate if we're not already showing this alarm
          if (currentRingingAlarm !== alarmId) {
            console.log('Navigating to ring screen for alarm:', alarmId);
            setCurrentRingingAlarm(alarmId);
            router.push(`/alarm/ring?alarmId=${alarmId}`);
          } else {
            console.log('Already showing ring screen for alarm:', alarmId);
          }
        }
      }
    );

    // Cleanup subscriptions
    return () => {
      responseSubscription.remove();
      receivedSubscription.remove();
    };
  };

  const checkPermission = async (): Promise<boolean> => {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      const hasPermission = status === 'granted';
      setHasPermission(hasPermission);
      return hasPermission;
    } catch (error) {
      console.error('Error checking notification permission:', error);
      return false;
    }
  };

  const requestPermission = async (): Promise<boolean> => {
    try {
      const { status } = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
        },
        android: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
        },
      });
      
      const granted = status === 'granted';
      setHasPermission(granted);
      
      if (granted) {
        console.log('Notification permission granted');
        // Re-initialize notification service with permissions
        await notificationService.initialize();
      } else {
        console.log('Notification permission denied');
      }
      
      return granted;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  };

  const contextValue: NotificationsContextType = {
    hasPermission,
    isInitialized,
    requestPermission,
    checkPermission,
    currentRingingAlarm,
    setCurrentRingingAlarm,
  };

  return (
    <NotificationsContext.Provider value={contextValue}>
      {children}
    </NotificationsContext.Provider>
  );
};

export const useNotifications = (): NotificationsContextType => {
  const context = useContext(NotificationsContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  return context;
};

// Hook for checking if notifications are properly set up
export const useNotificationStatus = () => {
  const { hasPermission, isInitialized } = useNotifications();
  
  return {
    isReady: hasPermission && isInitialized,
    needsPermission: isInitialized && !hasPermission,
    isLoading: !isInitialized,
  };
};

// Helper function to show notification permission prompt
export const showPermissionPrompt = async (): Promise<boolean> => {
  if (Platform.OS === 'ios') {
    // On iOS, we can show a custom alert before requesting permission
    // This helps improve permission grant rates
    return true; // For now, just return true
  }
  
  return true;
};