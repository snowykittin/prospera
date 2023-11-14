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
  QuerySnapshot,
} from "firebase/firestore";

import * as CONTROLLER from "./index";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

var memberSignedIn = false;
var curMemberEmail = "";
var curAcctId = 0;

onAuthStateChanged(auth, (user) => {
  if (user != null) {
    $("#name").html(`Welcome, ${user.displayName}!`);
    $("#visitor-options").css("display", "none");
    $("#member-options").css("display", "flex");
    memberSignedIn = true;
    curMemberEmail = user.email;
  } else {
    $("#name").html(`Welcome, [member]!`);
    $("#member-options").css("display", "none");
    $("#visitor-options").css("display", "flex");
    memberSignedIn = false;
    curMemberEmail = "";
    curAcctId = 0;
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

async function getAccountDetails() {
  const q = query(
    collection(db, "Accounts"),
    where("accountNo", "==", curAcctId)
  );

  const querySnapshot = await getDocs(q);
  showAccountDetails(querySnapshot);
}

function showAccountDetails(querySnapshot) {
  if (querySnapshot.docs.length > 0) {
    $(".acct-information").html("");

    querySnapshot.forEach((doc) => {
      $(".acct-information").html(`<h1>Account Summary</h1>
      <h2 id="acct-name">Account Name: ${doc.data().accountName}</h2>
      <h2 id="acct-ID">Account Number: ${doc.data().accountNo}</h2>

      <div class="row">
          <a href="#deposit"><button>Make a Deposit</button></a>
          <a href="#transfer"><button>Make a Transfer</button></a>
      </div>`);
      $("#balance").html(`$${doc.data().accountBal}`);
    });
  } else {
    console.log("No data found");
  }
}

function showAllAccounts(querySnapshot) {
  if (querySnapshot.docs.length > 0) {
    $(".account-overview").html("");

    querySnapshot.forEach((doc) => {
      $(".account-overview")
        .append(`<a href="#details"><div class="account" id="${
        doc.data().accountNo
      }" onclick="viewAccountDetails(this.id)">
      <h3>${doc.data().accountName}</h3>
      <h2>$${doc.data().accountBal}</h2>
      <h4>#${doc.data().accountNo}</h4>
  </div></a>`);
    });
  } else {
    console.log("No data found");
  }
}

window.viewAccountDetails = function (accountID) {
  curAcctId = accountID;
};

async function getAccountTransactions() {
  console.log(curAcctId);
  const q = query(
    collection(db, "Transactions"),
    where("accountNo", "==", curAcctId)
  );

  const querySnapshot = await getDocs(q);
  showTransactions(querySnapshot);
}

function showTransactions(querySnapshot) {
  if (querySnapshot.docs.length > 0) {
    $(".transactions-container").html("");

    querySnapshot.forEach((doc) => {
      let label = "";
      if (!doc.data().isWithdrawal) {
        label = "+";
      } else {
        label = "-";
      }
      $(".transactions-container").append(`
      <div class="transaction">
      <p class="date">${doc.data().transactionDate}</p>
      <p class="description">${doc.data().description}</p>
      <p class="amount">${label}$${doc.data().amount}</p>
      </div>
      `);
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
    case "services":
      changePage("services");
      break;
    case "logout":
      CONTROLLER.changeToMain();
      signout();
      changePage("home");
      break;
    case "details":
      changePage("details");
      getAccountDetails();
      getAccountTransactions();
      curAcctId = 0;
      break;
    default:
      signout();
      changePage("home");
      CONTROLLER.changeToMain();
      break;
  }
}
