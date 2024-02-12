import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
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

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
