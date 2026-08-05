import type { CaptureResult } from 'posthog-js';
import { suppressInjectedExceptions } from '../src/utils/exceptionFilter';

type ExceptionItem = {
  type?: string;
  value?: string;
  stacktrace?: { frames?: Array<{ filename?: string; function?: string }> };
};

const exceptionEvent = (exceptionList: ExceptionItem[]): CaptureResult =>
  ({
    uuid: 'test-uuid',
    event: '$exception',
    properties: { $exception_list: exceptionList },
  }) as unknown as CaptureResult;

describe('suppressInjectedExceptions', () => {
  it('drops the Firefox for iOS reader-mode TypeError', () => {
    const event = exceptionEvent([
      {
        type: 'TypeError',
        value: "undefined is not an object (evaluating 'window.__firefox__.reader')",
        stacktrace: {
          frames: [{ function: 'global code', filename: 'https://tack-wise.vercel.app/' }],
        },
      },
    ]);

    expect(suppressInjectedExceptions(event)).toBeNull();
  });

  it('drops the paired __firefox__ ReferenceError even without a stack', () => {
    const event = exceptionEvent([
      { type: 'ReferenceError', value: "Can't find variable: __firefox__" },
    ]);

    expect(suppressInjectedExceptions(event)).toBeNull();
  });

  it('drops a lone global-code frame that points at the document rather than a bundled asset', () => {
    const event = exceptionEvent([
      {
        type: 'Error',
        value: 'injected script blew up',
        stacktrace: {
          frames: [{ function: 'global code', filename: 'https://tack-wise.vercel.app/' }],
        },
      },
    ]);

    expect(suppressInjectedExceptions(event)).toBeNull();
  });

  it('keeps a real application error thrown from a bundled asset', () => {
    const event = exceptionEvent([
      {
        type: 'TypeError',
        value: 'Cannot read properties of undefined',
        stacktrace: {
          frames: [
            { function: 'renderSail', filename: 'https://tack-wise.vercel.app/assets/index-abc123.js' },
            { function: 'global code', filename: 'https://tack-wise.vercel.app/assets/index-abc123.js' },
          ],
        },
      },
    ]);

    expect(suppressInjectedExceptions(event)).toBe(event);
  });

  it('keeps a single global-code frame that lives in a bundled asset', () => {
    const event = exceptionEvent([
      {
        type: 'Error',
        value: 'boot failure',
        stacktrace: {
          frames: [{ function: 'global code', filename: 'https://tack-wise.vercel.app/assets/main-xyz.js' }],
        },
      },
    ]);

    expect(suppressInjectedExceptions(event)).toBe(event);
  });

  it('passes through non-exception events untouched', () => {
    const pageview = {
      uuid: 'pv',
      event: '$pageview',
      properties: {},
    } as unknown as CaptureResult;

    expect(suppressInjectedExceptions(pageview)).toBe(pageview);
  });

  it('passes through a null event', () => {
    expect(suppressInjectedExceptions(null)).toBeNull();
  });

  it('keeps an exception whose frames array is empty or absent', () => {
    const emptyFrames = exceptionEvent([
      { type: 'Error', value: 'no frames', stacktrace: { frames: [] } },
    ]);
    const noStacktrace = exceptionEvent([{ type: 'Error', value: 'bare error' }]);

    expect(suppressInjectedExceptions(emptyFrames)).toBe(emptyFrames);
    expect(suppressInjectedExceptions(noStacktrace)).toBe(noStacktrace);
  });

  it('keeps a lone frame that is missing both function and filename', () => {
    const event = exceptionEvent([
      { type: 'Error', value: 'anonymous throw', stacktrace: { frames: [{}] } },
    ]);
    const noTypeOrValue = exceptionEvent([{ stacktrace: { frames: [{}] } }]);

    expect(suppressInjectedExceptions(event)).toBe(event);
    expect(suppressInjectedExceptions(noTypeOrValue)).toBe(noTypeOrValue);
  });

  it('keeps an exception event that has no exception list', () => {
    const event = {
      uuid: 'no-list',
      event: '$exception',
      properties: {},
    } as unknown as CaptureResult;

    expect(suppressInjectedExceptions(event)).toBe(event);
  });
});
