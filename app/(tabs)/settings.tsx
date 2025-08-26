import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSettingsStore } from '../../state/settingsStore';
import { useTheme } from '../../providers/ThemeProvider';
import { useNotifications } from '../../providers/NotificationsProvider';
import { soundService } from '../../lib/sound';
import { Settings } from '../../models/settings';
import BatteryOptimizationGuide from '../../components/UI/BatteryOptimizationGuide';
import { alarmService } from '../../lib/alarmService';

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
  const [showBatteryGuide, setShowBatteryGuide] = useState(false);
  const [isBatteryOptimized, setIsBatteryOptimized] = useState(true);

  useEffect(() => {
    checkBatteryOptimization();
  }, []);

  const checkBatteryOptimization = async () => {
    try {
      const isOptimized = await alarmService.checkBatteryOptimization();
      setIsBatteryOptimized(isOptimized);
    } catch (error) {
      console.error('Failed to check battery optimization:', error);
    }
  };

  const handleBatteryOptimizationRequest = async () => {
    try {
      await alarmService.requestBatteryOptimizationExemption();
      // Recheck status after request
      await checkBatteryOptimization();
    } catch (error) {
      console.error('Failed to request battery optimization exemption:', error);
      Alert.alert('Error', 'Failed to open battery optimization settings');
    }
  };

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
    const validMinutes = minutes as 5 | 10 | 15;
    updateSnoozeSettings(settings.snoozeEnabled, validMinutes);
  };

  const handleSoundToggle = (enabled: boolean) => {
    updateSoundSettings(enabled);
  };

  const handleVolumeChange = (volume: number) => {
    updateSoundSettings(settings.soundEnabled, volume, settings.soundName);
  };

  const handleSoundChange = (soundName: string) => {
    updateSoundSettings(settings.soundEnabled, settings.defaultVolume, soundName as Settings['soundName']);
  };

  const handleVibrationToggle = (enabled: boolean) => {
    updateVibrationSettings(enabled);
  };

  const handleVibrationPatternChange = (pattern: Settings['vibrationPattern']) => {
    updateVibrationSettings(settings.vibrationEnabled, pattern);
  };

  const handleTestSound = async () => {
    if (testingSound) return;
    
    setTestingSound(true);
    try {
      await soundService.testSound(settings.soundName, settings.defaultVolume);
    } catch (error) {
      console.error('Error testing sound:', error);
    } finally {
      setTimeout(() => setTestingSound(false), 3000);
    }
  };

  const handleNotificationPermission = async () => {
    if (!hasPermission) {
      const granted = await requestPermission();
      if (!granted) {
        Alert.alert(
          'Permission Required',
          'Notifications are required for alarms to work properly. Please enable them in your device settings.',
          [{ text: 'OK' }]
        );
      }
    }
  };

  const handleResetSettings = () => {
    Alert.alert(
      'Reset Settings',
      'Are you sure you want to reset all settings to default values?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Reset', 
          style: 'destructive',
          onPress: () => resetSettings()
        }
      ]
    );
  };

  const getThemeDisplayName = (theme: string) => {
    switch (theme) {
      case 'light': return 'Light';
      case 'dark': return 'Dark';
      case 'system': return 'System';
      default: return 'System';
    }
  };

  return (
    <SafeAreaView className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <ScrollView className="flex-1">
        {/* Header */}
        <View className={`${isDark ? 'bg-gray-800' : 'bg-white'} px-4 py-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
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
              <TouchableOpacity 
                onPress={handleNotificationPermission}
                className="flex-row items-center justify-between py-3"
              >
                <View className="flex-row items-center flex-1">
                  <Ionicons 
                    name={hasPermission ? "notifications" : "notifications-off"} 
                    size={20} 
                    color={hasPermission ? (isDark ? "#10b981" : "#059669") : (isDark ? "#ef4444" : "#dc2626")} 
                  />
                  <View className="ml-3 flex-1">
                    <Text className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      Notification Permission
                    </Text>
                    <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {hasPermission ? 'Enabled' : 'Tap to enable'}
                    </Text>
                  </View>
                </View>
                <Ionicons 
                  name="chevron-forward" 
                  size={20} 
                  color={isDark ? "#6b7280" : "#9ca3af"} 
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Battery Optimization Section */}
          <View className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl mb-6 shadow-sm`}>
            <View className="p-4 border-b border-gray-200 dark:border-gray-700">
              <Text className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Battery & Performance
              </Text>
            </View>
            
            <View className="p-4 space-y-4">
              <View className="py-2">
                <View className="flex-row items-center justify-between mb-2">
                  <Text className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Battery Optimization Status
                  </Text>
                  <View className={`px-3 py-1 rounded-full ${
                    isBatteryOptimized 
                      ? 'bg-red-100 border border-red-200' 
                      : 'bg-green-100 border border-green-200'
                  }`}>
                    <Text className={`text-xs font-medium ${
                      isBatteryOptimized ? 'text-red-800' : 'text-green-800'
                    }`}>
                      {isBatteryOptimized ? 'Enabled' : 'Disabled'}
                    </Text>
                  </View>
                </View>
                
                <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} mb-3`}>
                  {isBatteryOptimized 
                    ? 'Battery optimization may prevent alarms from working reliably' 
                    : 'Battery optimization is disabled - alarms should work reliably'
                  }
                </Text>
                
                {isBatteryOptimized && (
                  <TouchableOpacity
                    onPress={handleBatteryOptimizationRequest}
                    className="bg-blue-500 px-4 py-2 rounded-lg mb-3"
                  >
                    <Text className="text-white font-medium text-center">
                      Disable Battery Optimization
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
              
              <TouchableOpacity 
                onPress={() => setShowBatteryGuide(true)}
                className="flex-row items-center justify-between py-3"
              >
                <View className="flex-row items-center flex-1">
                  <Ionicons 
                    name="battery-charging" 
                    size={20} 
                    color={isDark ? "#10b981" : "#059669"} 
                  />
                  <View className="ml-3 flex-1">
                    <Text className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      Battery Optimization Guide
                    </Text>
                    <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      Learn how to ensure your alarms work reliably
                    </Text>
                  </View>
                </View>
                <Ionicons 
                  name="chevron-forward" 
                  size={20} 
                  color={isDark ? "#6b7280" : "#9ca3af"} 
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Sound Settings */}
          <View className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl mb-6 shadow-sm`}>
            <View className="p-4 border-b border-gray-200 dark:border-gray-700">
              <Text className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Sound
              </Text>
            </View>
            
            <View className="p-4 space-y-4">
              <View className="flex-row items-center justify-between py-2">
                <View className="flex-1">
                  <Text className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Enable Sound
                  </Text>
                  <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    Play sound when alarm goes off
                  </Text>
                </View>
                <Switch
                  value={settings.soundEnabled}
                  onValueChange={handleSoundToggle}
                  trackColor={{ false: isDark ? '#374151' : '#f3f4f6', true: '#10b981' }}
                  thumbColor={settings.soundEnabled ? '#ffffff' : '#9ca3af'}
                />
              </View>

              {settings.soundEnabled && (
                <>
                  <View className="py-2">
                    <Text className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'} mb-3`}>
                      Alarm Sound
                    </Text>
                    <View className="space-y-2">
                      {['default', 'gentle', 'nature', 'electronic'].map((sound) => (
                        <TouchableOpacity
                          key={sound}
                          onPress={() => handleSoundChange(sound)}
                          className={`flex-row items-center justify-between p-3 rounded-lg mb-2 ${
                            settings.soundName === sound 
                              ? (isDark ? 'bg-blue-900/30 border border-blue-500' : 'bg-blue-50 border border-blue-200')
                              : (isDark ? 'bg-gray-700' : 'bg-gray-50')
                          }`}
                        >
                          <Text className={`capitalize ${
                            settings.soundName === sound 
                              ? (isDark ? 'text-blue-400' : 'text-blue-600')
                              : (isDark ? 'text-gray-300' : 'text-gray-700')
                          }`}>
                            {sound}
                          </Text>
                          {settings.soundName === sound && (
                            <Ionicons 
                              name="checkmark-circle" 
                              size={20} 
                              color={isDark ? "#60a5fa" : "#3b82f6"} 
                            />
                          )}
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  <View className="py-2">
                    <View className="flex-row items-center justify-between mb-3">
                      <Text className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        Volume: {Math.round(settings.defaultVolume * 100)}%
                      </Text>
                      <TouchableOpacity
                        onPress={handleTestSound}
                        disabled={testingSound}
                        className={`px-3 py-1 rounded-lg ${
                          testingSound 
                            ? (isDark ? 'bg-gray-700' : 'bg-gray-200')
                            : (isDark ? 'bg-blue-600' : 'bg-blue-500')
                        }`}
                      >
                        <Text className={`text-sm ${
                          testingSound 
                            ? (isDark ? 'text-gray-400' : 'text-gray-500')
                            : 'text-white'
                        }`}>
                          {testingSound ? 'Playing...' : 'Test'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                    <View className={`h-2 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                      <View 
                        className="h-full bg-blue-500 rounded-full" 
                        style={{ width: `${settings.defaultVolume * 100}%` }}
                      />
                    </View>
                    <View className="flex-row justify-between mt-2">
                      {[0.2, 0.4, 0.6, 0.8, 1.0].map((vol) => (
                        <TouchableOpacity
                          key={vol}
                          onPress={() => handleVolumeChange(vol)}
                          className={`w-8 h-8 rounded-full items-center justify-center ${
                            Math.abs(settings.defaultVolume - vol) < 0.01
                              ? (isDark ? 'bg-blue-600' : 'bg-blue-500')
                              : (isDark ? 'bg-gray-700' : 'bg-gray-200')
                          }`}
                        >
                          <Text className={`text-xs ${
                            Math.abs(settings.defaultVolume - vol) < 0.01
                              ? 'text-white'
                              : (isDark ? 'text-gray-400' : 'text-gray-600')
                          }`}>
                            {Math.round(vol * 100)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </>
              )}
            </View>
          </View>

          {/* Vibration Settings */}
          <View className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl mb-6 shadow-sm`}>
            <View className="p-4 border-b border-gray-200 dark:border-gray-700">
              <Text className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Vibration
              </Text>
            </View>
            
            <View className="p-4 space-y-4">
              <View className="flex-row items-center justify-between py-2">
                <View className="flex-1">
                  <Text className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Enable Vibration
                  </Text>
                  <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    Vibrate when alarm goes off
                  </Text>
                </View>
                <Switch
                  value={settings.vibrationEnabled}
                  onValueChange={handleVibrationToggle}
                  trackColor={{ false: isDark ? '#374151' : '#f3f4f6', true: '#10b981' }}
                  thumbColor={settings.vibrationEnabled ? '#ffffff' : '#9ca3af'}
                />
              </View>

              {settings.vibrationEnabled && (
                <View className="py-2">
                  <Text className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'} mb-3`}>
                    Vibration Pattern
                  </Text>
                  <View className="space-y-2">
                    {[
                      { key: 'short', label: 'Short', description: 'Quick vibration' },
                      { key: 'long', label: 'Long', description: 'Extended vibration' },
                      { key: 'pattern', label: 'Pattern', description: 'Rhythmic vibration' }
                    ].map((pattern) => (
                      <TouchableOpacity
                        key={pattern.key}
                        onPress={() => handleVibrationPatternChange(pattern.key as Settings['vibrationPattern'])}
                        className={`flex-row items-center justify-between p-3 rounded-lg mb-2 ${
                          settings.vibrationPattern === pattern.key 
                            ? (isDark ? 'bg-blue-900/30 border border-blue-500' : 'bg-blue-50 border border-blue-200')
                            : (isDark ? 'bg-gray-700' : 'bg-gray-50')
                        }`}
                      >
                        <View>
                          <Text className={`font-medium ${
                            settings.vibrationPattern === pattern.key 
                              ? (isDark ? 'text-blue-400' : 'text-blue-600')
                              : (isDark ? 'text-gray-300' : 'text-gray-700')
                          }`}>
                            {pattern.label}
                          </Text>
                          <Text className={`text-sm ${
                            settings.vibrationPattern === pattern.key 
                              ? (isDark ? 'text-blue-300' : 'text-blue-500')
                              : (isDark ? 'text-gray-400' : 'text-gray-500')
                          }`}>
                            {pattern.description}
                          </Text>
                        </View>
                        {settings.vibrationPattern === pattern.key && (
                          <Ionicons 
                            name="checkmark-circle" 
                            size={20} 
                            color={isDark ? "#60a5fa" : "#3b82f6"} 
                          />
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            </View>
          </View>

          {/* Snooze Settings */}
          <View className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl mb-6 shadow-sm`}>
            <View className="p-4 border-b border-gray-200 dark:border-gray-700">
              <Text className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Snooze
              </Text>
            </View>
            
            <View className="p-4 space-y-4">
              <View className="flex-row items-center justify-between py-2">
                <View className="flex-1">
                  <Text className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Enable Snooze
                  </Text>
                  <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    Allow snoozing alarms
                  </Text>
                </View>
                <Switch
                  value={settings.snoozeEnabled}
                  onValueChange={handleSnoozeToggle}
                  trackColor={{ false: isDark ? '#374151' : '#f3f4f6', true: '#10b981' }}
                  thumbColor={settings.snoozeEnabled ? '#ffffff' : '#9ca3af'}
                />
              </View>

              {settings.snoozeEnabled && (
                <View className="py-2">
                  <Text className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'} mb-3`}>
                    Snooze Duration
                  </Text>
                  <View className="flex-row gap-3">
                    {[5, 10, 15].map((minutes) => (
                      <TouchableOpacity
                        key={minutes}
                        onPress={() => handleSnoozeMinutesChange(minutes)}
                        className={`flex-1 p-3 rounded-lg items-center mx-1 ${
                          settings.snoozeMinutes === minutes 
                            ? (isDark ? 'bg-blue-600' : 'bg-blue-500')
                            : (isDark ? 'bg-gray-700' : 'bg-gray-100')
                        }`}
                      >
                        <Text className={`font-medium ${
                          settings.snoozeMinutes === minutes 
                            ? 'text-white'
                            : (isDark ? 'text-gray-300' : 'text-gray-700')
                        }`}>
                          {minutes}m
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            </View>
          </View>

          {/* Default Task Settings */}
          <View className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl mb-6 shadow-sm`}>
            <View className="p-4 border-b border-gray-200 dark:border-gray-700">
              <Text className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Default Task Settings
              </Text>
            </View>
            
            <View className="p-4 space-y-6">
              <View>
                <Text className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'} mb-3`}>
                  Task Type
                </Text>
                <View className="space-y-2">
                  {[
                    { key: 'math', label: 'Math Problems', description: 'Solve arithmetic questions' },
                    { key: 'memory', label: 'Memory Game', description: 'Remember sequences' },
                    { key: 'typing', label: 'Typing Challenge', description: 'Type given text' }
                  ].map((task) => (
                    <TouchableOpacity
                      key={task.key}
                      onPress={() => handleTaskTypeChange(task.key as Settings['defaultTaskType'])}
                      className={`flex-row items-center justify-between p-3 rounded-lg mb-2 ${
                        settings.defaultTaskType === task.key 
                          ? (isDark ? 'bg-blue-900/30 border border-blue-500' : 'bg-blue-50 border border-blue-200')
                          : (isDark ? 'bg-gray-700' : 'bg-gray-50')
                      }`}
                    >
                      <View>
                        <Text className={`font-medium ${
                          settings.defaultTaskType === task.key 
                            ? (isDark ? 'text-blue-400' : 'text-blue-600')
                            : (isDark ? 'text-gray-300' : 'text-gray-700')
                        }`}>
                          {task.label}
                        </Text>
                        <Text className={`text-sm ${
                          settings.defaultTaskType === task.key 
                            ? (isDark ? 'text-blue-300' : 'text-blue-500')
                            : (isDark ? 'text-gray-400' : 'text-gray-500')
                        }`}>
                          {task.description}
                        </Text>
                      </View>
                      {settings.defaultTaskType === task.key && (
                        <Ionicons 
                          name="checkmark-circle" 
                          size={20} 
                          color={isDark ? "#60a5fa" : "#3b82f6"} 
                        />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View>
                <Text className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'} mb-3`}>
                  Difficulty Level
                </Text>
                <View className="flex-row gap-3">
                  {[
                    { key: 'easy', label: 'Easy', color: 'green' },
                    { key: 'medium', label: 'Medium', color: 'yellow' },
                    { key: 'hard', label: 'Hard', color: 'red' }
                  ].map((difficulty) => (
                    <TouchableOpacity
                      key={difficulty.key}
                      onPress={() => handleDifficultyChange(difficulty.key as Settings['defaultDifficulty'])}
                      className={`flex-1 p-3 rounded-lg items-center mx-1 ${
                        settings.defaultDifficulty === difficulty.key 
                          ? (difficulty.color === 'green' ? (isDark ? 'bg-green-600' : 'bg-green-500') :
                             difficulty.color === 'yellow' ? (isDark ? 'bg-yellow-600' : 'bg-yellow-500') :
                             (isDark ? 'bg-red-600' : 'bg-red-500'))
                          : (isDark ? 'bg-gray-700' : 'bg-gray-100')
                      }`}
                    >
                      <Text className={`font-medium ${
                        settings.defaultDifficulty === difficulty.key 
                          ? 'text-white'
                          : (isDark ? 'text-gray-300' : 'text-gray-700')
                      }`}>
                        {difficulty.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          </View>

          {/* Theme Settings */}
          <View className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl mb-6 shadow-sm`}>
            <View className="p-4 border-b border-gray-200 dark:border-gray-700">
              <Text className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Appearance
              </Text>
            </View>
            
            <View className="p-4">
              <TouchableOpacity 
                onPress={handleThemeChange}
                className="flex-row items-center justify-between py-3"
              >
                <View className="flex-row items-center flex-1">
                  <Ionicons 
                    name={isDark ? "moon" : "sunny"} 
                    size={20} 
                    color={isDark ? "#fbbf24" : "#f59e0b"} 
                  />
                  <View className="ml-3 flex-1">
                    <Text className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      Theme
                    </Text>
                    <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {getThemeDisplayName(theme)}
                    </Text>
                  </View>
                </View>
                <Ionicons 
                  name="chevron-forward" 
                  size={20} 
                  color={isDark ? "#6b7280" : "#9ca3af"} 
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Reset Settings */}
          <View className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl mb-6 shadow-sm`}>
            <View className="p-4">
              <TouchableOpacity
                onPress={handleResetSettings}
                className="flex-row items-center justify-center py-3"
              >
                <Ionicons
                  name="refresh"
                  size={20}
                  color={isDark ? "#ef4444" : "#dc2626"}
                />
                <Text className={`ml-2 font-medium ${isDark ? 'text-red-400' : 'text-red-600'}`}>
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
      
      {/* Battery Optimization Guide Modal */}
      <Modal
        visible={showBatteryGuide}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowBatteryGuide(false)}
      >
        <BatteryOptimizationGuide onClose={() => setShowBatteryGuide(false)} />
      </Modal>
    </SafeAreaView>
  );
}