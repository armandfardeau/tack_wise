export const featureFlags = {
  newFeatureBanner: {
    key: 'new-feature-banner',
    defaultValue: false,
  },
} as const;

export type FeatureFlags = {
  [Name in keyof typeof featureFlags]: boolean;
};
