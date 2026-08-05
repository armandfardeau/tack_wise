import type { CaptureResult } from 'posthog-js'
import {
  EXTENSION_GLOBAL_DENYLIST,
  createExceptionNoiseFilter,
  isExtensionNoiseException,
} from '../src/utils/exceptionFilter'

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
