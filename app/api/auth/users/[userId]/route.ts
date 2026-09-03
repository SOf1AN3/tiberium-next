import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { User } from '@/lib/models';
import { verifyAuth } from '@/lib/auth';

export async function DELETE(
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
            { error: true, message: 'Only admins can delete users' },
            { status: 403 }
         );
      }

      if (authResult.payload.userId === userId) {
         return NextResponse.json(
            { error: true, message: 'You cannot delete your own account' },
            { status: 400 }
         );
      }

      const user = await User.findByIdAndDelete(userId);
      if (!user) {
         return NextResponse.json(
            { error: true, message: 'User not found' },
            { status: 404 }
         );
      }

      return NextResponse.json(
         { error: false, message: 'User deleted successfully' },
         { status: 200 }
      );
   } catch (error) {
      console.error('Delete user error:', error);
      return NextResponse.json(
         { error: true, message: 'Internal server error' },
         { status: 500 }
      );
   }
}
