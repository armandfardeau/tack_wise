import Stripe from 'stripe';
import type { VercelRequest, VercelResponse } from '@vercel/node';

interface DonationRequestBody {
  amount?: number | string;
  distinct_id?: string;
  session_id?: string;
}

function getBody(request: VercelRequest): DonationRequestBody {
  if (typeof request.body === 'string') {
    try {
      return JSON.parse(request.body) as DonationRequestBody;
    } catch {
      return {};
    }
  }

  return request.body as DonationRequestBody ?? {};
}

function getHeaderValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function getAnalyticsId(value: string | undefined, fallback: string | undefined) {
  const candidate = value || fallback;
  return candidate?.trim().slice(0, 200) || null;
}

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return response.status(405).json({ error: 'Method not allowed.' });
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return response.status(500).json({ error: 'Stripe donations are not configured yet.' });
  }

  const body = getBody(request);
  const distinctId = getAnalyticsId(body.distinct_id, getHeaderValue(request.headers['x-posthog-distinct-id']));
  const sessionId = getAnalyticsId(body.session_id, getHeaderValue(request.headers['x-posthog-session-id']));
  const amount = Number(body.amount);
  const amountInCents = Math.round(amount * 100);
  if (!Number.isFinite(amountInCents) || amountInCents < 100 || amountInCents > 1_000_000) {
    return response.status(400).json({ error: 'Donation amount must be between 1.00 and 10,000.00.' });
  }

  const forwardedProtocol = request.headers['x-forwarded-proto'];
  const protocol = typeof forwardedProtocol === 'string' ? forwardedProtocol.split(',')[0] : 'https';
  const origin = process.env.APP_URL || `${protocol}://${request.headers.host}`;
  if (!origin) return response.status(500).json({ error: 'The application URL is not configured.' });

  try {
    const stripe = new Stripe(secretKey);
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      managed_payments: { enabled: false },
      line_items: [{
        price_data: {
          currency: process.env.STRIPE_CURRENCY || 'usd',
          product_data: { name: 'Tack Wise donation' },
          unit_amount: amountInCents,
        },
        quantity: 1,
      }],
      submit_type: 'donate',
      metadata: {
        ...(distinctId ? { posthog_distinct_id: distinctId } : {}),
        ...(sessionId ? { posthog_session_id: sessionId } : {}),
      },
      success_url: `${origin}/?donation=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/?donation=cancelled`,
    });

    return response.status(200).json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Stripe Checkout session creation failed.', error);
    return response.status(502).json({ error: 'Unable to start Stripe Checkout.' });
  }
}
