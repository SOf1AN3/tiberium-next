import { NextRequest, NextResponse } from 'next/server';

const publicPaths = ['/', '/login', '/signup', '/about', '/expats'];
const adminPaths = ['/admin'];

export function middleware(request: NextRequest) {
   const { pathname } = request.nextUrl;
   const token = request.cookies.get('token')?.value;

   // Check if path is public
   if (publicPaths.includes(pathname)) {
      return NextResponse.next();
   }

   // If no token, redirect to login (for protected paths)
   if (!token && !publicPaths.includes(pathname)) {
      return NextResponse.redirect(new URL('/login', request.url));
   }

   return NextResponse.next();
}

export const config = {
   matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
