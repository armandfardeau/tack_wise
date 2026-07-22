# Tack Wise

Tack Wise is a browser-based Tactical Sailing Situations (TSS) authoring and presentation tool. It is designed for coaches, sailors, umpires, and protest committees who need to draw, animate, explain, and share sailing situations.

## Features

- Wind direction, speed, sail trim, and boat headings.
- Boats, marks, gates, obstructions, connections, and rounding arrows.
- Curved tactical arrows, comments, rule cards with offense highlighting, uploaded diagram images, and rule references.
- Step-by-step or continuous animation with single-frame or cumulative display.
- Timeline editing with add, duplicate, rename, delete, playback, and speed control.
- Canvas pan, zoom, placement grid, magnetic snapping, presenter mode, and print output.
- Undo/redo, autosave recovery, local scenario library, JSON import/export, and portable share links.
- PNG/JPG diagram export, animated GIF export, and MP4 video export.
- GitHub pull-request handoff for adding or updating source templates.
- Installable PWA with an offline app shell and locally stored scenarios.

## Development

```bash
npm install
npm run dev
```

The PWA service worker is registered in production builds. To verify the installed/offline experience locally, run `npm run build && npm run preview`, open the preview URL once while online, then reload with the browser offline.

## Verification

```bash
npm test
npm run lint
npm run build
```

## Sponsorship

Tack Wise can accept support through a public Stripe Payment Link and GitHub
Sponsors. Configure the destinations at build time:

```bash
VITE_STRIPE_PAYMENT_LINK=https://buy.stripe.com/your-payment-link
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_your_publishable_key
VITE_GITHUB_SPONSORS_URL=https://github.com/sponsors/armandfardeau
VITE_DONATION_URL=https://opencollective.com/your-project
```

`VITE_STRIPE_PAYMENT_LINK` is optional. The app uses the repository owner's
GitHub Sponsors page by default. `VITE_DONATION_URL` can point to an
Open Collective, Ko-fi, Liberapay, or other public donation page. All support
links open in a new tab. Use Stripe Payment Links rather than a secret Stripe
API key in this frontend.

### Vercel Stripe Checkout

The optional donation form uses a Vercel serverless function at
`/api/create-checkout-session`. Add these environment variables in the Vercel
project settings:

```text
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...        # server-only; use a newly rotated key
STRIPE_CURRENCY=usd                   # optional; defaults to usd
APP_URL=https://your-domain.vercel.app # recommended for return URLs
```

The publishable key may be exposed to the browser. `STRIPE_SECRET_KEY` must be
added only as a Vercel server environment variable and must never use the
`VITE_` prefix. If `VITE_STRIPE_PAYMENT_LINK` is set, Tack Wise uses that
directly instead of the Checkout donation form.

The current scenario JSON format supports version 1 imports and version 2 exports when presentation settings are included.
