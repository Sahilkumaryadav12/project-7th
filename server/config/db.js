const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const { MongoMemoryServer } = require('mongodb-memory-server');

let localMongo = null;

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) throw new Error('MONGO_URI must be configured');

  try {
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
    console.log('[Database] Connected to configured MongoDB');
  } catch (primaryError) {
    const developmentMode = (process.env.NODE_ENV || 'development') === 'development';
    const fallbackAllowed = process.env.ALLOW_LOCAL_MONGODB_FALLBACK !== 'false';
    if (!developmentMode || !fallbackAllowed) {
      console.error('[Database] Connection to configured MongoDB failed:', primaryError.message);
      if (primaryError.message.includes('whitelist') || primaryError.message.includes('SSL') || primaryError.message.includes('ReplicaSetNoPrimary') || primaryError.name === 'MongooseServerSelectionError') {
        console.error('[Database] ATLAS IP WHITELIST REQUIRED: In MongoDB Atlas (cloud.mongodb.com), go to Network Access -> Add IP Address -> Allow Access from Anywhere (0.0.0.0/0). Cloud providers like Render require this because their IPs are dynamic.');
      }
      // Automatically retry connecting in 5 seconds
      setTimeout(() => {
        if (mongoose.connection.readyState !== 1) {
          console.log('[Database] Retrying MongoDB connection...');
          connectDB().catch(() => {});
        }
      }, 5000);
      throw primaryError;
    }

    const dataPath = path.join(__dirname, '..', 'data', 'mongodb');
    fs.mkdirSync(dataPath, { recursive: true });
    console.warn('[Database] Configured MongoDB is unreachable; starting the persistent local development database.');
    localMongo = await MongoMemoryServer.create({ instance: { dbPath: dataPath } });
    await mongoose.connect(localMongo.getUri(), { serverSelectionTimeoutMS: 10000 });
    console.log('[Database] Connected to persistent local development MongoDB');
  }
};

const stopLocalMongo = async () => {
  if (localMongo) {
    await localMongo.stop();
    localMongo = null;
  }
};

module.exports = connectDB;
module.exports.stopLocalMongo = stopLocalMongo;
