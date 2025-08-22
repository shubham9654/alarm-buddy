import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Alert, Vibration, AppState, AppStateStatus } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAlarmStore } from '../../state/alarmStore';
import { useSettingsStore } from '../../state/settingsStore';
import { useTheme } from '../../providers/ThemeProvider';
import { useNotifications } from '../../providers/NotificationsProvider';
import { soundService } from '../../lib/sound';
import { notificationService } from '../../lib/notifications';
import { MathTask } from '../../components/tasks/MathTask';
import { RiddleTask } from '../../components/tasks/RiddleTask';
import { Alarm } from '../../models/alarm';

type TaskResult = {
  completed: boolean;
  answer?: string | number;
};

export default function AlarmRingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ alarmId: string }>();
  const { isDark } = useTheme();
  const { alarms, snoozeAlarm, dismissAlarm } = useAlarmStore();
  const { settings } = useSettingsStore();
  const { setCurrentRingingAlarm } = useNotifications();
  
  const [alarm, setAlarm] = useState<Alarm | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showTask, setShowTask] = useState(false);
  const [taskCompleted, setTaskCompleted] = useState(false);
  const [snoozeCount, setSnoozeCount] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);
  
  const appState = useRef(AppState.currentState);
  const timeInterval = useRef<NodeJS.Timeout | null>(null);

  // Find the alarm
  useEffect(() => {
    if (params.alarmId) {
      const foundAlarm = alarms.find(a => a.id === params.alarmId);
      if (foundAlarm) {
        setAlarm(foundAlarm);
      } else {
        // Alarm not found, go back
        setCurrentRingingAlarm(null);
        router.back();
      }
    }
  }, [params.alarmId, alarms]);

  // Cleanup when component unmounts
  useEffect(() => {
    return () => {
      setCurrentRingingAlarm(null);
    };
  }, []);

  // Start alarm sound and vibration (only once when alarm is found)
  useEffect(() => {
    if (!alarm) return;

    console.log('🔔 Starting alarm useEffect for alarm:', alarm.id);
    const startAlarm = async () => {
      try {
        console.log('🔔 Starting alarm sound and vibration');
        // Play sound if enabled
        if (settings.soundEnabled && alarm.sound) {
          await soundService.playAlarm(alarm);
          setIsPlaying(true);
        }

        // Start vibration if enabled
        if (settings.vibrationEnabled && alarm.vibrate) {
          const vibrationPattern = [0, 1000, 500, 1000, 500, 1000];
          Vibration.vibrate(vibrationPattern, true); // This will repeat indefinitely
        }

        // Start time tracking
        timeInterval.current = setInterval(() => {
          setTimeElapsed(prev => prev + 1);
        }, 1000);

      } catch (error) {
        console.error('Failed to start alarm:', error);
      }
    };

    startAlarm();

    return () => {
      stopAlarm();
    };
  }, [alarm?.id, settings.soundEnabled, settings.vibrationEnabled]); // Only depend on alarm ID and relevant settings

  // Handle app state changes
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      console.log('📱 App state changed from', appState.current, 'to', nextAppState);
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // App came to foreground, ensure alarm is still playing
        if (alarm && !taskCompleted) {
          console.log('📱 App came to foreground, restarting alarm');
          restartAlarm();
        }
      }
      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [alarm?.id, taskCompleted]); // Only depend on alarm ID, not the full alarm object

  const stopAlarm = async () => {
    try {
  // Always attempt to stop the sound service. The local `isPlaying` state
  // can get out of sync with the underlying service (for example when a
  // fallback sound or a playback-status restart happens). Calling
  // soundService.stopAlarm() unconditionally ensures the audio is stopped.
  await soundService.stopAlarm();
  setIsPlaying(false);
      
      if (timeInterval.current) {
        clearInterval(timeInterval.current);
        timeInterval.current = null;
      }
      
      // Cancel all vibrations
      Vibration.cancel();
    } catch (error) {
      console.error('Failed to stop alarm:', error);
    }
  };

  const restartAlarm = async () => {
    if (!alarm) return;
    
    console.log('🔄 Restarting alarm for:', alarm.id);
    try {
      await stopAlarm();
      
      if (settings.soundEnabled && alarm.sound) {
        await soundService.playAlarm(alarm);
        setIsPlaying(true);
      }
      
      if (settings.vibrationEnabled && alarm.vibrate) {
        const vibrationPattern = [0, 1000, 500, 1000, 500, 1000];
        Vibration.vibrate(vibrationPattern, true);
      }
    } catch (error) {
      console.error('Failed to restart alarm:', error);
    }
  };

  const handleSnooze = async () => {
    if (!alarm || !settings.snoozeEnabled) return;

    try {
      await stopAlarm();
      await snoozeAlarm(alarm.id, settings.snoozeMinutes);
      
      // Schedule snooze notification
      const snoozeTime = new Date(Date.now() + settings.snoozeMinutes * 60 * 1000);
      await notificationService.scheduleSnooze(
        alarm.id,
        snoozeTime,
        alarm
      );
      
      setSnoozeCount(prev => prev + 1);
      setCurrentRingingAlarm(null);
      router.back();
    } catch (error) {
      console.error('Failed to snooze alarm:', error);
      Alert.alert('Error', 'Failed to snooze alarm');
    }
  };

  const handleDismiss = async () => {
    if (!alarm) return;

    console.log('❌ Dismissing alarm:', alarm.id);
    
    // Check if task is required
    if (alarm.taskType && alarm.taskType !== 'none' && !taskCompleted) {
      console.log('❌ Task required, showing task screen');
      setShowTask(true);
      return;
    }

    try {
      console.log('❌ Stopping alarm and dismissing');
      await stopAlarm();
      await dismissAlarm(alarm.id);
      console.log('❌ Navigating back');
      setCurrentRingingAlarm(null);
      router.back();
    } catch (error) {
      console.error('Failed to dismiss alarm:', error);
      Alert.alert('Error', 'Failed to dismiss alarm');
    }
  };

  const handleTaskComplete = (result: TaskResult) => {
    if (result.completed) {
      setTaskCompleted(true);
      setShowTask(false);
      // Auto-dismiss after task completion
      setTimeout(() => {
        handleDismiss();
      }, 1000);
    } else {
      Alert.alert(
        'Incorrect Answer',
        'Please try again to dismiss the alarm.',
        [{ text: 'OK' }]
      );
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getCurrentTime = (): string => {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!alarm) {
    return (
      <View className={`flex-1 justify-center items-center ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
        <Text className={`text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Loading alarm...
        </Text>
      </View>
    );
  }

  if (showTask && alarm.taskType && alarm.taskType !== 'none') {
    return (
      <View className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
        <View className="flex-1 justify-center items-center p-6">
          <View className={`${isDark ? 'bg-gray-800' : 'bg-gray-50'} rounded-2xl p-6 w-full max-w-sm`}>
            <Text className={`text-xl font-bold text-center mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Complete Task to Dismiss
            </Text>
            
            <Text className={`text-center mb-6 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              {alarm.label || 'Alarm'}
            </Text>

            {alarm.taskType === 'math' && (
              <MathTask
                difficulty={alarm.taskDifficulty || 'medium'}
                onComplete={handleTaskComplete}
                isDark={isDark}
              />
            )}

            {alarm.taskType === 'riddle' && (
              <RiddleTask
                difficulty={alarm.taskDifficulty || 'medium'}
                onComplete={handleTaskComplete}
                isDark={isDark}
              />
            )}

            <TouchableOpacity
              onPress={() => setShowTask(false)}
              className={`mt-4 ${isDark ? 'bg-gray-700' : 'bg-gray-200'} rounded-lg py-3`}
            >
              <Text className={`text-center font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-red-50'}`}>
      {/* Header */}
      <View className={`${isDark ? 'bg-red-900' : 'bg-red-600'} pt-12 pb-8 px-6`}>
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-1">
            <Text className="text-white text-3xl font-bold">
              {getCurrentTime()}
            </Text>
            <Text className="text-red-100 text-lg mt-1">
              {new Date().toLocaleDateString([], { 
                weekday: 'long', 
                month: 'long', 
                day: 'numeric' 
              })}
            </Text>
          </View>
          
          <View className={`${isDark ? 'bg-red-800' : 'bg-red-500'} rounded-full p-4`}>
            <Ionicons name="alarm" size={32} color="white" />
          </View>
        </View>
        
        <Text className="text-red-100 text-center text-sm">
          Ringing for {formatTime(timeElapsed)}
        </Text>
      </View>

      {/* Alarm Info */}
      <View className="flex-1 justify-center items-center p-6">
        <View className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-8 w-full max-w-sm shadow-lg`}>
          <Text className={`text-2xl font-bold text-center mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {alarm.label || 'Alarm'}
          </Text>
          
          <Text className={`text-center mb-6 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            {alarm.time}
          </Text>

          {/* Task Info */}
          {alarm.taskType && alarm.taskType !== 'none' && (
            <View className={`${isDark ? 'bg-yellow-900' : 'bg-yellow-50'} rounded-lg p-3 mb-6`}>
              <View className="flex-row items-center justify-center">
                <Ionicons 
                  name="school" 
                  size={16} 
                  color={isDark ? '#FCD34D' : '#D97706'} 
                />
                <Text className={`ml-2 text-sm font-medium ${isDark ? 'text-yellow-200' : 'text-yellow-800'}`}>
                  Task required to dismiss
                </Text>
              </View>
              <Text className={`text-xs text-center mt-1 ${isDark ? 'text-yellow-300' : 'text-yellow-700'}`}>
                {alarm.taskType.charAt(0).toUpperCase() + alarm.taskType.slice(1)} • {alarm.taskDifficulty || 'Medium'}
              </Text>
            </View>
          )}

          {/* Snooze Info */}
          {snoozeCount > 0 && (
            <View className={`${isDark ? 'bg-blue-900' : 'bg-blue-50'} rounded-lg p-3 mb-6`}>
              <Text className={`text-center text-sm ${isDark ? 'text-blue-200' : 'text-blue-800'}`}>
                Snoozed {snoozeCount} time{snoozeCount !== 1 ? 's' : ''}
              </Text>
            </View>
          )}

          {/* Action Buttons */}
          <View className="space-y-3">
            {/* Dismiss Button */}
            <TouchableOpacity
              onPress={handleDismiss}
              className={`${isDark ? 'bg-green-700' : 'bg-green-600'} rounded-xl py-4 shadow-sm`}
            >
              <Text className="text-white text-lg font-semibold text-center">
                {alarm.taskType && alarm.taskType !== 'none' ? 'Complete Task' : 'Dismiss'}
              </Text>
            </TouchableOpacity>

            {/* Snooze Button */}
            {settings.snoozeEnabled && (
              <TouchableOpacity
                onPress={handleSnooze}
                className={`${isDark ? 'bg-gray-700' : 'bg-gray-500'} rounded-xl py-4 shadow-sm`}
              >
                <Text className="text-white text-lg font-semibold text-center">
                  Snooze ({settings.snoozeMinutes}m)
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {/* Sound/Vibration Status */}
      <View className="px-6 pb-6">
        <View className="flex-row justify-center space-x-6">
          {settings.soundEnabled && (
            <View className="flex-row items-center">
              <Ionicons 
                name={isPlaying ? "volume-high" : "volume-mute"} 
                size={20} 
                color={isDark ? '#9CA3AF' : '#6B7280'} 
              />
              <Text className={`ml-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {isPlaying ? 'Playing' : 'Muted'}
              </Text>
            </View>
          )}
          
          {settings.vibrationEnabled && alarm.vibrate && (
            <View className="flex-row items-center">
              <Ionicons 
                name="phone-portrait" 
                size={20} 
                color={isDark ? '#9CA3AF' : '#6B7280'} 
              />
              <Text className={`ml-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Vibrating
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}