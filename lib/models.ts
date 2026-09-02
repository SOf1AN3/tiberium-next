import mongoose, { Schema, Document } from 'mongoose';

// User Schema Types
interface IUser extends Document {
   name: string;
   email: string;
   password: string;
   type: 'simple' | 'advanced' | 'premium' | 'admin';
   isConfirmed: boolean;
   createdAt?: Date;
   updatedAt?: Date;
}

// Message Schema Types
interface IMessage extends Document {
   senderId: mongoose.Types.ObjectId;
   receiverId: mongoose.Types.ObjectId;
   content: string;
   timestamp: Date;
   seen?: boolean;
}

// User Schema
const userSchema = new Schema<IUser>(
   {
      name: {
         type: String,
         required: true,
      },
      email: {
         type: String,
         required: true,
         unique: true,
         lowercase: true,
         match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email'],
      },
      password: {
         type: String,
         required: true,
      },
      type: {
         type: String,
         enum: ['simple', 'advanced', 'premium', 'admin'],
         default: 'simple',
      },
      isConfirmed: {
         type: Boolean,
         default: false,
      },
   },
   { timestamps: true }
);

// Message Schema
const messageSchema = new Schema<IMessage>(
   {
      senderId: {
         type: Schema.Types.ObjectId,
         ref: 'User',
         required: true,
      },
      receiverId: {
         type: Schema.Types.ObjectId,
         ref: 'User',
         required: true,
      },
      content: {
         type: String,
         required: true,
      },
      timestamp: {
         type: Date,
         default: Date.now,
      },
      seen: {
         type: Boolean,
         default: false,
      },
   },
   { timestamps: true }
);

// Create indexes
messageSchema.index({ senderId: 1, receiverId: 1 });
messageSchema.index({ timestamp: -1 });

// Create or get existing models
export const User = mongoose.models.User || mongoose.model<IUser>('User', userSchema);
export const Message = mongoose.models.Message || mongoose.model<IMessage>('Message', messageSchema);

export type { IUser, IMessage };
