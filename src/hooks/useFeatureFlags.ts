import { useEffect, useState } from 'react';
import posthog from 'posthog-js';
import { featureFlags, type FeatureFlags } from '../featureFlags';

function getDisabledFeatureFlags(): FeatureFlags {
  return Object.fromEntries(
    Object.entries(featureFlags).map(([name, definition]) => [name, definition.defaultValue]),
  ) as FeatureFlags;
}

const disabledFlags = getDisabledFeatureFlags();
let featureFlagsRequest: Promise<FeatureFlags> | undefined;

function normalizeFeatureFlags(value: unknown): FeatureFlags {
  const flags = value !== null && typeof value === 'object'
    ? value as Record<string, unknown>
    : {};

  return Object.fromEntries(
    Object.entries(featureFlags).map(([name, definition]) => [
      name,
      typeof flags[name] === typeof definition.defaultValue
        && (typeof flags[name] !== 'number' || Number.isFinite(flags[name]))
        ? flags[name]
        : definition.defaultValue,
    ]),
  ) as FeatureFlags;
}

async function loadFeatureFlags(): Promise<FeatureFlags> {
  const response = await fetch('/api/feature-flags');
  if (!response.ok) throw new Error('Unable to load feature flags.');

  const payload = await response.json() as Record<string, unknown>;
  const visitorId = payload.visitorId;

  if (typeof visitorId === 'string' && visitorId.length > 0) {
    posthog.register({ vercel_visitor_id: visitorId });
  }

  return normalizeFeatureFlags(payload);
}

function getFeatureFlags() {
  featureFlagsRequest ??= loadFeatureFlags().catch((error: unknown) => {
    featureFlagsRequest = undefined;
    throw error;
  });

  return featureFlagsRequest;
}

export function useFeatureFlags() {
  const [flags, setFlags] = useState<FeatureFlags>(disabledFlags);

  useEffect(() => {
    let isMounted = true;

    void getFeatureFlags()
      .then((nextFlags) => {
        if (isMounted) setFlags(nextFlags);
      })
      .catch(() => {
        if (isMounted) setFlags(disabledFlags);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return flags;
}
