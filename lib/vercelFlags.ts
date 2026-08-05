import { vercelAdapter } from '@flags-sdk/vercel';
import { flag, type Flag } from 'flags/next';
import type { VercelRequest } from '@vercel/node';
import type { FeatureFlagEntities } from '../entities/user.js';
import { featureFlags, type FeatureFlags } from '../src/featureFlags.js';
import { normalizeFeatureFlagValue } from './featureFlagValues.js';

type FeatureFlagDefinition = {
  key: string;
  defaultValue: boolean | number;
};

function vercelFlag<Value extends boolean | number>(
  definition: FeatureFlagDefinition,
  entities: FeatureFlagEntities,
): Flag<Value, FeatureFlagEntities> {
  return flag<Value, FeatureFlagEntities>({
    key: definition.key,
    defaultValue: definition.defaultValue as Value,
    adapter: vercelAdapter(),
    identify: () => entities,
  });
}

export async function evaluateFeatureFlags(
  request: VercelRequest,
  entities: FeatureFlagEntities,
): Promise<FeatureFlags> {
  const evaluations = Object.fromEntries(
    (Object.entries(featureFlags) as [keyof FeatureFlags, FeatureFlagDefinition][])
      .map(([name, definition]) => [name, vercelFlag(definition, entities)]),
  ) as { [Name in keyof FeatureFlags]: Flag<FeatureFlags[Name], FeatureFlagEntities> };

  const resolvedFlags = await Promise.all(
    (Object.entries(evaluations) as [keyof FeatureFlags, Flag<FeatureFlags[keyof FeatureFlags], FeatureFlagEntities>][])
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
          console.error(`Vercel flag evaluation failed for ${definition.key}.`, error);
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
