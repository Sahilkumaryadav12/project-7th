const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongod = null;

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/meditrack';
    
    // Attempt connecting to specified MONGO_URI with short timeout to catch absent local daemon fast
    const options = {
      serverSelectionTimeoutMS: 2000,
    };

    try {
      await mongoose.connect(mongoUri, options);
      console.log(`[Database] Connected to MongoDB at ${mongoUri}`);
    } catch (primaryErr) {
      console.warn(`[Database] Could not connect to primary MongoDB at ${mongoUri}. Spinning up MongoDB Memory Server fallback...`);
      mongod = await MongoMemoryServer.create();
      const memoryUri = mongod.getUri();
      await mongoose.connect(memoryUri);
      console.log(`[Database] Connected to fallback MongoDB Memory Server at ${memoryUri}`);
    }
  } catch (err) {
    console.error(`[Database] Error connecting to database: ${err.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
