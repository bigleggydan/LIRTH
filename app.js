import { firebaseConfig } from './firebase-config.js';
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut, sendEmailVerification } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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
    createUserWithEmailAndPassword(auth, email, password, sendEmailVerification)
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
        // Check if the user has clicked the link in their email
        if (user.emailVerified) {
            console.log("User is verified!");
            showAppPage();
            displayTreasureList();
        } else {
            // User exists but hasn't verified yet
            alert("Please verify your email! Check your inbox (and spam folder).");
            signOut(auth); // Log them out so they have to click the link first
            showAuthPage();
        }
    } else {
        showAuthPage();
    }
});

// --- 5. THE LIST BUILDER ---
async function displayTreasureList() {
    checkCompletion(); // Check immediately after loading
    const listDiv = document.getElementById('user-task-list');
    const user = auth.currentUser;
    if (!user) return;

    listDiv.innerHTML = "Loading your hunt...";

    try {
        // 1. Fetch the Master List AND the User's Progress at the same time
        const masterRef = doc(db, "settings", "treasureHunt_March");
        const progressRef = doc(db, "userProgress", user.uid);
        
        const [masterSnap, progressSnap] = await Promise.all([
            getDoc(masterRef),
            getDoc(progressRef)
        ]);

        if (masterSnap.exists()) {
            const itemsArray = masterSnap.data().items;
            const savedProgress = progressSnap.exists() ? progressSnap.data() : {};
            
            listDiv.innerHTML = ""; 

            itemsArray.forEach((treasureName, index) => {
                const itemId = `item-${index}`;
                // Check if this specific ID was saved as 'true' in our progress doc
                const isChecked = savedProgress[itemId] === true ? "checked" : "";

                const itemHtml = `
                    <div class="checklist-row">
                        <input type="checkbox" id="${itemId}" class="treasure-check" data-name="${treasureName}" ${isChecked}>
                        <label for="${itemId}">${treasureName}</label>
                    </div>
                `;
                listDiv.insertAdjacentHTML('beforeend', itemHtml);
            });

            // 2. Re-attach the listeners to the new checkboxes
            setupCheckboxListeners();
        }
    } catch (error) {
        console.error("Error loading list:", error);
    }
}

function setupCheckboxListeners() {
    const checkboxes = document.querySelectorAll('.treasure-check');
    checkboxes.forEach(box => {
        box.addEventListener('change', async (e) => {
            const user = auth.currentUser;
            if (user) {
                const userDocRef = doc(db, "userProgress", user.uid);
                await setDoc(userDocRef, {
                    [e.target.id]: e.target.checked
                }, { merge: true });
                console.log("Progress saved to cloud!");
                checkCompletion();
            }
        });
    });
}
function checkCompletion() {
    const checkboxes = document.querySelectorAll('.treasure-check');
    const congratsMsg = document.getElementById('congrats-msg');
    
    // Count how many are checked
    const totalItems = checkboxes.length;
    const checkedItems = Array.from(checkboxes).filter(box => box.checked).length;

    if (totalItems > 0 && checkedItems === totalItems) {
        congratsMsg.style.display = 'block';
        // Optional: Add a little 'completed' class to the card
        document.getElementById('app-container').style.borderColor = '#28a745';
    } else {
        congratsMsg.style.display = 'none';
        document.getElementById('app-container').style.borderColor = 'transparent';
    }
}