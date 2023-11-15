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
  updateDoc,
  deleteDoc,
} from "firebase/firestore";

import * as CONTROLLER from "./index";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

var memberSignedIn = false;
var curMemberEmail = "";
var curAcctId = 0;
var docID = "";

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

async function getAccountsForDeposit() {
  let currentMember = await getMemberNumber();

  const q = query(
    collection(db, "Accounts"),
    where("memberNo", "==", currentMember)
  );

  const querySnapshot = await getDocs(q);
  showDepositOptions(querySnapshot);
}

function showDepositOptions(querySnapshot) {
  if (querySnapshot.docs.length > 0) {
    $("#account-options").html("");

    querySnapshot.forEach((doc) => {
      $("#account-options").append(
        `<option value="${doc.data().accountNo}" id="${doc.data().accountNo}">${
          doc.data().accountName
        }</option>`
      );
    });
  } else {
    console.log("No data found");
  }
}

async function makeAccountDeposit() {
  let accountID = $("#account-options").val();
  let quickDesc = $("#quickDesc").val();
  let longDesc = $("#longDesc").val();
  let depositAmount = new Number($("#depositAmount").val());
  let oldBalance, newBalance;
  let accountRef;

  if (
    accountID == "" ||
    quickDesc == "" ||
    longDesc == "" ||
    depositAmount == ""
  ) {
    $("#error-box").html(`<p>Please fill out all fields.</p>`);
  } else {
    const q = query(
      collection(db, "Accounts"),
      where("accountNo", "==", accountID)
    );
    const querySnapshot = await getDocs(q);

    if (querySnapshot.docs.length > 0) {
      querySnapshot.forEach((doc) => {
        oldBalance = new Number(doc.data().accountBal);

        newBalance = oldBalance + depositAmount;

        accountRef = doc.id;
      });
      const acctRef = doc(db, "Accounts", accountRef);
      await updateDoc(acctRef, {
        accountBal: String(newBalance.toFixed(2)),
      });

      var fullDate = new Date();
      //convert month to 2 digits
      var twoDigitMonth =
        fullDate.getMonth().length + 1 === 1
          ? fullDate.getMonth() + 1
          : "0" + (fullDate.getMonth() + 1);

      var currentDate =
        fullDate.getDate() + "/" + twoDigitMonth + "/" + fullDate.getFullYear();

      let newDeposit = {
        accountNo: accountID,
        amount: String(depositAmount.toFixed(2)),
        description: quickDesc,
        isWithdrawal: false,
        longDescription: longDesc,
        transactionDate: currentDate,
      };

      try {
        const docRef = await addDoc(collection(db, "Transactions"), newDeposit);
        alert("Deposit successful");
        changePage("services");
      } catch (e) {
        console.log(e);
      }
    } else {
      console.log("Error, no account found");
    }
  }
}

async function makeAccountTransfer() {
  let accountID = $("#account-options").val();
  let quickDesc = $("#quickDesc").val();
  let longDesc = $("#longDesc").val();
  let transferAmount = new Number($("#transferAmount").val());
  let transferDestination = $("#transferDestination").val();
  let oldSourceBalance,
    newSourceBalance,
    oldTransferBalance,
    newTransferBalance;
  let sourceAccountRef, transferAccountRef;

  if (
    accountID == "" ||
    quickDesc == "" ||
    longDesc == "" ||
    transferAmount == "" ||
    transferDestination == ""
  ) {
    $("#error-box").html(`<p>Please fill out all fields.</p>`);
  } else {
    // get first account
    const q1 = query(
      collection(db, "Accounts"),
      where("accountNo", "==", accountID)
    );
    const querySnapshot = await getDocs(q1);
    const q2 = query(
      collection(db, "Accounts"),
      where("accountNo", "==", transferDestination)
    );
    const secondSnapshot = await getDocs(q2);

    if (querySnapshot.docs.length > 0 && secondSnapshot.docs.length > 0) {
      querySnapshot.forEach((doc) => {
        oldSourceBalance = new Number(doc.data().accountBal);

        newSourceBalance = oldSourceBalance - transferAmount;
        if (newSourceBalance < 0) {
          $("#error-box").html("Insufficient funds.");
          return;
        }

        sourceAccountRef = doc.id;
      });

      secondSnapshot.forEach((doc) => {
        oldTransferBalance = new Number(doc.data().accountBal);

        newTransferBalance = oldTransferBalance + transferAmount;

        transferAccountRef = doc.id;
      });
      const sourceAcctRef = doc(db, "Accounts", sourceAccountRef);
      await updateDoc(sourceAcctRef, {
        accountBal: String(newSourceBalance.toFixed(2)),
      });

      const transferAcctRef = doc(db, "Accounts", transferAccountRef);
      await updateDoc(transferAcctRef, {
        accountBal: String(newTransferBalance.toFixed(2)),
      });

      var fullDate = new Date();
      //convert month to 2 digits
      var twoDigitMonth =
        fullDate.getMonth().length + 1 === 1
          ? fullDate.getMonth() + 1
          : "0" + (fullDate.getMonth() + 1);

      var currentDate =
        fullDate.getDate() + "/" + twoDigitMonth + "/" + fullDate.getFullYear();

      let newWithdrawal = {
        accountNo: accountID,
        amount: String(transferAmount.toFixed(2)),
        description: quickDesc,
        isWithdrawal: true,
        longDescription: longDesc,
        transactionDate: currentDate,
      };
      let newDeposit = {
        accountNo: transferDestination,
        amount: String(transferAmount.toFixed(2)),
        description: quickDesc,
        isWithdrawal: false,
        longDescription: longDesc,
        transactionDate: currentDate,
      };

      try {
        const docRef = await addDoc(
          collection(db, "Transactions"),
          newWithdrawal
        );
        const docRef2 = await addDoc(
          collection(db, "Transactions"),
          newDeposit
        );
        alert("Transfer successful");
        changePage("services");
      } catch (e) {
        console.log(e);
      }
    } else {
      console.log("Error, no account found");
      alert("Error: please try again.");
    }
  }
}

