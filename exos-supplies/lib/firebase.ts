import { initializeApp } from "firebase/app";
import { getFirestore, connectFirestoreEmulator, enableNetwork } from "firebase/firestore";

// Your web app's Firebase configuration
// Using the working exos-equipment-list project configuration
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

// Initialize Firestore
export const db = getFirestore(app);

// Ensure Firestore is online and retry connection
enableNetwork(db).catch(error => {
  console.warn("Failed to enable network for Firestore:", error);
});

export default app; 