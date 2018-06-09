'use strict';

var request = require("request");
var config = require("dotenv").config();
var Hashids = require("hashids");


export function handler(event, context, callback) {

  // Set the root URL according to the Netlify site we are within
  var rootURL =  process.env.URL + "/";
  var url = "https://api.netlify.com/api/v1/forms/" + process.env.ROUTES_FORM_ID + "/submissions/?access_token=" + process.env.API_AUTH;

  // get the details of what we are creating
  var destination = event.queryStringParameters['to'];
  var code = event.queryStringParameters['code'];
  
  if( !code ) {
	  // generate a unique short code (stupidly for now)
	  var hash = new Hashids();
	  var number = Math.round(new Date().getTime() / 100);
	  var code = hash.encode(number);
  }
  
  // ensure that a protocol was provided
  if(destination.indexOf("://") == -1) {
    destination = "http://" + destination;
  }

	request(url, function(err, response, body){

	// look for this code in our stash
	if(!err && response.statusCode === 200){
	  var routes = JSON.parse(body);

	  for(var item in routes) {
		// return the result when we find the match
		if(routes[item].data.code == code && routes[item].data.url == destination) {
		  console.log("We searched for " + code + " and we found " + routes[item].data.destination);
		  return callback(null, {
			statusCode: 200,
			headers: {"Content-Type": "application/json"},
			body: JSON.stringify({url: rootURL + code})
		  })
		} else if(routes[item].data.code == code && routes[item].data.url == !destination) {
		  console.log("We searched for " + code + " and we found " + routes[item].data.destination);
		  return callback(null, {
			statusCode: 200,
			headers: {"Content-Type": "application/json"},
			body: JSON.stringify({url: "Error: code already exists!"})
		  })
		}
	  }
	}
	});
  
  // prepare a payload to post
  var payload = {
    'form-name' : "routes",
    'destination': destination,
    'code': code,
    'expires': ""
  };

  // post the new route to the Routes form
  request.post({'url': rootURL, 'formData': payload }, function(err, httpResponse, body) {
    var msg;
    if (err) {
      msg = "Post to Routes stash failed: " + err;
    } else {
      msg = "Route registered. Site deploying to include it. " + rootURL + code
    }
    console.log(msg);
    // tell the user what their shortcode will be
    return callback(null, {
      statusCode: 200,
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({"url": rootURL + code})
    })
  });

  // ENHANCEMENT: check for uniqueness of shortcode
  // ENHANCEMENT: let the user provide their own shortcode
  // ENHANCEMENT: dont' duplicate existing routes, return the current one
  // ENHANCEMENT: allow the user to specify how long the redirect should exist for

}
