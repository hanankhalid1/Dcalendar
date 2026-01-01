# Dcalendar - React Native Calendar App

A modern calendar application built with React Native, featuring multiple calendar views and event management.

## Features

- **Multiple Calendar Views**: Day, Week, Month, and Schedule views
- **Event Management**: Create, edit, and manage calendar events
- **Modern UI**: Clean, responsive design with smooth animations
- **Cross-platform**: Works on both iOS and Android

## New Week View

The app now includes a **WeekScreen** that displays a weekly calendar view matching the design specifications:

- **Week Header**: Shows days of the week with date circles and holiday indicators
- **Time Grid**: Displays hourly time slots from 10 AM to 8 PM
- **Event Display**: Shows events in colored cards with titles and details
- **Responsive Layout**: Adapts to different screen sizes

### How to Access Week View

1. Open the app and tap the hamburger menu (☰) in the top-left corner
2. In the drawer navigation, tap on the **"Week"** option (black folder icon)
3. The app will navigate to the WeekScreen showing the weekly calendar view

## Installation & Setup

### Prerequisites

- Node.js (>= 20)
- React Native CLI
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd Dcalendar
```

2. Install dependencies:
```bash
yarn install
```

3. Install iOS dependencies (macOS only):
```bash
cd ios && pod install && cd ..
```

### Running the App

#### Android
```bash
yarn android
```

#### iOS (macOS only)
```bash
yarn ios
```

## Project Structure

```
src/
├── components/          # Reusable UI components
├── screens/            # Screen components
│   ├── HomeScreen.tsx  # Main calendar view
│   └── WeekScreen.tsx  # Weekly calendar view
├── navigations/        # Navigation configuration
├── utils/              # Utility functions and themes
└── assets/             # Images and static assets
```

## Dependencies

- `react-native-calendars`: Calendar functionality and components
- `@react-navigation/native-stack`: Navigation between screens
- `react-native-linear-gradient`: Gradient backgrounds
- `react-native-vector-icons`: Icon library

## Development

The app uses TypeScript for type safety and follows React Native best practices. The WeekScreen component demonstrates:

- Proper navigation setup
- Responsive design with custom dimensions
- Event rendering in a grid layout
- Integration with existing components

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test on both platforms
5. Submit a pull request

## License

This project is licensed under the MIT License.
