import type { BeforeSendFn, CaptureResult } from 'posthog-js'

export const SCRIPT_ERROR_MESSAGE = 'Script error.'

/**
 * PostHog exception autocapture forwards every unhandled window error to us,
 * including errors thrown by content-modifying browser extensions (Dark Reader,
 * etc.) whose code is injected straight into the page. Those errors are not our
 * code: their only stack frames point at the document URL itself rather than a
 * bundled asset, and they surface globals we never ship. This filter drops that
 * noise before it becomes an `$exception` event and an error-tracking issue.
 */

/**
 * Globals that only exist because a browser extension injected them. An
 * exception mentioning one of these did not originate from our bundle.
 */
export const EXTENSION_GLOBAL_DENYLIST = ['DarkReader'] as const

interface StackFrame {
  filename?: string
  function?: string
}

interface CapturedException {
  value?: unknown
  stacktrace?: { frames?: StackFrame[] } | null
}

/**
 * A frame belongs to the loaded HTML document (extension-injected "global
 * code") rather than to one of our bundled JavaScript assets when it is
 * same-origin and shares the document's path. Bundled Vite assets live under a
 * distinct path (e.g. `/assets/index-*.js`), so any real in-app frame has a
 * different pathname than the document.
 */
function isDocumentFrame(frame: StackFrame, documentUrl: string): boolean {
  const source = frame.filename
  if (!source) {
    return false
  }

  let parsed: URL
  let document: URL
  try {
    parsed = new URL(source, documentUrl)
    document = new URL(documentUrl)
  } catch {
    return false
  }

  return parsed.origin === document.origin && parsed.pathname === document.pathname
}

/**
 * Decide whether an `$exception` capture is browser-extension noise. It is when
 * either the message references a known extension global, or the exception has
 * stack frames and every one of them resolves to the document URL instead of a
 * bundled asset.
 */
export function isExtensionNoiseException(
  result: CaptureResult,
  documentUrl: string
): boolean {
  const exceptionList = result.properties?.$exception_list as
    | CapturedException[]
    | undefined
  if (!Array.isArray(exceptionList) || exceptionList.length === 0) {
    return false
  }

  const mentionsExtensionGlobal = exceptionList.some(
    (exception) =>
      typeof exception.value === 'string' &&
      EXTENSION_GLOBAL_DENYLIST.some((name) =>
        (exception.value as string).includes(name)
      )
  )
  if (mentionsExtensionGlobal) {
    return true
  }

  const frames = exceptionList.flatMap(
    (exception) => exception.stacktrace?.frames ?? []
  )
  if (frames.length === 0) {
    return false
  }

  return frames.every((frame) => isDocumentFrame(frame, documentUrl))
}

/**
 * Build a PostHog `before_send` hook that drops extension-injected exceptions
 * while leaving every other event untouched.
 */
export function createExceptionNoiseFilter(documentUrl: string): BeforeSendFn {
  return (result) => {
    if (
      result &&
      result.event === '$exception' &&
      isExtensionNoiseException(result, documentUrl)
    ) {
      return null
    }
    return result
  }
}

interface ExceptionEntry {
  value?: unknown
  stacktrace?: { frames?: unknown }
}

/** Drop cross-origin stackless script errors with no actionable information. */
export function dropStacklessScriptErrors(
  event: CaptureResult | null,
): CaptureResult | null {
  if (!event || event.event !== '$exception') return event

  const exceptionList = event.properties?.$exception_list
  if (!Array.isArray(exceptionList) || exceptionList.length === 0) return event

  const everyEntryIsStacklessScriptError = exceptionList.every(
    (exception: ExceptionEntry) => {
      const value = typeof exception.value === 'string' ? exception.value.trim() : ''
      const frames = exception.stacktrace?.frames
      const hasFrames = Array.isArray(frames) && frames.length > 0
      return value === SCRIPT_ERROR_MESSAGE && !hasFrames
    },
  )

  return everyEntryIsStacklessScriptError ? null : event
}
