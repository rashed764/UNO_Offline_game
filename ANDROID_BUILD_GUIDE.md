# 📱 UNO Android App Conversion & Build Guide

This document provides complete instructions for converting and building the UNO web game into a standalone, installable Android application (APK) while preserving all existing features, game logic, AI opponents, and LAN multiplayer capabilities.

---

## 🛠️ Architecture & Integration Strategy

1. **Frontend UI & Assets:**
   - The existing HTML, CSS, and 3D JavaScript engine (`public/`) are bundled directly into the Android application assets via Capacitor (`webDir: "public"`).
   - Local storage (`UnoEconomy`) persists coin balances, unlocked card back themes, and table skins locally on the device.

2. **Authoritative Backend & Socket.IO:**
   - The game uses an authoritative Node.js/Express/Socket.io backend (`server.js`, `GameEngine.js`, `BotPlayer.js`) to guarantee secure state synchronization and bot AI execution.
   - For Android integration, local network traffic is permitted (`android:usesCleartextTraffic="true"`), and Socket.IO connects seamlessly over the local network / host interface.

3. **Offline Mode (Vs Computer AI):**
   - Fully functional without internet access or external CDN dependencies.
   - Smart AI bot opponents run with configurable decision heuristics and natural human-like delays.

4. **LAN Multiplayer:**
   - Friends can connect over the same Wi-Fi network or mobile hotspot.
   - The host creates a room, displaying connection details and room code for other players to join instantly.

---

## 📋 Prerequisites for Building the APK

To compile the Android APK on your development machine, ensure you have installed:
- **Node.js** (v18 or higher recommended) & **npm**
- **Java Development Kit (JDK 17 or higher)**
- **Android Studio** with Android SDK (API level 33 or higher recommended) and Android SDK Build-Tools.
- Environment variables configured (`JAVA_HOME` and `ANDROID_HOME`).

---

## 🚀 Step-by-Step Build Instructions

### Step 1: Install Project Dependencies
Open your terminal in the project root directory (`C:\games\uno-offline-game`) and install all required Node dependencies:
```bash
npm install
```

### Step 2: Sync Capacitor Web Assets to Android
Synchronize the web assets and configuration with the native Android project:
```bash
npx cap sync android
```

### Step 3: Build Debug APK (For Testing)
To generate an un-signed Debug APK for immediate testing on physical devices or emulators:
1. Open the Android project in Android Studio:
   ```bash
   npx cap open android
   ```
2. In Android Studio, go to **Build > Build Bundle(s) / APK(s) > Build APK(s)**.
3. Alternatively, compile via Gradle in the terminal:
   ```bash
   cd android
   ./gradlew assembleDebug
   ```
4. The resulting debug APK will be located at:
   `android/app/build/outputs/apk/debug/app-debug.apk`

### Step 4: Build Release APK (Production Ready)
To generate a production-ready Release APK:
1. Run Gradle build for release:
   ```bash
   cd android
   ./gradlew assembleRelease
   ```
2. The release APK will be located at:
   `android/app/build/outputs/apk/release/app-release.apk`
   *(Note: For publishing to the Google Play Store, sign the release APK with your keystore).*

---

## ✨ Features Preserved in the Android App

- **Classic & Special UNO Rules:** Number cards, Skip, Reverse, Draw 2, Wild, and Wild Draw 4.
- **Smart AI Opponents:** Offline play against computer bots with tactical play and bluff heuristics.
- **LAN Multiplayer:** Host and join rooms over local Wi-Fi or hotspot without internet reliance.
- **3D Perspective UI & Animations:** Smooth CSS transforms, card fanning, dealing animations, and sound effects.
- **Theme Shop & Economy:** Unlock and equip custom card backs and table surfaces using earned coins.
- **Mobile Optimizations:** Touch interactions, safe-area screen cutout support, prevention of accidental zooming/scrolling, and sensible back-button handling.
