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
import {
  getFirestore,
  getDoc,
  collection,
  getDocs,
  addDoc,
  where,
  query,
  doc,
} from "firebase/firestore";

import * as CONTROLLER from "./index";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

var memberSignedIn = false;
var curMemberEmail = "";

onAuthStateChanged(auth, (user) => {
  if (user != null) {
    console.log("Logged in.", user.email);
    $("#name").html(`Welcome, ${user.displayName}!`);
    $("#visitor-options").css("display", "none");
    $("#member-options").css("display", "flex");
    memberSignedIn = true;
    curMemberEmail = user.email;
  } else {
    console.log("Logged out.");
    $("#name").html(`Welcome, [member]!`);
    $("#member-options").css("display", "none");
    $("#visitor-options").css("display", "flex");
    memberSignedIn = false;
    curMemberEmail = "";
  }
});

async function getMemberNumber() {
  const q = query(
    collection(db, "Members"),
    where("memberEmail", "==", curMemberEmail)
  );

  const querySnapshot = await getDocs(q);
  let curMemberNo = 0;
  if (querySnapshot.docs.length > 0) {
    querySnapshot.forEach((doc) => {
      curMemberNo = doc.data().memberNo;
    });
  }

  return curMemberNo;
}

async function getAllAccounts() {
  let currentMember = await getMemberNumber();

  const q = query(
    collection(db, "Accounts"),
    where("memberNo", "==", currentMember)
  );

  const querySnapshot = await getDocs(q);
  showAllAccounts(querySnapshot);
}

function showAllAccounts(querySnapshot) {
  if (querySnapshot.docs.length > 0) {
    $(".account-overview").html("");

    querySnapshot.forEach((doc) => {
      $(".account-overview").append(`<div class="account" id="accountDetails">
      <h3>${doc.data().accountName}</h3>
      <h2>$${doc.data().accountBal}</h2>
      <h4>${doc.data().accountNo}</h4>
      <input type="hidden" value="${doc.data().accountNo}">
  </div>`);
    });
  } else {
    console.log("No data found");
  }
}

function generateMemberNumber() {
  var min = 100000; // Minimum value (inclusive) for a 6-digit number
  var max = 999999; // Maximum value (inclusive) for a 6-digit number
  var randomNumber = Math.floor(Math.random() * (max - min + 1)) + min;
  return randomNumber;
}

function generateAccountNumber() {
  var min = 1000000;
  var max = 9999999;
  var randomNumber = Math.floor(Math.random() * (max - min + 1)) + min;
  return randomNumber;
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
        let memberNumber = generateMemberNumber();
        updateUserCredentials(fullName);
        createNewMember(email, memberNumber);
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

async function createNewMember(email, memberNum) {
  let member = {
    memberEmail: email,
    memberNo: memberNum,
  };

  try {
    const docRef = await addDoc(collection(db, "Members"), member);

    createNewBankAccount(memberNum);
  } catch (e) {
    console.log(e);
  }
}

async function createNewBankAccount(memberNo) {
  let account = {
    accountNo: generateAccountNumber(),
    accountBal: "5.00",
    memberNo: memberNo,
    accountName: "Savings",
  };
  try {
    const docRef = await addDoc(collection(db, "Accounts"), account);
  } catch (e) {
    console.log(e);
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

export async function changeRoute() {
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
      signout();
      CONTROLLER.changeToMain();
      break;
    case "register":
      changePage("register");
      CONTROLLER.changeToAlt();
      break;
    case "portal":
      if (memberSignedIn) {
        changePage("portal");
        getAllAccounts();
        CONTROLLER.changeToAlt();
      } else {
        changePage("home");
        signout();
        CONTROLLER.changeToMain();
      }
      break;
    case "signInUser":
      signInByEmail();
      changePage("services");
      break;
    case "createNewUser":
      createUser();
      changePage("services");
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
