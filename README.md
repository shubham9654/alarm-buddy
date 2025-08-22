# Alarm Buddy 🔔

A smart alarm clock app built with React Native and Expo that helps you wake up with purpose through interactive task-based dismissal.

## Features ✨

### 🎯 Smart Alarm Management
- Create multiple alarms with custom labels
- Flexible repeat scheduling (daily, weekdays, weekends, custom)
- Easy toggle on/off functionality
- Visual time-until-alarm countdown

### 🧠 Task-Based Dismissal
- **Math Problems**: Solve arithmetic challenges to dismiss alarms
- **Riddles**: Answer brain teasers to wake up your mind
- **Difficulty Levels**: Easy, Medium, Hard for both task types
- **No Task Option**: Traditional alarm dismissal available

### 🎨 Modern UI/UX
- **Dark/Light Theme**: Automatic system theme detection with manual override
- **Intuitive Navigation**: Tab-based navigation with Expo Router
- **Responsive Design**: Optimized for various screen sizes
- **Smooth Animations**: Polished user interactions

### 🔊 Audio & Notifications
- **Multiple Alarm Sounds**: Choose from various built-in tones
- **Volume Control**: Adjustable alarm volume with test functionality
- **Vibration Support**: Optional device vibration
- **Background Notifications**: Reliable alarm triggering even when app is closed

### ⚙️ Customizable Settings
- **Snooze Configuration**: Enable/disable with custom duration (1-30 minutes)
- **Default Preferences**: Set default task types and difficulty levels
- **Audio Settings**: Global sound and vibration preferences
- **Theme Management**: Light, dark, or system theme options

## Tech Stack 🛠️

- **Framework**: React Native with Expo SDK 51+
- **Navigation**: Expo Router (file-based routing)
- **Styling**: NativeWind (Tailwind CSS for React Native)
- **State Management**: Zustand
- **Data Validation**: Zod schemas
- **Storage**: AsyncStorage
- **Audio**: expo-av
- **Notifications**: expo-notifications
- **TypeScript**: Full type safety

## Project Structure 📁

```
alarm-buddy-app/
├── app/                          # Expo Router pages
│   ├── (tabs)/                   # Tab navigation
│   │   ├── _layout.tsx          # Tab layout configuration
│   │   ├── index.tsx            # Home screen
│   │   ├── alarms.tsx           # Alarms management
│   │   └── settings.tsx         # App settings
│   ├── alarm/                    # Alarm-specific screens
│   │   └── ring.tsx             # Alarm ring screen
│   └── _layout.tsx              # Root layout
├── components/                   # Reusable components
│   ├── UI/                      # UI components
│   │   ├── AlarmCard.tsx        # Alarm display card
│   │   └── AlarmForm.tsx        # Alarm creation/editing form
│   └── tasks/                   # Task components
│       ├── MathTask.tsx         # Math problem component
│       └── RiddleTask.tsx       # Riddle component
├── lib/                         # Utility libraries
│   ├── notifications.ts        # Notification service
│   ├── sound.ts                # Audio service
│   ├── storage.ts              # AsyncStorage utilities
│   └── time.ts                 # Time/date utilities
├── models/                      # Data models
│   ├── alarm.ts                # Alarm schema and types
│   └── settings.ts             # Settings schema and types
├── providers/                   # React context providers
│   ├── NotificationsProvider.tsx
│   ├── StoreProvider.tsx
│   └── ThemeProvider.tsx
├── state/                       # Zustand stores
│   ├── alarmStore.ts           # Alarm state management
│   └── settingsStore.ts        # Settings state management
└── assets/                      # Static assets
    ├── fonts/                   # Custom fonts
    ├── icons/                   # App icons
    └── sounds/                  # Alarm sound files
```

## Getting Started 🚀

### Prerequisites

