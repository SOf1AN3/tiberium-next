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

      // Check if current user is admin
      const currentUser = await User.findById(authResult.payload.userId);
      if (!currentUser || currentUser.type !== 'admin') {
         return NextResponse.json(
            { error: true, message: 'Only admins can update user types' },
            { status: 403 }
         );
      }

      const body = await request.json();
      const { type } = body;

      // Validate type
      const validTypes = ['simple', 'advanced', 'premium', 'admin'];
      if (!type || !validTypes.includes(type)) {
         return NextResponse.json(
            { error: true, message: 'Invalid user type' },
            { status: 400 }
         );
      }

      // Update user
      const user = await User.findByIdAndUpdate(
         userId,
         { type },
         { new: true }
      ).select('-password');

      if (!user) {
         return NextResponse.json(
            { error: true, message: 'User not found' },
            { status: 404 }
         );
      }

      return NextResponse.json(
         {
            error: false,
            message: 'User type updated successfully',
            user: {
               id: user._id,
               name: user.name,
               email: user.email,
               type: user.type,
            },
         },
         { status: 200 }
      );
   } catch (error) {
      console.error('Update user type error:', error);
      return NextResponse.json(
         { error: true, message: 'Internal server error' },
         { status: 500 }
      );
   }
}
