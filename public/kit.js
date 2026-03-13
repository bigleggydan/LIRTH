import { firebaseConfig } from './firebase-config.js';
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Your Firebase Config (Copy from app.js)
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const orderForm = document.getElementById('order-form');

const genderSelect = document.getElementById('gender');
const maleGroup = document.getElementById('male-sizes-group');
const femaleGroup = document.getElementById('female-sizes-group');

genderSelect.addEventListener('change', function() {
    console.log("Gender changed to:", this.value); // If you don't see this in console, the link is broken

    if (this.value === 'female') {
        maleGroup.style.display = 'none';
        femaleGroup.style.display = 'block';
    } else {
        maleGroup.style.display = 'block';
        femaleGroup.style.display = 'none';
    }
});

orderForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Pick the size from whichever box is currently visible
    const finalSize = (genderSelect.value === 'female') 
        ? document.getElementById('female-size').value 
        : document.getElementById('male-size').value;

    const orderData = {
        name: document.getElementById('order-name').value,
        gender: genderSelect.value,
        size: finalSize,
        status: "pending",
        timestamp: new Date()
    };

    try {
        await addDoc(collection(db, "orders"), orderData);
        document.getElementById('order-status').innerText = "Order placed! We'll be in touch.";
        orderForm.reset();
    } catch (error) {
        console.error("Order failed:", error);
    }
});