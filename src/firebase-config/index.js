import { initializeApp } from "firebase/app";

const firebaseConfig = {
  apiKey: "AIzaSyCe-EX0yRPbCkCvtTs_zxCY9JoyWnjaiXo",
  authDomain: "testing-a0957.firebaseapp.com",
  databaseURL: "https://testing-a0957-default-rtdb.firebaseio.com",
  projectId: "testing-a0957",
  storageBucket: "testing-a0957.firebasestorage.app",
  messagingSenderId: "787946767008",
  appId: "1:787946767008:web:0452760f2b74e1581a7fc5",
  measurementId: "G-DYNKK0CHEG",
};

// Initialize Firebase
const firebase = initializeApp(firebaseConfig);
export default firebase;
