'use strict'

const https = require('https');
const http = require('http');
const express = require('express');
const apiCall = require('request');
const mongodb = require("mongodb");
const mongoose = require("mongoose");
const autoIncrement = require('mongoose-auto-increment');

const app = express();

/* Initialise connection to Mongo database */
autoIncrement.initialize(mongoose.connect(process.env.MONGO_URI));
mongoose.connection.on("error", (error) => {
  console.log("Error occured while connecting to databse—" + error);
});
mongoose.connection.once("open", () => {
  console.log("Connected to database!")
});

/* Schema for databse */
const searchStringSchema = mongoose.Schema({
  searchString: String,
  count: {type: Number, default: 0},
  created: {type: Date, default: Date.now},
  searched: {type: Date, default: Date.now}
});

/* Model for databse */
searchStringSchema.plugin(autoIncrement.plugin, "searchString");
const searchString = mongoose.model("searchString", searchStringSchema);

/* Express middlewares and methods for handling requests */
app.use(express.static('public'));

app.use((request, response, next) => {
  console.log(request.method + " " + request.url + " " + request.params);
  next();
})

app.get("/", (request, response) => {
  response.sendFile(__dirname + '/views/index.html');
});

app.get("/api", (request, response) => {
  if (!request.query.q) {
    response.send({
      "error": "Please specify a search phrase.  The value provided to the field \"q\" is used as the search phrase in this API."
    }); 
  }
  
  // Check whether or not the search string provided by the user already exists in the database
  searchString.find({searchString: request.query.q.toLowerCase()}, (error, results) => {
    if (error) {
      console.log("An error has occured when searching for a search string in the database—" + error);
    }
    
    // If the search string does not exist, create a new document for it
    if (!results.length) {
      const entry = new searchString({
        searchString: request.query.q.toLowerCase(),
      });
      
      entry.save((error, entry) => {
        if (error) {
          console.log("An error occured while creating a searchString document—" + error);
        }
        
        console.log("The following record has been updated: " + entry);
      })
    }
    // Increase the number of times that the search string has been used and update the last accessed date
    else {
      results[0].count += 1;
      results[0].searched = new Date().toISOString();
      results[0].save((error, updatedEntry) => {
        if (error) {
          console.log("An error occured while updating a searchString document—" + error);
        }
        
        console.log("The following record has been updated: " + updatedEntry);
      })
    }
  });
  
  if (!request.query.page) {
    request.query.page = 1;
  }
 
  const requestURL = "https://www.googleapis.com/customsearch/v1?key=" + process.env.CSE_KEY + "&cx=" + process.env.CSE_CX + "&safe=high&searchType=image&num=10&start=" + (1 + (request.query.page - 1) * 10) + "&q=" + request.query.q;
  
  apiCall(requestURL, (error, apiResponse, body) => {
    const data = JSON.parse(body);
    const searchTime = data.searchInformation.searchTime;
    const totalResults = data.searchInformation.totalResults;
    const results = data.items;
    let filteredResults = [];
    
    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      
      filteredResults.push({
        "url": result.link,
        "thumbnail": result.image.thumbnailLink,
        "snippet": result.snippet,
        "context": result.image.contextLink
      });
    }
    
    response.send(JSON.stringify({
      "page": request.query.page,
      "results": filteredResults
    }, null, 4));
  })
  
});


app.get("/top", (request, response) => {
  searchString.find({}).sort({count: -1}).limit(10).exec((error, results) => {
    response.json(results);
  });
});


// listen for requests :)
var listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});