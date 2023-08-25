const port = 3000,
	express = require("express"),
	app = express();
const homeController = require("./controllers/homeController");
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
//connect to DB with sequelize  
db.sequelize.sync();

app.set("views", "./views");
app.set("view engine", "ejs");
app.use(cors());
app.use(cookieParser("secret_password"));
app.use(expressSession({
	secret: "secret_password",
	cookie:{
		maxAge:4000000
	},
	resave:false,
	saveUninitialized:false
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
	socket.on("newUser", async(email) => {
		console.log(email);
		let user = await User.findByPk(email);
		let userName = user.fullName;
		console.log(userName);
		socket.email = email;
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
		let user = await User.findOne({
			where: {email:email}
		});
		if(user){
			if(User.passwordComparison(user, password)) {return done(null,user);
		}else{
			//The user information is in DB and entered password is the same from DB
			return done(null,false, {message: "password is wrong"});
		}
	}else { return done(null,false, {message: "Your account does not exist. Sign up first"});}
	}catch(error){
		return done(error);
	}
}));
passport.serializeUser(function(user,done){
	done(null,user.email);
});
passport.deserializeUser( async function(email, done){
	const user = await User.findOne({
		where: { email:email}
	});
	done(null,user);
});
app.use(async(req,res,next) => {
	res.locals.loggedIn = await req.isAuthenticated();
	res.locals.currentUser = await req.user;
	res.locals.flashMessages = req.flash();
	next()
});



app.get("/", (req,res) => { res.render("index")});
app.get("/signup", homeController.signUpView);
app.post("/signup", 
	[
	sanitizeBody("email").normalizeEmail({
		all_lowercase:true
	}).trim(),
	check("email","email is invalid").isEmail(),
	check("password", "password must be enterd").notEmpty(),
	],homeController.validate, homeController.signUp, homeController.redirectView);
app.get("/login", homeController.logInView);
app.post("/login", passport.authenticate("local", {
			failureRedirect: "/login",
			successRedirect: "/chatrooms",
			failureFlash: true
}));
app.get("/create", homeController.createChatRoom);
app.post("/create", homeController.create, homeController.redirectView);
app.get("/chatrooms", homeController.chatRoom);
app.get("/chat/:id", homeController.chat);
server.listen(port);
console.log(`The server has started and is listening on the port number: ${port}`);

