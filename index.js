const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const bodyparse = require('body-parser');
const handlebars = require('express-handlebars');
let Promise = require('bluebird');
const redis = require('redis');
Promise.promisifyAll(redis);
let redisClient = redis.createClient();

app.use(
	'/socket.io',
	express.static(__dirname + 'node_modules/socket.io-client/dist/')
);
