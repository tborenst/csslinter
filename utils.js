//====
// utils.js
// Contains utility functions that are used my multiple files in this project
//====

utils = {
    //====
    // Helper function that creates and returns an error message object given a line
    // number and a message
    //====
    createErrorMessage: function(line, msg){
        var err_msg = {};
        err_msg.line = line;
        err_msg.msg = msg;
        return err_msg;
    },

    //====
    // Helper method: does string contain substring?
    //====
    contains: function(string, substring){
        return (string.indexOf(substring) !== -1);
    }
}

module.exports = utils