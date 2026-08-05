import type { CaptureResult } from 'posthog-js'

/**
 * Firefox for iOS injects a private `window.__firefox__` namespace into every
 * page it loads (reader mode, user scripts). When that injection races against
 * our document it throws inside the page, and PostHog's exception autocapture
 * turns it into a `$exception` event — noise we can never act on, since the
 * code is the browser's, not ours.
 */
const FIREFOX_INJECTED_MARKER = '__firefox__'

/**
 * Our bundled code is served from hashed `/assets/*.js` files. A stack frame
 * that points anywhere else (the document URL itself) did not originate in our
 * source, so it cannot describe a bug we can fix.
 */
const BUNDLED_ASSET_MARKER = '/assets/'

interface StackFrameLike {
  filename?: string
  function?: string
}

interface ExceptionLike {
  type?: string
  value?: string
  stacktrace?: {
    frames?: StackFrameLike[]
  }
}

function referencesFirefoxNamespace(exception: ExceptionLike): boolean {
  const haystack = `${exception.type ?? ''} ${exception.value ?? ''}`
  return haystack.includes(FIREFOX_INJECTED_MARKER)
}

/**
 * A browser- or extension-injected error surfaces as a single top-level
 * `global code` frame pointing at the document URL rather than at one of our
 * bundled assets. Real application errors always carry at least one frame from
 * an `/assets/*.js` bundle.
 */
function isInjectedGlobalCode(exception: ExceptionLike): boolean {
  const frames = exception.stacktrace?.frames ?? []
  if (frames.length !== 1) {
    return false
  }

  const [frame] = frames
  const isGlobalCode = (frame.function ?? '').trim().toLowerCase() === 'global code'
  const pointsAtBundledAsset = (frame.filename ?? '').includes(BUNDLED_ASSET_MARKER)

  return isGlobalCode && !pointsAtBundledAsset
}

function isInjectedNoise(exception: ExceptionLike): boolean {
  return referencesFirefoxNamespace(exception) || isInjectedGlobalCode(exception)
}

/**
 * `before_send` hook that drops third-party and browser-injected exceptions so
 * they never become error tracking issues. Every other event passes through
 * untouched.
 */
export function suppressInjectedExceptions(
  event: CaptureResult | null,
): CaptureResult | null {
  if (!event || event.event !== '$exception') {
    return event
  }

  const exceptionList = event.properties?.$exception_list
  if (!Array.isArray(exceptionList) || exceptionList.length === 0) {
    return event
  }

  const hasInjectedNoise = (exceptionList as ExceptionLike[]).some(isInjectedNoise)

  return hasInjectedNoise ? null : event
}
