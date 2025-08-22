import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Switch } from 'react-native';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAlarmStore } from '../../state/alarmStore';
import { useTheme } from '../../providers/ThemeProvider';
import { formatTime } from '../../lib/time';
import { getRepeatText, Alarm } from '../../models/alarm';

export default function AlarmsScreen() {
  const { theme, isDark } = useTheme();
  const { alarms, toggleAlarm, deleteAlarm, isLoading } = useAlarmStore();
  const [expandedAlarm, setExpandedAlarm] = useState<string | null>(null);

  const handleToggleAlarm = async (id: string) => {
    try {
      await toggleAlarm(id);
    } catch (error) {
      Alert.alert('Error', 'Failed to toggle alarm');
    }
  };

  const handleDeleteAlarm = (alarm: Alarm) => {
    Alert.alert(
      'Delete Alarm',
      `Are you sure you want to delete the alarm "${alarm.label || formatTime(alarm.time)}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAlarm(alarm.id);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete alarm');
            }
          },
        },
      ]
    );
  };

  const toggleExpanded = (alarmId: string) => {
    setExpandedAlarm(expandedAlarm === alarmId ? null : alarmId);
  };

  const sortedAlarms = [...alarms].sort((a, b) => {
    // Sort by time, then by enabled status
    const timeA = a.time.split(':').map(Number);
    const timeB = b.time.split(':').map(Number);
    const minutesA = timeA[0] * 60 + timeA[1];
    const minutesB = timeB[0] * 60 + timeB[1];
    
    if (minutesA !== minutesB) {
      return minutesA - minutesB;
    }
    
    return b.enabled ? 1 : -1;
  });

  return (
    <View className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <View className={`${isDark ? 'bg-gray-800' : 'bg-white'} px-4 py-3 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
        <View className="flex-row items-center justify-between">
          <View>
            <Text className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Alarms
            </Text>
            <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {alarms.length} total • {alarms.filter(a => a.enabled).length} active
            </Text>
          </View>
          
          <Link href="/alarm/new" asChild>
            <TouchableOpacity className={`${isDark ? 'bg-blue-600' : 'bg-blue-500'} rounded-full p-3`}>
              <Ionicons name="add" size={24} color="white" />
            </TouchableOpacity>
          </Link>
        </View>
      </View>

      {/* Alarms List */}
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
        {sortedAlarms.length === 0 ? (
          <View className="flex-1 items-center justify-center py-20">
            <Ionicons 
              name="alarm-outline" 
              size={64} 
              color={isDark ? '#6B7280' : '#9CA3AF'} 
            />
            <Text className={`text-xl font-semibold ${isDark ? 'text-gray-300' : 'text-gray-600'} mt-4 mb-2`}>
              No Alarms Yet
            </Text>
            <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} text-center mb-6 max-w-xs`}>
              Create your first alarm to get started with wake-up challenges
            </Text>
            
            <Link href="/alarm/new" asChild>
              <TouchableOpacity className={`${isDark ? 'bg-blue-600' : 'bg-blue-500'} rounded-lg px-6 py-3 flex-row items-center`}>
                <Ionicons name="add" size={20} color="white" />
                <Text className="text-white font-semibold ml-2">Create Alarm</Text>
              </TouchableOpacity>
            </Link>
          </View>
        ) : (
          <View>
            {sortedAlarms.map((alarm) => (
              <View 
                key={alarm.id}
                className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl mb-4 shadow-sm overflow-hidden`}
              >
                {/* Main Alarm Row */}
                <TouchableOpacity
                  onPress={() => toggleExpanded(alarm.id)}
                  className="p-4"
                >
                  <View className="flex-row items-center justify-between">
                    <View className="flex-1">
                      <View className="flex-row items-center mb-1">
                        <Text className={`text-3xl font-bold ${alarm.enabled ? (isDark ? 'text-white' : 'text-gray-900') : (isDark ? 'text-gray-500' : 'text-gray-400')}`}>
                          {formatTime(alarm.time)}
                        </Text>
                        {alarm.taskType !== 'none' && (
                          <View className={`ml-3 px-2 py-1 rounded-full ${isDark ? 'bg-purple-900' : 'bg-purple-100'}`}>
                            <Text className={`text-xs font-medium ${isDark ? 'text-purple-300' : 'text-purple-700'}`}>
                              {alarm.taskType}
                            </Text>
                          </View>
                        )}
                      </View>
                      
                      <Text className={`text-sm ${alarm.enabled ? (isDark ? 'text-gray-300' : 'text-gray-600') : (isDark ? 'text-gray-500' : 'text-gray-400')} mb-1`}>
                        {alarm.label || 'Alarm'}
                      </Text>
                      
                      <Text className={`text-xs ${alarm.enabled ? (isDark ? 'text-gray-400' : 'text-gray-500') : (isDark ? 'text-gray-600' : 'text-gray-400')}`}>
                        {getRepeatText(alarm.repeat)}
                      </Text>
                    </View>
                    
                    <View className="flex-row items-center">
                      <Switch
                        value={alarm.enabled}
                        onValueChange={() => handleToggleAlarm(alarm.id)}
                        trackColor={{ 
                          false: isDark ? '#374151' : '#D1D5DB', 
                          true: isDark ? '#3B82F6' : '#60A5FA' 
                        }}
                        thumbColor={alarm.enabled ? '#FFFFFF' : '#F3F4F6'}
                        disabled={isLoading}
                      />
                      
                      <TouchableOpacity
                        onPress={() => toggleExpanded(alarm.id)}
                        className="ml-3 p-1"
                      >
                        <Ionicons 
                          name={expandedAlarm === alarm.id ? 'chevron-up' : 'chevron-down'} 
                          size={20} 
                          color={isDark ? '#9CA3AF' : '#6B7280'} 
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableOpacity>
                
                {/* Expanded Details */}
                {expandedAlarm === alarm.id && (
                  <View className={`px-4 pb-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                    <View className="pt-4">
                      {/* Alarm Details */}
                      <View className="flex-row flex-wrap mb-4">
                        <View className="flex-row items-center mr-4 mb-2">
                          <Ionicons 
                            name="volume-high" 
                            size={16} 
                            color={isDark ? '#9CA3AF' : '#6B7280'} 
                          />
                          <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} ml-2`}>
                            {alarm.sound} • {Math.round(alarm.volume * 100)}%
                          </Text>
                        </View>
                        
                        {alarm.vibrate && (
                          <View className="flex-row items-center mr-4 mb-2">
                            <Ionicons 
                              name="phone-portrait" 
                              size={16} 
                              color={isDark ? '#9CA3AF' : '#6B7280'} 
                            />
                            <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} ml-2`}>
                              Vibrate
                            </Text>
                          </View>
                        )}
                        
                        {alarm.taskType !== 'none' && (
                          <View className="flex-row items-center mr-4 mb-2">
                            <Ionicons 
                              name="puzzle" 
                              size={16} 
                              color={isDark ? '#9CA3AF' : '#6B7280'} 
                            />
                            <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} ml-2`}>
                              {alarm.taskDifficulty} {alarm.taskType}
                            </Text>
                          </View>
                        )}
                      </View>
                      
                      {/* Action Buttons */}
                      <View className="flex-row">
                        <Link href={`/alarm/${alarm.id}`} asChild>
                          <TouchableOpacity className={`flex-1 ${isDark ? 'bg-gray-700' : 'bg-gray-100'} rounded-lg py-3 mr-2 flex-row items-center justify-center`}>
                            <Ionicons 
                              name="create" 
                              size={18} 
                              color={isDark ? '#D1D5DB' : '#374151'} 
                            />
                            <Text className={`${isDark ? 'text-gray-200' : 'text-gray-700'} font-medium ml-2`}>
                              Edit
                            </Text>
                          </TouchableOpacity>
                        </Link>
                        
                        <TouchableOpacity
                          onPress={() => handleDeleteAlarm(alarm)}
                          className="flex-1 bg-red-100 dark:bg-red-900 rounded-lg py-3 ml-2 flex-row items-center justify-center"
                        >
                          <Ionicons 
                            name="trash" 
                            size={18} 
                            color={isDark ? '#F87171' : '#DC2626'} 
                          />
                          <Text className={`${isDark ? 'text-red-400' : 'text-red-600'} font-medium ml-2`}>
                            Delete
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                )}
              </View>
            ))}
            
            {/* Add New Alarm Button */}
            <Link href="/alarm/new" asChild>
              <TouchableOpacity className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 shadow-sm border-2 border-dashed ${isDark ? 'border-gray-600' : 'border-gray-300'} items-center justify-center mt-4`}>
                <Ionicons 
                  name="add-circle-outline" 
                  size={32} 
                  color={isDark ? '#60A5FA' : '#3B82F6'} 
                />
                <Text className={`${isDark ? 'text-blue-400' : 'text-blue-600'} font-semibold mt-2`}>
                  Add New Alarm
                </Text>
              </TouchableOpacity>
            </Link>
          </View>
        )}
      </ScrollView>
    </View>
  );
}