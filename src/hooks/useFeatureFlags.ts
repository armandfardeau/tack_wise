import { useEffect, useState } from 'react';
import { featureFlags, type FeatureFlagLoadSource, type FeatureFlags } from '../featureFlags';
import { getOrCreateUserId } from '../utils/userIdentity';

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
  console.log('[Feature Flags] Loading resolved flags from /api/feature-flags.');
  getOrCreateUserId();
  const response = await fetch('/api/feature-flags');
  if (!response.ok) {
    console.error('[Feature Flags] Unable to load resolved flags.', { status: response.status });
    throw new Error('Unable to load feature flags.');
  }

  const flags = normalizeFeatureFlags(await response.json());
  console.log('[Feature Flags] Resolved flags loaded.', flags);
  return flags;
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
  const [isResolved, setIsResolved] = useState(false);
  const [source, setSource] = useState<FeatureFlagLoadSource>('default');

  useEffect(() => {
    let isMounted = true;

    void getFeatureFlags()
      .then((nextFlags) => {
        if (isMounted) {
          setFlags(nextFlags);
          setSource('vercel');
          setIsResolved(true);
        }
      })
      .catch(() => {
        console.log('[Feature Flags] Using local defaults after loading failure.', disabledFlags);
        if (isMounted) {
          setFlags(disabledFlags);
          setSource('default');
          setIsResolved(true);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return { flags, isResolved, source };
}
