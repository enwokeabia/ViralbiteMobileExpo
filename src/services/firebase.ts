import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyC1zDSWLYeSxm5hpf013TXL6UkdqrzVH4w",
    authDomain: "viralbite-mobile.firebaseapp.com",
    projectId: "viralbite-mobile",
    storageBucket: "viralbite-mobile.firebasestorage.app",
    messagingSenderId: "673595596591",
    appId: "1:673595596591:web:49533090273b042d614bda"
  };  

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Add some debugging
console.log('🔥 Firebase initialized with project:', firebaseConfig.projectId);
console.log('📊 Firestore instance created'); 