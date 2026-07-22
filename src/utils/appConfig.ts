import { parseTemplateRepository } from './templateContribution';

const DEFAULT_GITHUB_SPONSORS_URL = 'https://github.com/sponsors/armandfardeau';

export const sponsorshipLinks = {
  stripeUrl: import.meta.env.VITE_STRIPE_PAYMENT_LINK,
  stripePublishableKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY,
  githubUrl: import.meta.env.VITE_GITHUB_SPONSORS_URL || DEFAULT_GITHUB_SPONSORS_URL,
  donationUrl: import.meta.env.VITE_DONATION_URL,
};

export const templateRepository = parseTemplateRepository(import.meta.env.VITE_TEMPLATE_REPOSITORY, import.meta.env.VITE_TEMPLATE_BRANCH);
