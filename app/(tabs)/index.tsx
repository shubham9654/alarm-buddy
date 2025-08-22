import React, { useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAlarmStore } from '../../state/alarmStore';
import { useSettingsStore } from '../../state/settingsStore';
import { useTheme } from '../../providers/ThemeProvider';
import { useNotifications } from '../../providers/NotificationsProvider';
import { formatTime, getTimeUntilAlarm } from '../../lib/time';
import { getRepeatText } from '../../models/alarm';

export default function HomeScreen() {
  const { theme, isDark } = useTheme();
  const { hasPermission, requestPermission } = useNotifications();
  const { alarms, nextAlarm, refreshNextAlarm } = useAlarmStore();
  const { settings } = useSettingsStore();

  useEffect(() => {
    // Refresh next alarm when component mounts
    refreshNextAlarm();
    
    // Set up interval to refresh next alarm every minute
    const interval = setInterval(refreshNextAlarm, 60000);
    
    return () => clearInterval(interval);
  }, [refreshNextAlarm]);

  const handleRequestPermission = async () => {
    const granted = await requestPermission();
    if (!granted) {
      Alert.alert(
        'Permission Required',
        'Notifications are required for alarms to work properly. Please enable them in your device settings.',
        [{ text: 'OK' }]
      );
    }
  };

  const enabledAlarms = alarms.filter(alarm => alarm.enabled);
  const totalAlarms = alarms.length;

  return (
    <ScrollView 
      className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}
      contentContainerStyle={{ padding: 16 }}
    >
      {/* Header */}
      <View className="mb-6">
        <Text className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-2`}>
          Good {getGreeting()}
        </Text>
        <Text className={`text-lg ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
          {getWelcomeMessage(totalAlarms, enabledAlarms.length)}
        </Text>
      </View>

      {/* Permission Warning */}
      {!hasPermission && (
        <TouchableOpacity
          onPress={handleRequestPermission}
          className="bg-yellow-100 dark:bg-yellow-900 border border-yellow-300 dark:border-yellow-700 rounded-lg p-4 mb-6 flex-row items-center"
        >
          <Ionicons 
            name="warning" 
            size={24} 
            color={isDark ? '#FBBF24' : '#D97706'} 
          />
          <View className="flex-1 ml-3">
            <Text className={`font-semibold ${isDark ? 'text-yellow-200' : 'text-yellow-800'} mb-1`}>
              Notifications Disabled
            </Text>
            <Text className={`text-sm ${isDark ? 'text-yellow-300' : 'text-yellow-700'}`}>
              Tap to enable notifications for your alarms
            </Text>
          </View>
          <Ionicons 
            name="chevron-forward" 
            size={20} 
            color={isDark ? '#FBBF24' : '#D97706'} 
          />
        </TouchableOpacity>
      )}

      {/* Next Alarm Card */}
      <View className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 mb-6 shadow-sm`}>
        <View className="flex-row items-center justify-between mb-4">
          <Text className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Next Alarm
          </Text>
          <Ionicons 
            name="alarm" 
            size={24} 
            color={isDark ? '#60A5FA' : '#3B82F6'} 
          />
        </View>
        
        {nextAlarm ? (
          <View>
            <Text className={`text-4xl font-bold ${isDark ? 'text-blue-400' : 'text-blue-600'} mb-2`}>
              {formatTime(nextAlarm.time)}
            </Text>
            <Text className={`text-lg ${isDark ? 'text-gray-300' : 'text-gray-600'} mb-2`}>
              {nextAlarm.label || 'Alarm'}
            </Text>
            <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} mb-3`}>
              {getRepeatText(nextAlarm.repeat)} • {getTimeUntilAlarm(nextAlarm)}
            </Text>
            {nextAlarm.taskType !== 'none' && (
              <View className="flex-row items-center">
                <Ionicons 
                  name="puzzle" 
                  size={16} 
                  color={isDark ? '#9CA3AF' : '#6B7280'} 
                />
                <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} ml-2`}>
                  {nextAlarm.taskType} task ({nextAlarm.taskDifficulty})
                </Text>
              </View>
            )}
          </View>
        ) : (
          <View className="items-center py-8">
            <Ionicons 
              name="moon" 
              size={48} 
              color={isDark ? '#6B7280' : '#9CA3AF'} 
            />
            <Text className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-500'} mt-4 text-center`}>
              No upcoming alarms
            </Text>
            <Text className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'} mt-2 text-center`}>
              Create your first alarm to get started
            </Text>
          </View>
        )}
      </View>

      {/* Quick Stats */}
      <View className="flex-row mb-6">
        <View className={`flex-1 ${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl p-4 mr-3 shadow-sm`}>
          <View className="flex-row items-center justify-between">
            <View>
              <Text className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {totalAlarms}
              </Text>
              <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Total Alarms
              </Text>
            </View>
            <Ionicons 
              name="list" 
              size={24} 
              color={isDark ? '#60A5FA' : '#3B82F6'} 
            />
          </View>
        </View>
        
        <View className={`flex-1 ${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl p-4 ml-3 shadow-sm`}>
          <View className="flex-row items-center justify-between">
            <View>
              <Text className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {enabledAlarms.length}
              </Text>
              <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Active Alarms
              </Text>
            </View>
            <Ionicons 
              name="checkmark-circle" 
              size={24} 
              color={isDark ? '#34D399' : '#10B981'} 
            />
          </View>
        </View>
      </View>

      {/* Quick Actions */}
      <View className="mb-6">
        <Text className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-4`}>
          Quick Actions
        </Text>
        
        <View className="flex-row">
          <Link href="/alarms" asChild>
            <TouchableOpacity className={`flex-1 ${isDark ? 'bg-blue-600' : 'bg-blue-500'} rounded-xl p-4 mr-3 flex-row items-center justify-center`}>
              <Ionicons name="add" size={20} color="white" />
              <Text className="text-white font-semibold ml-2">New Alarm</Text>
            </TouchableOpacity>
          </Link>
          
          <Link href="/settings" asChild>
            <TouchableOpacity className={`flex-1 ${isDark ? 'bg-gray-700' : 'bg-gray-200'} rounded-xl p-4 ml-3 flex-row items-center justify-center`}>
              <Ionicons 
                name="settings" 
                size={20} 
                color={isDark ? '#D1D5DB' : '#374151'} 
              />
              <Text className={`${isDark ? 'text-gray-200' : 'text-gray-700'} font-semibold ml-2`}>
                Settings
              </Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>

      {/* Recent Alarms */}
      {enabledAlarms.length > 0 && (
        <View>
          <Text className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-4`}>
            Active Alarms
          </Text>
          
          {enabledAlarms.slice(0, 3).map((alarm) => (
            <View 
              key={alarm.id}
              className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg p-4 mb-3 shadow-sm`}
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {formatTime(alarm.time)}
                  </Text>
                  <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    {alarm.label || 'Alarm'} • {getRepeatText(alarm.repeat)}
                  </Text>
                </View>
                <View className={`w-3 h-3 rounded-full ${alarm.enabled ? 'bg-green-500' : 'bg-gray-400'}`} />
              </View>
            </View>
          ))}
          
          {enabledAlarms.length > 3 && (
            <Link href="/alarms" asChild>
              <TouchableOpacity className="items-center py-3">
                <Text className={`${isDark ? 'text-blue-400' : 'text-blue-600'} font-medium`}>
                  View All Alarms ({enabledAlarms.length})
                </Text>
              </TouchableOpacity>
            </Link>
          )}
        </View>
      )}
    </ScrollView>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Morning';
  if (hour < 17) return 'Afternoon';
  return 'Evening';
}

function getWelcomeMessage(total: number, active: number): string {
  if (total === 0) {
    return 'Ready to set your first alarm?';
  }
  if (active === 0) {
    return 'All alarms are currently disabled';
  }
  if (active === 1) {
    return 'You have 1 active alarm';
  }
  return `You have ${active} active alarms`;
}