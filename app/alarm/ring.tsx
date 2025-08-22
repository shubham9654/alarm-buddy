import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Alert, Vibration, AppState, AppStateStatus } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAlarmStore } from '../../state/alarmStore';
import { useSettingsStore } from '../../state/settingsStore';
import { useTheme } from '../../providers/ThemeProvider';
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
  
  const [alarm, setAlarm] = useState<Alarm | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showTask, setShowTask] = useState(false);
  const [taskCompleted, setTaskCompleted] = useState(false);
  const [snoozeCount, setSnoozeCount] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);
  
  const appState = useRef(AppState.currentState);
  const vibrationInterval = useRef<NodeJS.Timeout | null>(null);
  const timeInterval = useRef<NodeJS.Timeout | null>(null);

  // Find the alarm
  useEffect(() => {
    if (params.alarmId) {
      const foundAlarm = alarms.find(a => a.id === params.alarmId);
      if (foundAlarm) {
        setAlarm(foundAlarm);
      } else {
        // Alarm not found, go back
        router.back();
      }
    }
  }, [params.alarmId, alarms]);

  // Start alarm sound and vibration
  useEffect(() => {
    if (!alarm) return;

    const startAlarm = async () => {
      try {
        // Play sound if enabled
        if (settings.soundEnabled && alarm.sound) {
          await soundService.playAlarm(alarm.sound, alarm.volume);
          setIsPlaying(true);
        }

        // Start vibration if enabled
        if (settings.vibrationEnabled && alarm.vibrate) {
          const vibrationPattern = [0, 1000, 500, 1000, 500, 1000];
          Vibration.vibrate(vibrationPattern, true);
          
          // Set up continuous vibration
          vibrationInterval.current = setInterval(() => {
            Vibration.vibrate(vibrationPattern, true);
          }, 3000);
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
  }, [alarm, settings]);

  // Handle app state changes
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // App came to foreground, ensure alarm is still playing
        if (alarm && !taskCompleted) {
          restartAlarm();
        }
      }
      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [alarm, taskCompleted]);

  const stopAlarm = async () => {
    try {
      if (isPlaying) {
        await soundService.stopAlarm();
        setIsPlaying(false);
      }
      
      if (vibrationInterval.current) {
        clearInterval(vibrationInterval.current);
        vibrationInterval.current = null;
      }
      
      if (timeInterval.current) {
        clearInterval(timeInterval.current);
        timeInterval.current = null;
      }
      
      Vibration.cancel();
    } catch (error) {
      console.error('Failed to stop alarm:', error);
    }
  };

  const restartAlarm = async () => {
    if (!alarm) return;
    
    try {
      await stopAlarm();
      
      if (settings.soundEnabled && alarm.sound) {
        await soundService.playAlarm(alarm.sound, alarm.volume);
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
      await snoozeAlarm(alarm.id);
      
      // Schedule snooze notification
      await notificationService.scheduleSnoozeNotification(
        alarm.id,
        alarm.label || 'Alarm',
        settings.snoozeMinutes
      );
      
      setSnoozeCount(prev => prev + 1);
      router.back();
    } catch (error) {
      console.error('Failed to snooze alarm:', error);
      Alert.alert('Error', 'Failed to snooze alarm');
    }
  };

  const handleDismiss = async () => {
    if (!alarm) return;

    // Check if task is required
    if (alarm.taskType && alarm.taskType !== 'none' && !taskCompleted) {
      setShowTask(true);
      return;
    }

    try {
      await stopAlarm();
      await dismissAlarm(alarm.id);
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