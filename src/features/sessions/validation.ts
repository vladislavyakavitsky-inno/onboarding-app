export type ValidationResult =
  | { ok: true; value: string }
  | { ok: false; message: string }

export const TITLE_MIN = 3
export const TITLE_MAX = 80
export const START_MARGIN_MS = 60_000

export function validateTitle(raw: string): ValidationResult {
  const title = raw.trim()
  if (title.length < TITLE_MIN) {
    return { ok: false, message: `Title must be at least ${TITLE_MIN} characters.` }
  }
  if (title.length > TITLE_MAX) {
    return { ok: false, message: `Title must be at most ${TITLE_MAX} characters.` }
  }
  return { ok: true, value: title }
}

/** `rawLocalValue` is a `datetime-local` value; `value` on success is an ISO UTC string. */
export function validateStartsAt(rawLocalValue: string, now: Date): ValidationResult {
  if (rawLocalValue === '') {
    return { ok: false, message: 'Start date and time is required.' }
  }
  const date = new Date(rawLocalValue)
  if (Number.isNaN(date.getTime())) {
    return { ok: false, message: 'Enter a valid start date and time.' }
  }
  if (date.getTime() < now.getTime() + START_MARGIN_MS) {
    return {
      ok: false,
      message: 'Start date and time must be at least 1 minute in the future.',
    }
  }
  return { ok: true, value: date.toISOString() }
}
