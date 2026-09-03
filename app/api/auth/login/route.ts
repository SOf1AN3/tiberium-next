import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { User } from '@/lib/models';
import { comparePassword, generateToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
   try {
      await connectToDatabase();

      const body = await request.json();
      const { email, password } = body;

      // Validation
      if (!email || !password) {
         return NextResponse.json(
            { error: true, message: 'Missing required fields' },
            { status: 400 }
         );
      }

      // Find user
      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
         return NextResponse.json(
            { error: true, message: 'Invalid email or password' },
            { status: 401 }
         );
      }

      // Compare password
      const passwordMatch = await comparePassword(password, user.password);
      if (!passwordMatch) {
         return NextResponse.json(
            { error: true, message: 'Invalid email or password' },
            { status: 401 }
         );
      }

      // Generate token
      const token = generateToken({
         userId: user._id.toString(),
         email: user.email,
         type: user.type,
      });

      const response = NextResponse.json(
         {
            error: false,
            message: 'Login successful',
            token,
            user: {
               id: user._id,
               name: user.name,
               email: user.email,
               type: user.type,
            },
         },
         { status: 200 }
      );

      // Set cookie server-side so middleware stays in sync on refresh
      response.cookies.set('token', token, {
         path: '/',
         maxAge: 7 * 24 * 60 * 60,
         httpOnly: false,
      });

      return response;
   } catch (error) {
      console.error('Login error:', error);
      return NextResponse.json(
         { error: true, message: 'Internal server error' },
         { status: 500 }
      );
   }
}
