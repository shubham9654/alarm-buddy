import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { AlarmForm } from '../../components/UI/AlarmForm';
import { useAlarmStore } from '../../state/alarmStore';
import { Alarm } from '../../models/alarm';
import { useTheme } from '../../providers/ThemeProvider';

export default function NewAlarmScreen() {
  const { isDark } = useTheme();
  const { addAlarm } = useAlarmStore();

  const handleSave = async (alarm: Alarm) => {
    try {
      await addAlarm(alarm);
      router.back();
    } catch (error) {
      console.error('Failed to create alarm:', error);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <View className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <AlarmForm onSave={handleSave} onCancel={handleCancel} />
    </View>
  );
}