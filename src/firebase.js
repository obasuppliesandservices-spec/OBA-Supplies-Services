import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyDKWt5Z3FfG4oVSEC2Xiv9uBOMCfmuBSuc",
  authDomain: "capstone-78bb0.firebaseapp.com",
  databaseURL: "https://capstone-78bb0-default-rtdb.firebaseio.com",
  projectId: "capstone-78bb0",
  storageBucket: "capstone-78bb0.firebasestorage.app",
  messagingSenderId: "73717813427",
  appId: "1:73717813427:web:277567f5e7fb4e41cf60c6",
  measurementId: "G-5K2T24F07G"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export instances to use in components
export const auth = getAuth(app);
export const database = getDatabase(app);

export let analytics = null;
isSupported().then((supported) => {
  if (supported) {
    analytics = getAnalytics(app);
  }
}).catch(() => {});
