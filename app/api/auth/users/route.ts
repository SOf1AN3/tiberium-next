import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { User, type IUser } from '@/lib/models';
import { verifyAuth } from '@/lib/auth';

const serializeUser = (user: IUser) => ({
   id: user._id,
   name: user.name,
   email: user.email,
   type: user.type,
   isConfirmed: user.isConfirmed,
   createdAt: user.createdAt,
});

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
      if (!currentUser) {
         return NextResponse.json(
            { error: true, message: 'User not found' },
            { status: 404 }
         );
      }

      const { searchParams } = new URL(request.url);
      const search = searchParams.get('search') || '';
      const type = searchParams.get('type') || '';
      const confirmed = searchParams.get('confirmed') || '';
      const page = parseInt(searchParams.get('page') || '1', 10);
      const limit = parseInt(searchParams.get('limit') || '20', 10);
      const sort = searchParams.get('sort') || 'createdAt';
      const order = searchParams.get('order') === 'asc' ? 1 : -1;

      const validSortFields = ['name', 'email', 'type', 'createdAt'];
      const sortField = validSortFields.includes(sort) ? sort : 'createdAt';

      if (currentUser.type !== 'admin') {
         const users = await User.find({ type: 'admin' })
            .select('-password')
            .sort({ createdAt: -1 });

         return NextResponse.json(
            {
               error: false,
               users: users.map((user) => serializeUser(user as IUser)),
               total: users.length,
               page: 1,
               totalPages: 1,
            },
            { status: 200 }
         );
      }

      const filter: {
         $or?: Record<string, unknown>[];
         type?: IUser['type'];
         isConfirmed?: boolean;
      } = {};

      if (search) {
         filter.$or = [
            { name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
         ];
      }

      if (type && ['simple', 'advanced', 'premium', 'admin'].includes(type)) {
         filter.type = type as IUser['type'];
      }

      if (confirmed === 'true') {
         filter.isConfirmed = true;
      } else if (confirmed === 'false') {
         filter.isConfirmed = false;
      }

      const total = await User.countDocuments(filter as never);
      const totalPages = Math.ceil(total / limit);
      const skip = (page - 1) * limit;

      const users = await User.find(filter as never)
         .select('-password')
         .sort({ [sortField]: order })
         .skip(skip)
         .limit(limit);

      return NextResponse.json(
         {
            error: false,
            users: users.map((user) => serializeUser(user as IUser)),
            total,
            page,
            totalPages,
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
