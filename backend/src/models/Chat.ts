import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IChat extends Document {
  type: 'direct' | 'group';
  name?: string;
  avatar?: string;
  description?: string;
  participants: mongoose.Types.ObjectId[];
  createdBy: mongoose.Types.ObjectId;
  admin: mongoose.Types.ObjectId[];
  lastMessage?: mongoose.Types.ObjectId;
  lastActivity: Date;
  isMuted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const chatSchema = new Schema<IChat>(
  {
    type: {
      type: String,
      enum: ['direct', 'group'],
      required: true,
    },
    name: {
      type: String,
      trim: true,
      maxlength: 50,
    },
    avatar: {
      type: String,
      default: '',
    },
    description: {
      type: String,
      maxlength: 200,
      default: '',
    },
    participants: {
      type: [Schema.Types.ObjectId],
      ref: 'User',
      required: true,
      validate: {
        validator: function (arr: mongoose.Types.ObjectId[]) {
          // Direct chats must have exactly 2 participants
          if (this.type === 'direct') return arr.length === 2;
          // Group chats must have at least 2 participants
          return arr.length >= 2;
        },
        message: 'Invalid participant count for chat type',
      },
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    admin: {
      type: [Schema.Types.ObjectId],
      ref: 'User',
      default: [],
    },
    lastMessage: {
      type: Schema.Types.ObjectId,
      ref: 'Message',
    },
    lastActivity: {
      type: Date,
      default: Date.now,
    },
    isMuted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
chatSchema.index({ participants: 1 });
chatSchema.index({ lastActivity: -1 });
chatSchema.index({ type: 1, lastActivity: -1 });

const Chat: Model<IChat> = mongoose.model<IChat>('Chat', chatSchema);

export default Chat;
