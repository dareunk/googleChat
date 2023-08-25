const { Model } = require("sequelize");
const passportSequelize = require("passport-local-sequelize");
const bcrypt = require("bcrypt");

module.exports = (sequelize, Sequelize) => {
	class User extends Model {
		static async passwordComparison(inputuser, inputPassword){
			let user = inputuser;
			return bcrypt.compare(inputPassword, user.password);
		}

	};
	User.init({
		firstName: {
			type: Sequelize.STRING
		},
		lastName: {
			type: Sequelize.STRING
		},
		fullName: {
			type: Sequelize.VIRTUAL,
			get() {
				return `${this.firstName} ${this.lastName}`;
			}
		},
		email: {
			type : Sequelize.STRING, 
			primaryKey:true,
			allowNull:false
		},
		phone: {
			type: Sequelize.INTEGER,
			allowNull:false
		},
		password: {
			type: Sequelize.STRING,
			allowNull:false
		},
		profile:{
			type: Sequelize.STRING
		},
		myhash: {
			type: Sequelize.STRING(1024)
		},
		mysalt: {
			type: Sequelize.STRING
		}
	}, { hooks:{
		beforeSave: async(user) => {
			let hash = await bcrypt.hash(user.password, 10);
			user.password = hash;
		}
	},
			timestamps:true,
			sequelize,
			tableName:"user"
	});
	passportSequelize.attachToUser(User, {
		usernameField: "email",
		passwordField: "password",
		hashField: "myhash",
	});
	return User;
};