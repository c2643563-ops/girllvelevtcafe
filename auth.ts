import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import type { StaffRole } from './types';

export const AUTH_COOKIE_NAME = 'velvet_staff_token';

function getSecretKey() {
  const secret = process.env.JWT_SECRET || 'velvet-cafe-grill-production-jwt-secret-change-me-2026';
  return new TextEncoder().encode(secret);
}

export interface SessionPayload {
  userId: string;
  name: string;
  email: string;
  role: StaffRole;
}

export async function signStaffToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(getSecretKey());
}

export async function verifyStaffToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (!payload.userId || !payload.role) return null;
    return {
      userId: String(payload.userId),
      name: String(payload.name || ''),
      email: String(payload.email || ''),
      role: payload.role as StaffRole,
    };
  } catch {
    return null;
  }
}

export async function getCurrentStaffSession(): Promise<SessionPayload | null> {
  const cookieStore = cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyStaffToken(token);
}

export async function requireStaffRole(allowedRoles: StaffRole[]): Promise<SessionPayload | null> {
  const session = await getCurrentStaffSession();
  if (!session) return null;
  if (!allowedRoles.includes(session.role)) return null;
  return session;
}
