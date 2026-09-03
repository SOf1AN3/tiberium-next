import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { Conversation } from '@/lib/models';
import { verifyAuth } from '@/lib/auth';

export async function DELETE(
   request: NextRequest,
   { params }: { params: Promise<{ id: string }> }
) {
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

      const { id } = await params;

      const conversation = await Conversation.findById(id);

      if (!conversation) {
         return NextResponse.json(
            { error: true, message: 'Conversation not found' },
            { status: 404 }
         );
      }

      const userId = authResult.payload.userId;
      const isParticipant =
         conversation.adminId.toString() === userId ||
         conversation.clientId.toString() === userId;

      if (!isParticipant) {
         return NextResponse.json(
            { error: true, message: 'Not authorized' },
            { status: 403 }
         );
      }

      conversation.status = 'closed';
      await conversation.save();

      return NextResponse.json({ error: false, message: 'Conversation closed' });
   } catch (error) {
      console.error('Close conversation error:', error);
      return NextResponse.json(
         { error: true, message: 'Internal server error' },
         { status: 500 }
      );
   }
}
