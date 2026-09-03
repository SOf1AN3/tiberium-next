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

      if (authResult.payload.type !== 'admin') {
         return NextResponse.json(
            { error: true, message: 'Only admins can access this route' },
            { status: 403 }
         );
      }

      const assignedClientIds = await Conversation.distinct('clientId', {
         status: 'active',
      });

      const unassignedClients = await User.find({
         _id: { $nin: assignedClientIds },
         type: { $ne: 'admin' },
      })
         .select('name email type isConfirmed createdAt')
         .sort({ createdAt: -1 })
         .lean();

      return NextResponse.json({ error: false, clients: unassignedClients });
   } catch (error) {
      console.error('Get unassigned clients error:', error);
      return NextResponse.json(
         { error: true, message: 'Internal server error' },
         { status: 500 }
      );
   }
}
