var util = require("../utils/util.js");

// returns payslip if exists, takes parameters empid, month , year
app.route.post('/payslip/issuedOrNot', async function(req, cb){ 
    var obj = {
        empid: req.query.empid,
        month: req.query.month,
        year: req.query.year
    }

    console.log("The query is: " + JSON.stringify(obj));


    var result = await app.model.Payslip.exists(obj);

    console.log("The result is: " + result);

    if(result) return "true";
    return "false";
})

app.route.post('/payslip/pendingIssues', async function(req, cb){  // High intensive call, need to find an alternative
   
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
app.route.get('/employees', async function(req){
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
    var options = {
        condition: {
            empID: req.query.empid
        },
        fields: ['email', 'empID', 'name', 'designation', 'salary']
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

    var successResult = {
        signature: result.sign,
        publickey: result.publickey,
        timestamp: result.timestamp,
        isSuccess: true
    }
    return successResult;

})
