import type { VercelRequest, VercelResponse } from '@vercel/node';
import { evaluateFeatureFlags, type FeatureFlagEntities } from '../lib/vercelFlags.js';
import { getOrCreateVisitorId } from '../lib/visitorIdentity.js';

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
