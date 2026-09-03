import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { Conversation, User } from '@/lib/models';
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
      const userType = authResult.payload.type;

      // Only return conversations the user is part of
      const filter: Record<string, unknown> = { status: 'active' };
      if (userType === 'admin') {
         filter.adminId = userId;
      } else {
         filter.clientId = userId;
      }

      const conversations = await Conversation.find(filter).lean();

      const enriched = await Promise.all(
         conversations.map(async (conv) => {
            const linkedUserId =
               userType === 'admin' ? conv.clientId : conv.adminId;

            const linkedUser = await User.findById(linkedUserId)
               .select('name email type')
               .lean();

            return {
               otherUserId: linkedUserId.toString(),
               otherUser: {
                  name: linkedUser?.name ?? 'Unknown',
                  email: linkedUser?.email ?? '',
                  type: linkedUser?.type ?? 'unknown',
               },
               conversationId: conv._id,
            };
         })
      );

      return NextResponse.json(
         {
            error: false,
            conversations: enriched,
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
