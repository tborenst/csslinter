css-linter
======
This is a CSS linter created for the Carnegie Mellon University course *'15-237: Developing Cross Platform Web Applications'*.

In order to download and use, simply `npm install csslinter`.

* MIT license.
* Copyright Carnegie Mellon University 2013.

##Functionality
Currently, the css linter has the following functionality:

* Validating values of selected properties (see below for more info).
* Validating consistent indentation (using tab characters or 4-space tabs).
* Validating newlines following every declaration and rule.
* Validating property uniqueness within any rule.
* Validating declaration count (default: no more than 25 declarations/rule).
* Validating correct spacing according to our style guide (see below for more info).

##Property-Value Validation
In order to validate the correctness of properties and their values, we use the file `dictionary.js`. Currently, it only contains very few properties and values since adding them all would be very time consuming.

In order to add Property-Value pairs, you need to change the following code in `dictionary.js`:

```javascript
module.exports = {
	background: [isColor, isUrl],
	position: ["static", "absolute", "fixed", "relative", "inherit"],
	color: [isColor]
}
```

You can add two types of values: strings or functions. In the example above `position` simply has an array of strings it accepts as values. On the other hand, `background` has two functions that it accepts as values. The functions should take in a string `value` and return true or false. For example, `isColor` accepts a string and uses regex to determine whether it is one of the default CSS colors or in the form of "#XXX" or "#XXXXXX".

##Our "Spacing Style Guide"
The linter checks for the following spacing format:

* Ignore spacing and indentation within comments.
* For any oneliners (e.g. "background { color: black; }"):
	* exactly 1 space before "{" and exactly 1 after "{".
	* exactly 0 space before ";" and exactly 1 space before "}".
* Specifically not for oneliners:
	* "}" is the only thing on the line.
* For everything:
	* exactly 0 space before "," and exactly 1 space after.
	* exactly 0 space before ":" and exactly 1 space after.
	* exactly 0 space before ";" and nothing after.
	* all declarations end with ";".

Note that any comments will be ignored by the linter as if they are not there, but whitespace around the comments will remain. So:
```css
body {
	color: /* some random comment */ black;
}
```
Becomes
```css
body {
	color:  black;
}
```
And hence will be flagged as an error by the linter (two spaces after ":").

##How to Use
`csslint.js` exports two functions: `lintCssFile(path, callback)` and `lintCssText(text)`.

`lintCssFile()` is asynchronous (clearly...) and the callback passed to it should take two arguments `(err, result)`. If there are any errors with the linter itself or any of the dependencies, `err` will be set to true, and otherwise null. The `result` object is of the form `{errors: [{file: string, msg: string, line: int}, ...]}`. The same goes for `lintCssText()`.
