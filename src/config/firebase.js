import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyBB6S08T7WxDnsNuxHzBYy3ddHN-EhJE4E",
  authDomain: "totem-duoc-san-bernardo.firebaseapp.com",
  projectId: "totem-duoc-san-bernardo",
  storageBucket: "totem-duoc-san-bernardo.firebasestorage.app",
  messagingSenderId: "95176404954",
  appId: "1:95176404954:web:9ac606dd031a84cf011ae3",
  measurementId: "G-SD7L1FRZGV"
};

// Inicializa el Ecosistema Cloud
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;
