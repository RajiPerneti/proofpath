const mongoose = require('mongoose');

let isConnected = false;

function sanitizeMongoUri(uri) {
  if (!uri) return '';
  return uri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@');
}

function getMongoUri() {
  if (process.env.NODE_ENV === 'test') {
    return process.env.MONGODB_TEST_URI || 'mongodb://127.0.0.1:27017/proofpath_test';
  }
  return process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/proofpath';
}

async function connectDb() {
  if (isConnected && mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  const mongoUri = getMongoUri();
  const sanitized = sanitizeMongoUri(mongoUri);

  try {
    console.log(`[MongoDB] Connecting to database at ${sanitized}...`);
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000
    });
    isConnected = true;
    console.log(`[MongoDB] Successfully connected to database: ${mongoose.connection.name}`);
    return mongoose.connection;
  } catch (err) {
    console.error(`[MongoDB] Connection ERROR: Failed to connect to ${sanitized} - ${err.message}`);
    // DO NOT fall back to SQLite as explicitly instructed
    throw new Error(`MongoDB connection failed: ${err.message}`);
  }
}

async function closeDb() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    isConnected = false;
    console.log('[MongoDB] Disconnected from database.');
  }
}

function isDbConnected() {
  return mongoose.connection.readyState === 1;
}

module.exports = {
  connectDb,
  closeDb,
  isDbConnected,
  sanitizeMongoUri,
  getMongoUri
};
