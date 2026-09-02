import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
   throw new Error('Please define the JWT_SECRET environment variable inside .env.local');
}

// JWT Token interface
interface TokenPayload {
   userId: string;
   email: string;
   type: string;
}

// Hash password
export async function hashPassword(password: string): Promise<string> {
   const saltRounds = 10;
   return bcrypt.hash(password, saltRounds);
}

// Compare password
export async function comparePassword(
   password: string,
   hashedPassword: string
): Promise<boolean> {
   return bcrypt.compare(password, hashedPassword);
}

// Generate JWT token
export function generateToken(payload: TokenPayload): string {
   return jwt.sign(payload, JWT_SECRET!, {
      expiresIn: '7d',
   });
}

// Verify JWT token
export function verifyToken(token: string): TokenPayload | null {
   try {
      return jwt.verify(token, JWT_SECRET!) as TokenPayload;
   } catch (error) {
      return null;
   }
}

// Decode token without verification (for debugging)
export function decodeToken(token: string): TokenPayload | null {
   try {
      return jwt.decode(token) as TokenPayload;
   } catch (error) {
      return null;
   }
}

// Extract token from headers
export function getTokenFromHeaders(
   authHeader: string | null | undefined
): string | null {
   if (!authHeader) return null;

   const parts = authHeader.split(' ');
   if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return null;
   }

   return parts[1];
}

// Middleware-like function for API routes
export async function verifyAuth(
   authHeader: string | null | undefined
): Promise<{ valid: false } | { valid: true; payload: TokenPayload }> {
   const token = getTokenFromHeaders(authHeader);

   if (!token) {
      return { valid: false };
   }

   const payload = verifyToken(token);

   if (!payload) {
      return { valid: false };
   }

   return { valid: true, payload };
}
