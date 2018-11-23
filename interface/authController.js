var config = require("../config.json");
var jwt = require('jsonwebtoken');

module.exports.getJwt = function(email){
    // create a token
    var token = jwt.sign({ id: email, timestamp: new Date().getTime() }, config.tokenKey, {
        expiresIn: 86400 // expires in 24 hours
      });
    return token;
}

module.exports.checkSession = async function(token){
    app.logger.log(token);
    var result = await app.model.Session.exists({
        jwtToken: token
    })
    app.logger.log(result);
    return result;
}