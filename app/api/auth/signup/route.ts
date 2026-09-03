import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { User } from '@/lib/models';
import { hashPassword, generateToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
   try {
      await connectToDatabase();

      const body = await request.json();
      const { name, email, password } = body;

      // Validation
      if (!name || !email || !password) {
         return NextResponse.json(
            { error: true, message: 'Missing required fields' },
            { status: 400 }
         );
      }

      // Check if user already exists
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
         return NextResponse.json(
            { error: true, message: 'User already exists' },
            { status: 409 }
         );
      }

      // Hash password
      const hashedPassword = await hashPassword(password);

      // Create user
      const newUser = new User({
         name,
         email: email.toLowerCase(),
         password: hashedPassword,
         type: 'simple',
         isConfirmed: false,
      });

      await newUser.save();

      // Generate token
      const token = generateToken({
         userId: newUser._id.toString(),
         email: newUser.email,
         type: newUser.type,
      });

      const response = NextResponse.json(
         {
            error: false,
            message: 'User created successfully',
            token,
            user: {
               id: newUser._id,
               name: newUser.name,
               email: newUser.email,
               type: newUser.type,
            },
         },
         { status: 201 }
      );

      // Set cookie server-side so middleware stays in sync on refresh
      response.cookies.set('token', token, {
         path: '/',
         maxAge: 7 * 24 * 60 * 60,
         httpOnly: false,
      });

      return response;
   } catch (error) {
      console.error('Signup error:', error);
      return NextResponse.json(
         { error: true, message: 'Internal server error' },
         { status: 500 }
      );
   }
}
