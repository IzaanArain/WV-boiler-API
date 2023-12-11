const mongoose = require("mongoose");
const express = require("express");
const app = express();
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const socketIO = require("socket.io");
require("./model");
const connect = require("./db/db");
dotenv.config();
const admin = require("./routes/admin");
const user = require("./routes/UserRoutes");
const common = require("./routes/common");
const TcPp = mongoose.model("TcPp");
var fs = require("fs");
const bodyParser = require("body-parser");
connect();
// const options = {
//   key: fs.readFileSync('/home/serverappsstagin/ssl/keys/b319e_1c941_fad63c8eeb17a7e86e5db73f3379eedb.key'),
//   cert: fs.readFileSync('/home/serverappsstagin/ssl/certs/server_appsstaging_com_b319e_1c941_1694648224_922935e7339cac445668733169408dd2.crt'),
// };
// const server = require('https').createServer(options, app);
const server = require("http").createServer(app);
app.use(
  cors({
    origin: "*",
  })
);
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.json());
app.use("/uploads", express.static("uploads"));
app.use(admin);
app.use(user);
app.use(common);
const { get_messages, send_message } = require("./utils/chat");
const { pushNotifications } = require("./utils/utils");
const { cronJob } = require("./utils/cronJob");

var io = require("socket.io")(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PATCH", "DELETE"],
    credentials: false,
    transports: ["websocket", "polling"],
    allowEIO3: true,
  },
});

io.on("connection", (socket) => {
  console.log("socket connection " + socket.id);
  socket.on("get_messages", function (object) {
    var user_room = "user_" + object.sender_id;
    socket.join(user_room);
    get_messages(object, function (response) {
      if (response.length > 0) {
        console.log("get_messages has been successfully executed...");
        io.to(user_room).emit("response", {
          object_type: "get_messages",
          data: response,
        });
      } else {
        console.log("get_messages has been failed...");
        io.to(user_room).emit("response", {
          object_type: "get_messages",
          message: "There is some problem in get_messages...",
          data: [],
        });
      }
    });
  });
  // SEND MESSAGE EMIT
  socket.on("send_message", function (object) {
    var sender_room = "user_" + object.sender_id;
    var receiver_room = "user_" + object.receiver_id;
    send_message(object, async (response_obj) => {
      if (response_obj) {
        console.log("send_message has been successfully executed...");
        io.to(sender_room)
          .to(receiver_room)
          .emit("response", { object_type: "get_message", data: response_obj });
      } else {
        console.log("send_message has been failed...");
        io.to(sender_room).to(receiver_room).emit("error", {
          object_type: "get_message",
          message: "There is some problem in get_message...",
        });
      }
    });
  });
});
const contentSeeder = [
  {
    title: "Privacy Policy",
    content:
      "Lorem ipsum dolor sit amet.Ea iste consectetur qui harum libero exercitationem harum et quam earum At cupiditate perferendis qui aspernatur vero!",
    companyImage: "",
    contentType: "privacy_policy",
  },
  {
    title: "About Us",
    content:
      "Lorem ipsum dolor sit amet.Ea iste consectetur qui harum libero exercitationem harum et quam earum At cupiditate perferendis qui aspernatur vero!",
    companyImage: "",
    contentType: "about_us",
  },
  {
    title: "Terms and Conditions",
    content:
      "Lorem ipsum dolor sit amet.Ea iste consectetur qui harum libero exercitationem harum et quam earum At cupiditate perferendis qui aspernatur vero!",
    companyImage: "",
    contentType: "terms_and_conditions",
  },
  {
    title: "Information",
    content:
      "Lorem ipsum dolor sit amet.Ea iste consectetur qui harum libero exercitationem harum et quam earum At cupiditate perferendis qui aspernatur vero!",
    companyImage: "",
    contentType: "information",
  },
];

var abc;
const dbSeed = async () => {
  try {
    const findTcPp = await TcPp.find({});
    if (findTcPp?.length < 1) {
      const pp = await TcPp.find({ contentType: "privacy_policy" });
      if (pp.length > 1 || pp.length < 1) {
        await TcPp.deleteMany({ type: "privacy_policy" });
        await TcPp.insertMany(contentSeeder[0]);
      }
      const about_us = await TcPp.find({ contentType: "about_us" });
      if (about_us.length > 1 || about_us.length < 1) {
        await TcPp.deleteMany({ type: "about_us" });
        await TcPp.insertMany(contentSeeder[1]);
      }
      const tc = await TcPp.find({ contentType: "terms_and_conditions" });
      if (tc.length > 1 || tc.length < 1) {
        await TcPp.deleteMany({ type: "terms_and_conditions" });
        await TcPp.insertMany(contentSeeder[2]);
      }
      const info = await TcPp.find({ contentType: "information" });
      if (info.length > 1 || info.length < 1) {
        await TcPp.deleteMany({ type: "information" });
        await TcPp.insertMany(contentSeeder[3]);
      }
    } else {
      abc = await TcPp.find({});
    }
  } catch (err) {
    console.error("error", err.message);
  }
};
dbSeed();
app.set("views", "./views");
    app.set("view engine", "pug");

    app.get("/privacy_policy*", (req, res, next) => {
      res.render("index", {
        title: "Privacy Policy",
        heading: "Privacy Policy",
        paragraph: abc ? abc[0].content : contentSeeder[0].content,
      });
    });
    app.get("/about_us*", (req, res, next) => {
      res.render("index", {
        title: "About Us",
        heading: "About Us",
        paragraph: abc ? abc[1].content : contentSeeder[1].content,
      });
    });
    app.get("/terms_and_conditions*", (req, res, next) => {
      res.render("index", {
        title: "Terms And Conditions",
        heading: "Terms And Conditions",
        paragraph: abc ? abc[2].content : contentSeeder[2].content,
      });
    });

    app.get("/information*", (req, res, next) => {
      res.render("index", {
        title: "Information",
        heading: "Information",
        paragraph: abc ? abc[2].content : contentSeeder[3].content,
      });
    });
// cronJob()
const PORT = process.env.PORT || 3002;
server.listen(PORT, (req, res) => {
  console.log(`Server running on ${PORT}`);
});
exports.dbSeed = dbSeed;
