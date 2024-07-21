import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

const firebaseConfig = {
    apiKey: "AIzaSyDAsHSsWozr0_cmW8whKmOHUmzxcuGYmVU",
    authDomain: "helping-hands-b2698.firebaseapp.com",
    projectId: "helping-hands-b2698",
    storageBucket: "helping-hands-b2698.appspot.com",
    messagingSenderId: "31366880727",
    appId: "1:31366880727:web:bce6d2786bc764dbe33f92",
    measurementId: "G-XLVXR6ZMB5",
};

const app = getApps.length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
