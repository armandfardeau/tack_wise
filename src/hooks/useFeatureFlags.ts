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
  const distinctId = posthog.get_distinct_id();
  const headers = distinctId ? { 'x-posthog-distinct-id': distinctId } : undefined;
  const response = await fetch('/api/feature-flags', { headers });
  if (!response.ok) throw new Error('Unable to load feature flags.');

  return normalizeFeatureFlags(await response.json());
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
