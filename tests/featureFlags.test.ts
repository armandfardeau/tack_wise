import { normalizeFeatureFlagValue } from '../lib/featureFlagValues';

describe('PostHog feature flags', () => {
  it('accepts numeric payloads and rejects invalid values', () => {
    expect(normalizeFeatureFlagValue(72, 68)).toBe(72);
    expect(normalizeFeatureFlagValue({ value: 5 }, 4)).toBe(5);
    expect(normalizeFeatureFlagValue('72', 68)).toBe(68);
    expect(normalizeFeatureFlagValue(Number.NaN, 68)).toBe(68);
    expect(normalizeFeatureFlagValue(undefined, 4)).toBe(4);
  });

});
