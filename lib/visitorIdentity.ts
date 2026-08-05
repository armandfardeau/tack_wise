import { randomUUID } from 'node:crypto';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const visitorCookieName = 'visitor_id';
const visitorCookieMaxAge = 60 * 60 * 24 * 365;

export function getOrCreateVisitorId(request: VercelRequest, response: VercelResponse): string {
  const existingVisitorId = request.cookies?.[visitorCookieName];

  if (existingVisitorId) return existingVisitorId;

  const visitorId = randomUUID();
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';

  response.setHeader(
    'Set-Cookie',
    `${visitorCookieName}=${visitorId}; Path=/; Max-Age=${visitorCookieMaxAge}; HttpOnly; SameSite=Lax${secure}`,
  );

  return visitorId;
}
