import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { User, Message } from '@/lib/models';
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

      const currentUser = await User.findById(authResult.payload.userId);
      if (!currentUser || currentUser.type !== 'admin') {
         return NextResponse.json(
            { error: true, message: 'Only admins can view stats' },
            { status: 403 }
         );
      }

      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const [
         totalUsers,
         confirmedUsers,
         pendingUsers,
         simpleCount,
         advancedCount,
         premiumCount,
         adminCount,
         totalMessages,
         recentUsers,
         activeConversations,
      ] = await Promise.all([
         User.countDocuments(),
         User.countDocuments({ isConfirmed: true }),
         User.countDocuments({ isConfirmed: false }),
         User.countDocuments({ type: 'simple' }),
         User.countDocuments({ type: 'advanced' }),
         User.countDocuments({ type: 'premium' }),
         User.countDocuments({ type: 'admin' }),
         Message.countDocuments(),
         User.countDocuments({ createdAt: { $gte: oneWeekAgo } }),
         Message.aggregate([
            {
               $group: {
                  _id: {
                     $let: {
                        vars: {
                           a: { $min: ['$senderId', '$receiverId'] },
                           b: { $max: ['$senderId', '$receiverId'] },
                        },
                        in: { a: '$$a', b: '$$b' },
                     },
                  },
               },
            },
            { $count: 'count' },
         ]),
      ]);

      return NextResponse.json(
         {
            error: false,
            stats: {
               totalUsers,
               confirmedUsers,
               pendingUsers,
               byType: {
                  simple: simpleCount,
                  advanced: advancedCount,
                  premium: premiumCount,
                  admin: adminCount,
               },
               totalMessages,
               recentUsers,
               activeConversations: activeConversations[0]?.count || 0,
            },
         },
         { status: 200 }
      );
   } catch (error) {
      console.error('Get stats error:', error);
      return NextResponse.json(
         { error: true, message: 'Internal server error' },
         { status: 500 }
      );
   }
}
