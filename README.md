# Alarm Buddy 🔔

A modern, feature-rich alarm clock app built with React Native and Expo. Wake up with style and challenge your mind with built-in tasks!

## ✨ Features

### 🎯 Smart Alarm System
- **Multiple Alarms**: Create and manage unlimited alarms
- **Custom Labels**: Personalize each alarm with meaningful names
- **Flexible Scheduling**: One-time or recurring alarms with day-specific settings
- **Smart Snoozing**: Configurable snooze duration (5, 10, or 15 minutes)

### 🧠 Wake-Up Challenges
- **Math Problems**: Solve arithmetic challenges to dismiss alarms
- **Riddles**: Answer brain teasers to prove you're awake
- **Difficulty Levels**: Easy, Medium, and Hard challenges
- **Optional Tasks**: Choose "none" for traditional alarm dismissal

### 🎨 Beautiful UI/UX
- **Dark/Light Theme**: Automatic system theme detection with manual toggle
- **Modern Design**: Clean, intuitive interface with smooth animations
- **Responsive Layout**: Optimized for all screen sizes
- **Accessibility**: Built with accessibility best practices

### 🔧 Customization
- **Sound Selection**: Choose from various alarm tones
- **Volume Control**: Adjustable alarm volume (30%, 50%, 70%, 100%)
- **Vibration**: Toggle vibration on/off
- **Notification Permissions**: Smart permission handling

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Expo CLI
- iOS Simulator or Android Emulator (optional)
- Expo Go app on your mobile device (for testing)

### Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Start the development server**
   ```bash
   npx expo start
   ```

3. **Run on device/simulator**
   - Scan the QR code with Expo Go (mobile)
   - Press `a` for Android emulator
   - Press `i` for iOS simulator
   - Press `w` for web browser

## 📱 Tech Stack

- **React Native & Expo SDK 52**: Cross-platform development
- **TypeScript**: Type-safe JavaScript
- **Expo Router**: File-based navigation
- **NativeWind**: Tailwind CSS for React Native
- **Zustand**: State management
- **AsyncStorage**: Persistent storage
- **Zod**: Runtime type validation
- **Expo Notifications**: Alarm scheduling
- **Expo AV**: Audio playback

## 🎮 Usage Guide

### Creating an Alarm
1. Navigate to the **Alarms** tab
2. Tap the **+** button
3. Configure time, label, repeat days, and wake-up tasks
4. Save your alarm

### Wake-Up Tasks
- **Math Problems**: Solve arithmetic based on difficulty
- **Riddles**: Answer brain teasers
- **None**: Traditional alarm dismissal

## 🔧 Development

```bash
npm start          # Start development server
npm run android    # Run on Android
npm run ios        # Run on iOS
npm run web        # Run in browser
npx tsc --noEmit   # Type checking
```

---

**Made with ❤️ using React Native and Expo**