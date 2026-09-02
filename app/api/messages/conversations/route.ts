import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { Message, User } from '@/lib/models';
import { verifyAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
   try {
      await connectToDatabase();

      const authHeader = request.headers.get('authorization');
      const authResult = await verifyAuth(authHeader);

      if (!authResult.valid) {
         return NextResponse.json(
            { error: true, message: 'Invalid or missing token' },
            { status: 401 }
         );
      }

      const userId = authResult.payload.userId;

      // Get all conversations for the user (unique pairs of sender/receiver)
      const conversations = await Message.aggregate([
         {
            $match: {
               $or: [
                  { senderId: { $oid: userId } },
                  { receiverId: { $oid: userId } },
               ],
            },
         },
         {
            $group: {
               _id: {
                  $cond: [
                     { $lt: ['$senderId', '$receiverId'] },
                     { senderId: '$senderId', receiverId: '$receiverId' },
                     { senderId: '$receiverId', receiverId: '$senderId' },
                  ],
               },
               lastMessage: { $last: '$content' },
               lastTimestamp: { $last: '$timestamp' },
            },
         },
         {
            $sort: { lastTimestamp: -1 },
         },
      ]);

      // Fetch user details for each conversation
      const conversationsWithUsers = await Promise.all(
         conversations.map(async (conv) => {
            const otherUserId =
               conv._id.senderId.toString() === userId
                  ? conv._id.receiverId
                  : conv._id.senderId;

            const otherUser = await User.findById(otherUserId).select('name email type');

            return {
               otherUserId,
               otherUser: {
                  name: otherUser?.name,
                  email: otherUser?.email,
                  type: otherUser?.type,
               },
               lastMessage: conv.lastMessage,
               lastTimestamp: conv.lastTimestamp,
            };
         })
      );

      return NextResponse.json(
         {
            error: false,
            conversations: conversationsWithUsers,
         },
         { status: 200 }
      );
   } catch (error) {
      console.error('Get conversations error:', error);
      return NextResponse.json(
         { error: true, message: 'Internal server error' },
         { status: 500 }
      );
   }
}
