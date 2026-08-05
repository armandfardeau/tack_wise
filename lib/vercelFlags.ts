import { createClient } from '@vercel/flags-core';
import { featureFlags, type FeatureFlags } from '../src/featureFlags.js';

interface BooleanFlagDefinition {
  key: string;
  defaultValue: boolean;
}

type BooleanFlag = () => Promise<boolean>;

const client = createClient();
let initialization: Promise<void> | undefined;

function initializeClient() {
  initialization ??= Promise.resolve(client.initialize()).catch((error: unknown) => {
    initialization = undefined;
    throw error;
  });

  return initialization;
}

export function booleanFlag({ key, defaultValue }: BooleanFlagDefinition): BooleanFlag {
  return async () => {
    try {
      await initializeClient();
      const result = await client.evaluate<boolean>(key, defaultValue);
      return result.value === true;
    } catch (error) {
      console.error(`Vercel Flags evaluation failed for ${key}.`, error);
      return defaultValue;
    }
  };
}

const evaluations = Object.fromEntries(
  (Object.entries(featureFlags) as [keyof FeatureFlags, BooleanFlagDefinition][])
    .map(([name, definition]) => [name, booleanFlag(definition)]),
) as { [Name in keyof FeatureFlags]: BooleanFlag };

export async function evaluateFeatureFlags(): Promise<FeatureFlags> {
  const resolvedFlags = await Promise.all(
    (Object.entries(evaluations) as [keyof FeatureFlags, BooleanFlag][])
      .map(async ([name, evaluate]) => [name, await evaluate()] as const),
  );

  return Object.fromEntries(resolvedFlags) as FeatureFlags;
}
