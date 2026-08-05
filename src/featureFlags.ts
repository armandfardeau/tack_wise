export const featureFlags = {
  sailBoomLength: {
    key: 'SAIL_BOOM_LENGTH',
    defaultValue: 68,
  },
  sailStrokeWidth: {
    key: 'SAIL_STROKE_WIDTH',
    defaultValue: 4,
  },
} as const;

export type FeatureFlags = {
  [Name in keyof typeof featureFlags]: (typeof featureFlags)[Name]['defaultValue'];
};
