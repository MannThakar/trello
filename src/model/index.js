const mongoose = require("mongoose");

const userSchema = mongoose.Schema({
  username: String,
  email: String,
  password: String,
});

const organizationSchema = mongoose.Schema({
  name: String,
  admin: mongoose.Types.ObjectId,
  members: [mongoose.Types.ObjectId],
});

const userModel = mongoose.model("users", userSchema);
const organizationModel = mongoose.model("organizations", organizationSchema);

module.exports = {
  userModel,
  organizationModel,
};
