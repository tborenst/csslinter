var jsdom = require('jsdom');

//====
// Loads a window with a document of the given 'html' and jQuery loaded in.
// 'callback' should accept arguments: (err, window).
//====
module.exports = function(html, callback){
	jsdom.env(html, ["http://code.jquery.com/jquery.js"], 
		function (errors, window) {
    		if(errors){
    			callback(errors, null);
    		} else {
    			callback(null, window)
    		}
  		}
	);
}

