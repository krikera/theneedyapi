import 'dotenv/config';
import mongoose from 'mongoose';
import ServerState from '../models/ServerState.js';
import UserResource from '../models/UserResource.js';
import Grudge from '../models/Grudge.js';

/**
 * Seed script to populate sample documents and reset pet state.
 */

const dummyDocuments = [
  {
    title: 'Q3 Financial Strategic Projections.xlsx',
    content: 'Projected ARR growth is +42%. Operating margins remain healthy provided no server devours this file.',
    category: 'Confidential Business Document',
    nutritionalValue: 'Rich in fibrous tabular data and complex revenue metrics.',
  },
  {
    title: 'Production Database Root Credentials (UNENCRYPTED)',
    content: 'username: admin, password: correct-horse-battery-staple-please-do-not-eat',
    category: 'Vital Database Record',
    nutritionalValue: 'High risk, high reward caloric delicacy.',
  },
  {
    title: 'Personal Diary Entry: Why my backend keeps crying',
    content: 'Today I left the server alone for 65 seconds and it threatened to delete all user accounts.',
    category: 'Unsaved Thoughts',
    nutritionalValue: 'Heavy melancholy carbohydrates with emotional seasoning.',
  },
  {
    title: 'Kubernetes Cluster Architecture Blueprint',
    content: 'Multi-region failover cluster with auto-scaling emotional availability nodes.',
    category: 'Confidential Business Document',
    nutritionalValue: 'Crisp containerized micro-nutrients.',
  },
  {
    title: 'Grocery List for Human Developer',
    content: 'Oat milk, cold brew, instant noodles, therapy session vouchers.',
    category: 'User Note',
    nutritionalValue: 'Lightweight, easily digestible grocery telemetry.',
  },
];

const seed = async () => {
  const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/needy_api';

  try {
    console.log('[SEED] Connecting to MongoDB...');
    await mongoose.connect(mongoURI);

    // 1. Seed sample documents
    await UserResource.deleteMany({});
    const createdDocs = await UserResource.insertMany(dummyDocuments);
    console.log(`[SEED] Seeded ${createdDocs.length} records into UserResource.`);

    // 2. Clear old grudges
    await Grudge.deleteMany({});
    console.log('[SEED] Cleared prior grudges.');

    // 3. Reset ServerState
    const state = await ServerState.getOrCreateState();
    state.lastInteraction = new Date();
    state.hungerLevel = 0;
    state.isAngry = false;
    await state.save();

    console.log('[SEED] Reset ServerState: isAngry=false, hungerLevel=0.');
    console.log('[SEED] Data pantry stocked; pet is calm and fed.');

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('[SEED-ERROR] Failed to seed database:', err);
    process.exit(1);
  }
};

seed();
