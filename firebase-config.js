const firebaseConfig = {
  apiKey: "AIzaSyD__Ua-7KtBO6vyHa9eKMcwrZ2nl96IsSU",
  authDomain: "cabsquare-c4533.firebaseapp.com",
  projectId: "cabsquare-c4533",
  storageBucket: "cabsquare-c4533.firebasestorage.app",
  messagingSenderId: "479195339907",
  appId: "1:479195339907:web:b9a6300cb35ea7330d4fb6",
  measurementId: "G-1S71R3YKQ1"
};


// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firestore
const db = firebase.firestore();

// Export for use in other files
window.db = db;
