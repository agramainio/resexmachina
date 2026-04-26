import { initializeApp, type FirebaseApp } from 'firebase/app'
import { getStorage, type FirebaseStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID ?? '',
}

export const hasFirebaseConfig = Object.values(firebaseConfig).every(
  (value) => value.length > 0,
)

export const firebaseApp: FirebaseApp | null = hasFirebaseConfig
  ? initializeApp(firebaseConfig)
  : null

export const storage: FirebaseStorage | null = firebaseApp ? getStorage(firebaseApp) : null
