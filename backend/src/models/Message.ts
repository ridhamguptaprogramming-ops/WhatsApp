import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IMedia {
  url: string;
  thumbnail?: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  duration?: number;
}

export interface IReaction {
  user: mongoose.Types.ObjectId;
  emoji: string;
}

export interface IReadReceipt {
  user: mongoose.Types.ObjectId;
  readAt: Date;
}

export interface IMessage extends Document {
  chatId: mongoose.Types.ObjectId;
  sender: mongoose.Types.ObjectId;
  type: 'text' | 'image' | 'video' | 'audio' | 'file';
  content: string;
  media?: IMedia;
  replyTo?: mongoose.Types.ObjectId;
  status: 'sent' | 'delivered' | 'read';
  readBy: IReadReceipt[];
  reactions: IReaction[];
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<IMessage>(
  {
    chatId: {
      type: Schema.Types.ObjectId,
      ref: 'Chat',
      required: true,
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['text', 'image', 'video', 'audio', 'file'],
      default: 'text',
    },
content: {
      type: String,
      maxlength: 5000,
    },
    media: {
      url: String,
      thumbnail: String,
      fileName: String,
      fileSize: Number,
      mimeType: String,
      duration: Number,
    },
    replyTo: {
      type: Schema.Types.ObjectId,
      ref: 'Message',
    },
    status: {
      type: String,
      enum: ['sent', 'delivered', 'read'],
      default: 'sent',
    },
    readBy: [
      {
        user: { type: Schema.Types.ObjectId, ref: 'User' },
        readAt: { type: Date, default: Date.now },
      },
    ],
    reactions: [
      {
        user: { type: Schema.Types.ObjectId, ref: 'User' },
        emoji: { type: String, required: true },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
messageSchema.index({ chatId: 1, createdAt: -1 });
messageSchema.index({ chatId: 1, status: 1 });
messageSchema.index({ sender: 1 });

const Message: Model<IMessage> = mongoose.model<IMessage>('Message', messageSchema);

export default Message;
