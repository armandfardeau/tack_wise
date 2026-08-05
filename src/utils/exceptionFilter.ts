import type { CaptureResult } from 'posthog-js'

export const SCRIPT_ERROR_MESSAGE = 'Script error.'

interface ExceptionEntry {
  value?: unknown
  stacktrace?: { frames?: unknown }
}

function isStacklessScriptError(exception: ExceptionEntry): boolean {
  const value = typeof exception.value === 'string' ? exception.value.trim() : ''
  const frames = exception.stacktrace?.frames
  const hasFrames = Array.isArray(frames) && frames.length > 0
  return value === SCRIPT_ERROR_MESSAGE && !hasFrames
}

/**
 * Cross-origin script failures reach `window.onerror` sanitized by the browser
 * down to the literal string "Script error." with no message and no stack
 * frames. PostHog's exception autocapture still reports them, but they carry
 * zero debugging information, so every occurrence just opens an issue nobody can
 * act on. Drop them here, before they reach error tracking.
 *
 * Only an event whose exceptions are *all* stackless "Script error." entries is
 * dropped, so a genuine error that happens to bundle one alongside real frames
 * still gets through.
 */
export function dropStacklessScriptErrors(
  event: CaptureResult | null,
): CaptureResult | null {
  if (!event || event.event !== '$exception') return event

  const exceptionList = event.properties?.$exception_list
  if (!Array.isArray(exceptionList) || exceptionList.length === 0) return event

  const everyEntryIsStacklessScriptError = exceptionList.every(
    (exception: ExceptionEntry) => isStacklessScriptError(exception),
  )

  return everyEntryIsStacklessScriptError ? null : event
}
