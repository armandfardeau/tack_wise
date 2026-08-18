export const featureFlags = {
  sailBoomLength: {
    key: 'SAIL_BOOM_LENGTH',
    defaultValue: 68,
  },
  sailStrokeWidth: {
    key: 'SAIL_STROKE_WIDTH',
    defaultValue: 4,
  },
  darkSailInLightMode: {
    key: 'DARK_SAIL_IN_LIGHT_MODE',
    defaultValue: false,
  },
  rightInspectorPanel: {
    key: 'RIGHT_INSPECTOR_PANEL',
    defaultValue: false,
  },
  ruleHighlightStrokeWidth: {
    key: 'RULE_HIGHLIGHT_STROKE_WIDTH',
    defaultValue: 10,
  },
} as const;

type FeatureFlagValue<Value> = Value extends number
  ? number
  : Value extends boolean
    ? boolean
    : Value;

export type FeatureFlags = {
  [Name in keyof typeof featureFlags]: FeatureFlagValue<(typeof featureFlags)[Name]['defaultValue']>;
};

export type FeatureFlagLoadSource = 'vercel' | 'default';

export type FeatureFlagMetadata = Record<string, boolean | number | string>;

export function getFeatureFlagMetadata(
  flags: FeatureFlags,
  source: FeatureFlagLoadSource,
): FeatureFlagMetadata {
  const metadata = Object.fromEntries(
    Object.entries(featureFlags).map(([name, definition]) => [
      `ff_${definition.key.toLowerCase()}`,
      flags[name as keyof FeatureFlags],
    ]),
  ) as FeatureFlagMetadata;

  const setup = Object.entries(featureFlags)
    .map(([name]) => `${name}_${flags[name as keyof FeatureFlags]}`)
    .join('__');

  return {
    ...metadata,
    ff_setup: setup,
    ff_source: source,
  };
}
