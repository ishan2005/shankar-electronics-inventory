import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBoiDKDpiA--HVlc6hOFKwLYkfmcRh9YtI",
  authDomain: "shankar-electronics-inventory.firebaseapp.com",
  projectId: "shankar-electronics-inventory",
  storageBucket: "shankar-electronics-inventory.appspot.com",
  messagingSenderId: "297112480528",
  appId: "1:297112480528:web:c967a180c65c36e5a4d395",
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);

export const auth = getAuth(app);

// 🔥 FORCE LOGIN STATE
setPersistence(auth, browserLocalPersistence);
