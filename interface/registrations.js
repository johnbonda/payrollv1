var schema = require('../schema/accounts.js');
var httpCall = require('../utils/httpCall.js');
var constants = require('../utils/constants.js');
var addressHelper = require('../utils/address.js');
var z_schema = require('../utils/zschema-express.js');
var BKVSCall = require('../utils/BKVSCall.js');
var SwaggerCall = require('../utils/SwaggerCall.js');
var request = require('request');
var auth = require('./authController');

// // Return Payslip with empname
// app.route.get('/payslip/:empname',  async function (req) {
//     let result = await app.model.Payslip.findOne({
//         condition: { empname: req.params.empname }
//     })
//     return result
//   })

app.route.post('/user/exist', async function(req, cb){

    var param = {
        email: req.query.email
    }

    // if(!req.query.dappToken) return "Need Dapp Token, please Login";
    // if(! (await auth.checkSession(req.query.dappToken))) return "Unauthorized Token";

    var response = await SwaggerCall.call('GET', '/api/v1/user/exist?email=' + param.email, param);
    return response;
    
});

//BKVS login
app.route.post('/userlogin', async function (req, cb) {
    var ac_params = {
        email: req.query.email,
        password: req.query.password
    };

    app.sdb.lock('payroll.userlogin@'+req.query.email);


    var response = await BKVSCall.call('POST', `/api/v1/login`, ac_params);// Call: http://54.254.174.74:8080

    // if (response.isSuccess === true){
    //     var user = await app.model.Employer.findOne({
    //         condition:{
    //             email: req.query.email
    //         }
    //     });

    //     if(!user) return "-2" // User not registered in Dapp

    //     var tokenSearch = await app.model.Session.exists({
    //         email: user.email
    //     });

    //     var token = auth.getJwt(user.email);

    //     if(tokenSearch) {
    //         app.sdb.update('session', {jwtToken: token}, {email: user.email});
    //     }
    //     else{
    //         app.sdb.create('session', {
    //             email: user.email,
    //             jwtToken: token
    //         })
    //     }

    //     response.dappToken = token;
    // }
    
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

    app.sdb.lock('payroll.usersignup@'+req.query.emailid);

    var response = await BKVSCall.call('POST', `/api/v1/signup`, params);// Call: http://54.254.174.74:8080
    // if(response.isSuccess===true || response.status === "CONFLICT")

    if(response.isSuccess===true)
    {
        // var user = await app.model.Employer.exists({
        //     email: req.query.emailid
        // });

        // if(user) return "-1"; // User already registered

        // app.sdb.create('employer', {
        //     name: req.query.name,
        //     email: req.query.emailid
        // });

        return "success";
    }
    else
    {
        return response;
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
