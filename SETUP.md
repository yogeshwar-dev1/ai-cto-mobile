# Android WebView Wrapper — Setup Guide

## Deep Links

The app handles two types of deep links:

- **Custom scheme**: `aicto://path` → opens `https://ai-cto.onrender.com/path`
- **App Links**: `https://ai-cto.onrender.com/path` → opens the app directly

For App Links (https://), you must verify domain ownership by hosting a `/.well-known/assetlinks.json` file on `ai-cto.onrender.com`. Generate this file using the Android Asset Links tool with your app's package name (`com.aicto.app`) and SHA-256 signing key.

## Push Notifications (FCM)

1. Place your `google-services.json` from your Firebase project into:
   ```
   artifacts/android-webview/google-services.json
   ```
   This file is required for FCM (Firebase Cloud Messaging) on Android.

2. The app uses `expo-notifications` which automatically integrates with FCM when `google-services.json` is present in the build.

3. Push notification payload should include a `url` or `link` field to navigate the WebView on tap:
   ```json
   {
     "notification": {
       "title": "New Update",
       "body": "Check out the latest feature"
     },
     "data": {
       "url": "https://ai-cto.onrender.com/updates"
     }
   }
   ```

4. The Expo Push Token is displayed on the app's Settings screen (dev mode) for testing.

## Building the Android APK

To produce an APK for Android, use EAS Build from your local machine:

```bash
# Install EAS CLI
npm install -g eas-cli

# Log in to Expo
eas login

# Build APK (internal distribution / testing)
eas build -p android --profile preview

# Build AAB (Google Play production)
eas build -p android --profile production
```

The `eas.json` file in this directory is already configured with development, preview (APK), and production (AAB) profiles.

## File Handling

- **File uploads**: Handled natively by the WebView on Android via the system file picker.
- **File downloads**: The app detects download URLs (pdf, doc, xls, zip, csv, apk, etc.) and saves them to the device using `expo-file-system`. A toast notification appears when the download completes.
