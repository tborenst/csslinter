//====
// Imports
//====
var util = require("util");
var utils = require("./utils");
var fs = require("fs");
var cssparse = require("css-parse");
var cssDictionary = require("./dictionary.js");
var lineByLine = require("./linebyline.js");

//====
// Begins the parsing process using a path to a css file.
// Callback should accept (err, result), where result is an object:
// {errors: [{msg: string, line: int}, ...]}
//====
var parseCssFile = function(path, callback){
	fs.readFile(path, function(err, data){
		if(err) callback(err, null);
		var text = data.toString().replace(/\t/g, "    "); // tabs -> 4 spaces
		parseCssText(text, callback, path);
	});
}

//====
// Begins the parsing process using a string of CSS.
// Callback should accept (err, result), where result is an object:
// {errors: [{msg: string, line: int}, ...]}
// Tests for:
// - valid property/value pairs.
// - valid indentation (4 space tabs OR tab characters).
// - valid newlines (after each declaration, rule, etc,).
// - valid property uniqueness (no setting the same property twice in a rule).
// - valid declaration count (no more than 25 in a rule).
// - valid spacing according to guidelines (see 'linebyline.js').
//====
var parseCssText = function(text, callback, path){ // path is optional, for use by lintCssFile()
	var tree = null;
	path = (path) ? path : null;
	try {
		tree = cssparse(text, {position: true});
	} catch(err) {
		// return syntax error to callback in correct form
		var result = {errors: [utils.extractCssParseErrorInfo(err)]};
		callback(null, result);
		return;
	}
	var all_results = [validatePropertyValuePairs(tree, cssDictionary, path),
		validateIndentation(tree, 4, path),
		validateNewlines(tree, path),
		validatePropertyUniqueness(tree, path),
		validateDeclarationCount(tree, 25, path),
		lineByLine.analyzeCssText(text, path)];
	var combined_result = {errors: []};
	for(var i = 0; i < all_results.length; i++){
		var res = all_results[i];
		for(var j = 0; j < res.errors.length; j++){
			combined_result.errors.push(res.errors[j]);
		}
	}
	callback(null, combined_result);
}

//====
// Given a css parse tree and a dictionary, validate property values
// in the tree according to the dictionary: {"property": ["val1", "val2", ...]}.
// Returns object: {errors: [errmsg1, errmsg2, ...]}
//====
var validatePropertyValuePairs = function(tree, dictionary, path){
	var result = {errors: []};
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
					var err_line = dec.position.start.line;
					var msg = "invalid property/value pair (" 
						    + property + "/" + value + ")";
					result.errors.push(utils.createErrorMessage(err_line, msg, path));
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
// Returns an object: {errors: [errmsg1, errmsg2, ...]}.
//====
var validateIndentation = function(tree, spaces, path){
	spaces = spaces || 4;
	var result = {errors: []};
	var rules = tree.stylesheet.rules;
	for(var i = 0; i < rules.length; i++){
		var rule = rules[i];
		var rPos = rule.position;
		// check indentation for rule
		if(rule.type !== "comment" && rPos.start.column !== 1){
			var err_line = rPos.start.line;
			var msg = "bad indentation";
			result.errors.push(utils.createErrorMessage(err_line, msg, path));
		}
		if(rule.type !== "comment" && !ruleIsOneLiner(rule) && rPos.end.column !== 2){
			var err_line = rPos.end.line;
			var msg = "bad indentation";
			result.errors.push(utils.createErrorMessage(err_line, msg, path));
		}
		if(rule.type !== "comment" && !ruleIsOneLiner(rule)){
			// only check declaration indentation for non-oneliners
			var decs = rule.declarations;
			if(decs){
				for(var j = 0; j < decs.length; j++){
					var dec = decs[j];
					var dPos = dec.position;
					if(dec.type !== "comment" && dPos.start.column !== spaces+1){
						var err_line = dPos.start.line;
						var msg = "bad indentation";
						result.errors.push(utils.createErrorMessage(err_line, msg, path));
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
// Returns an object: {errors: [errmsg1, errmsg2, ...]}.
//====
var validateNewlines = function(tree, path){
	var result = {errors: []};
	var rules = tree.stylesheet.rules;
	for(var i = 1; i < rules.length + 1; i++){
		var rule1 = rules[i-1];
		var rule2 = rules[i];
		if(i !== rules.length && rule1.position.end.line === rule2.position.start.line){
			var err_line = rule1.position.end.line;
			var msg = "missing newline between rules"; 
			result.errors.push(utils.createErrorMessage(err_line, msg, path));
		}
		var decs = rule1.declarations;
		if(decs){
			for(var j = 1; j < decs.length + 1; j++){
				var dec1 = decs[j-1];
				var dec2 = decs[j];
				if(j !== decs.length && dec1.position.end.line === dec2.position.start.line
					&& dec1.type !== "comment" && dec2.type !== "comment"){
					var err_line = dec1.position.end.line;
					var msg = "missing newline between declarations"
					result.errors.push(utils.createErrorMessage(err_line, msg, path));
				}
			}
		}
	}
	return result;
}

//====
// Validates that within each rule, every property shows up no more than once.
// Returns an object: {errors: [errmsg1, errmsg2, ...]}.
//====
var validatePropertyUniqueness = function(tree, path){
	var result = {errors: []};
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
					var err_line = dec.position.start.line;
					var msg = "duplicate property (" + property + ")"; 
					result.errors.push(utils.createErrorMessage(err_line, msg, path));
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
// Returns an object: {errors: [errmsg1, errmsg2, ...]}.
//====
var validateDeclarationCount = function(tree, count, path){
	count = count || 25;
	var result = {errors: []};
	var rules = tree.stylesheet.rules;
	for(var i = 1; i < rules.length; i++){
		var rule = rules[i];
		var decs = rule.declarations;
		if(decs && ruleIsOneLiner(rule) && decs.length > 1){
			var err_line = rule.position.start.line;
			var msg = "rule (oneliner) has too many declarations";
			result.errors.push(utils.createErrorMessage(err_line, msg, path));
		} else if(decs && decs.length > count) {
			var err_line = rule.position.start.line;
			var msg = "rule has too many declarations"
			result.errors.push(utils.createErrorMessage(err_line, msg, path));
		}
	}
	return result;
}

module.exports = {
	parseCssFile: parseCssFile,
	parseCssText: parseCssText
}
