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

      // Get user from database
      const user = await User.findById(authResult.payload.userId).select('-password');
      if (!user) {
         return NextResponse.json(
            { error: true, message: 'User not found' },
            { status: 404 }
         );
      }

      return NextResponse.json(
         {
            error: false,
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
      console.error('Check auth error:', error);
      return NextResponse.json(
         { error: true, message: 'Internal server error' },
         { status: 500 }
      );
   }
}
