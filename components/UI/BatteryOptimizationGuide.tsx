import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { alarmService } from '../../lib/alarmService';

interface BatteryOptimizationGuideProps {
  onClose?: () => void;
}

export default function BatteryOptimizationGuide({ onClose }: BatteryOptimizationGuideProps) {
  const [isOptimized, setIsOptimized] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    checkBatteryStatus();
  }, []);

  const checkBatteryStatus = async () => {
    try {
      const optimized = await alarmService.checkBatteryOptimization();
      setIsOptimized(optimized);
    } catch (error) {
      console.error('Failed to check battery optimization:', error);
      setIsOptimized(null);
    }
  };

  const requestExemption = async () => {
    setIsLoading(true);
    try {
      await alarmService.requestBatteryOptimizationExemption();
      Alert.alert(
        'Battery Optimization',
        'Please disable battery optimization for Alarm Buddy to ensure alarms work reliably in the background.',
        [
          {
            text: 'OK',
            onPress: () => {
              // Recheck status after user returns
              setTimeout(checkBatteryStatus, 1000);
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to open battery optimization settings.');
    } finally {
      setIsLoading(false);
    }
  };

  const openBatterySettings = async () => {
    try {
      await alarmService.requestBatteryOptimizationExemption();
      Alert.alert(
        'Battery Settings',
        'Find Alarm Buddy in the list and disable battery optimization for reliable alarm operation.',
        [
          {
            text: 'OK',
            onPress: () => {
              setTimeout(checkBatteryStatus, 1000);
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to open battery settings.');
    }
  };

  const getBatteryStatusColor = () => {
    if (isOptimized === null) return 'text-gray-500';
    return isOptimized ? 'text-green-600' : 'text-red-600';
  };

  const getBatteryStatusText = () => {
    if (isOptimized === null) return 'Checking...';
    return isOptimized ? 'Optimized (Good)' : 'Not Optimized (Needs Attention)';
  };

  const getBatteryStatusIcon = () => {
    if (isOptimized === null) return 'help-circle-outline';
    return isOptimized ? 'checkmark-circle' : 'warning';
  };

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center justify-between p-4 border-b border-gray-200">
        <Text className="text-xl font-semibold text-gray-900">Battery Optimization</Text>
        {onClose && (
          <TouchableOpacity onPress={onClose} className="p-2">
            <Ionicons name="close" size={24} color="#6B7280" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView className="flex-1 p-4">
        {/* Current Status */}
        <View className="bg-gray-50 rounded-lg p-4 mb-6">
          <View className="flex-row items-center mb-2">
            <Ionicons 
              name={getBatteryStatusIcon() as any} 
              size={24} 
              color={isOptimized ? '#059669' : '#DC2626'} 
            />
            <Text className="ml-2 text-lg font-medium text-gray-900">Current Status</Text>
          </View>
          <Text className={`text-base ${getBatteryStatusColor()}`}>
            {getBatteryStatusText()}
          </Text>
        </View>

        {/* Why This Matters */}
        <View className="mb-6">
          <Text className="text-lg font-semibold text-gray-900 mb-3">Why This Matters</Text>
          <Text className="text-gray-700 leading-6 mb-3">
            Android's battery optimization can prevent alarms from working reliably when the app is in the background or when your device is in deep sleep mode.
          </Text>
          <Text className="text-gray-700 leading-6">
            Disabling battery optimization for Alarm Buddy ensures your alarms will ring on time, even when your phone is trying to save battery.
          </Text>
        </View>

        {/* Action Buttons */}
        {!isOptimized && (
          <View className="mb-6">
            <Text className="text-lg font-semibold text-gray-900 mb-3">Recommended Actions</Text>
            
            <TouchableOpacity
              onPress={requestExemption}
              disabled={isLoading}
              className="bg-blue-600 rounded-lg p-4 mb-3 flex-row items-center justify-center"
            >
              <Ionicons name="battery-charging" size={20} color="white" />
              <Text className="text-white font-medium ml-2">
                {isLoading ? 'Opening Settings...' : 'Request Battery Exemption'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={openBatterySettings}
              className="bg-gray-600 rounded-lg p-4 flex-row items-center justify-center"
            >
              <Ionicons name="settings" size={20} color="white" />
              <Text className="text-white font-medium ml-2">Open Battery Settings</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Instructions */}
        <View className="mb-6">
          <Text className="text-lg font-semibold text-gray-900 mb-3">Step-by-Step Instructions</Text>
          
          <View className="space-y-3">
            <View className="flex-row">
              <Text className="text-blue-600 font-semibold mr-2">1.</Text>
              <Text className="text-gray-700 flex-1">Tap "Request Battery Exemption" above</Text>
            </View>
            
            <View className="flex-row">
              <Text className="text-blue-600 font-semibold mr-2">2.</Text>
              <Text className="text-gray-700 flex-1">Select "Allow" or "Don't optimize" for Alarm Buddy</Text>
            </View>
            
            <View className="flex-row">
              <Text className="text-blue-600 font-semibold mr-2">3.</Text>
              <Text className="text-gray-700 flex-1">Return to this screen to verify the change</Text>
            </View>
          </View>
        </View>

        {/* Manufacturer-Specific Notes */}
        <View className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <View className="flex-row items-center mb-2">
            <Ionicons name="warning" size={20} color="#D97706" />
            <Text className="ml-2 font-semibold text-yellow-800">Manufacturer-Specific Settings</Text>
          </View>
          <Text className="text-yellow-700 text-sm leading-5">
            Some phone manufacturers (Xiaomi, Huawei, OnePlus, Samsung) have additional battery management features. You may need to:
          </Text>
          <Text className="text-yellow-700 text-sm leading-5 mt-2">
            • Enable "Auto-start" for Alarm Buddy{"\n"}
            • Add the app to "Protected apps" list{"\n"}
            • Disable "Adaptive Battery" restrictions{"\n"}
            • Check "Background App Refresh" settings
          </Text>
        </View>

        {/* Refresh Button */}
        <TouchableOpacity
          onPress={checkBatteryStatus}
          className="bg-gray-100 rounded-lg p-4 flex-row items-center justify-center"
        >
          <Ionicons name="refresh" size={20} color="#6B7280" />
          <Text className="text-gray-700 font-medium ml-2">Refresh Status</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}