//====
// linebyline.js
// The purpose of this file, in contrast to 'csslint.js', is to perform a line-
// by-line analysis of a .CSS file in order to test things that the parser can't
// detect (such as spacing between words, etc...)
//====

var fs = require("fs");

//====
// Callback should accept (err, result), where result is an object:
// {err: boolean, messages: [errmsg1, errmsg2, ...]}
// Difference between 'err' and 'result' is that 'err' is for system error
// and 'result' contains the errors found by the linter itself.
//====
var analyzeCssFile = function(path, callback){
	fs.readFile(path, function(err, data){
		if(err) callback(err, null);
		var text = data.toString().replace(/\t/g, "    "); // tabs -> 4 spaces
		var result = analyzeCssText(text);
		callback(null, result);
	});
}

//====
// Returns an object:
// {err: boolean, messages: [errmsg1, errmsg2, ...]}
//====
var analyzeCssText = function(text){
	var lines = text.split("\n");
	lines = removeComments(lines);
	return validateSpacing(lines);
}

//====
// Takes in an array of strings representing text of a .CSS file and returns
// an array of string representing the same text with the comments taken out.
//====
var removeComments = function(lines){
	var result = [];            // lines with comments removed
	var insideComment = false;  // are we currently in a comment?
	for(var i = 0; i < lines.length; i++){
		var line = lines[i];
		// break lines into code and comments, delimit by '/*' or '*/'
		var broken = line.split(/\/\*|\*\//);
		var noCommentLine = "";
		for(var j = 0; j < broken.length; j++){
			// is this piece of text comment or code?
			var isComment = insideComment ? (j%2 === 0) : (j%2 === 1);
			if(!isComment){
				noCommentLine += broken[j];
			}
		}
		result.push(noCommentLine);
		// in the next line, will we be inside of a comment?
		insideComment = (broken.length%2 === 0) ? !insideComment : insideComment;
	}
	return result;
}

//====
// Removes all space characters in a given string starting at a given index.
// TODO: may be better to just "cut all after first space", faster.
//====
var removeSpacesAfter = function(string, index){
	var substring1 = string.slice(0, index);
	var substring2 = "";
	for(var i = index; i < (string.length - substring1.length); i++){
		if(string.charAt(i) !== " "){
			substring2 += string.charAt(i);
		}
	}
	return (substring1 + substring2);
}

//====
// Helper method: does string contain substring?
//====
var contains = function(string, substring){
	return (string.indexOf(substring) !== -1);
}

//====
// Validate that the spacing in the CSS code is according to style guide:
// - exactly 1 space before "{" and exactly 1 after "{" (oneliner).
// - exactly 0 space before "," and exactly 1 space after ",".
// - exactly 0 space before ":" and exactly 1 space after ":".
// - exactly 0 space before ";" and exactly 1 space before "}" (oneliner).
// - make sure "}" is the only thing on the line (not oneliner).
// - declaration ends with ";".
//====
var validateSpacing = function(lines){
	var result = {err: false, messages: []}
	for(var i = 0; i < lines.length; i++){
		var line = lines[i];
		if(contains(line, "{") && contains(line, "}") && contains(line, ":")){
			// oneliner
			// check for exactly one space after "{"
			var open = line.indexOf("{");
			if(line.charAt(open+1) !== " " || line.charAt(open+2) === " "){
				result.err = true;
				var msg = "bad spacing on line " + (i+1);
				result.messages.push(msg);
			}
			// check for 0 space before ":" and 1 space after
			var colon = line.indexOf(":");
			if(line.charAt(colon-1) === " " || line.charAt(colon+1) !== " "
				|| line.charAt(colon+2) === " "){
				result.err = true;
				var msg = "bad spacing on line " + (i+1);
				result.messages.push(msg);
			}
			// check for "; " before "}" and 0 space before ";"
			var semicolon = line.indexOf(";");
			var close = line.indexOf("}");
			if(semicolon === -1){
				result.err = true;
				var msg = "no semicolon on line " + (i+1);
				result.messages.push(msg);
			} else {
				if(line.charAt(semicolon-1) === " "){
					result.err = true;
					var msg = "bad spacing on line " + (i+1);
					result.messages.push(msg);
				}
				if(line.charAt(close-1) !== " " && line.charAt(close-2) !== ";"){
					result.err = true;
					var msg = "bad spacing on line " + (i+1);
					result.messages.push(msg);
				}
			}
		} else if(contains(line, "{")){
			// selector line
			// check for spaces after any ","
			var broken = line.split(",");
			for(var j = 1; j < broken.length; j++){
				if(broken[j].charAt(0) !== " " || broken[j].charAt(1) === " "){
					result.err = true;
					var msg = "bad spacing on line " + (i+1);
					result.messages.push(msg);
				}
			}
			// check for exactly 1 space before "{"
			var open = line.indexOf("{");
			if(line.charAt(open-1) !== " " && line.charAt(open-2) === " "){
				result.err = true;
				var msg = "bad spacing on line " + (i+1);
				result.messages.push(msg);
			}
		} else if(contains(line, ":")){
			// declaration
			// check for 0 space before ":" and 1 space after
			var colon = line.indexOf(":");
			if(line.charAt(colon-1) === " " || line.charAt(colon+1) !== " "
				|| line.charAt(colon+2) === " "){
				result.err = true;
				var msg = "bad spacing on line " + (i+1);
				result.messages.push(msg);
			}
			// check for ";", with 0 space before
			var semicolon = line.indexOf(";");
			if(semicolon === -1){
				result.err = true;
				var msg = "no semicolon on line " + (i+1);
				result.messages.push(msg);
			} else {
				if(line.charAt(semicolon-1) === " "){
					result.err = true;
					var msg = "bad spacing on line " + (i+1);
					result.messages.push(msg);
				}
			}
		} else if(contains(line, "}")){
			// closer
			// check it's the only thing on that line
			if(line.charAt(0) !== "}" || line.slice(1).search(/\S/) !== -1){
				result.err = true;
				var msg = "bad spacing on line " + (i+1);
				result.messages.push(msg);
			}
		}
	}
	return result;
}

module.exports = {
	analyzeCssFile: analyzeCssFile,
	analyzeCssText: analyzeCssText
}