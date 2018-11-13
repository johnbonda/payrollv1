var schema = require('../schema/accounts.js');
var httpCall = require('../utils/httpCall.js');
var constants = require('../utils/constants.js');
var addressHelper = require('../utils/address.js');
var z_schema = require('../utils/zschema-express.js');
var BKVSCall = require('../utils/BKVSCall.js');


// Return Payslip with empname
app.route.get('/payslip/:empname',  async function (req) {
    let result = await app.model.Payslip.findOne({
        condition: { empname: req.params.empname }
    })
    return result
  })


// Get Account Details of User
app.route.post('/wallet/login', async function (req, cb) {
    var validateSchema = await z_schema.validate(req.query, schema.open);


    var ac_params = {
        password: req.query.password,
        email: req.query.email
    };

    var response = await httpCall.call('POST', `/api/v1/login`, ac_params);// Call: http://54.254.174.74:8080

    if(response && !response.success) {
        return response;
    }

    var params = {
        secret: req.query.secret,
        countryCode:req.query.countryCode
    };
    var res = await httpCall.call('POST', `/api/accounts/open`, params); // Call:  http://node1.belrium.io
    res.account.address = res.account.address.concat(req.query.countryCode);
    return res;
});


// Employer Registration on BKVS 
app.route.post('/wallet/creation', async function(req,cb) {
    var validateSchema = await z_schema.validate(req.query, schema.open);

    var ac_params = {
        countryId:req.query.countryId,
        countryCode:req.query.countryCode,
        email:req.query.email,
        name:req.query.name,
        password:req.query.password,
        type:req.query.type
    };
    
    var response = await httpCall.call('POST','/api/v1/signup',ac_params); Call: http://54.254.174.74:8080

    if(response && !response.success){
        return response;
    }

});

// Get Wallet Address
app.route.post('/accounts/details', async function(req,cb) {
     var validateSchema = await z_schema.validate(req.query, schema.open);

     var ac_params = {
        secret: req.query.secret,
        countryCode:req.query.countryCode
     };

     var response = await httpCall.call('POST','/api/accounts/open',ac_params); // Call:  http://node1.belrium.io
     res.account.address = res.account.address.concat(req.query.countryCode);
     return res;
});

//BKVS login
app.route.post('/userlogin', async function (req, cb) {
    var ac_params = {
        email: req.query.email,
        password: req.query.password
    };
    var response = await BKVSCall.call('POST', `/api/v1/login`, ac_params);// Call: http://54.254.174.74:8080
    return response;
 });//BKVS Signup
 app.route.post('/usersignup', async function (req, cb) {
    var params={
        countryId:req.query.countryId,
        countryCode:req.query.countryCode,
        email:req.query.emailid,
        name:req.query.name,
        password:req.query.password,
        type:req.query.type
    }
    var response = await BKVSCall.call('POST', `/api/v1/signup`, params);// Call: http://54.254.174.74:8080
    if(response.isSuccess===true)
    {
        return "success";
    }
    else
    {
        return "failed";
    }

 });//BKVS Signup
//  app.route.post('/usersecretLogin', async function (req, cb) {
//     var params={
//         secret:req.query.secret,
//         countryCode:req.query.countryCode
//     }
//     var response = await BKVSCall.call('POST', `/api/v1/hyperledger/login`, params);// Call: http://54.254.174.74:8080
//     if(response.isSuccess===true)
//     {
//         return "success";
//     }
//     else
//     {
//         return "failed";
//     }
//  });
// KYC Verification``` 
