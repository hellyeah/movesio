//Moves.io
//Hit the make moves button on any startup website and get founder's email in an alert

//**JS LOADED BEFOREHAND**//
//**MUST DECLARE IN MANIFEST -- ORDER MATTERS**//
//asyncTracking.js -- linked up to Segment for analytics
//backend.js -- loads Parse/Firebase

var asyncTracking = function () {

  // var _gaq = _gaq || [];
  // _gaq.push(['_setAccount', 'UA-56144706-1']);
  // _gaq.push(['_trackPageview']);

  // (function() {
  //   var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
  //   ga.src = 'https://ssl.google-analytics.com/ga.js';
  //   var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
  // })();
//Segment.io
// window.analytics=window.analytics||[],window.analytics.methods=["identify","group","track","page","pageview","alias","ready","on","once","off","trackLink","trackForm","trackClick","trackSubmit"],window.analytics.factory=function(t){return function(){var a=Array.prototype.slice.call(arguments);return a.unshift(t),window.analytics.push(a),window.analytics}};for(var i=0;i<window.analytics.methods.length;i++){var key=window.analytics.methods[i];window.analytics[key]=window.analytics.factory(key)}window.analytics.load=function(t){if(!document.getElementById("analytics-js")){var a=document.createElement("script");a.type="text/javascript",a.id="analytics-js",a.async=!0,a.src=("https://")+"cdn.segment.com/analytics.js/v1/"+t+"/analytics.min.js";var n=document.getElementsByTagName("script")[0];n.parentNode.insertBefore(a,n)}},window.analytics.SNIPPET_VERSION="2.0.9",
// window.analytics.load("Ng0ctItA2L");
// window.analytics.page();
// console.log('segment.io')

}
asyncTracking();


//**REAL FUNCTIONS**//

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
    getEmailWithURL(shortURL);

    saveSite(shortURL, fullURL);

    //chrome.extension.getBackgroundPage().console.log('Made Moves');
};

// Called when the user clicks on the browser action.
chrome.browserAction.onClicked.addListener(function(tab) {
  // No tabs or host permissions needed! 
  // tab.url is current url
  //**Analytics**//
  //do one for works and doesnt work
  //_gaq.push(['_trackPageview']);
  // analytics.track('clicked', {
  //   url: tab.url
  // });
console.log(tab.url);
  analytics.track('click', {
    category: 'sitesClicked',
    label: tab.url
  });





  // chrome.storage.sync.get("urls", function (result) {
  //       //channels = result.url;
  //       //console.log(result);
  //       //$("#channels").val(channels);
  // });
  // console.log("url: " + chrome.storage.sync.url);

  // chrome.extension.getBackgroundPage().console.log(tab.url);

  var hostname = parseUrl(tab.url).hostname;

  // console.log('blah')

  makeMoves(stripSubdomains(hostname), tab.url);

  chrome.tabs.executeScript({
    //can do something here to tab
    //code: 'document.body.style.backgroundColor="red"'
  });
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
