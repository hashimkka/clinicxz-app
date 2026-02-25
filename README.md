# ClinicXZ React Native App

A complete clinic management mobile app built with **Expo (React Native)**, converted from the original FastAPI + HTML app.

## 🚀 Quick Start

```bash
cd ClinicXZ_App
npm install        # Already done!
npx expo start     # Start the dev server
```

Then:
- **Android Phone/Tablet**: Install [Expo Go](https://play.google.com/store/apps/details?id=host.exp.exponent) → scan the QR code
- **Android Emulator**: Press `A` after starting

## 🔐 Default Login
- **Username:** `admin`
- **Password:** `admin123`

## 📁 Project Structure
```
ClinicXZ_App/
  app/
    index.js              ← Login screen
    _layout.js            ← Root layout + DB init
    (tabs)/
      _layout.js          ← Bottom tab navigator
      dashboard.js        ← Dashboard with stats
      patients.js         ← All patients + search
      schedule.js         ← Appointment schedule
    add-patient.js        ← Add new patient
    patient/
      [id].js             ← Patient detail (4 tabs)
  components/
    ui.js                 ← Shared UI components
  context/
    AuthContext.js        ← Login/logout state
  services/
    database.js           ← SQLite (expo-sqlite) CRUD
  constants/
    theme.js              ← Colors, spacing
```

## 🗄️ Database
- Uses **SQLite** stored locally on the device (`clinicxz.db`)
- All table names match the Python models: `patients`, `core_issues`, `sessions`, `tracked_issues`, `kids`, `schedule_events`, `users`
- Compatible with future data uploads from other sources

## ✅ New Features vs Original HTML App

| Feature | Status |
|---|---|
| Removed: Is working / Has siblings / Is genetic checkboxes | ✅ |
| Added: Which Job Field input | ✅ |
| 6 provider types (+ Homeopathy, Ayurveda, Unani) each with name field | ✅ |
| Years on medicine field | ✅ |
| Other Diseases shown before Other Medications | ✅ |
| Add Patient → redirects to patient detail | ✅ |
| Beliefs section: type input + Add More button | ✅ |
| Niyyath (Wudu/Namaz/Ghusl/Fasting): time fields | ✅ |
| Najas: time field for each of 6 items | ✅ |
| Object/Animal: Insects related + Gas locking | ✅ |
| Progress bar inside each Session card | ✅ |
| Responsive for phones & tablets (Redmi Pad Pro) | ✅ |

## 📦 Building APK (for production install)

```bash
npm install -g eas-cli
eas login
eas build --platform android --profile preview
```

This produces an `.apk` / `.aab` you can install directly on your Redmi Pad Pro.
