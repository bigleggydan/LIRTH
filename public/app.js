console.log("Button check:", document.getElementById('login-btn'));
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
    setDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

let isRegistering = false;

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

    //Reset the welcome message for next user
    const welcomeHeading = document.getElementById('welcome-user');
    if (welcomeHeading) welcomeHeading.innerText = "Welcome!";
}

// REGISTRATION FUNCTION
const signupBtn = document.getElementById('signup-btn');
if (signupBtn) {
    signupBtn.addEventListener('click', () => {
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;
        const firstName = document.getElementById('reg-first-name').value;

        if (!firstName) {
            alert("Please enter your first name.");
            return;
        }

        isRegistering = true; 

        createUserWithEmailAndPassword(auth, email, password)
            .then(async (userCredential) => {
                const user = userCredential.user;

                // Save to your 'users' folder in Firestore
                await setDoc(doc(db, "users", user.uid), {
                    firstName: firstName,
                    email: email,
                    createdAt: new Date()
                });

                await sendEmailVerification(user);
                alert("Account created! Please check your email for a verification link.");
                
                // Switch back to login view so they can sign in after verifying
                document.getElementById('signup-view').style.display = 'none';
                document.getElementById('login-view').style.display = 'block';
                
                isRegistering = false;
            })
            .catch((error) => {
                isRegistering = false;
                alert("Registration failed: " + error.message);
            });
    });
}

// LOGIN FUNCTION
const loginBtn = document.getElementById('login-btn');
if (loginBtn) {
    loginBtn.addEventListener('click', () => {
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        signInWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
                const user = userCredential.user;
                if (!user.emailVerified) {
                    alert("Please verify your email before logging in.");
                    signOut(auth);
                }
                // onAuthStateChanged handles the rest!
            })
            .catch((error) => {
                alert("Login failed: " + error.message);
            });
    });
}

// --- THE WATCHER (The Bouncer) ---
onAuthStateChanged(auth, (user) => {
    if (user && !isRegistering) { // Only act if we aren't currently signing up
        if (user.emailVerified) {
            console.log("User is verified!");
            showAppPage();
            updateWelcomeMessage(user);
            displayTreasureList();
        } else {
            alert("Please verify your email before logging in.");
            signOut(auth);
            showAuthPage();
        }
    }else if (!user && !isRegistering) { 
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

async function updateWelcomeMessage(user) {
    const welcomeHeading = document.getElementById('welcome-user');
    
    try {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const userData = docSnap.data();
            welcomeHeading.innerText = `Welcome, ${userData.firstName}!`;
        } else {
            welcomeHeading.innerText = "Welcome to the Hunt!";
        }
    } catch (error) {
        console.error("Error fetching user name:", error);
    }
}

// 1. The Toggle Links (to switch between views)
const goToSignup = document.getElementById('go-to-signup');
const goToLogin = document.getElementById('go-to-login');

if (goToSignup) {
    goToSignup.addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('login-view').style.display = 'none';
        document.getElementById('signup-view').style.display = 'block';
    });
}

if (goToLogin) {
    goToLogin.addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('signup-view').style.display = 'none';
        document.getElementById('login-view').style.display = 'block';
    });
}

// 2. The Logout Button
const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        const authMsg = document.getElementById('auth-message');
        const loginView = document.getElementById('login-view');
        
        signOut(auth).then(() => {
            // 1. Show the goodbye message
            if (authMsg) authMsg.innerText = "Goodbye! See you soon.";
            
            // 2. Hide the login form temporarily so they don't see "Welcome Back"
            if (loginView) loginView.style.display = 'none';
            
            showAuthPage();

            // 3. After 5 seconds, clear message and bring back the login form
            setTimeout(() => {
                if (authMsg) authMsg.innerText = "";
                if (loginView) loginView.style.display = 'block';
            }, 5000);
        });
    });
}