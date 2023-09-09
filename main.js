const port = 3000,
	express = require("express"),
	app = express();
const homeController = require("./controllers/homeController"),
	authController = require("./controllers/authController");
const passport = require("passport");
const cors = require("cors");
const { check, sanitizeBody } = require("express-validator"),
	LocalStrategy = require("passport-local").Strategy;
const db= require("./models/index"),
	User = db.user,
	Chat = db.chat;
const cookieParser = require("cookie-parser");
const expressSession = require("express-session");
const connectFlash = require("connect-flash");
//to create the function of chatting
const http = require("http"),
	server = http.createServer(app),
	socket = require("socket.io"),
	io = socket(server);
require("dotenv").config();
//connect to DB with sequelize
const GoogleStrategy = require("passport-google-oauth2").Strategy;
const clientID = process.env.GOOGLE_CLIENT_ID,
	clientSecret = process.env.GOOGLE_CLIENT_SECRET,
	clientRedirectUrl = process.env.GOOGLE_REDIRECT_URL;
//const memoryStore = require("memoryStore")(session);
/*
const nodeMailer = require("nodemailer");

var generateRandomString = function(length) {
	  var text = '';
	  var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

	  for (var i = 0; i < length; i++) {
		      text += possible.charAt(Math.floor(Math.random() * possible.length));
		    }
	  return text;
};

const send = async(email) => {
	const transporter = nodeMailer.createTransport({
		service: "google",
		host: "smtp.google.com",
		port: port,
		auth: {
			user: process.env.SENDER,
			pass: process.env.PASSWORD
		}
	});
	var number = generateRandomString(6);
	var text = `[Authentication code] + ${number}`;
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
*/

db.sequelize.sync();

app.set("views", "./views");
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(cors());
app.use(cookieParser("secret_password"));
app.use(expressSession({
	secret: "secret_password",
	cookie:{
		maxAge:4000000
	},
	resave:false,
	saveUninitialized:true

}));
app.use(connectFlash());
app.use(
	express.urlencoded({
		extended: false
	})
);

app.use(express.json());
io.on("connection", (socket) => {
	console.log("new connection");
	socket.on("newUser", async(userEmail, userName) => {
	//	console.log(userEmail);
		
		//let user = await User.findByPk(email);
		

	//	console.log(userName);
		socket.email = userEmail;
		socket.name = userName;
		let msg = "hi! " + socket.name;
		//	console.log(`name: ${name}`);
		io.emit("pop",msg);
		});
	socket.on("disconnect", async() => {
		console.log("user disconnected");
		let msg = socket.name + " disconnected";
		socket.broadcast.emit("pop", msg);
	});
	socket.on("message", async(content,id) => {
		//console.log(`content: ${content}`);
		//console.log(`id: ${id}`);
		//console.log(`user: ${socket.name}`);
		let chatAttributes = {
			userEmail: socket.email,
			content: content,
			chatRoomNum: id
		};
		await Chat.create(chatAttributes);
		io.emit("update",content, socket.name);
	});
		
});

app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy({
	usernameField: "email",
	passwordField:"password",
	session:true,
	passReqToCallback: false,
},async function(email,password, done) {
	try{
		let user = await User.findByPk(email);
		if(user){
			
			if(await User.passwordComparison(user, password)) {return done(null,user);
		}else{
			//The user information is in DB and entered password is the same from DB
			return done(null,false, {message: "password is wrong"});
		}
	}else { return done(null,false, {message: "Your account does not exist. Sign up first"});}
	}catch(error){
		return done(error);
	}
}));
passport.use(new GoogleStrategy({
	clientID: clientID,
	clientSecret: clientSecret,
	callbackURL: clientRedirectUrl,
	passReqToCallback: true,
}, async function(request, accessToken, refreshToken, profile, done) {
	console.log(profile);
//	console.log(accessToken);
	return done(null, profile);
}));
passport.serializeUser(function(user,done){
	done(null,user);
});
passport.deserializeUser( async function(user, done){
	//const user = await User.findOne({
	//	where: { email:email}
	//});
	done(null,user);
});

app.use(async(req,res,next) => {
	res.locals.loggedIn = await req.isAuthenticated();
	res.locals.currentUser = await req.user;
	res.locals.flashMessages = req.flash();
	next();
});



app.get("/", (req,res) => { res.render("index")});
app.get("/signup", homeController.signUpView);
app.post("/signup", 
	[ //sanitizeBody("email").normalizeEmail({all_lowercase:true}).trim(),
	//	check("email", "email is invalid").isEmail(),
	check("password", "password must be enterd").notEmpty(),
	],homeController.validate,homeController.signUp, homeController.redirectView);
app.post("/sendCode", authController.sendMessage);
app.post("/confirm", authController.matchCode, authController.signUpAfterAuth, homeController.redirectView);
app.get("/login", (req,res) => {res.render("login")});
app.get("/login/local", homeController.logInView);
app.post("/login/local", passport.authenticate("local", {
			failureRedirect: "/login/local",
			successRedirect: "/chatrooms",
			failureFlash: true
}));
app.get("/login/google", passport.authenticate("google", {scope: ["email", "profile"]}));
app.get("/login/google/callback", passport.authenticate("google", {
			failureRedirect: "/login/google",
			successRedirect: "/chatrooms",
			failureFlash:true
}));

app.get("/create", homeController.createChatRoom);
app.post("/create", homeController.create, homeController.redirectView);
app.get("/chatrooms", homeController.chatRoom);
app.get("/chat/:id", homeController.chat);
app.post("/search", homeController.search);
app.get("/find/id", (req,res) => {res.render("findId")});
app.post("/find/id", homeController.findId, homeController.redirectView);
app.get("/find/pw", (req,res) => {res.render("findPw")});
app.post("/find/pw", authController.matchCode, authController.findPw, homeController.redirectView);
app.get("/setpw", authController.setPwView);
app.post("/setpw", authController.setPw, homeController.redirectView);
app.get("/resultFind", homeController.resultFindId);
app.get("/resultFind/pw", homeController.resultFindPw);
server.listen(port);
console.log(`The server has started and is listening on the port number: ${port}`);

