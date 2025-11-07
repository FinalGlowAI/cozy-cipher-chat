# App Store Preparation Guide

## ✅ Completed Steps

### 1. PWA Manifest Enhancement
- ✅ Added app categories: utilities, productivity, security
- ✅ Added language direction (ltr)
- ✅ Optimized icons with separate "any" and "maskable" purposes
- ✅ Added 4 app shortcuts for quick actions:
  - Encrypt Message
  - Decrypt Message
  - Image Encryption
  - Ephemeral Chat

### 2. Screenshots Configuration
The manifest is configured for 4 screenshots. **You need to create these images:**

#### Required Screenshots:
1. **screenshot-1.png** (1170x2532) - Main encryption/decryption interface
2. **screenshot-2.png** (1170x2532) - Image encryption feature
3. **screenshot-3.png** (1170x2532) - Ephemeral chat rooms
4. **screenshot-4.png** (2048x2732) - iPad/tablet view

#### How to Create Screenshots:
1. Open your deployed app on an iPhone (iOS 17+)
2. Navigate to each key feature
3. Take screenshots using the device
4. Resize to exact dimensions if needed
5. Place files in the `public/` folder

**Alternative:** Use browser dev tools to simulate device dimensions and take screenshots.

## 📋 Next Steps (Manual)

### Step 3: Create Screenshot Images
- [ ] Take 4 high-quality screenshots of your app
- [ ] Save them as `screenshot-1.png` through `screenshot-4.png`
- [ ] Place them in the `public/` folder
- [ ] Ensure they showcase key features clearly

### Step 4: Prepare Privacy Information
Document what data your app collects (if any):
- [ ] Review your Privacy Policy at `/privacy-policy`
- [ ] Ensure it covers all data handling practices
- [ ] Note: OCX processes everything locally, no data stored on servers
- [ ] The iOS Privacy Manifest (PrivacyInfo.xcprivacy) will be added during PWABuilder packaging

### Step 5: Test PWA Installation
- [ ] Deploy your app to production
- [ ] Test "Add to Home Screen" on iOS Safari
- [ ] Verify all shortcuts work correctly
- [ ] Test offline functionality
- [ ] Ensure all features work in standalone mode

### Step 6: Package with PWABuilder
1. Go to https://www.pwabuilder.com/
2. Enter your production URL
3. Click "Start" to analyze your PWA
4. Click "Package For Stores"
5. Select "iOS" as target platform
6. Download the generated iOS package
7. The package will include the required PrivacyInfo.xcprivacy file

### Step 7: Submit to App Store
1. Create an Apple Developer account ($99/year)
2. Open Xcode and load the generated iOS package
3. Configure signing certificates
4. Prepare App Store Connect listing:
   - App name: OCX - Encrypted Texts/Images Secure
   - Subtitle: Privacy-First Encryption
   - Categories: Utilities, Productivity
   - Keywords: encryption, privacy, secure, messaging, ephemeral
5. Submit for review

## 🔒 Privacy Notes

Your app is privacy-focused with these key features:
- ✅ All encryption happens locally (client-side)
- ✅ No user data stored on servers (except ephemeral rooms temporarily)
- ✅ No tracking or analytics
- ✅ No third-party SDKs
- ✅ Open-source encryption libraries

## 📱 App Shortcuts

Users can long-press your app icon to access:
1. **Encrypt Message** - Quick access to encryption
2. **Decrypt Message** - Quick access to decryption
3. **Image Encryption** - Direct to image encryption
4. **Ephemeral Chat** - Start secure chat instantly

## 🎯 Requirements Checklist

- [x] Web App Manifest
- [x] HTTPS (via Lovable deployment)
- [x] Service Worker
- [x] Icons (192x192, 512x512)
- [x] App name and description
- [x] Start URL
- [x] Display mode (standalone)
- [x] Theme and background colors
- [x] Apple touch icon
- [x] Apple meta tags
- [x] Categories
- [x] Shortcuts
- [ ] Screenshots (need to be created)
- [ ] App Store Connect listing
- [ ] Apple Developer account

## 📚 Helpful Resources

- [PWABuilder Documentation](https://docs.pwabuilder.com/)
- [Apple App Store Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [PWA Best Practices](https://web.dev/pwa-checklist/)
