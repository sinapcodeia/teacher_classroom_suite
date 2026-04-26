import { initializeApp, getApps } from "firebase/app";
import { 
  getFirestore, 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager 
} from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Initialize Firebase only if API key is present to avoid build crashes
const isConfigured = firebaseConfig.apiKey && firebaseConfig.apiKey !== "undefined";

let app: any;
let db: any;
let auth: any;
let googleProvider: any;

if (isConfigured) {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  db = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager(),
    }),
  });
  auth = getAuth(app);
  googleProvider = new GoogleAuthProvider();
} else {
  // Provide empty/mock objects for build time
  console.warn("Firebase API Key missing. Firebase features will be disabled.");
  app = {} as any;
  db = {} as any;
  auth = {
    onAuthStateChanged: (cb: any) => {
      // During build/missing config, we just assume no user
      return () => {};
    },
    signOut: async () => {},
  } as any;
  googleProvider = {} as any;
}

export { db, auth, googleProvider };
