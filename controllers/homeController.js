const db = require("../models/index"),
	User = db.user,
	ChatRoom = db.chatroom,
	Chat = db.chat;
const store= require("store");
const {validationResult} = require("express-validator");
const getUserParams = (body, validEmail) => {
	return {
		firstName: body.firstName,
		lastName:body.lastName,
		email:validEmail,
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
		res.locals.authentication = false;
		res.render("signUp");
	},

	signUp: async(req,res,next) => {
		
		let code = req.session.code;
		let validEmail = req.session.inputEmail;
		let checkAuthentication = req.session.auth;
		console.log(code);
		console.log(checkAuthentication);
		console.log(`validEmail:${validEmail}`);
		if(checkAuthentication){
		let userParams = await getUserParams(req.body, validEmail);
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
					res.locals.redirect="/signup";
					next(error);
				}
			});

		}catch(error){
			console.log(`Error saving user's information: ${error.message}`);
			next(error);
		}
		}else{
			req.flash("error", "Send a code first and then confirm it");
			res.locals.redirect = "/signup";
			next();
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
		res.render("localLogin");
	},
	chatRoom: async(req,res) => {
		console.log(req.user);
		console.log(req.isAuthenticated());
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
	search: async(req,res) => {
		let search = req.body.search;
		console.log(search);
		//It is simple code, but only printed out when it is exactly match.
		/*
		const chatRooms = await ChatRoom.findAll({
			where: { roomName: search}});
		res.locals.chatrooms = chatRooms;
		res.render("chatRooms");
		*/

		// if it does not exactly match, can be printed out
		const chatRooms = await ChatRoom.findAll();
		var count = 0;
		var chatrooms = [];
		chatRooms.forEach( (chatRoom) => {
			if(chatRoom.roomName.indexOf(search) != -1){
				//console.log(chatRoom);
				chatrooms[count] = chatRoom;
				count++;
			}});
		console.log(chatrooms);
		res.locals.chatrooms = chatrooms;
		res.render("chatRooms");
		
	},	
	create: async(req,res,next)=>{
		let user = res.locals.currentUser;
		let code = res.locals.code;
		console.log(code);
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
	},
	findId: async(req,res,next) => {
		//console.log(req.body.firstName);
		//console.log(req.body.lastName);
		//console.log(req.body.phone);
	
		let user = await User.findOne({ where: {
			firstName: req.body.firstName,
			lastName: req.body.lastName,
			phone: req.body.phone
		}});
		console.log(user);
		if(user===null){ 
			req.flash("error","Can't find a user. Plese recheck your information you put or sign in");
		}
		else{
			req.flash("success",`${user.email}`);
			
		}
		//console.log(user);
		res.locals.redirect = "/resultFind";
		next();
	},
	resultFindId: (req,res) => {
		res.render("resultFindId");
	},
	resultFindPw: (req,res) => {
		res.render("resultFindPw");
	}
	
};
