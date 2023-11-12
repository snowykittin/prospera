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
  altFooter.style.display = "none";
}
export function changeToAlt() {
  mainNav.style.display = "none";
  altNav.style.display = "flex";
  altFooter.style.display = "flex";
  mainFooter.style.display = "none";
}

window.dropdownMenu = function () {
  $(".dropdown-menu").toggleClass("flex-visible");
  $(".dropdown-menu").toggleClass("hidden");
};

$(document).ready(function () {
  initURLListener();
});
