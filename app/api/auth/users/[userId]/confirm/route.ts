import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { User } from '@/lib/models';
import { verifyAuth } from '@/lib/auth';

export async function PATCH(
   request: NextRequest,
   { params }: { params: Promise<{ userId: string }> }
) {
   try {
      await connectToDatabase();

      const { userId } = await params;
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
            { error: true, message: 'Only admins can toggle confirmation' },
            { status: 403 }
         );
      }

      const user = await User.findById(userId);
      if (!user) {
         return NextResponse.json(
            { error: true, message: 'User not found' },
            { status: 404 }
         );
      }

      user.isConfirmed = !user.isConfirmed;
      await user.save();

      return NextResponse.json(
         {
            error: false,
            message: `User ${user.isConfirmed ? 'confirmed' : 'unconfirmed'} successfully`,
            user: {
               id: user._id,
               name: user.name,
               email: user.email,
               type: user.type,
               isConfirmed: user.isConfirmed,
            },
         },
         { status: 200 }
      );
   } catch (error) {
      console.error('Toggle confirmation error:', error);
      return NextResponse.json(
         { error: true, message: 'Internal server error' },
         { status: 500 }
      );
   }
}
