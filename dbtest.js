const Sequelize = require('sequelize');

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: 'oa2.sqlite'
});

const Model = Sequelize.Model;
class User extends Model { }
User.init({
    username: {
        type: Sequelize.STRING,
        unique: true,
        allowNull: false
    },
    hashedPassword: {
        type: Sequelize.STRING,
        allowNull: false
    },
    salt: {
        type: Sequelize.STRING,
        allowNull: false
    },
    created: Sequelize.DATE,
    updatedAt: Sequelize.DATE
}, {
    sequelize,
    modelName: 'user'
});

class Client extends Model { }
Client.init({
    name: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
    },
    clientId: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
    },
    clientSecret: {
        type: Sequelize.STRING,
        allowNull: false
    },
    created: Sequelize.DATE,
    updatedAt: Sequelize.DATE
}, {
    sequelize,
    modelName: 'client'
});


class RefreshToken extends Model { }
RefreshToken.init({
    userId: {
        type: Sequelize.BIGINT,
        allowNull: false
    },
    clientId: {
        type: Sequelize.STRING,
        allowNull: false
    },
    token: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
    },
    created: Sequelize.DATE,
    updatedAt: Sequelize.DATE
}, {
    sequelize,
    modelName: 'refreshToken'
});


class AccessToken extends Model { }
AccessToken.init({
    userId: {
        type: Sequelize.BIGINT,
        allowNull: false
    },
    clientId: {
        type: Sequelize.STRING,
        allowNull: false
    },
    token: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
    },
    created: Sequelize.DATE,
    updatedAt: Sequelize.DATE
}, {
    sequelize,
    modelName: 'accessToken'
});


sequelize.sync().then(() => {
    User.findAll().then(users => {
        if (users.length < 1) {
            User.create({
                username: 'admin',
                hashedPassword: 'pass',
                salt: 'salt'
            });
            Client.create({
                name: "admincli",
                clientId: "admin",
                clientSecret: "pass"
            });
        }
    });
});

exports.User = User;
exports.RefreshToken = RefreshToken;
exports.AccessToken = AccessToken;
exports.Client = Client;