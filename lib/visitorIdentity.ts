import { randomUUID } from 'node:crypto';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { USER_ID_COOKIE_NAME } from '../entities/user.js';

const userIdCookieMaxAge = 60 * 60 * 24 * 365;

export function getOrCreateUserId(request: VercelRequest, response: VercelResponse): string {
  const existingUserId = request.cookies?.[USER_ID_COOKIE_NAME]?.trim();

  if (existingUserId) return existingUserId;

  const userId = randomUUID();
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';

  response.setHeader(
    'Set-Cookie',
    `${USER_ID_COOKIE_NAME}=${userId}; Path=/; Max-Age=${userIdCookieMaxAge}; SameSite=Lax${secure}`,
  );

  return userId;
}
