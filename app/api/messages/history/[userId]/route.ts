import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { Message } from '@/lib/models';
import { verifyAuth } from '@/lib/auth';

export async function GET(
   request: NextRequest,
   { params }: { params: Promise<{ userId: string }> }
) {
   try {
      await connectToDatabase();

      const { userId: targetUserId } = await params;
      const authHeader = request.headers.get('authorization');
      const authResult = await verifyAuth(authHeader);

      if (!authResult.valid) {
         return NextResponse.json(
            { error: true, message: 'Invalid or missing token' },
            { status: 401 }
         );
      }

      const currentUserId = authResult.payload.userId;

      // Get messages between two users
      const messages = await Message.find({
         $or: [
            { senderId: currentUserId, receiverId: targetUserId },
            { senderId: targetUserId, receiverId: currentUserId },
         ],
      })
         .sort({ timestamp: 1 })
         .lean();

      return NextResponse.json(
         {
            error: false,
            messages: messages.map((msg: any) => ({
               id: msg._id,
               senderId: msg.senderId,
               receiverId: msg.receiverId,
               content: msg.content,
               timestamp: msg.timestamp,
               seen: msg.seen,
               isSentByMe: msg.senderId.toString() === currentUserId,
            })),
         },
         { status: 200 }
      );
   } catch (error) {
      console.error('Get message history error:', error);
      return NextResponse.json(
         { error: true, message: 'Internal server error' },
         { status: 500 }
      );
   }
}
