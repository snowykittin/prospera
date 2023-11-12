// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { firebaseConfig } from "./firebaseConfig";
import {
  signOut,
  getAuth,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithEmailAndPassword,
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
    $("#name").html(`Welcome, ${user.displayName}!`);
    $("#visitor-options").css("display", "none");
    $("#member-options").css("display", "flex");
  } else {
    console.log("Logged out.");
    $("#name").html(`Welcome, [member]!`);
    $("#member-options").css("display", "none");
    $("#visitor-options").css("display", "flex");
  }
});

async function getAllData() {
  const querySnapshot = await getDocs(collection(db, "Pirates"));

  querySnapshot.forEach((doc) => {
    $("#data").append(`<p>${doc.data().firstName}</p>`);
  });
}

function createUser() {
  //validate inputs
  if (
    $("#fName").val() === "" ||
    $("#lName").val() === "" ||
    $("#email").val() === "" ||
    $("#password").val() === "" ||
    $("#password2").val() === ""
  ) {
    $("#error-box").html(`<p>Please fill out all fields.</p>`);
  } else if ($("#password").val() != $("#password2").val()) {
    $("#error-box").html(`<p>Passwords do not match.</p>`);
  } else {
    let fName = $("#fName").val();
    let lName = $("#lName").val();
    let fullName = fName.concat(" ", lName);
    let email = $("#email").val();
    let pw = $("#password").val();

    createUserWithEmailAndPassword(auth, email, pw)
      .then((userCredentials) => {
        updateUserCredentials(fullName);
        $("#name").html(`Welcome, ${fullName}!`);
        console.log("Created new user ", userCredentials.user);
        $("#fName").val("");
        $("#lName").val("");
        $("#email").val("");
        $("#password").val("");
        $("#password2").val("");
      })
      .catch((error) => {
        console.log("An error has occurred. ", error.message);
      });
  }
}

function signout() {
  signOut(auth)
    .then(() => {
      console.log("Signing out user");
    })
    .catch((error) => {
      console.log("error", error.message);
    });
}

function signInByEmail() {
  let email = $("#email").val();
  let pw = $("#password").val();

  signInWithEmailAndPassword(auth, email, pw)
    .then((userCredentials) => {
      console.log("Signed in as ", userCredentials.user);
    })
    .catch((error) => {
      console.log("An error has occurred. ", error.message);
    });
}

function updateUserCredentials(name) {
  updateProfile(auth.currentUser, {
    displayName: name,
  })
    .then(() => {
      console.log("Changed.");
    })
    .catch((error) => {
      console.log("An error has occurred. ", error.message);
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
      signInByEmail();
      break;
    case "createNewUser":
      createUser();
      break;
    case "logout":
      signout();
      break;
    default:
      signout();
      changePage("home");
      CONTROLLER.changeToMain();
      break;
  }
}
