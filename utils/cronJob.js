const mongoose = require("mongoose");
const Chat = mongoose.model("Chat");
const cron = require("node-cron");
const moment = require("moment");
const { pushNotifications } = require("./utils");
const cronJob = async (io) => {
  cron.schedule("*/59 * * * * *", async () => {
    console.log("ss")

  });
}

module.exports = { cronJob };
