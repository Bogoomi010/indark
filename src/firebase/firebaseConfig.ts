import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics, isSupported } from 'firebase/analytics';
import type { Analytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyC0952E1JZrcR511fgYjBGI37m0Sutvow4",
  authDomain: "in-dark.firebaseapp.com",
  projectId: "in-dark",
  storageBucket: "in-dark.firebasestorage.app",
  messagingSenderId: "1024878008190",
  appId: "1:1024878008190:web:d112fc4cf1a58fc236c52f",
  measurementId: "G-P0DY7T11D1"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export let analytics: Analytics | undefined;
if (typeof window !== 'undefined') {
  // Analytics는 브라우저 환경에서만 지원됩니다.
  void isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  });
}

