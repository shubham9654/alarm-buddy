import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import Slider from '@react-native-community/slider';
import { Alarm, createDefaultAlarm } from '../../models/alarm';
import { useTheme } from '../../providers/ThemeProvider';
import { useSettingsStore } from '../../state/settingsStore';
import { soundService } from '../../lib/sound';
import { isValidTime } from '../../lib/time';

interface AlarmFormProps {
  alarm?: Alarm;
  onSave: (alarm: Alarm) => void;
  onCancel: () => void;
}

export function AlarmForm({ alarm, onSave, onCancel }: AlarmFormProps) {
  const { isDark } = useTheme();
  const { settings } = useSettingsStore();
  const isEditing = !!alarm;
  
  const [formData, setFormData] = useState<Alarm>(() => {
    if (alarm) {
      return { ...alarm };
    }
    const defaultAlarm = createDefaultAlarm();
    const now = Date.now();
    return {
      ...defaultAlarm,
      id: '',
      taskType: settings.defaultTaskType,
      taskDifficulty: settings.defaultDifficulty,
      volume: settings.defaultVolume,
      vibrate: settings.vibrationEnabled,
      createdAt: now,
      updatedAt: now,
    };
  });
  
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [testingSound, setTestingSound] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const availableSounds = soundService.getAvailableSounds();
  const daysOfWeek = [
    { key: 'mon', label: 'Mon' },
    { key: 'tue', label: 'Tue' },
    { key: 'wed', label: 'Wed' },
    { key: 'thu', label: 'Thu' },
    { key: 'fri', label: 'Fri' },
    { key: 'sat', label: 'Sat' },
    { key: 'sun', label: 'Sun' },
  ] as const;

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};
    
    if (!isValidTime(formData.time)) {
      newErrors.time = 'Please enter a valid time';
    }
    
    if (formData.label && formData.label.length > 50) {
      newErrors.label = 'Label must be 50 characters or less';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) {
      return;
    }
    
    const updatedAlarm: Alarm = {
      ...formData,
      updatedAt: Date.now(),
    };
    
    onSave(updatedAlarm);
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    
    if (selectedTime) {
      const hours = selectedTime.getHours().toString().padStart(2, '0');
      const minutes = selectedTime.getMinutes().toString().padStart(2, '0');
      const timeString = `${hours}:${minutes}`;
      
      setFormData(prev => ({ ...prev, time: timeString }));
      
      // Clear time error if it exists
      if (errors.time) {
        setErrors(prev => ({ ...prev, time: '' }));
      }
    }
  };

  const handleRepeatToggle = (day: keyof typeof formData.repeat) => {
    setFormData(prev => ({
      ...prev,
      repeat: {
        ...prev.repeat,
        [day]: !prev.repeat[day],
      },
    }));
  };

  const handleTestSound = async () => {
    if (testingSound || !formData.sound) return;
    
    try {
      setTestingSound(true);
      await soundService.testSound(formData.sound, formData.volume);
    } catch (error) {
      Alert.alert('Error', 'Failed to test sound');
    } finally {
      setTimeout(() => setTestingSound(false), 3000);
    }
  };

  const getCurrentTimeForPicker = (): Date => {
    const timeParts = formData.time.split(':').map(Number);
    const hours = timeParts[0];
    const minutes = timeParts[1];
    const date = new Date();
    if (hours !== undefined && minutes !== undefined) {
      date.setHours(hours, minutes, 0, 0);
    }
    return date;
  };

  const formatTime = (time: string): string => {
    const timeParts = time.split(':');
    const hours = timeParts[0];
    const minutes = timeParts[1];
    if (!hours || !minutes) {
      return '12:00 AM';
    }
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  return (
    <SafeAreaView className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <View className={`${isDark ? 'bg-gray-800' : 'bg-white'} px-4 py-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
        <View className="flex-row items-center justify-between">
          <TouchableOpacity 
            onPress={onCancel}
            className={`px-4 py-2 rounded-lg border ${isDark ? 'border-gray-600 bg-gray-700' : 'border-gray-300 bg-gray-50'}`}
          >
            <Text className={`text-lg ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
              Cancel
            </Text>
          </TouchableOpacity>
          
          <Text className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {isEditing ? 'Edit Alarm' : 'New Alarm'}
          </Text>
          
          <TouchableOpacity 
            onPress={handleSave}
            className={`px-4 py-2 rounded-lg border ${isDark ? 'border-blue-500 bg-blue-900/30' : 'border-blue-300 bg-blue-50'}`}
          >
            <Text className={`text-lg font-semibold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
              Save
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="flex-1 p-4">
        {/* Time Section */}
        <View className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl p-4 mb-4 shadow-sm`}>
          <Text className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Time
          </Text>
          
          <TouchableOpacity
            onPress={() => setShowTimePicker(true)}
            className={`${isDark ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg p-4 border ${errors.time ? 'border-red-500' : (isDark ? 'border-gray-600' : 'border-gray-200')}`}
          >
            <Text className={`text-center text-4xl font-light ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {formatTime(formData.time)}
            </Text>
          </TouchableOpacity>
          
          {errors.time && (
            <Text className="text-red-500 text-sm mt-2">{errors.time}</Text>
          )}
        </View>

        {/* Label Section */}
        <View className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl p-4 mb-4 shadow-sm`}>
          <Text className={`text-lg font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Label
          </Text>
          
          <TextInput
            value={formData.label}
            onChangeText={(text) => {
              setFormData(prev => ({ ...prev, label: text }));
              if (errors.label) {
                setErrors(prev => ({ ...prev, label: '' }));
              }
            }}
            placeholder="Alarm label (optional)"
            placeholderTextColor={isDark ? '#9CA3AF' : '#6B7280'}
            className={`${isDark ? 'bg-gray-700 text-white border-gray-600' : 'bg-gray-50 text-gray-900 border-gray-200'} border rounded-lg px-4 py-3 text-lg ${errors.label ? 'border-red-500' : ''}`}
            maxLength={50}
          />
          
          {errors.label && (
            <Text className="text-red-500 text-sm mt-2">{errors.label}</Text>
          )}
        </View>

        {/* Repeat Section */}
        <View className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl p-4 mb-4 shadow-sm`}>
          <Text className={`text-lg font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Repeat
          </Text>
          
          <View className="flex-row flex-wrap justify-between">
            {daysOfWeek.map(({ key, label }) => (
              <TouchableOpacity
                key={key}
                onPress={() => handleRepeatToggle(key)}
                className={`w-12 h-12 rounded-full items-center justify-center mb-2 ${
                  formData.repeat[key]
                    ? (isDark ? 'bg-blue-600' : 'bg-blue-500')
                    : (isDark ? 'bg-gray-700 border border-gray-600' : 'bg-gray-100 border border-gray-300')
                }`}
              >
                <Text className={`font-medium ${
                  formData.repeat[key]
                    ? 'text-white'
                    : (isDark ? 'text-gray-300' : 'text-gray-700')
                }`}>
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Task Section */}
        <View className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl p-4 mb-4 shadow-sm`}>
          <Text className={`text-lg font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Dismissal Task
          </Text>
          
          {/* Task Type */}
          <View className="mb-4">
            <Text className={`font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Task Type
            </Text>
            <View className="flex-row flex-wrap">
              {(['none', 'math', 'riddle'] as const).map((type) => (
                <TouchableOpacity
                  key={type}
                  onPress={() => setFormData(prev => ({ ...prev, taskType: type }))}
                  className={`mr-3 mb-2 px-4 py-2 rounded-lg border ${
                    formData.taskType === type
                      ? (isDark ? 'bg-blue-600 border-blue-600' : 'bg-blue-500 border-blue-500')
                      : (isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-300')
                  }`}
                >
                  <Text className={`font-medium ${
                    formData.taskType === type
                      ? 'text-white'
                      : (isDark ? 'text-gray-300' : 'text-gray-700')
                  }`}>
                    {type === 'none' ? 'None' : type.charAt(0).toUpperCase() + type.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          {/* Task Difficulty */}
          {formData.taskType !== 'none' && (
            <View>
              <Text className={`font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Difficulty
              </Text>
              <View className="flex-row flex-wrap">
                {(['easy', 'medium', 'hard'] as const).map((difficulty) => (
                  <TouchableOpacity
                    key={difficulty}
                    onPress={() => setFormData(prev => ({ ...prev, taskDifficulty: difficulty }))}
                    className={`mr-3 mb-2 px-4 py-2 rounded-lg border ${
                      formData.taskDifficulty === difficulty
                        ? (isDark ? 'bg-blue-600 border-blue-600' : 'bg-blue-500 border-blue-500')
                        : (isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-300')
                    }`}
                  >
                    <Text className={`font-medium ${
                      formData.taskDifficulty === difficulty
                        ? 'text-white'
                        : (isDark ? 'text-gray-300' : 'text-gray-700')
                    }`}>
                      {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* Sound Section */}
        <View className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl p-4 mb-4 shadow-sm`}>
          <Text className={`text-lg font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Sound & Volume
          </Text>
          
          {/* Sound Selection */}
          <View className="mb-4">
            <Text className={`font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Alarm Sound
            </Text>
            <View className="flex-row flex-wrap">
              {availableSounds.map((sound) => (
                <TouchableOpacity
                  key={sound.name}
                  onPress={() => setFormData(prev => ({ ...prev, sound: sound.name }))}
                  className={`mr-3 mb-2 px-4 py-2 rounded-lg border ${
                    formData.sound === sound.name
                      ? (isDark ? 'bg-blue-600 border-blue-600' : 'bg-blue-500 border-blue-500')
                      : (isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-300')
                  }`}
                >
                  <Text className={`font-medium ${
                    formData.sound === sound.name
                      ? 'text-white'
                      : (isDark ? 'text-gray-300' : 'text-gray-700')
                  }`}>
                    {sound.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          {/* Volume Slider */}
          <View className="mb-4">
            <View className="flex-row items-center justify-between mb-2">
              <Text className={`font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Volume: {Math.round(formData.volume * 100)}%
              </Text>
              <TouchableOpacity
                onPress={handleTestSound}
                disabled={testingSound}
                className={`${testingSound ? 'bg-gray-400' : 'bg-blue-600'} rounded-lg px-3 py-1`}
              >
                <Text className="text-white text-sm font-medium">
                  {testingSound ? 'Testing...' : 'Test'}
                </Text>
              </TouchableOpacity>
            </View>
            <Slider
              style={{ width: '100%', height: 40 }}
              minimumValue={0.1}
              maximumValue={1.0}
              step={0.1}
              value={formData.volume}
              onValueChange={(volume) => setFormData(prev => ({ ...prev, volume }))}
              minimumTrackTintColor={isDark ? '#3B82F6' : '#60A5FA'}
              maximumTrackTintColor={isDark ? '#374151' : '#D1D5DB'}
              thumbTintColor={isDark ? '#60A5FA' : '#3B82F6'}
            />
          </View>
        </View>

        {/* Vibration Section */}
        <View className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl p-4 mb-4 shadow-sm`}>
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <Text className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Vibration
              </Text>
              <Text className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Vibrate device when alarm rings
              </Text>
            </View>
            
            <Switch
              value={formData.vibrate}
              onValueChange={(vibrate) => setFormData(prev => ({ ...prev, vibrate }))}
              trackColor={{ 
                false: isDark ? '#374151' : '#D1D5DB', 
                true: isDark ? '#3B82F6' : '#60A5FA' 
              }}
              thumbColor={formData.vibrate ? '#FFFFFF' : '#F3F4F6'}
            />
          </View>
        </View>
      </ScrollView>

      {/* Bottom Save Button */}
      <View className={`p-4 ${isDark ? 'bg-gray-800' : 'bg-white'} border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
        <TouchableOpacity
          onPress={handleSave}
          className="bg-blue-600 rounded-lg py-4 px-6 items-center justify-center"
        >
          <Text className="text-white text-lg font-semibold">Save Alarm</Text>
        </TouchableOpacity>
      </View>

      {/* Time Picker Modal */}
      {showTimePicker && (
        <DateTimePicker
          value={getCurrentTimeForPicker()}
          mode="time"
          is24Hour={false}
          onChange={handleTimeChange}
        />
      )}
    </SafeAreaView>
  );
}