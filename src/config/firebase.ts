import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, GithubAuthProvider } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAJelX0_dnPBRraYJtLTK-ycpaHXmdUTcY",
  authDomain: "leasecare-34401.firebaseapp.com",
  projectId: "leasecare-34401",
  storageBucket: "leasecare-34401.firebasestorage.app",
  messagingSenderId: "114463206022",
  appId: "1:114463206022:web:26a86f455e23f635d47f07",
  measurementId: "G-QLR8FSCZXH"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const analytics = getAnalytics(app);

// Auth providers
export const googleProvider = new GoogleAuthProvider();
export const githubProvider = new GithubAuthProvider();

export default app;
