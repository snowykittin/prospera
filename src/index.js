import * as MODEL from "./model.js";

function initURLListener() {
  $(window).on("hashchange", MODEL.changeRoute);
  MODEL.changeRoute();
}

// Functions to change navigation appearance
var mainNav = document.getElementById("main-nav");
var altNav = document.getElementById("alt-nav");
var mainFooter = document.getElementById("main-footer");
var altFooter = document.getElementById("alt-footer");
export function changeToMain() {
  mainNav.style.display = "flex";
  altNav.style.display = "none";
  mainFooter.style.display = "flex";
}
export function changeToAlt() {
  mainNav.style.display = "none";
  altNav.style.display = "flex";
  altFooter.style.display = "flex";
  mainFooter.style.display = "none";
}

export function logInUserListener() {
  $("#login-btn").on("click", (e) => {
    e.preventDefault();
    MODEL.anonSignIn();
  });
}

$(document).ready(function () {
  initURLListener();
});
