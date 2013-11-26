css-lint
======
This is a CSS linter created for the Carnegie Mellon Univeristy course *'15-237: Developing Cross Platform Web Applications'*.

MIT Lisence.

##Functionality
Currently, the css linter has the following functionality:

* Validating values of selected properties (see below for more info).
* Validating consistent indentation (using tab characters or 4-space tabs).
* Validating newlines following every declaration and rule.
* Validating property uniqueness within any rule.
* Validating declaraciton count (default: no more than 25 declarations/rule).
* Validating correct spacing according to our style guide (see below for more info).

Additionally, the code exists for extracting *ids* and *classes* from .HTML files in case you want to add the functionality to cross-reference *ids* or *classes* between .HTML and .CSS files. The code is in `csslint.js`, but not exported to the module. 

##Property-Value Validation
In order to validate the correctness of properties and their values, we use the file `dictionary.js`. Currently, it only contains very few properties and values since adding them all would be very time consuming.

In order to add Property-Value pairs, you need to change the following code in `dictionary.js`:

``
module.exports = {
	background: [isColor, isUrl],
	position: ["static", "absolute", "fixed", "relative", "inherit"],
	color: [isColor]
}
``

You can add two types of values: strings or functions. In the example above `position` simply has an array of strings it accepts as values. On the other hand, `background` has two functions that it accepts as values. The functions should take in a string `value` and return true or false. For example, `isColor` accepts a string and uses regex to determine whether it is one of the default CSS colors or in the form of "#XXX" or "#XXXXXX".

##How to Use
`csslint.js` exports two functions: `parseCssFile(path, callback)` and `parseCssText(text)`.

`parseCssFile` is asynchronous (clearly...) and the callback passed to it should take two arguments `(err, result)`. If there are any errors with the linter itself or any of the dependencies, `err` will be set to true, and otherwise null. The `result` object is of the form `{err: boolean, messages[errmsg1, errmsg2, ...]}` (where `errmsg1` and `errmsg2` are strings). The same `result` object is returned *synchronously* from `parseCssText`.

##Note About Declaration Count
If you would like to change the number of declaration counts allowed within a single rule, see the 6th line of the `parseCssText` function in `csslint.js`.