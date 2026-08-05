import { createPostHogAdapter } from '@flags-sdk/posthog';
import { flag, type Flag } from 'flags/next';
import type { VercelRequest } from '@vercel/node';
import { featureFlags, type FeatureFlags } from '../src/featureFlags.js';
import { normalizeFeatureFlagValue } from './featureFlagValues.js';

type FeatureFlagDefinition = {
  key: string;
  defaultValue: boolean | number;
};

type PostHogEntities = { distinctId: string };

const posthogProjectToken = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN
  ?? process.env.VITE_PUBLIC_POSTHOG_KEY
  ?? process.env.POSTHOG_PROJECT_API_KEY;
const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST
  ?? process.env.VITE_PUBLIC_POSTHOG_HOST
  ?? process.env.POSTHOG_HOST;

const posthogAdapter = posthogProjectToken && posthogHost
  ? createPostHogAdapter({
      postHogKey: posthogProjectToken,
      postHogOptions: {
        host: posthogHost,
        disableGeoip: true,
      },
    })
  : undefined;

function identify({ headers }: { headers: Headers }) {
  const distinctId = headers.get('x-posthog-distinct-id');
  return distinctId ? { distinctId } : undefined;
}

function fallbackFlag<Value extends boolean | number>(definition: FeatureFlagDefinition): Flag<Value> {
  return flag<Value>({
    key: definition.key,
    defaultValue: definition.defaultValue as Value,
    decide: () => definition.defaultValue as Value,
  });
}

function posthogPayloadFlag<Value extends boolean | number>(definition: FeatureFlagDefinition): Flag<Value, PostHogEntities> {
  if (!posthogAdapter) return fallbackFlag<Value>(definition);

  return flag<Value, PostHogEntities>({
    key: definition.key,
    defaultValue: definition.defaultValue as Value,
    adapter: posthogAdapter.payload,
    identify,
  });
}

const evaluations = Object.fromEntries(
  (Object.entries(featureFlags) as [keyof FeatureFlags, FeatureFlagDefinition][])
    .map(([name, definition]) => [name, posthogPayloadFlag(definition)]),
) as { [Name in keyof FeatureFlags]: Flag<FeatureFlags[Name], PostHogEntities> };

export async function evaluateFeatureFlags(request: VercelRequest): Promise<FeatureFlags> {
  const resolvedFlags = await Promise.all(
    (Object.entries(evaluations) as [keyof FeatureFlags, Flag<FeatureFlags[keyof FeatureFlags], PostHogEntities>][])
      .map(async ([name, evaluate]) => {
        const definition = featureFlags[name];
        console.log(`[Feature Flags] Evaluating ${definition.key}.`, {
          defaultValue: definition.defaultValue,
        });
        try {
          const value = await evaluate(request);
          const normalizedValue = normalizeFeatureFlagValue(value, definition.defaultValue);
          console.log(`[Feature Flags] ${definition.key} resolved.`, {
            value: normalizedValue,
            usedDefault: normalizedValue === definition.defaultValue,
          });
          return [name, normalizedValue] as const;
        } catch (error) {
          console.error(`PostHog flag evaluation failed for ${definition.key}.`, error);
          console.log(`[Feature Flags] ${definition.key} using default after evaluation failure.`, {
            defaultValue: definition.defaultValue,
          });
          return [name, definition.defaultValue] as const;
        }
      }),
  );

  const flags = Object.fromEntries(resolvedFlags) as FeatureFlags;
  console.log('[Feature Flags] Evaluation complete.', flags);
  return flags;
}
