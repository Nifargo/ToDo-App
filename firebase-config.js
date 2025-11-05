// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyAxde31tl4RazVOmcC_c14lG2b3wsPXzC0",
  authDomain: "just-do-it-c3390.firebaseapp.com",
  projectId: "just-do-it-c3390",
  storageBucket: "just-do-it-c3390.firebasestorage.app",
  messagingSenderId: "1057242941805",
  appId: "1:1057242941805:web:8caea8fb087210f8637264"
};

// VAPID key for Web Push
const vapidKey = "BAx2-XuP9uTBN1yD_kw7s8FyM4yD-vkw1pI93_x0b33hCKWiF6Fmgi0LBaS-IRsuGUIP8PAMtuJiKZnUmfI2UOk";

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firebase services
const messaging = firebase.messaging();
const firestore = firebase.firestore();

// Enable offline persistence for Firestore
firestore.enablePersistence()
  .catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
    } else if (err.code === 'unimplemented') {
      console.warn('The current browser does not support persistence.');
    }
  });

console.log('Firebase initialized successfully');