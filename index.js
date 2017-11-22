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
      redisClient.HMSETAsync(totalMessages, {
        author: "anonymous",
        message: message,
        id: totalMessages
      });
    })
    .then(() => {
      return redisClient.hmgetAsync(totalMessages, "id", "author", "message");
    })
    .then(newMessage => {
      // ["1", "anonymous", "message"]
      allMessages.push(newMessage);
      // allMessages[newMessage[0]] = {
      //   id: newMessage[0],
      //   author: newMessage[1],
      //   message: newMessage[2]
      // };

      let messageObj = {
        params: allMessages
      };
      console.log(newMessage);
      console.log(messageObj);
      res.render("index", messageObj);
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
