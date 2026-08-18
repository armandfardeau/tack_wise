import { featureFlags, getFeatureFlagMetadata } from '../src/featureFlags';

describe('feature flag PostHog metadata', () => {
  it('creates metadata for every declared feature flag', () => {
    const metadata = getFeatureFlagMetadata(
      { sailBoomLength: 72, sailStrokeWidth: 5, darkSailInLightMode: true, rightInspectorPanel: true, ruleHighlightStrokeWidth: 24 },
      'vercel',
    );

    expect(Object.keys(featureFlags).map((name) => featureFlags[name as keyof typeof featureFlags].key.toLowerCase()))
      .toEqual(expect.arrayContaining(['sail_boom_length', 'sail_stroke_width', 'dark_sail_in_light_mode', 'right_inspector_panel', 'rule_highlight_stroke_width']));
    expect(metadata).toEqual({
      ff_sail_boom_length: 72,
      ff_sail_stroke_width: 5,
      ff_dark_sail_in_light_mode: true,
      ff_right_inspector_panel: true,
      ff_rule_highlight_stroke_width: 24,
      ff_setup: 'sailBoomLength_72__sailStrokeWidth_5__darkSailInLightMode_true__rightInspectorPanel_true__ruleHighlightStrokeWidth_24',
      ff_source: 'vercel',
    });
  });

  it('preserves default values and marks fallback metadata', () => {
    expect(getFeatureFlagMetadata(
      { sailBoomLength: 68, sailStrokeWidth: 4, darkSailInLightMode: false, rightInspectorPanel: false, ruleHighlightStrokeWidth: 30 },
      'default',
    )).toMatchObject({
      ff_sail_boom_length: 68,
      ff_sail_stroke_width: 4,
      ff_dark_sail_in_light_mode: false,
      ff_right_inspector_panel: false,
      ff_rule_highlight_stroke_width: 30,
      ff_source: 'default',
    });
  });
});
