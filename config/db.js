const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const connectionString = process.env.MONGO_URI;
    const conn = await mongoose.connect(connectionString);

    console.log(`MongoDB Connected: ${conn.connection.host}`.cyan.underline);
  } catch (error) {
    console.log(`Error: ${error.message}`);
    process.exit(1);
  }
}

module.exports = connectDB;