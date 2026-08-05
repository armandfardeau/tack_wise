import { createClient } from '@vercel/flags-core';
import { featureFlags, type FeatureFlags } from '../src/featureFlags.js';

interface FeatureFlagDefinition {
  key: string;
  defaultValue: boolean | number;
}

type FeatureFlag = () => Promise<boolean | number>;

const client = createClient();
let initialization: Promise<void> | undefined;

function initializeClient() {
  initialization ??= Promise.resolve(client.initialize()).catch((error: unknown) => {
    initialization = undefined;
    throw error;
  });

  return initialization;
}

export function featureFlag({ key, defaultValue }: FeatureFlagDefinition): FeatureFlag {
  return async () => {
    try {
      await initializeClient();
      const result = await client.evaluate<boolean | number>(key, defaultValue);
      return typeof result.value === typeof defaultValue
        && (typeof result.value !== 'number' || Number.isFinite(result.value))
        ? result.value
        : defaultValue;
    } catch (error) {
      console.error(`Vercel Flags evaluation failed for ${key}.`, error);
      return defaultValue;
    }
  };
}

const evaluations = Object.fromEntries(
  (Object.entries(featureFlags) as [keyof FeatureFlags, FeatureFlagDefinition][])
    .map(([name, definition]) => [name, featureFlag(definition)]),
) as { [Name in keyof FeatureFlags]: FeatureFlag };

export async function evaluateFeatureFlags(): Promise<FeatureFlags> {
  const resolvedFlags = await Promise.all(
    (Object.entries(evaluations) as [keyof FeatureFlags, FeatureFlag][])
      .map(async ([name, evaluate]) => [name, await evaluate()] as const),
  );

  return Object.fromEntries(resolvedFlags) as FeatureFlags;
}
