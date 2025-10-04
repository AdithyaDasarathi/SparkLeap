import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const COOKIE_NAME = 'sparkleap-session';

export interface UserSession {
  id: string;
  email: string;
  name: string;
  picture?: string;
  loginAt: string;
}

// Create session token
export function createSession(user: UserSession): string {
  return jwt.sign(user, JWT_SECRET, { 
    expiresIn: '7d' // Session expires in 7 days
  });
}

// Verify session token
export function verifySession(token: string): UserSession | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as UserSession;
    return decoded;
  } catch (error) {
    console.error('Invalid session token:', error);
    return null;
  }
}

// Set session cookie (server-side)
export function setSessionCookie(token: string) {
  const cookieStore = cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true, // Prevents XSS attacks
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    sameSite: 'lax', // CSRF protection
    maxAge: 7 * 24 * 60 * 60, // 7 days
    path: '/'
  });
}

// Get session from cookie (server-side)
export function getSessionFromCookie(): UserSession | null {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    
    if (!token) {
      return null;
    }
    
    return verifySession(token);
  } catch (error) {
    console.error('Error getting session from cookie:', error);
    return null;
  }
}

// Clear session cookie
export function clearSessionCookie() {
  const cookieStore = cookies();
  cookieStore.delete(COOKIE_NAME);
}
