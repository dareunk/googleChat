const {Model} = require("sequelize");

module.exports = (sequelize, Sequelize) => {
	const User = require("./user")(sequelize,Sequelize);	
	class ChatRoom extends Model {};
	ChatRoom.init({
		id: {
			type:Sequelize.INTEGER,
			autoIncrement: true,
			primaryKey: true
		},
		roomName: {
			type: Sequelize.STRING
		},
		description: {
			type: Sequelize.STRING
		},
		user: {
			type: Sequelize.STRING,
			references:{
				model: User,
				key: "email"
			}
		}
	},{ 
		timestamps: true,
		sequelize,
		tableName: "chatroom"
	});
	return ChatRoom;
};
