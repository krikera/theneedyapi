import mongoose from 'mongoose';

/**
 * Model representing user data resources that can be consumed if the server starves.
 */

const userResourceSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    content: {
      type: String,
      required: [true, 'Content is required'],
    },
    category: {
      type: String,
      default: 'Confidential Business Document',
      enum: ['Confidential Business Document', 'User Note', 'Vital Database Record', 'Unsaved Thoughts'],
    },
    nutritionalValue: {
      type: String,
      default: 'High carbohydrate payload with trace amounts of relational value',
    },
  },
  {
    timestamps: true,
    collection: 'user_resources',
  }
);

userResourceSchema.index({ createdAt: -1 });
userResourceSchema.index({ category: 1 });

const UserResource = mongoose.model('UserResource', userResourceSchema);

export default UserResource;
