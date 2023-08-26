const db = require("../models/index"),
	User = db.user,
	ChatRoom = db.chatroom,
	Chat = db.chat;
const {validationResult} = require("express-validator");
const getUserParams = body => {
	return {
		firstName: body.firstName,
		lastName:body.lastName,
		email:body.email,
		phone:body.phone,
		password: body.password,
		profile: body.profileInput
	};
};
module.exports = {
	validate: async(req,res,next) => {
		const errors = await validationResult(req);
		console.log(errors);
		if(!(errors.isEmpty())){
			let messages = errors.array().map(e=>e.msg);
			res.skip=true;
			const errorvalidation = messages.join(" and");
			req.flash("error", errorvalidation);
			return res.redirect("/signup");
		}else{
			next();
		}
	},
	signUpView: (req,res) => {
		res.render("signUp");
	},

	signUp: async(req,res,next) => {
		let userParams = await getUserParams(req.body);
		try{
			console.log(userParams);
			let user = new User(userParams);
			User.register(user, req.body.password, (error,user)=> {
				if(user) {
					res.locals.redirect ="/";
					res.locals.user = user;
					next();
				}else{
					console.log(`Error while a user signing up: ${error.message}`);
					res.locals.redirect="/singup";
					next(error);
				}
			});
		}catch(error){
			console.log(`Error saving user's information: ${error.message}`);
			next(error);
		}
	},
	redirectView: (req,res) => {
		let redirectPath = res.locals.redirect;
		try{
			console.log(`conntected to ${redirectPath}`);
			res.redirect(redirectPath);
		}catch(error){
			console.log(`Error to connect to ${redirectPath}`);
		}
	},
	logInView: (req,res) => {
		res.render("logIn");
	},
	chatRoom: async(req,res) => {
		if(req.isAuthenticated()){
			const chatRooms = await ChatRoom.findAll();
			res.locals.chatrooms = chatRooms;
			res.render("chatRooms");
		}else{
			res.render("logIn");
		}
	},
	createChatRoom: async(req,res) => {
		res.render("createChatRooms");
	},
	create: async(req,res,next)=>{
		let user = res.locals.currentUser;
		console.log(`user: ${user}`);
		try{
			await ChatRoom.create({
				roomName: req.body.roomName,
				description: req.body.description,
				user: user.email
			});
			console.log(`roomName: ${req.body.roomName}, description: ${req.body.description}`);
			res.locals.redirect = "/chatrooms";
			next();
		}catch(error){
			console.log(`Error creating a chatroom:${error.message}`);
			req.flash("error", "something is wrong");
			res.locals.redirect = "/create";
			next();
		}
	},
	chat: async(req,res) => {
		let chatRoomId = req.params.id;
		console.log(`${chatRoomId}`);
		let previousChat = await Chat.findAll({where: {chatRoomNum : chatRoomId}});
		console.log(previousChat);
		res.locals.chatcontents = previousChat;
		res.locals.chatroomid = chatRoomId;
		res.render("chat");
	}

	
};
