import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyB3UKrfRp3baFxrFLiZDbTN0ccYh7cvBK0",
  authDomain: "forge-sms-authentication.firebaseapp.com",
  projectId: "forge-sms-authentication",
  storageBucket: "forge-sms-authentication.firebasestorage.app",
  messagingSenderId: "350959919474",
  appId: "1:350959919474:web:1e5b084be359735d63fdeb",
  measurementId: "G-BSKCGC81VS"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);