import { useState, type FormEvent } from 'react';
import posthog from 'posthog-js';
import styles from './SponsorshipActions.module.css';

const QUICK_AMOUNTS = [5, 10, 25, 50];

export default function StripeDonationForm() {
  const [amount, setAmount] = useState('10');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount < 1 || parsedAmount > 10000) {
      posthog.capture('donation_checkout_failed', { reason: 'invalid_amount' });
      setError('Choose an amount between 1 and 10,000.');
      return;
    }

    setIsSubmitting(true);
    try {
      const distinctId = posthog.get_distinct_id();
      const sessionId = posthog.get_session_id();
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-POSTHOG-DISTINCT-ID': distinctId,
          'X-POSTHOG-SESSION-ID': sessionId,
        },
        body: JSON.stringify({ amount: parsedAmount, distinct_id: distinctId, session_id: sessionId }),
      });
      const payload = await response.json() as { error?: string; sessionId?: string; url?: string | null };
      if (!response.ok || !payload.sessionId || !payload.url) throw new Error(payload.error || 'Unable to start Stripe Checkout.');

      // Stripe now returns the hosted Checkout URL directly. The publishable
      // key remains a public deployment setting and gates this client flow.
      posthog.capture('donation_checkout_started', { amount: parsedAmount });
      window.location.assign(payload.url);
    } catch (submitError) {
      posthog.capture('donation_checkout_failed', { reason: 'session_creation_failed' });
      setError(submitError instanceof Error ? submitError.message : 'Unable to start Stripe Checkout.');
      setIsSubmitting(false);
    }
  };

  return (
    <form className={styles.stripeDonationForm} onSubmit={handleSubmit}>
      <label htmlFor="stripe-donation-amount">Donation amount</label>
      <div className={styles.stripeDonationAmountField}>
        <span aria-hidden="true">$</span>
        <input
          id="stripe-donation-amount"
          type="number"
          min="1"
          max="10000"
          step="0.01"
          inputMode="decimal"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          disabled={isSubmitting}
        />
      </div>
      <div className={styles.stripeDonationQuickAmounts} aria-label="Quick donation amounts">
        {QUICK_AMOUNTS.map((quickAmount) => (
          <button
            key={quickAmount}
            type="button"
            className={amount === String(quickAmount) ? styles.isSelected : ''}
            onClick={() => setAmount(String(quickAmount))}
            disabled={isSubmitting}
          >
            ${quickAmount}
          </button>
        ))}
      </div>
      {error && <p className={styles.stripeDonationError} role="alert">{error}</p>}
      <button type="submit" className={styles.stripeDonationSubmit} disabled={isSubmitting}>
        {isSubmitting ? 'Opening Stripe…' : 'Continue to Stripe Checkout'}
      </button>
      <small>Secure payment handled by Stripe.</small>
    </form>
  );
}