- Node.js (v18 or later)
- npm or yarn
- Expo CLI (`npm install -g @expo/cli`)
- iOS Simulator (for iOS development) or Android Studio (for Android development)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd alarm-buddy-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npx expo start
   ```

4. **Run on device/simulator**
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Scan QR code with Expo Go app on physical device

### Configuration

#### Notification Permissions
The app requires notification permissions to function properly. On first launch:
- iOS: System will prompt for permission automatically
- Android: Permission is granted by default

#### Sound Files
Replace placeholder sound files in `assets/sounds/` with actual MP3 files:
- `default-alarm.mp3`
- `gentle-alarm.mp3`
- `loud-alarm.mp3`
- `beep-alarm.mp3`

## Usage Guide 📱

### Creating an Alarm
1. Navigate to the **Alarms** tab
2. Tap the **+** button
3. Set your desired time using the time picker
4. Add an optional label
5. Configure repeat days (tap day buttons to toggle)
6. Choose a dismissal task type and difficulty
7. Select alarm sound and volume
8. Enable/disable vibration
9. Tap **Save**

### Managing Alarms
- **Toggle**: Use the switch on each alarm card
- **Edit**: Tap on the alarm time or use the Edit button
- **Delete**: Tap the Delete button in alarm details
- **View Details**: Tap the expand arrow to see full alarm configuration

### Dismissing Alarms
- **No Task**: Simply tap "Dismiss"
- **With Task**: Tap "Complete Task" and solve the presented challenge
- **Snooze**: Tap "Snooze" (if enabled) to delay for configured minutes

### Customizing Settings
- **Theme**: Choose between Light, Dark, or System theme
- **Default Tasks**: Set preferred task type and difficulty for new alarms
- **Snooze**: Enable/disable and set duration (1-30 minutes)
- **Audio**: Configure default volume and enable/disable sound/vibration

## Development 👨‍💻

### Key Architecture Decisions

1. **Expo Router**: File-based routing for intuitive navigation structure
2. **Zustand**: Lightweight state management with persistence
3. **Zod**: Runtime type validation for data integrity
4. **NativeWind**: Tailwind CSS for consistent, responsive styling
5. **Service Pattern**: Separate services for notifications, audio, and storage

### Adding New Features

#### New Task Type
1. Create component in `components/tasks/`
2. Update `TaskType` in `models/alarm.ts`
3. Add to task selection in `AlarmForm.tsx`
4. Handle in `ring.tsx` screen

#### New Alarm Sound
1. Add MP3 file to `assets/sounds/`
2. Update `getAvailableSounds()` in `lib/sound.ts`
3. Test with `testSound()` method

### Testing

```bash
# Run type checking
npx tsc --noEmit

# Run linting
npx eslint .

# Format code
npx prettier --write .
```

## Building for Production 📦

### Development Build
```bash
npx expo build:android
npx expo build:ios
```

### EAS Build (Recommended)
```bash
npm install -g eas-cli
eas build --platform android
eas build --platform ios
```

## Troubleshooting 🔧

### Common Issues

**Notifications not working**
- Ensure notification permissions are granted
- Check device notification settings
- Verify app is not in battery optimization (Android)

**Sounds not playing**
- Replace placeholder MP3 files with actual audio
- Check device volume and silent mode
- Verify audio permissions

**App crashes on alarm ring**
- Check console for error logs
- Ensure all required dependencies are installed
- Verify notification payload format

**Theme not switching**
- Clear app data and restart
- Check system theme settings
- Verify AsyncStorage permissions

## Contributing 🤝

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style
- Use TypeScript for all new code
- Follow existing naming conventions
- Add JSDoc comments for complex functions
- Ensure all components are properly typed
- Use Prettier for code formatting

## License 📄

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments 🙏

- Expo team for the excellent development platform
- React Native community for comprehensive libraries
- Contributors and testers who helped improve the app

---

**Wake up with purpose! 🌅**

For support or questions, please open an issue on GitHub.