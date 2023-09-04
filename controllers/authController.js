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
		req.session.inputEmail = req.body.inputemail;
		console.log(result);
		req.session.save();
	//	res.locals.redirect = "/signup";
		//res.locals.inputEmail = email;
	//	next();

		}catch(error){
			console.log(`Failed to send a message: ${error.message}`);
			next();
		}
	},
	matchCode: async(req,res,next) => {
		let inputCode = req.body.code;
		let code = req.session.code;
		console.log(`confirm section's code: ${code}`);

		if(code == undefined){
			req.flash("match", "Send a code to your email first");
		//	res.locals.redirect = "/signup";
			req.session.auth = false;
			next();
		}else{
			if(code == inputCode) {
				//req.session.inputEmail = req.body.inputemail;
				console.log("code is correct");
				req.flash("match", "Authentication code is correct");
				res.locals.authentication = true;
				req.session.auth=true;
			//	res.render("signUp");
				next();
			}else{
				req.flash("match", "Authentication code is not correct. Send again");
				req.session.auth = false;
				req.session.code = null;
			//	res.locals.redirect = "/signup";
				next();
			}
		}
	},
	signUpAfterAuth: async(req,res,next) => {
		let inputCode = req.body.code;
		let code = req.session.code;

		if(code==undefined) {
			res.locals.redirect = "/signup";
			next(); 
		}else{
			if(code == inputCode) {
				res.render("signUp");
			}else{
				res.locals.redirect = "/signup";
				next();
			}
		}
	},
	findPw: async(req,res,next) => {
		console.log("here")
		let inputCode = req.body.code;
		let code = req.session.code;
		console.log(`findPw: ${inputCode}`);
		console.log(`findPs: ${code}`);
		if(code==undefined){
			res.locals.redirect = "/find/pw";
			next();
		}else{
			if(code == inputCode) {
			res.locals.redirect = "/setpw";
			next();

			}else{
				res.locals.redirect = "/find/pw";
				next();
			}
		}
	},
	setPwView: async(req,res,next) => {
		let authentication = req.session.auth;
		console.log(`authentication:${authentication}`);
		if(authentication){ res.render("setPw");}
	}


};
