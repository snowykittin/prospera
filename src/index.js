import * as MODEL from "./model.js";

function initURLListener() {
  $(window).on("hashchange", MODEL.changeRoute);
  MODEL.changeRoute();
}

$(document).ready(function () {
  initURLListener();
});
