// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { firebaseConfig } from "./firebaseConfig";
import {
  signInAnonymously,
  signOut,
  getAuth,
  onAuthStateChanged,
} from "firebase/auth";
import { getFirestore, getDoc, collection, getDocs } from "firebase/firestore";

import * as CONTROLLER from "./index";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

onAuthStateChanged(auth, (user) => {
  if (user != null) {
    console.log("Logged in.");
  } else {
    console.log("Logged out.");
  }
});

async function getAllData() {
  const querySnapshot = await getDocs(collection(db, "Pirates"));

  querySnapshot.forEach((doc) => {
    $("#data").append(`<p>${doc.data().firstName}</p>`);
  });
}

function anonSignIn() {
  signInAnonymously(auth)
    .then(() => {
      console.log("Signed in");
    })
    .catch((error) => {
      console.log("error", error.message);
    });
}

function signout() {
  signOut(auth)
    .then(() => {
      console.log("Sign out");
    })
    .catch((error) => {
      console.log("error", error.message);
    });
}

function changePage(pageID) {
  $.get(`pages/${pageID}.html`, function (data) {
    console.log("Changing page to", pageID);
    $("#app").html(data);
  });
}

export function changeRoute() {
  let hashTag = window.location.hash;
  let pageID = hashTag.replace("#", "");
  //   console.log(hashTag + ' ' + pageID);

  switch (pageID) {
    case "login":
      changePage("login");
      CONTROLLER.changeToAlt();
      break;
    case "home":
      changePage("home");
      CONTROLLER.changeToMain();
      break;
    case "register":
      changePage("register");
      CONTROLLER.changeToAlt();
      break;
    case "signInUser":
      console.log("Signed in");
      break;
    default:
      changePage("home");
      CONTROLLER.changeToMain();
      break;
  }
}
