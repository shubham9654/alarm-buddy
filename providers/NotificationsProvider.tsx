import React, { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { notificationService } from '../lib/notifications';
import { useAlarmStore } from '../state/alarmStore';

interface NotificationsContextType {
  hasPermission: boolean;
  isInitialized: boolean;
  requestPermission: () => Promise<boolean>;
  checkPermission: () => Promise<boolean>;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

interface NotificationsProviderProps {
  children: React.ReactNode;
}

export const NotificationsProvider: React.FC<NotificationsProviderProps> = ({ children }) => {
  const [hasPermission, setHasPermission] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const { dismissAlarm, snoozeAlarm } = useAlarmStore();

  useEffect(() => {
    initializeNotifications();
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
              snoozeAlarm(alarmId, 5); // Default 5 minutes snooze
              break;
            case 'dismiss':
            case Notifications.DEFAULT_ACTION_IDENTIFIER:
              dismissAlarm(alarmId);
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
        
        if (data?.type === 'alarm') {
          console.log('Alarm notification received:', notification.request.content.title);
          // You could trigger additional actions here, like showing an in-app alarm screen
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
          allowAnnouncements: true,
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