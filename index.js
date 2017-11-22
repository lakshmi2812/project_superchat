const express = require("express");
const app = express();
const server = require("http").createServer(app);
const io = require("socket.io")(server);
const bodyParser = require("body-parser");
const handlebars = require("express-handlebars");
let Promise = require("bluebird");
const redis = require("redis");
Promise.promisifyAll(redis);
let redisClient = redis.createClient();

const hbs = handlebars.create({
  defaultLayout: "main"
});
app.use(bodyParser.urlencoded({ extended: true }));
app.engine("handlebars", hbs.engine);
app.set("view engine", "handlebars");

app.use(
  "/socket.io",
  express.static(__dirname + "node_modules/socket.io-client/dist/")
);

app.get("/", (req, res) => {
  res.render("index");
});

// look up how many objects there are in redis
// create a new value, with digit as key, and hash as value
// hash keys => author, message
//
// 0: {
//   id: 0
//   author: anony
//   message: hi there
// }
let totalMessages;
let message;
let allMessages = [];

app.post("/", (req, res) => {
  message = req.body["message"];
  redisClient
    .keysAsync("*")
    .then(keys => {
      totalMessages = keys.length;
      return totalMessages;
    })
    .then(totalMessages => {
      let newMessage = redisClient.HMSETAsync(totalMessages, {
        author: "anonymous",
        message: message,
        id: totalMessages
      });
      return newMessage;
    })
    // retrieving all messages form redis database
    .then(newMessage => {
      let test = redisClient.get(`${totalMessages}`, (err, data) => {
        if (err) {
          console.log(err);
        }
        console.log(data);
      });
      allMessages.push(newMessage);
      res.render("index", allMessages);
    })
    .catch(error => {
      console.log(error);
    });
});

app.use((err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }
  if (err.stack) {
    err = err.stack;
  }
  res.status(500).json({ error: err });
});

app.listen(3000);
