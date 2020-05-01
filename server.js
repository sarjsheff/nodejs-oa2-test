var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');
var oauth2orize = require('oauth2orize');
var crypto = require('crypto');
var passport = require('passport');
var BasicStrategy = require('passport-http').BasicStrategy;
var ClientPasswordStrategy = require('passport-oauth2-client-password').Strategy;
var BearerStrategy = require('passport-http-bearer').Strategy;
var db = require('./dbtest.js');


var app = express();

//app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));


passport.use(new BasicStrategy(
    function (username, password, done) {
        db.Client.findAll({
            where: {
                clientId: username
            }
        }).then((clients) => {
            if (clients.length < 1) { return done(null, false); }
            if (clients[0].clientSecret != password) { return done(null, false); }

            return done(null, clients[0]);
        });
    })
);

passport.use(new ClientPasswordStrategy(
    function (clientId, clientSecret, done) {
        db.Client.findAll({
            where: {
                clientId: clientId
            }
        }).then((clients) => {
            if (clients.length < 1) { return done(null, false); }
            if (clients[0].clientSecret != clientSecret) { return done(null, false); }

            return done(null, clients[0]);
        });

    }
));

passport.use(new BearerStrategy(
    function (token, done) {
        db.AccessToken.findAll({ where: { token: token } }).then((tokens) => {
            if (tokens.length < 1) { return done(null, false); }
            db.User.findAll({ where: { id: tokens[0].userId } }).then((users) => {
                if (users.length < 1) { return done(null, false); }
                return done(null, users[0], { scope: 'all' });
            });
        });
    }
));

// OAUTH 2.0
var server = oauth2orize.createServer();

server.exchange(oauth2orize.exchange.password(function (client, username, password, scope, done) {

    db.User.findAll({
        where: {
            username: username
        }
    }).then((users) => {
        if (users.length < 1) { return done(null, false); }
        if (users[0].hashedPassword != password) { return done(null, false); }

        var user = users[0];

        db.RefreshToken.destroy({
            where: {
                userId: user.id, clientId: client.id
            }
        });

        db.AccessToken.destroy({
            where: {
                userId: user.id, clientId: client.id
            }
        });

        var tokenValue = crypto.randomBytes(32).toString('hex');
        var refreshTokenValue = crypto.randomBytes(32).toString('hex');

        db.RefreshToken.create({ token: refreshTokenValue, clientId: client.id, userId: user.id });
        db.AccessToken.create({ token: tokenValue, clientId: client.id, userId: user.id }).then(() => {
            done(null, tokenValue, refreshTokenValue, { 'expires_in': 3600 });
        });
    });
}));

server.exchange(oauth2orize.exchange.refreshToken(function (client, refreshToken, scope, done) {
    db.RefreshToken.findAll({ where: { token: refreshToken } }).then((tokens) => {
        if (tokens.length < 1) { return done(null, false); }

        db.User.findAll({ where: { id: tokens[0].userId } }).then((users) => {
            if (users.length < 1) { return done(null, false); }
            var user = users[0];
            db.RefreshToken.destroy({
                where: {
                    userId: user.id, clientId: client.id
                }
            });

            db.AccessToken.destroy({
                where: {
                    userId: user.id, clientId: client.id
                }
            });

            var tokenValue = crypto.randomBytes(32).toString('hex');
            var refreshTokenValue = crypto.randomBytes(32).toString('hex');
            db.RefreshToken.create({ token: refreshTokenValue, clientId: client.clientId, userId: user.id });
            db.AccessToken.create({ token: tokenValue, clientId: client.clientId, userId: user.id }).then(() => {
                done(null, tokenValue, refreshTokenValue, { 'expires_in': 3600 });
            });
        });
    });
}));

app.use(passport.initialize());

app.get('/oauth/token', function (req, res, next) { req.body = req.query; return next(); }, passport.authenticate(['basic', 'oauth2-client-password'], { session: false }), server.token(), server.errorHandler());

app.get("/api", passport.authenticate('bearer', { session: false }), function (req, res) {
    res.send("Ok");
});

app.listen(3333, function () {
    console.log('Express server listening on port 3333');
});