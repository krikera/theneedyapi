import mongoose from 'mongoose';
import ServerState from '../models/ServerState.js';

let isDisconnectingIntentionally = false;

/**
 * Connect to MongoDB and initialize server state.
 */
export const connectDB = async (customURI) => {
  isDisconnectingIntentionally = false;
  const mongoURI = customURI || process.env.MONGODB_URI || 'mongodb://localhost:27017/needy_api';

  try {
    const conn = await mongoose.connect(mongoURI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    console.log(`MongoDB connected: ${conn.connection.host}`);

    mongoose.connection.on('error', (err) => {
      console.error(`MongoDB connection error: ${err.message}`);
    });

    mongoose.connection.on('disconnected', () => {
      if (!isDisconnectingIntentionally) {
        console.warn('MongoDB disconnected unexpectedly. Attempting reconnection...');
      }
    });

    // Initialize server state document
    const state = await ServerState.getOrCreateState();
    console.log('Pet state synchronized:', {
      hungerLevel: `${state.hungerLevel}%`,
      isAngry: state.isAngry,
      lastInteraction: state.lastInteraction.toISOString(),
    });
  } catch (error) {
    console.error(`MongoDB connection failed: ${error.message}`);
    process.exit(1);
  }
};

/**
 * Disconnect cleanly from MongoDB without triggering reconnection alarms.
 */
export const disconnectDB = async () => {
  isDisconnectingIntentionally = true;
  await mongoose.connection.close(false);
};
