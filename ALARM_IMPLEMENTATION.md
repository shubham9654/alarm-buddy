# Alarm Implementation Documentation

This document outlines the enhanced alarm functionality implementation for the Alarm Buddy app, including persistent alarms, background operation, and native Android features.

## Overview

The alarm system has been enhanced with the following key features:
- **Persistent alarm playback** that continues until dismissed or snoozed
- **Background operation** using Android foreground services
- **Interactive notifications** with Dismiss and Snooze action buttons
- **Boot receiver** to re-register alarms after device reboot
- **Battery optimization handling** for reliable alarm operation
- **Keep-awake functionality** to prevent screen lock during alarms

## Required Permissions

The following permissions have been added to `android/app/src/main/AndroidManifest.xml`:

### Core Alarm Permissions
```xml
<uses-permission android:name="android.permission.VIBRATE" />
<uses-permission android:name="android.permission.WAKE_LOCK" />
<uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM" />
<uses-permission android:name="android.permission.USE_EXACT_ALARM" />
<uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />
```

### Background Operation Permissions
```xml
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK" />
<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
```

### Battery Optimization Permissions
```xml
<uses-permission android:name="android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS" />
<uses-permission android:name="android.permission.SYSTEM_ALERT_WINDOW" />
```

## Native Android Components

### 1. AlarmForegroundService
**Location**: `android/app/src/main/java/com/alarmbuddyapp/AlarmForegroundService.java`

- Ensures alarm functionality works in the background
- Creates a persistent notification for the service
- Automatically restarts if killed by the system
- Uses `mediaPlayback` foreground service type

### 2. BootReceiver
**Location**: `android/app/src/main/java/com/alarmbuddyapp/BootReceiver.java`

- Listens for device boot completion
- Automatically starts the foreground service after reboot
- Re-launches the app to re-register scheduled alarms
- Handles package replacement events

### 3. AlarmServiceModule
**Location**: `android/app/src/main/java/com/alarmbuddyapp/AlarmServiceModule.java`

- React Native bridge for native alarm functionality
- Provides methods for:
  - Starting/stopping foreground service
  - Checking battery optimization status
  - Requesting battery optimization exemption
  - Opening battery optimization settings

### 4. AlarmServicePackage
**Location**: `android/app/src/main/java/com/alarmbuddyapp/AlarmServicePackage.java`

- Registers the native module with React Native
- Added to `MainApplication.kt` packages list

## Enhanced React Native Components

### 1. Sound Service (`lib/sound.ts`)
**New Features**:
- `playPersistentAlarm()` method for continuous playback
- Aggressive audio mode configuration
- Automatic restart on playback interruption
- Higher minimum volume for persistent alarms
- Audio ducking prevention on Android

### 2. Notification Service (`lib/notifications.ts`)
**New Features**:
- Interactive notification categories with action buttons
- `handleNotificationAction()` for processing dismiss/snooze
- Enhanced notification content with alarm type identification
- Proper action button configuration

### 3. Alarm Ring Screen (`app/alarm/ring.tsx`)
**New Features**:
- `expo-keep-awake` integration to prevent screen lock
- Persistent alarm playback usage
- More aggressive vibration patterns
- Automatic keep-awake deactivation on alarm stop

### 4. Notifications Provider (`providers/NotificationsProvider.tsx`)
**New Features**:
- Alarm service initialization on app start
- Enhanced action handling with settings integration
- Proper snooze duration from user settings

### 5. Alarm Service (`lib/alarmService.ts`)
**New Features**:
- TypeScript interface for native module
- Battery optimization checking and management
- Foreground service lifecycle management
- Initialization helper methods

## Dependencies Added

```json
{
  "expo-keep-awake": "^12.8.2"
}
```

## Build Steps

### 1. Install Dependencies
```bash
npm install expo-keep-awake
```

### 2. Prebuild Android Project
```bash
npx expo prebuild --platform android --clean
```

### 3. Build APK
```bash
cd android
./gradlew assembleRelease
```

### 4. Install APK
```bash
adb install app/build/outputs/apk/release/app-release.apk
```

## Testing Checklist

### Basic Functionality
- [ ] Alarms trigger at scheduled time
- [ ] Sound plays continuously until dismissed
- [ ] Vibration works with sound
- [ ] Screen stays awake during alarm

### Background Operation
- [ ] Alarms work when app is in background
- [ ] Alarms work when app is killed
- [ ] Foreground service notification appears
- [ ] Service restarts after being killed

### Interactive Notifications
- [ ] Notification shows Dismiss and Snooze buttons
- [ ] Dismiss button stops the alarm
- [ ] Snooze button schedules new alarm
- [ ] Tapping notification opens alarm screen

### Device Integration
- [ ] Alarms work after device reboot
- [ ] Battery optimization exemption can be requested
- [ ] App handles Doze mode appropriately

## Known Limitations

### Android Doze Mode
- Android 6.0+ may still delay alarms in deep sleep
- Battery optimization exemption helps but doesn't guarantee 100% reliability
- Users should manually whitelist the app in battery settings

### Manufacturer Restrictions
- Some manufacturers (Xiaomi, Huawei, OnePlus) have aggressive battery management
- May require additional manufacturer-specific settings
- Auto-start permissions may need to be enabled manually

### Development vs Production
- Native modules only work in production builds
- Use `expo run:android` or built APK for testing
- Development mode may show warnings about missing native modules

## User Instructions

For optimal alarm reliability, users should:

1. **Grant all permissions** when prompted
2. **Disable battery optimization** for the app
3. **Enable auto-start** (manufacturer-specific)
4. **Keep the app in recent apps** when possible
5. **Avoid force-closing** the app

## Troubleshooting

### Alarms Not Working in Background
1. Check if foreground service is running
2. Verify battery optimization is disabled
3. Check manufacturer-specific battery settings
4. Ensure exact alarm permission is granted

### Sound Not Playing
1. Check device volume settings
2. Verify Do Not Disturb mode settings
3. Test with different alarm sounds
4. Check audio focus and ducking settings

### Notifications Not Showing Actions
1. Verify notification categories are registered
2. Check notification channel settings
3. Ensure app has notification permissions
4. Test on different Android versions

## Future Enhancements

- **Smart alarm detection** using device sensors
- **Gradual volume increase** for gentler wake-up
- **Sleep cycle integration** for optimal wake times
- **Multiple snooze options** with different durations
- **Alarm analytics** and reliability reporting