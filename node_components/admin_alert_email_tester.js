var smptMail = require("./common/send_smpt_email")

module.exports = function(app, passport){
//create navigation menu based on user permissions
	
	app.post('/admin_alert_email_tester', async function(req, res) { 
			//test AD config
			
			try{
				var data = req.body;
				var rc = data["test_rcpt"];
				var s = data["test_subject"];				
				var b = data["test_body"];				
				console.log("Sending test email, config:",data);
				var result = await (smptMail.send(rc,s,b) );
				console.log("Test email success", result);
				res.status(200);//Send error response here
				res.write(JSON.stringify(result));
				res.end(); 
			}catch(ex){
				console.log("Test email failed", ex);
				res.status(500);//Send error response here
				res.write("Sorry, taht didn't work. Error details:\n\n" + ex)
				res.end(); 
			}
	});
	
	
}
