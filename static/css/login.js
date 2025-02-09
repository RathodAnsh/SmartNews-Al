// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.3.0/firebase-analytics.js";
import { 
    getAuth, 
    GoogleAuthProvider, 
    signInWithPopup, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword 
} from "https://www.gstatic.com/firebasejs/11.3.0/firebase-auth.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBheovkqCuqk6uMyyr1-ppZeroDtP-Rz34",
    authDomain: "smart-news-ce093.firebaseapp.com",
    projectId: "smart-news-ce093",
    storageBucket: "smart-news-ce093.firebasestorage.app",
    messagingSenderId: "303988900388",
    appId: "1:303988900388:web:b64dafa8a307dbe1888eb1",
    measurementId: "G-LV9NGXGB54"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth();
auth.languageCode = 'en';
const provider = new GoogleAuthProvider();

// Google Sign-In
document.getElementById("google-signin-button").addEventListener("click", () => {
    signInWithPopup(auth, provider)
    .then((result) => {
        const user = result.user;
        console.log("User Signed In:", user);
        alert("Sign-In Successful!\nWelcome, " + user.displayName);
        localStorage.setItem("loggedInUser", JSON.stringify(user)); // Store user in localStorage
        window.location.href = "index.html"; // Redirect after successful login
    })
    .catch((error) => {
        console.error("Error during Google Sign-In:", error);
        alert("Google Sign-In Failed: " + error.message);
    });
});

// Regular Email/Password Sign-In
document.getElementById("loginForm").addEventListener("submit", (e) => {
    e.preventDefault();
    
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    signInWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
        const user = userCredential.user;
        console.log("Logged in:", user);
        alert("Login Successful!");
        localStorage.setItem("loggedInUser", JSON.stringify(user));
        window.location.href = "dashboard.html";
    })
    .catch((error) => {
        console.error("Login Error:", error);
        alert("Login Failed: " + error.message);
    });
});
