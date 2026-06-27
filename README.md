# iTimeYou

**Connect · Share · Experience Laos** — ເຊື່ອມຕໍ່ · ແບ່ງປັນ · ສຳຜັດ

iTimeYou is a bilingual (English / Lao) social marketplace for Lao culture, stays,
food, tours and time-based services. Visitors can browse the whole app freely and
only need an account when they want to **book or offer a real service**.

> Fully standalone. Backend powered by **Firebase** (Auth + Firestore + Storage).
> No Base44 dependency.

---

## ✨ Features

- 📱 Responsive web app (mobile + desktop), installable as a PWA
- 🔓 **Open browsing** — anyone can explore the feed, listings and profiles without logging in
- 🔐 **Login only for actions** — booking, posting a service, wallet and chat require an account
- 🔑 Firebase Authentication: Email/Password + Google
- 📰 Real-time social feed with photos
- 🏡 Service marketplace: stays, food, tours, cultural experiences, time/talk
- 💬 Messaging between members
- 💳 Wallet & multi-currency (LAK / USD / USDT)
- ⭐ Trust ratings & verification badges
- 🌍 Instant English ⇄ Lao switching

---

## 🚀 How to use the app (for visitors)

1. Open **https://www.itimeyou.com**
2. Browse the **Home**, **Feed** and **Explore** pages — no account needed.
3. Tap a listing to see full details, photos, host and price.
4. When you want to **book a service** or **post your own**, tap the action — you'll be
   asked to **Login / Register** (email or Google).
5. After login you also get **Wallet**, **Messages**, **Bookings** and **Notifications**.

---

## 🛠 Run locally (for developers)

**Prerequisites:** Node.js 18+ and npm.

```bash
git clone https://github.com/ItwithYou/iTimeyOu_V.2.git
cd iTimeyOu_V.2
npm install
npm run dev          # local dev server (http://localhost:5173)
npm run build        # production build -> dist/
npm run preview      # preview the production build
```

No environment variables are required — the Firebase web config is public by design
and lives in `src/api/base44Client.js`.

---

## 🔥 Firebase setup (one-time, in the Firebase Console)

The app talks to Firebase project **`itimeyou-88`**. For login and data to work,
enable these in the [Firebase Console](https://console.firebase.google.com):

1. **Authentication → Sign-in method** → enable **Email/Password** and **Google**.
2. **Authentication → Settings → Authorized domains** → add `itimeyou.com` and
   `www.itimeyou.com` (and any preview domain).
3. **Firestore Database → Rules** → publish:
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /{document=**} {
         allow read: if true;
         allow write: if request.auth != null;
       }
     }
   }
   ```
4. **Storage → Rules** → publish:
   ```
   rules_version = '2';
   service firebase.storage {
     match /b/{bucket}/o {
       match /{allPaths=**} {
         allow read: if true;
         allow write: if request.auth != null;
       }
     }
   }
   ```

To point the app at your **own** Firebase project, replace the `firebaseConfig`
object in `src/api/base44Client.js`.

---

## 🧱 Tech stack

- React 18 + Vite
- Tailwind CSS + Radix UI (shadcn/ui)
- React Router DOM
- TanStack React Query
- Firebase (Auth, Firestore, Storage)

## 📦 Deployment

Hosted on **Vercel** (framework preset: Vite, output: `dist`). `vercel.json` rewrites
all routes to `index.html` for client-side routing. Pushing to `main` auto-deploys.

## 🗂 Project structure

```
src/
  api/base44Client.js   # Firebase client (entities, auth, storage, uploads)
  pages/                # Home, Feed, Explore, Login, ListingDetail, Wallet, ...
  components/           # UI + feature components (PostCard, BookServiceModal, ...)
  hooks/                # useLang, useProfile, usePullToRefresh
  lib/                  # AuthContext, AppContext, query-client, utils
```
