import React from 'react';
import { View, Text, TouchableOpacity, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Alarm } from '../../models/alarm';
import { useTheme } from '../../providers/ThemeProvider';
import { getRepeatText, getTimeUntilAlarm } from '../../lib/time';

interface AlarmCardProps {
  alarm: Alarm;
  onToggle: (id: string, enabled: boolean) => void;
  onEdit: (alarm: Alarm) => void;
  onDelete: (id: string) => void;
  showDetails?: boolean;
}

export function AlarmCard({ alarm, onToggle, onEdit, onDelete, showDetails = false }: AlarmCardProps) {
  const { isDark } = useTheme();

  const getTaskIcon = (taskType: string) => {
    switch (taskType) {
      case 'math':
        return 'calculator';
      case 'riddle':
        return 'help-circle';
      default:
        return 'checkmark-circle';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return isDark ? 'text-green-400' : 'text-green-600';
      case 'medium':
        return isDark ? 'text-yellow-400' : 'text-yellow-600';
      case 'hard':
        return isDark ? 'text-red-400' : 'text-red-600';
      default:
        return isDark ? 'text-gray-400' : 'text-gray-600';
    }
  };

  const formatTime = (time: string): string => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const timeUntil = alarm.enabled ? getTimeUntilAlarm(alarm.time, alarm.repeat) : null;

  return (
    <View className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl p-4 mb-3 shadow-sm border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
      {/* Main Content */}
      <View className="flex-row items-center justify-between">
        {/* Time and Label */}
        <TouchableOpacity 
          onPress={() => onEdit(alarm)}
          className="flex-1"
          activeOpacity={0.7}
        >
          <View className="flex-row items-baseline">
            <Text className={`text-3xl font-light ${alarm.enabled ? (isDark ? 'text-white' : 'text-gray-900') : (isDark ? 'text-gray-500' : 'text-gray-400')}`}>
              {formatTime(alarm.time)}
            </Text>
            {alarm.label && (
              <Text className={`ml-3 text-lg ${alarm.enabled ? (isDark ? 'text-gray-300' : 'text-gray-600') : (isDark ? 'text-gray-600' : 'text-gray-500')}`}>
                {alarm.label}
              </Text>
            )}
          </View>
          
          {/* Time Until */}
          {alarm.enabled && timeUntil && (
            <Text className={`text-sm mt-1 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
              {timeUntil}
            </Text>
          )}
          
          {/* Repeat Info */}
          {alarm.enabled && (
            <Text className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {getRepeatText(alarm.repeat)}
            </Text>
          )}
        </TouchableOpacity>

        {/* Toggle Switch */}
        <View className="ml-4">
          <Switch
            value={alarm.enabled}
            onValueChange={(enabled) => onToggle(alarm.id, enabled)}
            trackColor={{ 
              false: isDark ? '#374151' : '#D1D5DB', 
              true: isDark ? '#3B82F6' : '#60A5FA' 
            }}
            thumbColor={alarm.enabled ? '#FFFFFF' : '#F3F4F6'}
          />
        </View>
      </View>

      {/* Details Section */}
      {showDetails && (
        <View className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <View className="flex-row flex-wrap items-center">
            {/* Task Info */}
            {alarm.taskType && alarm.taskType !== 'none' && (
              <View className="flex-row items-center mr-4 mb-2">
                <Ionicons 
                  name={getTaskIcon(alarm.taskType)} 
                  size={16} 
                  color={isDark ? '#9CA3AF' : '#6B7280'} 
                />
                <Text className={`ml-1 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {alarm.taskType.charAt(0).toUpperCase() + alarm.taskType.slice(1)}
                </Text>
                {alarm.taskDifficulty && (
                  <Text className={`ml-1 text-sm ${getDifficultyColor(alarm.taskDifficulty)}`}>
                    ({alarm.taskDifficulty})
                  </Text>
                )}
              </View>
            )}

            {/* Sound Info */}
            {alarm.sound && (
              <View className="flex-row items-center mr-4 mb-2">
                <Ionicons 
                  name="volume-high" 
                  size={16} 
                  color={isDark ? '#9CA3AF' : '#6B7280'} 
                />
                <Text className={`ml-1 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {alarm.sound.charAt(0).toUpperCase() + alarm.sound.slice(1)}
                </Text>
                <Text className={`ml-1 text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                  ({Math.round(alarm.volume * 100)}%)
                </Text>
              </View>
            )}

            {/* Vibration Info */}
            {alarm.vibrate && (
              <View className="flex-row items-center mr-4 mb-2">
                <Ionicons 
                  name="phone-portrait" 
                  size={16} 
                  color={isDark ? '#9CA3AF' : '#6B7280'} 
                />
                <Text className={`ml-1 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Vibrate
                </Text>
              </View>
            )}
          </View>

          {/* Action Buttons */}
          <View className="flex-row justify-end mt-3 space-x-2">
            <TouchableOpacity
              onPress={() => onEdit(alarm)}
              className={`${isDark ? 'bg-gray-700' : 'bg-gray-100'} rounded-lg px-4 py-2`}
            >
              <View className="flex-row items-center">
                <Ionicons 
                  name="pencil" 
                  size={16} 
                  color={isDark ? '#9CA3AF' : '#6B7280'} 
                />
                <Text className={`ml-1 text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Edit
                </Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={() => onDelete(alarm.id)}
              className={`${isDark ? 'bg-red-900' : 'bg-red-50'} rounded-lg px-4 py-2`}
            >
              <View className="flex-row items-center">
                <Ionicons 
                  name="trash" 
                  size={16} 
                  color={isDark ? '#F87171' : '#DC2626'} 
                />
                <Text className={`ml-1 text-sm font-medium ${isDark ? 'text-red-400' : 'text-red-600'}`}>
                  Delete
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}