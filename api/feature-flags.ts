import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getOrCreateUserId } from '../lib/visitorIdentity.js';
import { evaluateFeatureFlags } from '../lib/vercelFlags.js';

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET');
    return response.status(405).json({ error: 'Method not allowed.' });
  }

  response.setHeader('Cache-Control', 'no-store');

  const userId = getOrCreateUserId(request, response);
  return response.status(200).json(await evaluateFeatureFlags(request, { user: { id: userId } }));
}
