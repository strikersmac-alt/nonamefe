// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported  } from "firebase/analytics";
import {
  getAuth,
  GoogleAuthProvider
} from "firebase/auth";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIRBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIRBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIRBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIRBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIRBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIRBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIRBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

let analytics;
if (typeof window !== "undefined") {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
      // console.log("Firebase Analytics initialized");
    } else {
      console.warn("Analytics not supported in this environment");
    }
  });
}

export { auth, googleProvider, analytics  };