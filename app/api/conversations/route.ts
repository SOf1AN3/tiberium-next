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

      let filter: Record<string, unknown>;

      if (userType === 'admin') {
         filter = { adminId: userId, status: 'active' };
      } else {
         filter = { clientId: userId, status: 'active' };
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
               _id: conv._id,
               linkedUserId,
               linkedUser: {
                  name: linkedUser?.name ?? 'Unknown',
                  email: linkedUser?.email ?? '',
                  type: linkedUser?.type ?? 'unknown',
               },
               status: conv.status,
               createdAt: conv.createdAt,
            };
         })
      );

      return NextResponse.json({ error: false, conversations: enriched });
   } catch (error) {
      console.error('Get conversations error:', error);
      return NextResponse.json(
         { error: true, message: 'Internal server error' },
         { status: 500 }
      );
   }
}

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

      if (authResult.payload.type !== 'admin') {
         return NextResponse.json(
            { error: true, message: 'Only admins can create conversations' },
            { status: 403 }
         );
      }

      const { clientId } = await request.json();

      if (!clientId) {
         return NextResponse.json(
            { error: true, message: 'clientId is required' },
            { status: 400 }
         );
      }

      const client = await User.findById(clientId);
      if (!client) {
         return NextResponse.json(
            { error: true, message: 'Client not found' },
            { status: 404 }
         );
      }

      if (client.type === 'admin') {
         return NextResponse.json(
            { error: true, message: 'Cannot create conversation with an admin' },
            { status: 400 }
         );
      }

      const existing = await Conversation.findOne({ clientId });

      if (existing) {
         if (existing.status === 'active') {
            return NextResponse.json(
               { error: true, message: 'This client already has an active conversation' },
               { status: 409 }
            );
         }

         // Reactivate closed conversation (same admin or different)
         existing.adminId = authResult.payload.userId;
         existing.status = 'active';
         await existing.save();

         return NextResponse.json(
            {
               error: false,
               conversation: {
                  _id: existing._id,
                  clientId: existing.clientId,
                  adminId: existing.adminId,
                  status: existing.status,
               },
            },
            { status: 200 }
         );
      }

      const conversation = await Conversation.create({
         clientId,
         adminId: authResult.payload.userId,
         status: 'active',
      });

      return NextResponse.json(
         {
            error: false,
            conversation: {
               _id: conversation._id,
               clientId: conversation.clientId,
               adminId: conversation.adminId,
               status: conversation.status,
            },
         },
         { status: 201 }
      );
   } catch (error) {
      console.error('Create conversation error:', error);
      return NextResponse.json(
         { error: true, message: 'Internal server error' },
         { status: 500 }
      );
   }
}
