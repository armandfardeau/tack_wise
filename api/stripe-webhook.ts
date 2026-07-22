import Stripe from 'stripe';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export const config = { api: { bodyParser: false } };

async function readRawBody(request: VercelRequest) {
  const chunks: Buffer[] = [];
  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

function getPostHogConfig() {
  return {
    apiKey: process.env.POSTHOG_PROJECT_API_KEY || process.env.VITE_PUBLIC_POSTHOG_KEY,
    host: (process.env.POSTHOG_HOST || process.env.VITE_PUBLIC_POSTHOG_HOST || '').replace(/\/$/, ''),
  };
}

async function captureDonation(session: Stripe.Checkout.Session, eventId: string) {
  const distinctId = session.metadata?.posthog_distinct_id;
  const { apiKey, host } = getPostHogConfig();
  if (!distinctId || !apiKey || !host) {
    console.warn('PostHog donation completion was not captured because analytics configuration or identity is missing.');
    return;
  }

  const response = await fetch(`${host}/capture/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: apiKey,
      event: 'donation_completed',
      distinct_id: distinctId,
      properties: {
        $insert_id: eventId,
        provider: 'stripe',
        amount: session.amount_total ? session.amount_total / 100 : undefined,
        currency: session.currency,
        stripe_event_id: eventId,
        $session_id: session.metadata?.posthog_session_id,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`PostHog capture failed with status ${response.status}.`);
  }
}

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return response.status(405).json({ error: 'Method not allowed.' });
  }

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = request.headers['stripe-signature'];
  if (!stripeSecretKey || !webhookSecret || typeof signature !== 'string') {
    return response.status(400).json({ error: 'Stripe webhook configuration is incomplete.' });
  }

  let event: Stripe.Event;
  try {
    const rawBody = await readRawBody(request);
    event = new Stripe(stripeSecretKey).webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (error) {
    console.error('Stripe webhook signature verification failed.', error);
    return response.status(400).json({ error: 'Invalid Stripe webhook.' });
  }

  if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
    const session = event.data.object as Stripe.Checkout.Session;
    if (event.type === 'checkout.session.async_payment_succeeded' || session.payment_status === 'paid') {
      try {
        await captureDonation(session, event.id);
      } catch (error) {
        console.error('PostHog donation completion capture failed.', error);
        return response.status(502).json({ error: 'Unable to capture donation analytics.' });
      }
    }
  }

  return response.status(200).json({ received: true });
}
