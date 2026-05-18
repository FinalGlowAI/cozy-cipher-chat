# Build & Run OcodX on Android with Capacitor

Capacitor is already installed in your project (`@capacitor/core`, `@capacitor/cli`, `@capacitor/android`, `@capacitor/ios`) and `capacitor.config.ts` is configured. You just need to set up your local machine and run a few commands.

---

## 1. Required Tools (install once)

| Tool | Why | Where |
|------|-----|-------|
| **Node.js 18+** | Runs the build & Capacitor CLI | https://nodejs.org |
| **Git** | Pull the project from GitHub | https://git-scm.com |
| **Java JDK 17** | Required to compile Android apps | https://adoptium.net |
| **Android Studio** (latest) | Provides Android SDK, emulator, and build tools | https://developer.android.com/studio |

### Inside Android Studio (first launch)
Open **Settings → Languages & Frameworks → Android SDK** and make sure these are installed:
- **Android SDK Platform 34** (or latest)
- **Android SDK Build-Tools**
- **Android SDK Platform-Tools**
- **Android Emulator**
- **Android SDK Command-line Tools**

Then in **Device Manager**, create a virtual device (e.g. Pixel 7, system image Android 14) — or plug in a physical phone with **USB debugging** enabled (Settings → Developer Options).

### Environment variables (so the CLI finds Android)
- **macOS / Linux** (add to `~/.zshrc` or `~/.bashrc`):
  ```bash
  export ANDROID_HOME=$HOME/Library/Android/sdk        # macOS
  # export ANDROID_HOME=$HOME/Android/Sdk              # Linux
  export PATH=$PATH:$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator
  ```
- **Windows** (System Properties → Environment Variables):
  - `ANDROID_HOME` = `C:\Users\<you>\AppData\Local\Android\Sdk`
  - Add `%ANDROID_HOME%\platform-tools` and `%ANDROID_HOME%\emulator` to `Path`

Verify: `adb --version` should print a version.

---

## 2. Get the project on your machine

The Lovable sandbox can't run native builds. You need to export the project to **your own GitHub** (button at top right of the Lovable editor → "Export to GitHub"), then:

```bash
git clone https://github.com/<your-user>/<your-repo>.git
cd <your-repo>
npm install
```

---

## 3. Add the Android platform (only the first time)

```bash
npx cap add android
npx cap update android
```

This creates an `android/` folder with the native Gradle project.

---

## 4. Build the web app + sync to Android

Run this every time you pull new code from Lovable:

```bash
npm run build
npx cap sync android
```

`npm run build` produces the `dist/` folder; `cap sync` copies it into the Android project and updates native plugins.

---

## 5. Run it

### Option A — one-line run (emulator or connected device)
```bash
npx cap run android
```

### Option B — open in Android Studio (recommended for debugging / signing)
```bash
npx cap open android
```
Then in Android Studio press the green **Run ▶** button. Pick your emulator or device.

---

## 6. Daily workflow after the first setup

```bash
git pull                 # get latest changes from Lovable
npm install              # only if dependencies changed
npm run build
npx cap sync android
npx cap run android
```

---

## Notes specific to your project

- `capacitor.config.ts` points `server.url` to the Lovable sandbox, so the running Android app **hot-reloads from Lovable** while you develop. For a real Play Store build, remove the `server.url` block so the app loads the bundled `dist/` instead.
- **Google Sign-In**: replace the placeholder `serverClientId` in `capacitor.config.ts` with your real **Web Client ID** from Google Cloud Console. Without it, Google login on Android will fail.
- `public/.well-known/assetlinks.json` is already present for Android App Links / Digital Asset Links — update its SHA-256 fingerprint once you have your signing key (`./gradlew signingReport` inside `android/`).

---

## Common issues

- **`SDK location not found`** → `ANDROID_HOME` isn't set, or create `android/local.properties` with `sdk.dir=/absolute/path/to/Android/Sdk`.
- **`JAVA_HOME is not set`** → install JDK 17 and set `JAVA_HOME` to its install path.
- **Gradle download stalls** → first build downloads ~1 GB; let it finish, don't cancel.
- **Blank white screen on device** → you skipped `npm run build` before `cap sync`, or `server.url` is unreachable from the phone (use the same Wi-Fi or remove it for a local bundle).

Want me to also add an npm script like `"android": "npm run build && npx cap sync android && npx cap run android"` to `package.json` to make this one command?
