<script type="module">
  // Import the functions you need from the SDKs you need
  import { initializeApp } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-app.js";
  import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-analytics.js";
  // TODO: Add SDKs for Firebase products that you want to use
  // https://firebase.google.com/docs/web/setup#available-libraries

  // Your web app's Firebase configuration
  // For Firebase JS SDK v7.20.0 and later, measurementId is optional
  const firebaseConfig = {
    apiKey: "AIzaSyA-Iy2Uli9_9ebdJZyVK5RpLKwZF3XrdY4",
    authDomain: "lirtr-2fc4d.firebaseapp.com",
    projectId: "lirtr-2fc4d",
    storageBucket: "lirtr-2fc4d.firebasestorage.app",
    messagingSenderId: "7328042961",
    appId: "1:7328042961:web:c48e7218070ec942c55af0",
    measurementId: "G-RV6TWLBKYQ"
  };

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const analytics = getAnalytics(app);
</script>
