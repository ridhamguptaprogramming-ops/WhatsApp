import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IMedia extends Document {
  owner: mongoose.Types.ObjectId;
  message?: mongoose.Types.ObjectId;
  chatId: mongoose.Types.ObjectId;
  type: 'image' | 'video' | 'audio' | 'file';
  url: string;
  thumbnail?: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  width?: number;
  height?: number;
  duration?: number;
  storageType: 's3' | 'local';
  createdAt: Date;
}

const mediaSchema = new Schema<IMedia>(
  {
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    message: {
      type: Schema.Types.ObjectId,
      ref: 'Message',
    },
    chatId: {
      type: Schema.Types.ObjectId,
      ref: 'Chat',
      required: true,
    },
    type: {
      type: String,
      enum: ['image', 'video', 'audio', 'file'],
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
    thumbnail: {
      type: String,
    },
    fileName: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    width: {
      type: Number,
    },
    height: {
      type: Number,
    },
    duration: {
      type: Number,
    },
    storageType: {
      type: String,
      enum: ['s3', 'local'],
      default: 'local',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
mediaSchema.index({ chatId: 1, createdAt: -1 });
mediaSchema.index({ owner: 1 });

const Media: Model<IMedia> = mongoose.model<IMedia>('Media', mediaSchema);

export default Media;
