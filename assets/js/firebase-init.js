// assets/js/firebase-init.js
// Firebase initialization module (ES module).
// Replace the placeholder values in `firebaseConfig` with your real project settings
// from the Firebase Console -> Project Settings -> Your apps (Web SDK config).

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
  initializeFirestore,
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-storage.js";

// ---- REPLACE THESE VALUES ----
// Get these from the Firebase Console (Project settings -> Your apps -> Firebase SDK snippet)
const firebaseConfig = {
 apiKey: "AIzaSyCA-qzbLYL3nf6EpiMAJf7g5qJ2XyY6Be4",
  authDomain: "hemchandra-foundation.firebaseapp.com",
  projectId: "hemchandra-foundation",
  storageBucket: "gs://hemchandra-foundation.firebasestorage.app",
  messagingSenderId: "1044241898866",
  appId: "1:1044241898866:web:32e876eb747b17399611eb",
  measurementId: "G-S1JWK5Y9VQ"
  
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// Use Firestore with a specific database ('alldata')
const db = getFirestore(app, "alldata");
// Initialize Firebase Storage
const storage = getStorage(app);

// Expose database and storage for use in other modules
window.db = db;
window.storage = storage;
window.firebaseStorage = { ref, uploadBytes, getDownloadURL };



