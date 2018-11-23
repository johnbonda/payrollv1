var config = require("../config.json");
var jwt = require('jsonwebtoken');

module.exports.getJwt = function(email){
    // create a token
    var token = jwt.sign({ id: email, timestamp: new Date().getTime() }, config.secret, {
        expiresIn: 86400 // expires in 24 hours
      });
    return token;
}