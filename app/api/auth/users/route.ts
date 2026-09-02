import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { User } from '@/lib/models';
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

      // Get current user
      const currentUser = await User.findById(authResult.payload.userId);
      if (!currentUser) {
         return NextResponse.json(
            { error: true, message: 'User not found' },
            { status: 404 }
         );
      }

      let users;

      // Admin sees all users, regular users see only admins
      if (currentUser.type === 'admin') {
         users = await User.find({}).select('-password').sort({ createdAt: -1 });
      } else {
         users = await User.find({ type: 'admin' }).select('-password').sort({ createdAt: -1 });
      }

      return NextResponse.json(
         {
            error: false,
            users: users.map((user: any) => ({
               id: user._id,
               name: user.name,
               email: user.email,
               type: user.type,
               isConfirmed: user.isConfirmed,
            })),
         },
         { status: 200 }
      );
   } catch (error) {
      console.error('Get users error:', error);
      return NextResponse.json(
         { error: true, message: 'Internal server error' },
         { status: 500 }
      );
   }
}
