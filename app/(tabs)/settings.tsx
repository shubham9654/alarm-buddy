import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, Alert, Slider } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSettingsStore } from '../../state/settingsStore';
import { useTheme } from '../../providers/ThemeProvider';
import { useNotifications } from '../../providers/NotificationsProvider';
import { soundService } from '../../lib/sound';
import { Settings } from '../../models/settings';

export default function SettingsScreen() {
  const { theme, isDark, toggleTheme } = useTheme();
  const { hasPermission, requestPermission } = useNotifications();
  const { 
    settings, 
    updateSettings, 
    resetSettings, 
    updateSnoozeSettings, 
    updateSoundSettings, 
    updateVibrationSettings,
    isLoading 
  } = useSettingsStore();
  const [testingSound, setTestingSound] = useState(false);

  const handleThemeChange = async () => {
    await toggleTheme();
  };

  const handleTaskTypeChange = (taskType: Settings['defaultTaskType']) => {
    updateSettings({ defaultTaskType: taskType });
  };

  const handleDifficultyChange = (difficulty: Settings['defaultDifficulty']) => {
    updateSettings({ defaultDifficulty: difficulty });
  };

  const handleSnoozeToggle = (enabled: boolean) => {
    updateSnoozeSettings(enabled);
  };

  const handleSnoozeMinutesChange = (minutes: number) => {
    updateSnoozeSettings(settings.snoozeEnabled, minutes);
  };

  const handleSoundToggle = (enabled: boolean) => {
    updateSoundSettings(enabled);
  };

  const handleVolumeChange = (volume: number) => {
    updateSoundSettings(settings.soundEnabled, volume);
  };

  const handleVibrationToggle = (enabled: boolean) => {
    updateVibrationSettings(enabled);
  };

  const handleTestSound = async () => {
    if (testingSound) return;
    
    try {
      setTestingSound(true);
      await soundService.testSound('default', settings.defaultVolume);
    } catch (error) {
      Alert.alert('Error', 'Failed to test sound');
    } finally {
      setTimeout(() => setTestingSound(false), 3000);
    }
  };

  const handleResetSettings = () => {
    Alert.alert(
      'Reset Settings',
      'Are you sure you want to reset all settings to their default values?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              await resetSettings();
              Alert.alert('Success', 'Settings have been reset to defaults');
            } catch (error) {
              Alert.alert('Error', 'Failed to reset settings');
            }
          },
        },
      ]
    );
  };

  const handleRequestNotificationPermission = async () => {
    const granted = await requestPermission();
    if (!granted) {
      Alert.alert(
        'Permission Required',
        'Please enable notifications in your device settings for alarms to work properly.',
        [{ text: 'OK' }]
      );
    }
  };

  const getThemeDisplayName = (theme: Settings['theme']) => {
    switch (theme) {
      case 'light': return 'Light';
      case 'dark': return 'Dark';
      case 'system': return 'System';
      default: return 'System';
    }
  };

  return (
    <ScrollView className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <View className={`${isDark ? 'bg-gray-800' : 'bg-white'} px-4 py-6 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
        <Text className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-2`}>
          Settings
        </Text>
        <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          Customize your alarm experience
        </Text>
      </View>

      <View className="p-4">
        {/* Notifications Section */}
        <View className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl mb-6 shadow-sm`}>
          <View className="p-4 border-b border-gray-200 dark:border-gray-700">
            <Text className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Notifications
            </Text>
          </View>
          
          <View className="p-4">
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Notification Permission
                </Text>
                <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
                  {hasPermission ? 'Enabled' : 'Required for alarms to work'}
                </Text>
              </View>
              
              {!hasPermission ? (
                <TouchableOpacity
                  onPress={handleRequestNotificationPermission}
                  className="bg-blue-600 rounded-lg px-4 py-2"
                >
                  <Text className="text-white font-medium">Enable</Text>
                </TouchableOpacity>
              ) : (
                <Ionicons name="checkmark-circle" size={24} color="#10B981" />
              )}
            </View>
          </View>
        </View>

        {/* Appearance Section */}
        <View className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl mb-6 shadow-sm`}>
          <View className="p-4 border-b border-gray-200 dark:border-gray-700">
            <Text className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Appearance
            </Text>
          </View>
          
          <View className="p-4">
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Theme
                </Text>
                <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
                  Current: {getThemeDisplayName(settings.theme)}
                </Text>
              </View>
              
              <TouchableOpacity
                onPress={handleThemeChange}
                className={`${isDark ? 'bg-gray-700' : 'bg-gray-100'} rounded-lg px-4 py-2`}
              >
                <Text className={`${isDark ? 'text-gray-200' : 'text-gray-700'} font-medium`}>
                  Change
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Default Task Settings */}
        <View className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl mb-6 shadow-sm`}>
          <View className="p-4 border-b border-gray-200 dark:border-gray-700">
            <Text className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Default Task Settings
            </Text>
          </View>
          
          <View className="p-4">
            {/* Task Type */}
            <View className="mb-4">
              <Text className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'} mb-3`}>
                Default Task Type
              </Text>
              <View className="flex-row flex-wrap">
                {(['none', 'math', 'riddle'] as const).map((type) => (
                  <TouchableOpacity
                    key={type}
                    onPress={() => handleTaskTypeChange(type)}
                    className={`mr-3 mb-2 px-4 py-2 rounded-lg border ${
                      settings.defaultTaskType === type
                        ? (isDark ? 'bg-blue-600 border-blue-600' : 'bg-blue-500 border-blue-500')
                        : (isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-300')
                    }`}
                  >
                    <Text className={`font-medium ${
                      settings.defaultTaskType === type
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
            <View>
              <Text className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'} mb-3`}>
                Default Difficulty
              </Text>
              <View className="flex-row flex-wrap">
                {(['easy', 'medium', 'hard'] as const).map((difficulty) => (
                  <TouchableOpacity
                    key={difficulty}
                    onPress={() => handleDifficultyChange(difficulty)}
                    className={`mr-3 mb-2 px-4 py-2 rounded-lg border ${
                      settings.defaultDifficulty === difficulty
                        ? (isDark ? 'bg-blue-600 border-blue-600' : 'bg-blue-500 border-blue-500')
                        : (isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-300')
                    }`}
                  >
                    <Text className={`font-medium ${
                      settings.defaultDifficulty === difficulty
                        ? 'text-white'
                        : (isDark ? 'text-gray-300' : 'text-gray-700')
                    }`}>
                      {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </View>

        {/* Snooze Settings */}
        <View className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl mb-6 shadow-sm`}>
          <View className="p-4 border-b border-gray-200 dark:border-gray-700">
            <Text className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Snooze Settings
            </Text>
          </View>
          
          <View className="p-4">
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-1">
                <Text className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Enable Snooze
                </Text>
                <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
                  Allow snoozing alarms
                </Text>
              </View>
              
              <Switch
                value={settings.snoozeEnabled}
                onValueChange={handleSnoozeToggle}
                trackColor={{ 
                  false: isDark ? '#374151' : '#D1D5DB', 
                  true: isDark ? '#3B82F6' : '#60A5FA' 
                }}
                thumbColor={settings.snoozeEnabled ? '#FFFFFF' : '#F3F4F6'}
                disabled={isLoading}
              />
            </View>
            
            {settings.snoozeEnabled && (
              <View>
                <Text className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'} mb-3`}>
                  Snooze Duration: {settings.snoozeMinutes} minutes
                </Text>
                <Slider
                  style={{ width: '100%', height: 40 }}
                  minimumValue={1}
                  maximumValue={30}
                  step={1}
                  value={settings.snoozeMinutes}
                  onValueChange={handleSnoozeMinutesChange}
                  minimumTrackTintColor={isDark ? '#3B82F6' : '#60A5FA'}
                  maximumTrackTintColor={isDark ? '#374151' : '#D1D5DB'}
                  thumbTintColor={isDark ? '#60A5FA' : '#3B82F6'}
                />
              </View>
            )}
          </View>
        </View>

        {/* Audio Settings */}
        <View className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl mb-6 shadow-sm`}>
          <View className="p-4 border-b border-gray-200 dark:border-gray-700">
            <Text className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Audio Settings
            </Text>
          </View>
          
          <View className="p-4">
            {/* Sound Toggle */}
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-1">
                <Text className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Sound Enabled
                </Text>
                <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
                  Play sound for alarms
                </Text>
              </View>
              
              <Switch
                value={settings.soundEnabled}
                onValueChange={handleSoundToggle}
                trackColor={{ 
                  false: isDark ? '#374151' : '#D1D5DB', 
                  true: isDark ? '#3B82F6' : '#60A5FA' 
                }}
                thumbColor={settings.soundEnabled ? '#FFFFFF' : '#F3F4F6'}
                disabled={isLoading}
              />
            </View>
            
            {/* Volume Slider */}
            {settings.soundEnabled && (
              <View className="mb-4">
                <View className="flex-row items-center justify-between mb-3">
                  <Text className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Default Volume: {Math.round(settings.defaultVolume * 100)}%
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
                  value={settings.defaultVolume}
                  onValueChange={handleVolumeChange}
                  minimumTrackTintColor={isDark ? '#3B82F6' : '#60A5FA'}
                  maximumTrackTintColor={isDark ? '#374151' : '#D1D5DB'}
                  thumbTintColor={isDark ? '#60A5FA' : '#3B82F6'}
                />
              </View>
            )}
            
            {/* Vibration Toggle */}
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Vibration
                </Text>
                <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
                  Vibrate device for alarms
                </Text>
              </View>
              
              <Switch
                value={settings.vibrationEnabled}
                onValueChange={handleVibrationToggle}
                trackColor={{ 
                  false: isDark ? '#374151' : '#D1D5DB', 
                  true: isDark ? '#3B82F6' : '#60A5FA' 
                }}
                thumbColor={settings.vibrationEnabled ? '#FFFFFF' : '#F3F4F6'}
                disabled={isLoading}
              />
            </View>
          </View>
        </View>

        {/* Reset Settings */}
        <View className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl mb-6 shadow-sm`}>
          <View className="p-4">
            <TouchableOpacity
              onPress={handleResetSettings}
              className="flex-row items-center justify-center py-2"
            >
              <Ionicons 
                name="refresh" 
                size={20} 
                color={isDark ? '#F87171' : '#DC2626'} 
              />
              <Text className={`${isDark ? 'text-red-400' : 'text-red-600'} font-medium ml-2`}>
                Reset All Settings
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* App Info */}
        <View className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-sm`}>
          <View className="p-4">
            <Text className={`text-center ${isDark ? 'text-gray-400' : 'text-gray-500'} text-sm`}>
              Alarm Buddy v{settings.version}
            </Text>
            <Text className={`text-center ${isDark ? 'text-gray-500' : 'text-gray-400'} text-xs mt-1`}>
              Wake up with purpose
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}