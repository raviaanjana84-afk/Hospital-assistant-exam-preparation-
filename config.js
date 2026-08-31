// ==========================================
// FIREBASE CONFIG (shared across all modules)
// ==========================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCHLIemvVjIzH4j_UKMj7lMhecj_QHWBT8",
  authDomain: "harsh-sharma-dc962.firebaseapp.com",
  projectId: "harsh-sharma-dc962",
  storageBucket: "harsh-sharma-dc962.firebasestorage.app",
  messagingSenderId: "247283952552",
  appId: "1:247283952552:web:5501d5e69d39dd13570b9d"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Pandit ji ka WhatsApp number (booking messages ke liye)
export const PANDIT_WHATSAPP = "918319714682";
export const PANDIT_PHONE_DISPLAY = "+91 83197 14682";
export const PANDIT_INSTAGRAM = "https://www.instagram.com/pt_harshu0732?igsi=aWd6YjJlMXgxNWo0";

// Gemini API key (Bhakti AI ke liye)
export const GEMINI_API_KEY = "AQ.Ab8RN6LcHi30EHoHO6C3uwuqAAMwaMQliHFwRDp1yu-wyIRTsw";
