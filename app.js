import { firebaseConfig } from './firebase-config.js';
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Grab HTML elements
const loginBtn = document.getElementById('login-btn');
const signupBtn = document.getElementById('signup-btn');
const logoutBtn = document.getElementById('logout-btn');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const authContainer = document.getElementById('auth-container');
const appContainer = document.getElementById('app-container');

// --- 1. SIGN UP LOGIC ---
signupBtn.addEventListener('click', () => {
    const email = emailInput.value;
    const password = passwordInput.value;
    createUserWithEmailAndPassword(auth, email, password)
        .catch(error => alert(error.message));
});

// --- 2. LOGIN LOGIC ---
loginBtn.addEventListener('click', () => {
    const email = emailInput.value;
    const password = passwordInput.value;
    signInWithEmailAndPassword(auth, email, password)
        .catch(error => alert("Login failed: " + error.message));
});

// --- 3. LOGOUT LOGIC ---
logoutBtn.addEventListener('click', () => {
    signOut(auth);
});

// --- 4. THE "WATCHER" (Checks if someone is logged in) ---
onAuthStateChanged(auth, (user) => {
    if (user) {
        // User is logged in
        authContainer.style.display = 'none';
        appContainer.style.display = 'block';
        displayTreasureList(); // Call the list builder
    } else {
        // User is logged out
        authContainer.style.display = 'block';
        appContainer.style.display = 'none';
    }
});

// --- 5. THE LIST BUILDER ---
async function displayTreasureList() {
    const listDiv = document.getElementById('user-task-list');
    listDiv.innerHTML = "Loading your hunt...";

    const docRef = doc(db, "settings", "treasureHunt");
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        const items = docSnap.data().items;
        listDiv.innerHTML = ""; // Clear loading text
        
        items.forEach((item, index) => {
            const itemRow = `
                <div style="margin: 10px 0;">
                    <input type="checkbox" id="item-${index}">
                    <label for="item-${index}">${item}</label>
                </div>
            `;
            listDiv.insertAdjacentHTML('beforeend', itemRow);
        });
    } else {
        listDiv.innerHTML = "No items found. Check your Firestore 'settings' collection!";
    }
}
