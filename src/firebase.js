import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Your Firebase configuration
// Firebase config for exos-equipment-list project
const firebaseConfig = {
  apiKey: "AIzaSyCB3S6TJPDwV_GL3V9utxQjSFqim165mkA",
  authDomain: "exos-equipment-list.firebaseapp.com",
  projectId: "exos-equipment-list",
  storageBucket: "exos-equipment-list.firebasestorage.app",
  messagingSenderId: "556330710347",
  appId: "1:556330710347:web:8a2cbffd600bb4494124ce",
  measurementId: "G-FKVK8H4LHX"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore Database
export const db = getFirestore(app);

// Initialize Auth (for future use if needed)
export const auth = getAuth(app);

export default app; 