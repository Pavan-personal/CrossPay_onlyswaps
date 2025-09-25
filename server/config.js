require('dotenv').config();

module.exports = {
  database: {
    connectionString: process.env.DATABASE_URL
  },
  server: {
    port: process.env.PORT || 3000
  }
};