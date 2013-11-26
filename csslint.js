//====
// Imports
//====
var util = require("util");
var fs = require("fs");
var cssparse = require("css-parse");
var cssDictionary = require("./dictionary.js");
var loadHtml = require("./loadhtml.js");
var lineByLine = require("./linebyline.js");

//====
// Begins the parsing process using a path to a css file.
// Callback should accept (err, result), where result is an object:
// {err: boolean, messages: [errmsg1, errmsg2, ...]}
// Difference between 'err' and 'result' is that 'err' is for system error
// and 'result' contains the errors found by the linter itself.
//====
var parseCssFile = function(path, callback){
	fs.readFile(path, function(err, data){
		if(err) callback(err, null);
		var text = data.toString().replace(/\t/g, "    "); // tabs -> 4 spaces
		var result = parseCssText(text);
		callback(null, result);
	});
}

//====
// Begins the parsing process using a string of CSS.
// Returns object: {err: boolean, messages: [errmsg1, errmsg2, ...]}
// Tests for:
// - valid property/value pairs.
// - valid indentation (4 space tabs OR tab characters).
// - valid newlines (after each declaration, rule, etc,).
// - valid property uniqueness (no setting the same property twice in a rule).
// - valid declaration count (no more than 25 in a rule).
// - valid spacing according to guidelines (see 'linebyline.js').
//====
var parseCssText = function(text){
	var tree = cssparse(text, {position: true});
	var results = [validatePropertyValuePairs(tree, cssDictionary),
				validateIndentation(tree, 4),
				validateNewlines(tree),
				validatePropertyUniqueness(tree),
				validateDeclarationCount(tree, 25),
				lineByLine.analyzeCssText(text)];
	var result = {err: false, messages: []};
	for(var i = 0; i < results.length; i++){
		var res = results[i];
		if(res.err === true){
			result.err = true;
			for(var j = 0; j < res.messages.length; j++){
				result.messages.push(res.messages[j]);
			}
		}
	}
	return result;
}

//====
// Given a css parse tree and a dictionary, validate property values
// in the tree according to the dictionary: {"property": ["val1", "val2", ...]}.
// Returns an object: {err: boolean, messages: [string1, string2, ...]}.
//====
var validatePropertyValuePairs = function(tree, dictionary){
	var result = {err: false, messages: []};
	var rules = tree.stylesheet.rules;
	for(var i = 0; i < rules.length; i++){
		var rule = rules[i];
		var decs = rule.declarations;
		if(decs){
			for(var j = 0; j < decs.length; j++){
				var dec = decs[j];
				var property = dec.property;
				var value = dec.value;
				var valid = validatePropertyValue(property, value, dictionary);
				if(!valid){
					// add update the result object with appropriate message
					result.err = true;
					var line = dec.position.start.line;
					var msg = "invalid property/value pair on line " + line
							+ " (" + property + "/" + value + ")";
					result.messages.push(msg);
				}
			}
		}
	}
	return result;
}

//====
// Helper function for 'validatePropertyValuePairs()', which given a property,
// a value, and a dictionary, returns true if the value and property are valid
// and false otherwise. 
// If the property is not present in the dictionary, this function returns true.
//====
var validatePropertyValue = function(property, value, dictionary){
	if(property in dictionary){
		var values = dictionary[property];
		for(var i = 0; i < values.length; i++){
			if(typeof values[i] === "function" && values[i](value)){
				return true;
			}
			else if(value === values[i]){
				// valid value
				return true;
			}
		}
		// not a valid value
		return false;
	} else {
		// property not in dictionary
		return true;
	}
}

//====
// Validates indentation for rules and declarations. 'spaces' is the number of
// spaces an indentation should have. Defaults to 4 spaces.
// Returns an object: {err: boolean, messages: [string1, string2, ...]}.
//====
var validateIndentation = function(tree, spaces){
	spaces = spaces || 4;
	var result = {err: false, messages: []};
	var rules = tree.stylesheet.rules;
	for(var i = 0; i < rules.length; i++){
		var rule = rules[i];
		var rPos = rule.position;
		// check indentation for rule
		if(rule.type !== "comment" && rPos.start.column !== 1){
			result.err = true;
			var msg = "bad indentation on line " + rPos.start.line;
			result.messages.push(msg);
		}
		if(rule.type !== "comment" && !ruleIsOneLiner(rule) && rPos.end.column !== 2){
			result.err = true;
			var msg = "bad indentation on line " + rPos.end.line;
			result.messages.push(msg);
		}
		if(rule.type !== "comment" && !ruleIsOneLiner(rule)){
			// only check declaration indentation for non-oneliners
			var decs = rule.declarations;
			if(decs){
				for(var j = 0; j < decs.length; j++){
					var dec = decs[j];
					var dPos = dec.position;
					if(dec.type !== "comment" && dPos.start.column !== spaces+1){
						result.err = true;
						var msg = "bad indentation on line " + dPos.start.line;
						result.messages.push(msg);
					}
				}
			}
		}
	}
	return result;
}

