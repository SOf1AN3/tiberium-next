import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { Message, User } from '@/lib/models';
import { verifyAuth } from '@/lib/auth';

export async function POST(request: NextRequest) {
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

      const body = await request.json();
      const { receiverId, content } = body;

      // Validation
      if (!receiverId || !content) {
         return NextResponse.json(
            { error: true, message: 'Missing required fields' },
            { status: 400 }
         );
      }

      // Check if receiver exists
      const receiver = await User.findById(receiverId);
      if (!receiver) {
         return NextResponse.json(
            { error: true, message: 'Receiver not found' },
            { status: 404 }
         );
      }

      // Create message
      const message = new Message({
         senderId: authResult.payload.userId,
         receiverId,
         content: content.trim(),
         timestamp: new Date(),
         seen: false,
      });

      await message.save();

      return NextResponse.json(
         {
            error: false,
            message: 'Message sent successfully',
            data: {
               id: message._id,
               senderId: message.senderId,
               receiverId: message.receiverId,
               content: message.content,
               timestamp: message.timestamp,
               seen: message.seen,
            },
         },
         { status: 201 }
      );
   } catch (error) {
      console.error('Send message error:', error);
      return NextResponse.json(
         { error: true, message: 'Internal server error' },
         { status: 500 }
      );
   }
}
