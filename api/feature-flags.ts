import type { VercelRequest, VercelResponse } from '@vercel/node';
import { randomUUID } from 'node:crypto';
import { evaluateFeatureFlags, type FeatureFlagEntities } from '../lib/vercelFlags.js';

const visitorCookieName = 'visitor_id';
const visitorCookieMaxAge = 60 * 60 * 24 * 365;

function getOrCreateVisitorId(request: VercelRequest, response: VercelResponse): string {
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

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET');
    return response.status(405).json({ error: 'Method not allowed.' });
  }

  response.setHeader('Cache-Control', 'no-store');

  const entities: FeatureFlagEntities = {
    visitor: { id: getOrCreateVisitorId(request, response) },
  };

  return response.status(200).json({
    ...(await evaluateFeatureFlags(entities)),
    visitorId: entities.visitor.id,
  });
}
