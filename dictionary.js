//====
// dictionary.js
// Pass into validatePropertyValuePairs() in csslint.js.
// Checks for property/value validity, including colors, %s, etc...
//====

//====
// Checks if value is one of CSS"s default values or of the form "#XXXXXX", or
// "#XXX".
// TODO: support for "rgb(...)" and "rgba(...)".
//====
var isColor = function(value){
	var regex = /^#([0-9a-fA-F]{3}$|[0-9a-fA-F]{6}$)/;
	var colors = ["aliceblue", "antiquewhite", "aqua", "aquamarine", "azure", 
	 			  "beige", "bisque", "black", "blanchedalmond", "blue", 
	 			  "blueviolet", "brown", "burlywood", "cadetblue", "chartreuse", 
	 			  "chocolate", "coral", "cornflowerblue", "cornsilk", "crimson", 
	 			  "cyan", "darkblue", "darkcyan", "darkgoldenrod", "darkgray", 
	 			  "darkgreen", "darkkhaki", "darkmagenta", "darkolivegreen", 
	 			  "darkorange", "darkorchid", "darkred", "darksalmon", 
	 			  "darkseagreen", "darkslateblue", "darkslategray", 
	 			  "darkturquoise", "darkviolet", "deeppink", "deepskyblue", 
	 			  "dimgray", "dodgerblue", "firebrick", "floralwhite", 
	 			  "forestgreen", "fuchsia", "gainsboro", "ghostwhite", "gold", 
	 			  "goldenrod", "gray", "green", "greenyellow", "honeydew", 
	 			  "hotpink", "indianred", "indigo", "ivory", "khaki", 
	 			  "lavender", "lavenderblush", "lawngreen", "lemonchiffon", 
	 			  "lightblue", "lightcoral", "lightcyan", 
	 			  "lightgoldenrodyellow", "lightgray", "lightgreen", 
	 			  "lightpink", "lightsalmon", "lightseagreen", "lightskyblue", 
	 			  "lightslategray", "lightsteelblue", "lightyellow", "lime", 
	 			  "limegreen", "linen", "magenta", "maroon", "mediumaquamarine", 
	 			  "mediumblue", "mediumorchid", "mediumpurple", 
	 			  "mediumseagreen", "mediumslateblue", "mediumspringgreen", 
	 			  "mediumturquoise", "mediumvioletred", "midnightblue", 
	 			  "mintcream", "mistyrose", "moccasin", "navajowhite", "navy", 
	 			  "oldlace", "olive", "olivedrab", "orange", "orangered", 
	 			  "orchid", "palegoldenrod", "palegreen", "paleturquoise", 
	 			  "palevioletred", "papayawhip", "peachpuff", "peru", "pink", 
	 			  "plum", "powderblue", "purple", "red", "rosybrown", 
	 			  "royalblue", "saddlebrown", "salmon", "sandybrown", 
	 			  "seagreen", "seashell", "sienna", "silver", "skyblue", 
	 			  "slateblue", "slategray", "snow", "springgreen", "steelblue", 
	 			  "tan", "teal", "thistle", "tomato", "turquoise", "violet", 
	 			  "wheat", "white", "whitesmoke", "yellow", "yellowgreen"];
	if(regex.test(value) === true){
		// matches "#XXXXXX" or "#XXX" form
		return true;
	} else {
		for(var i = 0; i < colors.length; i++){
			var color = colors[i];
			if(value === color){
				// CSS default color
				return true;
			}
		}
		// not a color
		return false;
	}
}

//====
// Checks if value is of the form "XYYpx", "XYYem", or "XYY%", where X is any
// digit between 1-9, and Y is any didgit between 0-9.
//====
var isMeasurement = function(value){
	var regex = /[1-9]\d*(px|%|em)/;
	return regex.test(value);
}

//====
// Checks if value is of the form "url('...')" (allowing " and ').
//====
var isUrl = function(value){
	var regex = /url\(["|''].+["|']\)/;
	return regex.test(value);
}

//====
// Dictionary of CSS properties and their accepted values.
// TODO: add to more properties and values to the dictionary.
//====
module.exports = {
	// background properties
	background: [isColor, isUrl],
	// positioning properties
	position: ["static", "absolute", "fixed", "relative", "inherit"],
	// color properties
	color: [isColor]
}