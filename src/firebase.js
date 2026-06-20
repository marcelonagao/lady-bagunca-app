import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyBHpXTB6TtcmhGAdTXMU-Eh_PKmHzDuNcU",
    authDomain: "lady-bagunca.firebaseapp.com",
    projectId: "lady-bagunca",
    storageBucket: "lady-bagunca.firebasestorage.app",
    messagingSenderId: "397966169444",
    appId: "1:397966169444:web:5badbcec110aaabb591671"
  };

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);