const {Model} = require("sequelize");

module.exports = (sequelize, Sequelize) => {
	const ChatRoom = require("./chatRoom")(sequelize,Sequelize);
	class Chat extends Model{};
	Chat.init({
	id: {   
		type: Sequelize.INTEGER,
		autoIncrement: true,
		primaryKey: true
	},
	userEmail: {
		type: Sequelize.STRING,
		allowNull:false,
		required: true
	},
	content: {
		type: Sequelize.STRING,
		allowNull:false,
		required: true
	},
	chatRoomNum: {
		type: Sequelize.INTEGER,
		references: {
			model: ChatRoom,
			key: "id",
		},
	},
	}, {
		timestamps: true,
		sequelize,
		tableName: "chat"
	});

	return Chat;

};
