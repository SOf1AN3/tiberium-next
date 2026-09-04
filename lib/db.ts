import mongoose from 'mongoose';

let cached = global as any;

if (!cached.mongoose) {
   cached.mongoose = { conn: null, promise: null };
}

async function connectToDatabase() {
   if (cached.mongoose.conn) {
      return cached.mongoose.conn;
   }

   if (!cached.mongoose.promise) {
      const MONGODB_URI = process.env.MONGODB_URI;

      if (!MONGODB_URI) {
         throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
      }

      const opts = {
         bufferCommands: false,
      };

      cached.mongoose.promise = mongoose
         .connect(MONGODB_URI, opts)
         .then((mongoose) => {
            console.log('✓ Connected to MongoDB');
            return mongoose;
         })
         .catch((error) => {
            console.error('✗ MongoDB connection error:', error);
            throw error;
         });
   }

   try {
      cached.mongoose.conn = await cached.mongoose.promise;
   } catch (e) {
      cached.mongoose.promise = null;
      throw e;
   }

   return cached.mongoose.conn;
}

export default connectToDatabase;
