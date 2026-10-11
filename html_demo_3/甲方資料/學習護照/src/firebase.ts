import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase App instance safely
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Connect to dedicated Firestore Database
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Firebase Authentication
export const auth = getAuth(app);