async function getAccountDetails() {
  const q = query(
    collection(db, "Accounts"),
    where("accountNo", "==", String(curAcctId))
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
      <h2 id="member-ID">Member Number: ${doc.data().memberNo}</h2>

      <div class="row">
          <a href="#deposit"><button>Make a Deposit</button></a>
          <a href="#transfers"><button>Make a Transfer</button></a>
          <a href="#closeBankAccount"  onclick="viewAccountDetails(${
            doc.data().accountNo
          })"><button>Close this Account</button></a>
      </div>`);
      $("#balance").html(`$${doc.data().accountBal}`);
    });
  } else {
    console.log("No data found");
  }
}

async function getAccountForDeletion() {
  const q = query(
    collection(db, "Accounts"),
    where("accountNo", "==", String(curAcctId))
  );

  const querySnapshot = await getDocs(q);
  showAccountForDeletion(querySnapshot);
}

function showAccountForDeletion(querySnapshot) {
  if (querySnapshot.docs.length > 0) {
    querySnapshot.forEach((doc) => {
      $(".close-account").html(`<h1>Close Account</h1>
      <h2>Account: ${doc.data().accountNo}</h2>

      <div class="form">
          <div id="error-box">
          </div>

          <label for="account">Selected account number:</label>
          <input type="text" id="${doc.data().accountNo}" value="${
        doc.data().accountNo
      }" disabled>
          <label for="account">Selected account name:</label>
          <input type="text" id="${doc.data().accountName}" value="${
        doc.data().accountName
      }" disabled>

          <label for="memberNo">Please enter your member number to close this account</label>
          <input type="number" name="memberNo" id="memberNo" placeholder="Enter your member number...">
          <input type="number" name="memberNo2" id="memberNo2" placeholder="Confirm member number...">

          <p>By hitting the button below, you understand that this account will be permanently closed and any
              remaining funds will become inaccessible.</p>
          <a href="#confirmDeleteAccount"><button>Close this Account</button></a>
      </div>`);
      docID = doc.id;
    });
  } else {
    console.log("No data found");
  }
}

async function confirmDeleteAccount() {
  if ($("#memberNo").val() === "" || $("#memberNo2").val() === "") {
    $("#error-box").html(`<p>Please fill out all fields.</p>`);
  } else if ($("#memberNo").val() != $("#memberNo2").val()) {
    $("#error-box").html(`<p>Member number does not match.</p>`);
  } else {
    try {
      await deleteDoc(doc(db, "Accounts", docID));
      docID = "";
      alert("Delete successful.");
      changePage("services");
    } catch (e) {
      console.log(e);
    }
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

async function showMemberDetails() {
  let currentMember = await getMemberNumber();

  $("#memberNumber").val(currentMember);
  $("#fullName").val(auth.currentUser.displayName);
  $("#email").val(auth.currentUser.email);
}

function editMemberDetails() {
  updateProfile(auth.currentUser, {
    displayName: $("#fullName").val(),
    email: $("#email").val(),
  })
    .then(() => {
      alert("Your information has been updated.");

      $("#name").html(`Welcome, ${auth.currentUser.displayName}!`);
      curMemberEmail = auth.currentUser.email;
      changePage("services");
    })
    .catch((error) => {
      console.log("An error has occurred. ", error.message);
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
    accountNo: String(generateAccountNumber()),
    accountBal: "5.00",
    memberNo: memberNo,
    accountName: "Savings",
  };
  var fullDate = new Date();
  //convert month to 2 digits
  var twoDigitMonth =
    fullDate.getMonth().length + 1 === 1
      ? fullDate.getMonth() + 1
      : "0" + (fullDate.getMonth() + 1);

  var currentDate =
    fullDate.getDate() + "/" + twoDigitMonth + "/" + fullDate.getFullYear();
  //19/05/2011
  let initDeposit = {
    accountNo: account.accountNo,
    amount: "5.00",
    description: "Initial deposit",
    isWithdrawal: false,
    longDescription: "Initial deposit upon opening account",
    transactionDate: currentDate,
  };
  try {
    const docRef = await addDoc(collection(db, "Accounts"), account);
    const docRef2 = await addDoc(collection(db, "Transactions"), initDeposit);
  } catch (e) {
    console.log(e);
  }
}

async function openNewAccount() {
  let currentMember = await getMemberNumber();

  if (
    $("#memberNo").val() === "" ||
    $("#memberNo2").val() === "" ||
    $("#accountName").val() === "" ||
    $("#accountBal").val() === ""
  ) {
    $("#error-box").html(`<p>Please fill out all fields.</p>`);
  } else if (
    currentMember != $("#memberNo").val() ||
    currentMember != $("#memberNo2").val()
  ) {
    $("#error-box").html(`<p>Incorrect member number.</p>`);
  } else if ($("#memberNo").val() != $("#memberNo2").val()) {
    $("#error-box").html(`<p>Member number does not match.</p>`);
  } else {
    var fullDate = new Date();
    //convert month to 2 digits
    var twoDigitMonth =
      fullDate.getMonth().length + 1 === 1
        ? fullDate.getMonth() + 1
        : "0" + (fullDate.getMonth() + 1);

    var currentDate =
      fullDate.getDate() + "/" + twoDigitMonth + "/" + fullDate.getFullYear();
    //19/05/2011
    let account = {
      accountNo: String(generateAccountNumber()),
      accountBal: $("#accountBal").val(),
      memberNo: Number($("#memberNo").val()),
      accountName: $("#accountName").val(),
    };

    let initDeposit = {
      accountNo: account.accountNo,
      amount: account.accountBal,
      description: "Initial deposit",
      isWithdrawal: false,
      longDescription: "Initial deposit upon opening account",
      transactionDate: currentDate,
    };

    try {
      const docRef = await addDoc(collection(db, "Accounts"), account);
      const docRef2 = await addDoc(collection(db, "Transactions"), initDeposit);

      changePage("portal");
      getAllAccounts();
    } catch (e) {
      console.log(e);
    }
  }
}

function signout() {
  signOut(auth)
    .then(() => {})
    .catch((error) => {
      console.log("error", error.message);
    });
}

function signInByEmail() {
  let email = $("#email").val();
  let pw = $("#password").val();

  signInWithEmailAndPassword(auth, email, pw)
    .then((userCredentials) => {})
    .catch((error) => {
      console.log("An error has occurred. ", error.message);
      changePage("home");
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
    $("#app").html(data);
  });

  if (pageID == "home") {
    signout();
  }
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
    case "open-account":
      changePage("open-account");
      break;
    case "createAccount":
      openNewAccount();
      break;
    case "deposit":
      changePage("deposit");
      getAccountsForDeposit();
      break;
    case "makeDeposit":
      makeAccountDeposit();
      break;
    case "transfers":
      changePage("transfers");
      getAccountsForDeposit();
      break;
    case "makeTransfer":
      makeAccountTransfer();
      break;
    case "closeBankAccount":
      changePage("close-account");
      getAccountForDeletion();
      break;
    case "confirmDeleteAccount":
      confirmDeleteAccount();
      break;
    case "update-details":
      changePage("update-details");
      showMemberDetails();
      break;
    case "editMemberDetails":
      editMemberDetails();
      break;
    default:
      signout();
      changePage("home");
      CONTROLLER.changeToMain();
      break;
  }
}
