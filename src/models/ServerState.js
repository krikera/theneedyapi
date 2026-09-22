import mongoose from 'mongoose';

/**
 * Singleton model tracking server emotion, hunger, and interaction timestamp.
 */

const serverStateSchema = new mongoose.Schema(
  {
    lastInteraction: {
      type: Date,
      default: Date.now,
      required: true,
      index: true,
    },
    hungerLevel: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
      required: true,
    },
    isAngry: {
      type: Boolean,
      default: false,
      required: true,
    },
  },
  {
    timestamps: true,
    collection: 'server_state',
  }
);

/**
 * Gets or initializes the singleton server state document.
 */
serverStateSchema.statics.getOrCreateState = async function () {
  const state = await this.findOneAndUpdate(
    {},
    {
      $setOnInsert: {
        lastInteraction: new Date(),
        hungerLevel: 0,
        isAngry: false,
      },
    },
    {
      upsert: true,
      returnDocument: 'after',
      setDefaultsOnInsert: true,
    }
  );
  return state;
};

/**
 * Atomically updates lastInteraction and merges optional fields.
 */
serverStateSchema.statics.touchInteraction = async function (additionalUpdates = {}) {
  return this.findOneAndUpdate(
    {},
    {
      $set: {
        lastInteraction: new Date(),
        ...additionalUpdates,
      },
    },
    {
      upsert: true,
      returnDocument: 'after',
      setDefaultsOnInsert: true,
    }
  );
};

/**
 * Atomically feeds the pet (resets hunger to 0 and updates interaction time).
 */
serverStateSchema.statics.feedPet = async function () {
  return this.findOneAndUpdate(
    {},
    {
      $set: {
        hungerLevel: 0,
        lastInteraction: new Date(),
      },
    },
    {
      upsert: true,
      returnDocument: 'after',
      setDefaultsOnInsert: true,
    }
  );
};

/**
 * Atomically increments hunger level using pipeline update clamped to max.
 */
serverStateSchema.statics.incrementHunger = async function (increment = 5, max = 100) {
  return this.findOneAndUpdate(
    {},
    [
      {
        $set: {
          hungerLevel: {
            $min: [max, { $add: [{ $ifNull: ['$hungerLevel', 0] }, increment] }],
          },
        },
      },
    ],
    {
      upsert: true,
      returnDocument: 'after',
      setDefaultsOnInsert: true,
      updatePipeline: true,
    }
  );
};

/**
 * Atomically updates the anger disposition.
 */
serverStateSchema.statics.setAngry = async function (isAngry = true) {
  return this.findOneAndUpdate(
    {},
    {
      $set: { isAngry },
    },
    {
      upsert: true,
      returnDocument: 'after',
      setDefaultsOnInsert: true,
    }
  );
};

const ServerState = mongoose.model('ServerState', serverStateSchema);

export default ServerState;
