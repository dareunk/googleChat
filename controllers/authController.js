const nodeMailer = require("nodemailer");
const store = require("store");

var generateRandomString = function(length) {
	          var text = '';
	          var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

	          for (var i = 0; i < length; i++) {
			                        text += possible.charAt(Math.floor(Math.random() * possible.length));
			                      }
	          return text;
};

const send = async(email,code) => {
	        const transporter = nodeMailer.createTransport({
			                service: "gmail",
			                host: "smtp.google.com",
			                port: 3000,
			                auth: {
						                        user: process.env.SENDER,
						                        pass: process.env.PASSWORD
						                }
			        });
	        var text = `[Authentication code] ${code}`;
	        console.log(text);
	        const option = {
			                from: process.env.SENDER,
			                to: email,
			                subject: "authentication code",
			                text:text
			        };
	        const info = await transporter.sendMail(option);
	        return info;
};

module.exports = {
	sendMessage: async(req,res,next) => {
	        let email = req.body.inputemail;
		try{ 
		var code = generateRandomString(6);
		const result = await send(email,code);
		req.flash("success", "Check your email");
		//res.locals.code = code;
		//res.locals.inputEmail = email;
		//store.set("code", {code:code});
		req.session.code = code;
			//next();
		
		console.log(result);
		req.session.save();
	//	res.locals.redirect = "/signup";
		//res.locals.inputEmail = email;
	//	next();

		}catch(error){
			console.log(`Failed to send a message: ${error.message}`);
			next();
		}
	}

};
