var util = require("../utils/util.js");

// returns payslip if exists, takes parameters empid, month , year
app.route.get('/payslip/issuedOrNot', async function(req){ 
    var obj = {
        empid: req.params.empid,
        month: req.params.month,
        year: req.params.year
    }

    var result = app.model.Payslip.findOne({
        condition: obj
    });

    if(result) return true;
    return false;
})

// For the employee table,
// GET call
// inputs: No inputs
// outputs: empid, name, designations
app.route.get('/employees', async function(req){
    var options = {
        fields: ['empID', 'name', 'designation']
    }

    var result = app.model.Employee.findAll(options);

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

    var result = app.model.Employee.findOne(options);

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

    return "Success";

})



