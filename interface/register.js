var util = require("../utils/util.js");
var config = require("../config.json");
var SwaggerCall = require("../utils/SwaggerCall");
var DappCall = require("../utils/DappCall");

// returns payslip if exists, takes parameters empid, month , year
app.route.post('/payslip/issuedOrNot', async function(req, cb){ 
    var obj = {
        empid: req.query.empid,
        month: req.query.month,
        year: req.query.year
    }

    // if(!req.query.dappToken) return "Need Dapp Token, please Login";
    // if(! (await auth.checkSession(req.query.dappToken))) return "Unauthorized Token";

    console.log("The query is: " + JSON.stringify(obj));


    var result = await app.model.Payslip.exists(obj);

    console.log("The result is: " + result);

    if(result) return "true";
    return "false";
})

app.route.post('/payslip/pendingIssues', async function(req, cb){  // High intensive call, need to find an alternative

    // if(!req.query.dappToken) return "Need Dapp Token, please Login";
    // if(! (await auth.checkSession(req.query.dappToken))) return "Unauthorized Token";
   
    var options = {
        fields: ['empID','name','designation']
    } 

    var result = await app.model.Employee.findAll(options);


    var array = [];

    for(obj in result){
        let options = {
            empid: result[obj].empID,
            month: req.query.month,
            year: req.query.year,
        }
        let response = await app.model.Payslip.exists(options);
        if(!response) array.push(result[obj]);
    }
    return array;
})

// For the employee table,
// GET call
// inputs: No inputs
// outputs: empid, name, designations
app.route.post('/employees', async function(req, cb){

    // if(!req.query.dappToken) return "Need Dapp Token, please Login";
    // if(! (await auth.checkSession(req.query.dappToken))) return "Unauthorized Token";

    var options = {
        fields: ['empID', 'name', 'designation']
    }

    var result = await app.model.Employee.findAll(options);

    return result;
})

// For issue auto-fill,
// GET call
// inputs: empid
// outputs: email, empid, name, designation, actualsalary
app.route.post('/employeeData', async function(req,cb){

    // if(!req.query.dappToken) return "Need Dapp Token, please Login";
    // if(! (await auth.checkSession(req.query.dappToken))) return "Unauthorized Token";

    var options = {
        condition: {
            empID: req.query.empid
        }
    }

    var result = await app.model.Employee.findOne(options);

    return result;
})

// Verifies the json string
// inputs: data (contains the stringified json object)
// outputs: verified or not
app.route.post('/verifypayslip', async function(req,cb){
        
    //app.logger.debug(objtext);
    //var obj = JSON.parse(objtext);
    //var objtext = JSON.stringify(req.params.data);
    //console.log("Recieved data: " + objtext);
    console.log("recieving: " + req.query.data);
    var hash = util.getHash(req.query.data);
    //console.log("Verifier: " + hash);
    //var hash = util.getHash(objtext);

    //mail.sendMail("john@belfricsbt.com", "From verify", objtext + "Hash from verify: " +hash);


    var base64hash = hash.toString('base64');
    //console.log("Verifier base64 hash: " + base64hash)

    var result = await app.model.Issue.findOne({
        condition: {hash: base64hash}
    });

    if(!result) return "Hash not found";

    //var result2 = await app.model.Employer.findOne({publickey: result.publickey});

    //console.log("Verifier base64 sign: " + result.sign);
    //console.log("Verifier base64 publickey: " + result.publickey);

    var sign = new Buffer(result.sign, 'base64');
    var publickey = new Buffer(result.publickey, 'hex');  
    //console.log("Verifier sign: " + sign);
    //console.log("Verifier publickey: " + publickey);


    if(!util.Verify(hash, sign, publickey) /*&& result2.name === obj.employer*/) return "Wrong Employer Signature";

    var myDate = new Date( Number(result.timestamp));
    var timestamp = myDate.toGMTString();

    var successResult = {
        signature: result.sign,
        publickey: result.publickey,
        timestamp: timestamp,
        isSuccess: true
    }
    return successResult;

})

module.exports.getToken = async function(req, cb){
    var options = {
        email: config.token.email,
        password: config.token.password,
        totp: config.token.totp
    }

    var response = await SwaggerCall.call('POST','/api/v1/login', options);

    if(!response) return "-1";
    if(!response.isSuccess) return "0";

    return  response.data.token;

}

app.route.post('/getToken', module.exports.getToken)

app.route.post('/getPayslips', async function(req, cb){
    var address = req.query.address;
    var options = {};
    var response = await DappCall.call('GET', '', options);
    if(!response) return "No response";
    var transactionsArray = response.transactions;
    var result = [];
    function parseAddress(str){
        var arr = str.split(",");
        arr = arr[0].split("\"");
        return arr[1];
    }
    for(i in transactionsArray){
        if(address === parseAddress(transactionsArray[i].args)) result.push(i);
    }
    return result;
});

