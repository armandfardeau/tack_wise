export function normalizeFeatureFlagValue<Value extends boolean | number>(value: unknown, defaultValue: Value): Value {
  if (typeof value === typeof defaultValue
    && (typeof value !== 'number' || Number.isFinite(value))) {
    return value as Value;
  }

  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    const nestedValue = (value as Record<string, unknown>).value;
    if (typeof nestedValue === typeof defaultValue
      && (typeof nestedValue !== 'number' || Number.isFinite(nestedValue))) {
      return nestedValue as Value;
    }
  }

  return defaultValue;
}
