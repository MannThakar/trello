const jwt = require("jsonwebtoken");
const config = require("../config/index");

const authenticate = (req, res, next) => {
  const accessToken = req.headers.authorization?.split(" ")[1];

  if (!accessToken) {
    return res.status(401).send({
      status: 401,
      data: "Access Token missing",
    });
  }

  try {
    const decoded = jwt.verify(accessToken, config.SALT);
    req.headers.uid = decoded.uid;
    next();
  } catch (error) {
    return res.status(401).send({
      status: 401,
      data: error.message,
    });
  }
};

module.exports = { authenticate };
