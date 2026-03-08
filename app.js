import { firebaseConfig } from './firebase-config.js';
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
    getAuth, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    onAuthStateChanged, 
    signOut, 
    sendEmailVerification 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
    getFirestore, 
    doc, 
    getDoc, 
    setDoc 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- NAVIGATION FUNCTIONS ---
function showAppPage() {
    document.getElementById('auth-container').style.display = 'none';
    document.getElementById('app-container').style.display = 'block';
}

function showAuthPage() {
    document.getElementById('auth-container').style.display = 'block';
    document.getElementById('app-container').style.display = 'none';
}

// --- SIGN UP LOGIC ---
async function handleRegister() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        // Send verification email immediately
        await sendEmailVerification(userCredential.user);
        alert("Verification email sent! Please check your inbox (and spam folder).");
        
        // Log them out so they have to verify before getting in
        await signOut(auth);
        showAuthPage();
    } catch (error) {
        alert("Registration failed: " + error.message);
    }
}

// --- LOGIN LOGIC ---
async function handleLogin() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        await signInWithEmailAndPassword(auth, email, password);
        // The onAuthStateChanged watcher below will handle the rest
    } catch (error) {
        alert("Login failed: " + error.message);
    }
}

// --- THE WATCHER (The Bouncer) ---
onAuthStateChanged(auth, (user) => {
    if (user) {
        if (user.emailVerified) {
            console.log("User is verified!");
            showAppPage();
            displayTreasureList();
        } else {
            alert("Please verify your email before logging in.");
            signOut(auth);
            showAuthPage();
        }
    } else {
        showAuthPage();
    }
});

// --- LIST LOGIC ---
async function displayTreasureList() {
    const listDiv = document.getElementById('user-task-list');
    const user = auth.currentUser;
    if (!user) return;

    listDiv.innerHTML = "Loading your hunt...";

    try {
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
                const isChecked = savedProgress[itemId] === true ? "checked" : "";

                const itemHtml = `
                    <div class="checklist-row">
                        <input type="checkbox" id="${itemId}" class="treasure-check" ${isChecked}>
                        <label for="${itemId}">${treasureName}</label>
                    </div>
                `;
                listDiv.insertAdjacentHTML('beforeend', itemHtml);
            });

            setupCheckboxListeners();
            checkCompletion(); // Run once after items are drawn
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
                console.log("Progress saved!");
                checkCompletion();
            }
        });
    });
}

function checkCompletion() {
    const checkboxes = document.querySelectorAll('.treasure-check');
    const congratsMsg = document.getElementById('congrats-msg');
    if (!congratsMsg) return;

    const totalItems = checkboxes.length;
    const checkedItems = Array.from(checkboxes).filter(box => box.checked).length;

    if (totalItems > 0 && checkedItems === totalItems) {
        congratsMsg.style.display = 'block';
        document.getElementById('app-container').style.borderColor = '#28a745';
    } else {
        congratsMsg.style.display = 'none';
        document.getElementById('app-container').style.borderColor = 'transparent';
    }
}

// --- EVENT LISTENERS ---
const loginBtn = document.getElementById('login-btn');
const signupBtn = document.getElementById('signup-btn');
const logoutBtn = document.getElementById('logout-btn');

if (loginBtn) {
    loginBtn.addEventListener('click', handleLogin);
}

if (signupBtn) {
    signupBtn.addEventListener('click', handleRegister);
}

if (logoutBtn) {
    logoutBtn.addEventListener('click', () => signOut(auth));
}
