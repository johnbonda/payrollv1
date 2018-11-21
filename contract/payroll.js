var ByteBuffer = require("bytebuffer");
var util = require("../utils/util.js");
var mail = require("../utils/sendmail");
var api = require("../utils/api");
var SwaggerCall = require("../utils/SwaggerCall");
var TokenCall = require("../utils/TokenCall");
var mailer = require("../utils/mailTemplate/TemplateMail/index");
var registrationMail = require("../utils/mailTemplate/TemplateMail/register");
var register = require("../interface/register");

module.exports = {

    issuePaySlip: async function(email, empid, name, employer, month, year, designation, bank, accountNumber, pan, basicPay, hra, lta, ma, providentFund, professionalTax, grossSalary, totalDeductions, netSalary, secret){

        app.sdb.lock('payroll.issuePaySlip@'+empid);

        console.log("***********************Entered issuePaySlip************************")

        var options = {
            condition: {
                empid: empid,
                employer: employer,
                month: month,
                year: year
            }
        }

        var result = await app.model.Payslip.findOne(options);

        if(result) return "Payslip already issued";

        console.log("***********************Passed duplicate check************************")

        var paySlip = {
            email: email,
            empid: empid,
            name: name,
            employer: employer,
            month: month,
            year: year,
            designation: designation,
            bank: bank,
            accountNumber: accountNumber,
            pan: pan,
            basicPay: basicPay,
            hra: hra,
            lta: lta,
            ma: ma,
            providentFund: providentFund,
            professionalTax: professionalTax,
            grossSalary: grossSalary,
            totalDeductions: totalDeductions,
            netSalary: netSalary
        }

        app.sdb.create("payslip", paySlip);

        console.log("***********************app.sdb.create completed************************")
        
        
        var hash = util.getHash(JSON.stringify(paySlip));
        //console.log("Sender: " + hash);
        var sign = util.getSignatureByHash(hash, secret);
        var publickey = util.getPublicKey(secret);

        console.log("***********************Completed crypto************************")
        // /*
        //var time = this.trs.timestamp;

        //var result = app.model.Employer.findOne({publickey: publickey});
        //var employer = result.name;\

        //var text = JSON.stringify(paySlip);

        console.log("Issuer hash: " + hash);
        console.log("Issuer sign: " + sign);
        console.log("Issuer publickey: " + publickey);

        var base64hash = hash.toString('base64');

        var base64sign = sign.toString('base64');

        //var base64publickey = publickey.toString('base64');

        console.log("Issuer base64 hash: " + base64hash);
        console.log("Issuer base64 sign: " + base64sign);
        //console.log("Issuer base64 publickey: " + base64publickey);

        app.sdb.create("issue", {
            hash: base64hash,
            sign: base64sign,
            publickey: publickey,
            timestamp: new Date().getTime()
        });  

        
        //Email

        // var subject = "Payslip for the month " + month + " and year " + year + " issued"; 


        // console.log("Issuer: " + hash);

        //  mail.sendMail(email, subject, text);

         //*/

         mailer.mailing(paySlip, email, name);
    
    },

    verify: async function(obj){
        
        //app.logger.debug(objtext);
        //var obj = JSON.parse(objtext);
        var objtext = JSON.stringify(obj);
        console.log("objtext " + objtext);
        var hash = util.getHash(objtext);
        console.log("Verifier: " + hash);
        //var hash = util.getHash(objtext);

        //mail.sendMail("john@belfricsbt.com", "From verify", objtext + "Hash from verify: " +hash);


        var base64hash = hash.toString('base64');
        console.log("Verifier base64 hash: " + base64hash)

        var result = await app.model.Issue.findOne({
            condition: {hash: base64hash}
        });

        if(!result) return "Hash not found";

        //var result2 = await app.model.Employer.findOne({publickey: result.publickey});

        console.log("Verifier base64 sign: " + result.sign);
        console.log("Verifier base64 publickey: " + result.publickey);

        var sign = new Buffer(result.sign, 'base64');
        var publickey = new Buffer(result.publickey, 'hex');  
        console.log("Verifier sign: " + sign);
        console.log("Verifier publickey: " + publickey);


        if(!util.Verify(hash, sign, publickey) /*&& result2.name === obj.employer*/) return "Wrong Employer Signature";

    },

    registerEmployee: async function(countryCode, email, lastName, name, uuid, designation, bank, accountNumber, pan, salary){


        var token = await register.getToken(0,0);

        console.log(token);
        
        console.log(email)
        var result = await app.model.Employee.exists({
            email: email
        });
        if(result) return "Employee already registered";

        console.log("Passed email already exists or not");

        function makePassword() {
            var text = "";
            var caps = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
            var smalls = "abcdefghijklmnopqrstuvwxyz";
            var symbols = "!@#$%^&*";
            var numbers = "1234567890";
          
            for (var i = 0; i < 3; i++){
              text += caps.charAt(Math.floor(Math.random() * caps.length));
              text += smalls.charAt(Math.floor(Math.random() * smalls.length));
              text += symbols.charAt(Math.floor(Math.random() * symbols.length));
              text += numbers.charAt(Math.floor(Math.random() * numbers.length));
            }
            return text;
        }

        var password = makePassword();        


        var options = {
            countryCode: countryCode,
            email: email,
            lastName: lastName,
            name: name,
            password: password,
            uuid: uuid
        }

        console.log("About to call registration call with parameters: " + JSON.stringify(options));

        var response = await SwaggerCall.call('POST', '/api/v1/registration/verifier', options);

        console.log("Verifier Registration response is complete with response: " + JSON.stringify(response));

        if(!response) return "No response from verifier call";
        if(!response.isSuccess) return JSON.stringify(response);

        var data = response.data;

        var wallet = JSON.parse(data.wallet);
        wallet.loginPassword = password;

        var opt = {
            roleId: '3',
            userId: data.uid
        }

        console.log("About to make change role call");

        var resp = await TokenCall.call('PATCH', '/api/v1/users/role', opt, token);

        console.log("Change role call made with response: " + JSON.stringify(resp));

        if(!resp) return "No response from change role call";
        if(!resp.isSuccess) return JSON.stringify(resp);

        var creat = {
            email: email,
            empID: uuid,
            name: name + lastName,
            designation: designation,
            bank: bank,
            accountNumber: accountNumber,
            pan: pan,
            salary: salary,
            walletAddress: wallet.address
        }

        console.log("About to make a row");

        app.sdb.create('employee', creat);

        //mail.sendMail(email, "Your BKVS wallet information", JSON.stringify(wallet));

        registrationMail.mailing(wallet, email, name);
    }

    // pay: async function(address, currency, amount) {
    //     var result = app.balances.get(address, 'BEL');
    //     console.log("Balance before increasing: " + result.balance);
    //     app.balances.increase(address, currency, amount * 100000000);
    //     var result2 = app.balances.get(address, 'BEL');
    //     console.log("Balance after increasing: " + result.balance);
    //     //app.balances.increase('A9fDpCe9FGQ14VwJdc1FpycxsJ9jN3Ttwf', 'BEL', '100000')
    //     //app.balances.decrease('A9fDpCe9FGQ14VwJdc1FpycxsJ9jN3Ttwf', 'BEL', '100000')
    //     //app.balances.transfer('BEL', '100000', 'A9fDpCe9FGQ14VwJdc1FpycxsJ9jN3Ttwf', 'A4MFPoF3c9vCzZ3GGf9sNQ3rDy2q8aXuVF')
  
    //   },

   /*  issueTo: async function(email, empid, name, employer, month, year, secret){
        app.sdb.lock('payroll.issueTo@'+empid);

        // Checking email is registered with Payroll
        var exists = await app.model.Employee.findOne({
            condition: {
                email: email
            }
        });

        if(!exists) return "Email not registered with Payroll";

        var options = {
            condition: {
                empid: empid,
                employer: employer,
                month: month,
                year: year
            }
        }

        var result = await app.model.Payslip.findOne(options);

        if(result) return "Payslip already issued";

        var paySlip = {
            email: email,
            empid: empid,
            name: name,
            employer: employer,
            month: month,
            year: year
        }

        app.sdb.create("payslip", paySlip);        
        
        var hash = util.getHash(JSON.stringify(paySlip));
        var sign = util.getSignatureByHash(hash, secret);
        var publickey = util.getPublicKey(secret);
        // /*
        //var time = this.trs.timestamp;

        //var result = app.model.Employer.findOne({publickey: publickey});
        //var employer = result.name;\

        var text = JSON.stringify(paySlip);

        var base64hash = hash.toString('base64');

        var base64sign = sign.toString('base64');

        app.sdb.create("issue", {
            hash: base64hash,
            sign: base64sign,
            publickey: publickey,
            toaddress: exists.walletAddress
        });  

        //Email

        var subject = "Payslip for the month " + month + " and year " + year + " issued"; 


        console.log("Issuer: " + hash);

         mail.sendMail(email, subject, text);
      } */

}