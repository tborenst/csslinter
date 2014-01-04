//====
// utils.js
// Contains utility functions that are used my multiple files in this project.
//====

var util = require('util');


utils = {
    //====
    // Helper function that creates and returns an error message object given a line
    // number and a message.
    //====
    createErrorMessage: function(line, msg, path){
        var err_msg = {file: path, line: line, msg: msg};
        return err_msg;
    },

    //====
    // Helper method: does string contain substring?
    //====
    contains: function(string, substring){
        return (string.indexOf(substring) !== -1);
    },

    //====
    // Parses out required information from css-parse's errors.
    //====
    extractCssParseErrorInfo: function(error){
        var errString = error.toString();
        var errLine = error.line;
        // magic number 7 to get rid of "Error: " at beginning of error.
        var errMsg = errString.slice(7, errString.indexOf("near"));
        return utils.createErrorMessage(errLine, errMsg);
    }
}

module.exports = utils