//====
// Returns true if rule is a oneliner (begins and ends on the same line), false
// otherwise.
//====
var ruleIsOneLiner = function(rule){
	var pos = rule.position;
	return (pos.start.line === pos.end.line);
}

//====
// Validates that after each rule and after each declaration there is a newline.
// Returns an object: {err: boolean, messages: [string1, string2, ...]}.
//====
var validateNewlines = function(tree){
	var result = {err: false, messages: []};
	var rules = tree.stylesheet.rules;
	for(var i = 1; i < rules.length + 1; i++){
		var rule1 = rules[i-1];
		var rule2 = rules[i];
		if(i !== rules.length && rule1.position.end.line === rule2.position.start.line){
			result.err = true;
			var msg = "missing newline between rules on line " 
					+ rule1.position.end.line;
			result.messages.push(msg);
		}
		var decs = rule1.declarations;
		if(decs){
			for(var j = 1; j < decs.length + 1; j++){
				var dec1 = decs[j-1];
				var dec2 = decs[j];
				if(j !== decs.length && dec1.position.end.line === dec2.position.start.line
					&& dec1.type !== "comment" && dec2.type !== "comment"){
					result.err = true;
					var msg = "missing newline between declarations on line "
							+ dec1.position.end.line;
					result.messages.push(msg);
				}
			}
		}
	}
	return result;
}

//====
// Validates that within each rule, every property shows up no more than once.
// Returns an object: {err: boolean, messages: [string1, string2, ...]}.
//====
var validatePropertyUniqueness = function(tree){
	var result = {err: false, messages: []};
	var rules = tree.stylesheet.rules;
	for(var i = 0; i < rules.length; i++){
		var rule = rules[i];
		var decs = rule.declarations;
		var properties = [];
		if(decs){
			for(var j = 0; j < decs.length; j++){
				var dec = decs[j];
				var property = dec.property;
				if(properties.indexOf(property) !== -1){
					// property already exists in this rule
					result.err = true;
					var msg = "duplicate property (" + property + ") on line " 
							+ dec.position.start.line;
					result.messages.push(msg);
				} else {
					properties.push(property);
				}
			}
		}
	}
	return result;
}

//====
// Validates that each rule does not exceed the declaration 'count'.
// 'count' defaults to 25.
// Also checks that oneliners do not have more than one declaration.
// Returns an object: {err: boolean, messages: [string1, string2, ...]}.
//====
var validateDeclarationCount = function(tree, count){
	count = count || 25;
	var result = {err: false, messages: []};
	var rules = tree.stylesheet.rules;
	for(var i = 1; i < rules.length; i++){
		var rule = rules[i];
		var decs = rule.declarations;
		if(ruleIsOneLiner(rule) && decs.length > 1){
			result.err = true;
			var msg = "rule (oneliner) has too many declarations on line "
					+ rule.position.start.line;
			result.messages.push(msg);
		} else if(decs.length > count) {
			result.err = true;
			var msg = "rule has too many declarations on line " 
					+ rule.position.start.line;
			result.messages.push(msg);
		}
	}
	return result;
}

//====
// Returns all ids from an .html file.
// 'callback' should take arguments (err, ids), where ids is an array of ids
// in the form "#some_id".
//====
var getAllIds = function(htmlFilePath, callback){
	var ids = [];
	fs.readFile(htmlFilePath, function(err, data){
		if(err){
			callback(err, null);
			return;
		}
		var html = data.toString();
		loadHtml(html, function(err, window){
			if(err) { 
				callback(err, null);
				return;
			}
			var $ = window.$;
			$("[id]").each(function(){
				var id = $(this).attr("id");
				if(ids.indexOf("#" + id) === -1){
					ids.push("#" + id);
				}
			});
			callback(null, ids);
		});
	});
}

//====
// Returns all classes from an .html file.
// 'callback' should take arguments (err, classes), where classes is an array of
// classes in the form ".some_class".
//====
var getAllClasses = function(htmlFilePath, callback){
	var classes = [];
	fs.readFile(htmlFilePath, function(err, data){
		if(err) {
			callback(err, null);
			return;
		}
		var html = data.toString();
		loadHtml(html, function(err, window){
			if(err) {
				callback(err, null);
				return;
			}
			var $ = window.$;
			$("[class]").each(function(){
				var cls = $(this).attr("class");
				if(classes.indexOf("." + cls) === -1 && cls !== "jsdom"){
					classes.push("." + cls);
				}
			});
			callback(null, classes);
		});
	});
}

module.exports = {
	parseCssFile: parseCssFile,
	parseCssText: parseCssText
}
