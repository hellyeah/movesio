"use strict";
//TODO: Implement Angular
//implement whenever i need to save a scoped variable that stores the email -- maybe just use chrome storage

//TODO: when somehow firebase doesnt have email, query normally

//Moves.io
//Hit the make moves button on any startup website and get founder's email in an alert

//TODO: make it run as soon as the page loads 
//check firebase first for email
//if not, run it
//always query email from firebase when make moves is hit

//**JS LOADED BEFOREHAND**//
//warning: must declare js files in loading order in manifest
//asyncTracking.js -- linked up to Segment for analytics
//backend.js -- loads Parse/Firebase

//**REAL FUNCTIONS**//

//structure: when you click button, what happens?

//Initialize Firebase
var myFirebaseRef = new Firebase("https://moves-io.firebaseio.com/");

var getFirebaseJSON = function (callback) {
  //grabs and returns full firebase JSON
  myFirebaseRef.on("value", function(snapshot) {
    console.log(snapshot.val());  // Alerts "San Francisco"
    callback(snapshot.val());
  });
}

var saveFoundersEmailToFirebase = function(url, callback) {
  Parse.Cloud.run('getFoundersEmail', {url: url}, {
    success: function(result) {
      var blah = stripTLD(url);
      var payload = {};
      payload[blah] = result;
      // payload === {blah:result};
      //save to firebase
      myFirebaseRef.update(payload);
      //console.log(myFirebaseRef)
    },
    error: function(error) {
      console.log(error);
    }
  });
}

var stripTLD = function (url) {
  var n = url.indexOf('.');
  var domain = url.substring(0, n != -1 ? n : url.length);
  //console.log(domain);
  return domain
}
//stripTLD(stripSubdomains(parseUrl(tab.url).hostname))
console.log(stripTLD("hackmatch.com"))

//keys are just '_startup_' in ('_startup_' + '.com')
var checkIfURLExistsInFirebase = function (json, url) {
  var key = stripTLD(url)
  if(json.hasOwnProperty(key)){
    console.log('has key')
  } else {
    console.log('doesnt have key')
    saveFoundersEmailToFirebase("firebase.com", function() {
      console.log('saved founders email to firebase')
    })
  }
}
getFirebaseJSON(function(JSON) {
  //dynamically check subdomain
  //subdomain without .com stripSubdomains(hostname).?
  checkIfURLExistsInFirebase(JSON, "twitter.com")
})

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  // inject
  console.log('tab onUpdate')
  console.log(tab)
  //check if tab has url attribute
  //if so grab url and makey da moves
  if(tab.url.substring(0, 6) == "chrome") {
    //"chrome://newtab/"
    console.log('chrome tab')
  } else if(tab.url.substring(0, 4) == "http"){
    console.log('http')
  } else {
    console.log('else')
  }
});


var checkFirebaseForEmail = function (url) {
  //on page load
  //check firebase to see if an email exists for that url
  //if email isn't there yet, generate the email and save to firebase, then store it locally
  //if email is, store it locally to chrome storage

}

var saveEmailToFirebase = function (url) {
  //generates email with getEmailWithURL
  //saves to firebase with the stripped down url as the key

}

var returnFoundersEmail = function () {
  //returns the founders email by checking local variable
  //local variable is actually a function that queries from firebase
}


var getEmailWithURL = function (url) {
    //**crunchbase or team page search by url for founders names
    Parse.Cloud.run('getFoundersEmail', {url: url}, {
      success: function(result) {
        alert(result);
      },
      error: function(error) {
        console.log('failure');
      }
    });
};

var makeMoves = function(shortURL, fullURL) {
  //should already have JSON loaded
  getFirebaseJSON(function(JSON) {
    var domain = stripTLD(shortURL)
    if JSON.hasOwnProperty(domain) {
      alert(JSON[domain])
    } else {
      getEmailWithURL(shortURL);       
    }
  })


    saveSite(shortURL, fullURL);

    saveFoundersEmailToFirebase(shortURL, function() {
      console.log('saved founders email to firebase')
    })

    //chrome.extension.getBackgroundPage().console.log('Made Moves');
};

// Called when the user clicks on the browser action.
chrome.browserAction.onClicked.addListener(function(tab) {
  // No tabs or host permissions needed! 
  // tab.url is current url

  analytics.track('click', {
    category: 'sitesClicked',
    label: tab.url
  });

  var hostname = parseUrl(tab.url).hostname;

  console.log(Parse);
  makeMoves(stripSubdomains(hostname), tab.url);

});




//STORAGE - Chrome & Parse//

var appendToStorage = function(startup) {
  chrome.storage.sync.get(null, function(result) {
    //forsome reason this prints the new results with startup pushed
    console.log(result);
    result.startupsArray.push(startup);
    chrome.storage.sync.set({'startupsArray': result.startupsArray}, function() {});
  });
}

var saveSiteToParse = function(shortURL, longURL, callback) {
    var Startup = Parse.Object.extend("Startups");
    var startup = new Startup();
    startup.save({url: shortURL, longURL: longURL}).then(function(object) {
      callback('saved startup');
    });
}

var saveSite = function (shortURL, longURL) {
  saveSiteToParse(shortURL, longURL, function () {
    // console.log('saved site to parse');
  })

  //saveSiteToChrome(shortURL, longURL);
  appendToStorage(shortURL);
}


//HELPER FUNCTIONS//

var parseUrl = function (url) {
    var parser = document.createElement('a'),
        searchObject = {},
        queries, split, i;
    // Let the browser do the work
    parser.href = url;
    // Convert query string to object
    queries = parser.search.replace(/^\?/, '').split('&');
    for( i = 0; i < queries.length; i++ ) {
        split = queries[i].split('=');
        searchObject[split[0]] = split[1];
    }
    return {
        protocol: parser.protocol,
        host: parser.host,
        hostname: parser.hostname,
        port: parser.port,
        pathname: parser.pathname,
        search: parser.search,
        searchObject: searchObject,
        hash: parser.hash
    }
};

var numberOfPeriods = function (string) {
  return (string.match(/[.]/g) || []).length;
};

//**doesnt work for .co.uk right now or endings with multiple periods
//could just split the string from the right of 2nd to last period
var stripSubdomains = function (url) {
  if (numberOfPeriods(url) >= 2) {
    //remove one subdomain then call function recursively on that new url
    return stripSubdomains(url.replace(/^[^.]+\./g, ""));
  }
  else {
    return url;
  }
};

chrome.runtime.onInstalled.addListener(function(info){
    //    
    // info.reason should contain either "install" or "update"

    var sessionId = localStorage.getItem("session-id");

    if(!sessionId){
      localStorage.setItem("session-id", "random-session-id");
    }
});
