const mongoose = require('mongoose');
const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) throw new Error('MONGO_URI must be configured');
  await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 10000 });
  console.log('[Database] Connected to MongoDB');
};

module.exports = connectDB;
