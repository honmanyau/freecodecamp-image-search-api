'use strict'

const xhr = new XMLHttpRequest();
const form = document.getElementById("shortener-form");
const textInput = document.getElementById("input-text");
const pageInput = document.getElementById("input-page");
const output = document.getElementById("output-area");

form.addEventListener("submit", (event) => {
  event.preventDefault();
  
  output.innerHTML = "<code>--Retrieving--</code>";
  
  // Request for data from the server using the serach phrase and page number provided by the user
  xhr.open("GET", "https://honmanyau-fcc-image-search-api.glitch.me/api?page=" + pageInput.value + "&q=" + textInput.value, true);
  xhr.onload = (event) => {
    output.innerHTML = "";

    const data = JSON.parse(event.target.response);
    const results = data.results;
    
    if (results.length) {
      for (let i = 0; i < results.length; i ++) {
        output.innerHTML +=
          "<div class=\"result-container\">" +
            "<img src=\"" + results[i].thumbnail + "\" alt=\"" + results[i].snippet + "\" class=\"thumbnail\" />" +
            "<div>" +
              "<p><strong>" + "URL</strong>:" + "<br />" + "<a href=\"" + results[i].url + "\">" + results[i].url + "</a>" + "</p>" +
              "<p><strong>" + "Context</strong>: " + "<br />" + results[i].context + "</p>" +
              "<p><strong>" + "Snippet</strong>: " + "<br />" + results[i].snippet + "</p>" +
            "</div>" +
          "</div>"
      }
    }
    else if (data.error) {
      output.innerHTML = data.error;
    }
    else {
      output.innerHTML = "You have either exhausted the daily limit of API calls or you managed to break the app.  :c";
    }
  }
  xhr.send();
  
});
