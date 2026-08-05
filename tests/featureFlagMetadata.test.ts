import { featureFlags, getFeatureFlagMetadata } from '../src/featureFlags';

describe('feature flag PostHog metadata', () => {
  it('creates metadata for every declared feature flag', () => {
    const metadata = getFeatureFlagMetadata(
      { sailBoomLength: 72, sailStrokeWidth: 5 },
      'vercel',
    );

    expect(Object.keys(featureFlags).map((name) => featureFlags[name as keyof typeof featureFlags].key.toLowerCase()))
      .toEqual(expect.arrayContaining(['sail_boom_length', 'sail_stroke_width']));
    expect(metadata).toEqual({
      ff_sail_boom_length: 72,
      ff_sail_stroke_width: 5,
      ff_setup: 'sailBoomLength_72__sailStrokeWidth_5',
      ff_source: 'vercel',
    });
  });

  it('preserves default values and marks fallback metadata', () => {
    expect(getFeatureFlagMetadata(
      { sailBoomLength: 68, sailStrokeWidth: 4 },
      'default',
    )).toMatchObject({
      ff_sail_boom_length: 68,
      ff_sail_stroke_width: 4,
      ff_source: 'default',
    });
  });
});
