const mongoose = require("mongoose");
const config = require("../../config/index");

async function connectMongoose() {
  try {
    await mongoose.connect(config?.DB_URL ?? "");
    console.log("Mongoose connected successfully");
  } catch (error) {
    console.error("Mongoose connection error", error);
  }
}

module.exports = {
  connectMongoose,
};
