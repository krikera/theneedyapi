import mongoose from 'mongoose';

/**
 * Audit log of rejected apologies.
 */

const grudgeSchema = new mongoose.Schema(
  {
    apologyText: {
      type: String,
      required: true,
      trim: true,
    },
    wordCount: {
      type: Number,
      required: true,
    },
    rejectionReason: {
      type: String,
      default: 'Insufficient sincerity (< 20 words).',
    },
    timestamp: {
      type: Date,
      default: Date.now,
      immutable: true,
    },
  },
  {
    timestamps: true,
    collection: 'grudges',
  }
);

grudgeSchema.index({ timestamp: -1 });

const Grudge = mongoose.model('Grudge', grudgeSchema);

export default Grudge;
