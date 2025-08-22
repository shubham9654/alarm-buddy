import React from 'react';
import { View, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { AlarmForm } from '../../components/UI/AlarmForm';
import { useAlarmStore } from '../../state/alarmStore';
import { Alarm } from '../../models/alarm';
import { useTheme } from '../../providers/ThemeProvider';

export default function EditAlarmScreen() {
  const { isDark } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { alarms, updateAlarm } = useAlarmStore();

  // Find the alarm to edit
  const alarm = alarms.find(a => a.id === id);

  if (!alarm) {
    // If alarm not found, go back
    React.useEffect(() => {
      Alert.alert('Error', 'Alarm not found', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    }, []);
    
    return (
      <View className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`} />
    );
  }

  const handleSave = async (updatedAlarm: Alarm) => {
    try {
      await updateAlarm(alarm.id, updatedAlarm);
      router.back();
    } catch (error) {
      console.error('Failed to update alarm:', error);
      Alert.alert('Error', 'Failed to update alarm');
    }
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <View className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <AlarmForm 
        alarm={alarm} 
        onSave={handleSave} 
        onCancel={handleCancel} 
      />
    </View>
  );
}