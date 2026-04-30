process.loadEnvFile(".env");
const config = {
  PORT: process.env.PORT,
  SALT: process.env.SALT,
  EXPIRES_IN: process.env.EXPIRES_IN,
  DB_URL: process.env.DB_URL,
};

module.exports = Object.freeze(config);
