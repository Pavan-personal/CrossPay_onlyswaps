require('dotenv').config();

module.exports = {
  database: {
    connectionString: process.env.DATABASE_URL || "postgresql://testdb_owner:Du4WGvC0YpxM@ep-yellow-bird-a5pplakl-pooler.us-east-2.aws.neon.tech/newdb?sslmode=require&channel_binding=require"
  },
  server: {
    port: process.env.PORT || 3001
  }
};