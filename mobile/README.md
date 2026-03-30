# MedGen AI - Mobile App

Expo React Native mobile app for the MedGen AI medical report generation platform.

## Prerequisites

- **Node.js** 18+ (check with `node --version`)
- **npm** or **yarn**
- **Xcode** 15+ (for iOS Simulator — Mac only)
  - Install from the Mac App Store
  - Open Xcode once to accept the license agreement
  - Install iOS Simulator: Xcode > Settings > Platforms > iOS
- **Expo CLI** (installed automatically via npx)

## Quick Start

```bash
# 1. Navigate to the mobile directory
cd mobile

# 2. Install dependencies
npm install

# 3. Start the development server
npx expo start
```

This opens the Expo Dev Tools in your terminal. From there:
- Press **i** to open in iOS Simulator
- Press **w** to open in web browser
- Scan the QR code with **Expo Go** app on your physical device

## Running on iOS Simulator

### First Time Setup

1. **Install Xcode** from the Mac App Store (if not already installed)
2. **Open Xcode** once to accept the license and install command-line tools
3. **Install an iOS Simulator**:
   - Open Xcode > Settings (Cmd+,) > Platforms
   - Click the "+" button and add "iOS 18.x" (or latest)
   - This downloads the iOS runtime (~5GB)

### Running the App

```bash
# Start with iOS Simulator auto-launch
npx expo start --ios

# OR start the dev server and press 'i'
npx expo start
# Then press 'i' in the terminal
```

The simulator will open automatically with the MedGen app loaded. Hot reload is enabled — save a file and changes appear instantly.

### Switching Simulator Devices

```bash
# List available simulators
xcrun simctl list devices available

# Run on a specific device
npx expo start --ios --device "iPhone 16 Pro"
```

## Running on a Physical iOS Device

### Option 1: Expo Go (Fastest — no build required)

1. **Install Expo Go** from the App Store on your iPhone
2. **Start the dev server**:
   ```bash
   npx expo start
   ```
3. **Scan the QR code** shown in the terminal with your iPhone camera
4. The app opens in Expo Go

> **Note:** Your Mac and iPhone must be on the same Wi-Fi network. If that doesn't work, press `s` to switch to tunnel mode.

### Option 2: Development Build (Full native capabilities)

For features requiring native modules (like audio recording), you'll need a development build:

```bash
# Install EAS CLI
npm install -g eas-cli

# Log in to Expo
eas login

# Create a development build for iOS
eas build --profile development --platform ios

# Once built, install the .ipa on your device via:
# - Scanning the QR code from the EAS build page
# - Or downloading and installing via Apple Configurator
```

Then connect to the dev server:
```bash
npx expo start --dev-client
```

## Project Structure

```
mobile/
├── app/                    # Screens (file-based routing)
│   ├── _layout.tsx         # Root layout with auth gate
│   ├── (auth)/             # Login, Signup, Welcome
│   └── (tabs)/             # Main app with 5-tab navigator
│       ├── index.tsx       # Dashboard
│       ├── record.tsx      # Record session
│       ├── reports/        # Reports list & detail
│       ├── appointments/   # Appointments
│       └── more/           # Profile, Settings, Patients, etc.
├── components/
│   ├── ui/                 # Reusable: Button, Input, Card, Avatar, Badge
│   ├── domain/             # PatientCard, ReportCard, etc.
│   └── layout/             # ScreenContainer, Header
├── stores/                 # Zustand state management
├── services/               # API layer (mock + real)
│   ├── mock/               # Mock data & handlers
│   └── api/                # Real API calls (Phase 6)
├── types/                  # TypeScript interfaces
├── constants/              # Theme, config
├── hooks/                  # Custom hooks
└── utils/                  # Helpers (formatting, storage)
```

## Mock Data

The app runs entirely on mock data by default. The mock/real switch is in `constants/config.ts`:

```typescript
export const USE_MOCK = true; // Set to false for real backend
```

Mock data is in `services/mock/data/` and mock API handlers in `services/mock/handlers/`.

## Test Credentials

In mock mode, any email/password combination works for login. The default mock user is:
- **Email:** dr.smith@medgen.com
- **Password:** password (or anything)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Expo SDK 54 |
| Language | TypeScript (strict) |
| Routing | expo-router v6 |
| State | Zustand |
| Styling | NativeWind (Tailwind CSS) |
| Forms | react-hook-form + zod |
| HTTP | axios |
| Auth Storage | expo-secure-store |
| Audio | expo-av |

## Common Commands

```bash
# Start development server
npx expo start

# Start with iOS Simulator
npx expo start --ios

# Start with tunnel (for physical devices on different networks)
npx expo start --tunnel

# Clear cache and restart
npx expo start --clear

# Run TypeScript type check
npx tsc --noEmit

# Run linter
npm run lint

# Install a new Expo-compatible package
npx expo install <package-name>
```

## Troubleshooting

### "Metro bundler" errors
```bash
npx expo start --clear
```

### iOS Simulator not showing up
```bash
# Verify Xcode CLI tools are installed
xcode-select --install

# Verify simulators are available
xcrun simctl list devices available
```

### Expo Go can't connect
- Ensure Mac and iPhone are on the same Wi-Fi
- Try tunnel mode: `npx expo start --tunnel`
- Check if firewall is blocking port 8081

### Module not found errors
```bash
rm -rf node_modules && npm install
npx expo start --clear
```
