import type { CaptureResult } from 'posthog-js';
import {
  dropStacklessScriptErrors,
  SCRIPT_ERROR_MESSAGE,
  EXTENSION_GLOBAL_DENYLIST,
  createExceptionNoiseFilter,
  isExtensionNoiseException,
} from '../src/utils/exceptionFilter';
import { suppressInjectedExceptions } from '../src/utils/exceptionFilter';

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

const DOCUMENT_URL = 'https://tack-wise.vercel.app/'

interface FrameInput {
  filename?: string
}

function exceptionResult(
  exceptionList: unknown,
  event = '$exception'
): CaptureResult {
  return {
    uuid: 'test-uuid',
    event,
    properties: { $exception_list: exceptionList },
  } as CaptureResult
}

function withFrames(frames: FrameInput[], value = 'Some error'): CaptureResult {
  return exceptionResult([
    { value, stacktrace: { type: 'raw', frames } },
  ])
}

describe('isExtensionNoiseException', () => {
  it('flags the Dark Reader signature: one frame at the document URL', () => {
    // Matches the captured trace: `global code` at the page URL, line 1.
    const result = withFrames(
      [{ filename: 'https://tack-wise.vercel.app/' }],
      "Can't find variable: DarkReader"
    )
    expect(isExtensionNoiseException(result, DOCUMENT_URL)).toBe(true)
  })

  it('flags a known extension global by name even without stack frames', () => {
    const result = exceptionResult([
      { value: 'ReferenceError: DarkReader is not defined' },
    ])
    expect(isExtensionNoiseException(result, DOCUMENT_URL)).toBe(true)
    expect(EXTENSION_GLOBAL_DENYLIST).toContain('DarkReader')
  })

  it('keeps exceptions thrown from a bundled asset', () => {
    const result = withFrames([
      { filename: 'https://tack-wise.vercel.app/assets/index-abc123.js' },
    ])
    expect(isExtensionNoiseException(result, DOCUMENT_URL)).toBe(false)
  })

  it('keeps exceptions with at least one bundled-asset frame', () => {
    const result = withFrames([
      { filename: 'https://tack-wise.vercel.app/' },
      { filename: 'https://tack-wise.vercel.app/assets/App-def456.js' },
    ])
    expect(isExtensionNoiseException(result, DOCUMENT_URL)).toBe(false)
  })

  it('keeps exceptions from a different origin (e.g. a CDN)', () => {
    const result = withFrames([{ filename: 'https://cdn.example.com/lib.js' }])
    expect(isExtensionNoiseException(result, DOCUMENT_URL)).toBe(false)
  })

  it('keeps document-hosted code served under a real path', () => {
    const result = withFrames([{ filename: 'https://tack-wise.vercel.app/sw.js' }])
    expect(isExtensionNoiseException(result, DOCUMENT_URL)).toBe(false)
  })

  it('keeps exceptions whose frames lack a filename', () => {
    const result = withFrames([{}])
    expect(isExtensionNoiseException(result, DOCUMENT_URL)).toBe(false)
  })

  it('keeps exceptions with an unparseable frame filename', () => {
    const result = withFrames([{ filename: 'http://[' }])
    expect(isExtensionNoiseException(result, DOCUMENT_URL)).toBe(false)
  })

  it('ignores a non-string exception value', () => {
    const result = withFrames([{ filename: 'https://tack-wise.vercel.app/' }])
    ;(result.properties.$exception_list as { value: unknown }[])[0].value = 42
    expect(isExtensionNoiseException(result, DOCUMENT_URL)).toBe(true)
  })

  it('keeps exceptions with no exception list', () => {
    const result = exceptionResult(undefined)
    expect(isExtensionNoiseException(result, DOCUMENT_URL)).toBe(false)
  })

  it('keeps exceptions with an empty exception list', () => {
    expect(isExtensionNoiseException(exceptionResult([]), DOCUMENT_URL)).toBe(false)
  })

  it('keeps exceptions whose only exception has no stacktrace', () => {
    const result = exceptionResult([{ value: 'Boom' }])
    expect(isExtensionNoiseException(result, DOCUMENT_URL)).toBe(false)
  })
})

describe('createExceptionNoiseFilter', () => {
  const filter = createExceptionNoiseFilter(DOCUMENT_URL)

  it('drops extension noise', () => {
    const result = withFrames(
      [{ filename: 'https://tack-wise.vercel.app/' }],
      "Can't find variable: DarkReader"
    )
    expect(filter(result)).toBeNull()
  })

  it('passes real exceptions through unchanged', () => {
    const result = withFrames([
      { filename: 'https://tack-wise.vercel.app/assets/index-abc123.js' },
    ])
    expect(filter(result)).toBe(result)
  })

  it('leaves non-exception events untouched', () => {
    const pageview = exceptionResult(
      [{ filename: 'https://tack-wise.vercel.app/' }],
      '$pageview'
    )
    expect(filter(pageview)).toBe(pageview)
  })

  it('passes null through', () => {
    expect(filter(null)).toBeNull()
  })
})
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
