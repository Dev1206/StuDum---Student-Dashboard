import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
    apiKey: "AIzaSyBX5ZXxeFZI3m6FrAAf7nE-9kNWgqA3x38",
    authDomain: "studentdashboard-f1284.firebaseapp.com",
    projectId: "studentdashboard-f1284",
    storageBucket: "studentdashboard-f1284.firebasestorage.app",
    messagingSenderId: "347551992150",
    appId: "1:347551992150:web:4012a2c88090f6dce2eef7",
    measurementId: "G-GPG2XVRZV0"
};

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)