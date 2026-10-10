require('dotenv').config();
const path = require('path');
// Ensure dotenv also checks backend/.env if started from root
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = require('./src/app');
const { connectDb } = require('./src/db/connection');
const { migrateFromSqliteIfNeeded } = require('./src/db/migrateSqlite');
const mongoose = require('mongoose');

const PORT = process.env.PORT || 5000;

let serverInstance = null;

async function start() {
  try {
    // Connect strictly to MongoDB using Mongoose - no fallback to SQLite
    await connectDb();

    // Preserve existing assessments by migrating into MongoDB if needed
    await migrateFromSqliteIfNeeded();

    serverInstance = app.listen(PORT, () => {
      console.log(`=======================================================`);
      console.log(`  ProofPath Assessment Platform Server`);
      console.log(`  Running on http://localhost:${PORT}`);
      console.log(`  Database: MongoDB (${mongoose.connection.name})`);
      console.log(`  AI Engine: ${process.env.GEMINI_API_KEY ? 'Gemini Live' : 'Deterministic Explainable Demo'}`);
      console.log(`=======================================================`);
    });

    return serverInstance;
  } catch (err) {
    console.error(`[ProofPath Fatal] Server failed to start: ${err.message}`);
    process.exit(1);
  }
}

if (require.main === module) {
  start();
}

module.exports = { app, start };
