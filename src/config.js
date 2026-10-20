/** Central configuration so the port is defined in exactly one place. */
const config = {
  PORT: Number(process.env.PORT) || 3000,
};

module.exports = config;
