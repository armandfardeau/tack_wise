import type { CaptureResult } from 'posthog-js';
import { dropStacklessScriptErrors, SCRIPT_ERROR_MESSAGE } from '../src/utils/exceptionFilter';

function buildEvent(properties: Record<string, unknown>): CaptureResult {
  return {
    uuid: 'test-uuid',
    event: '$exception',
    properties,
  } as CaptureResult;
}

describe('dropStacklessScriptErrors', () => {
  it('drops a cross-origin "Script error." with no stack frames', () => {
    const event = buildEvent({
      $exception_list: [
        { value: SCRIPT_ERROR_MESSAGE, mechanism: { synthetic: true }, stacktrace: { frames: [] } },
      ],
    });

    expect(dropStacklessScriptErrors(event)).toBeNull();
  });

  it('drops it even when stacktrace is entirely absent', () => {
    const event = buildEvent({ $exception_list: [{ value: SCRIPT_ERROR_MESSAGE }] });

    expect(dropStacklessScriptErrors(event)).toBeNull();
  });

  it('keeps a "Script error." that actually carries stack frames', () => {
    const event = buildEvent({
      $exception_list: [
        { value: SCRIPT_ERROR_MESSAGE, stacktrace: { frames: [{ filename: 'app.js', lineno: 12 }] } },
      ],
    });

    expect(dropStacklessScriptErrors(event)).toBe(event);
  });

  it('keeps a real exception with a message and a stack', () => {
    const event = buildEvent({
      $exception_list: [
        { value: 'Cannot read properties of undefined', stacktrace: { frames: [{ filename: 'x.js' }] } },
      ],
    });

    expect(dropStacklessScriptErrors(event)).toBe(event);
  });

  it('keeps an event that mixes a stackless script error with a real exception', () => {
    const event = buildEvent({
      $exception_list: [
        { value: SCRIPT_ERROR_MESSAGE, stacktrace: { frames: [] } },
        { value: 'TypeError: boom', stacktrace: { frames: [{ filename: 'y.js' }] } },
      ],
    });

    expect(dropStacklessScriptErrors(event)).toBe(event);
  });

  it('passes non-exception events through untouched', () => {
    const event = buildEvent({ $exception_list: [{ value: SCRIPT_ERROR_MESSAGE }] });
    event.event = '$pageview';

    expect(dropStacklessScriptErrors(event)).toBe(event);
  });

  it('passes through a null event and an exception with an empty list', () => {
    expect(dropStacklessScriptErrors(null)).toBeNull();

    const emptyList = buildEvent({ $exception_list: [] });
    expect(dropStacklessScriptErrors(emptyList)).toBe(emptyList);
  });
});
