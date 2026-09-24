import { describe, expect, it } from 'vitest'
import { validateStartsAt, validateTitle } from './validation.ts'

describe('validateTitle', () => {
  it('trims the title and accepts 3 to 80 characters', () => {
    expect(validateTitle('  abc  ')).toEqual({ ok: true, value: 'abc' })
    expect(validateTitle('x'.repeat(80))).toEqual({ ok: true, value: 'x'.repeat(80) })
  })

  it('rejects titles shorter than 3 or longer than 80 after trimming', () => {
    expect(validateTitle('ab')).toMatchObject({ ok: false })
    expect(validateTitle('   ab   ')).toMatchObject({ ok: false })
    expect(validateTitle('     ')).toMatchObject({ ok: false })
    expect(validateTitle('x'.repeat(81))).toMatchObject({ ok: false })
    expect(validateTitle(`  ${'x'.repeat(81)}  `)).toMatchObject({ ok: false })
  })
})

describe('validateStartsAt', () => {
  // Fixed local "now"; datetime-local values are read as local time, so this is time-zone independent.
  const now = new Date(2030, 0, 15, 12, 0, 0)

  it('requires a value', () => {
    expect(validateStartsAt('', now)).toEqual({
      ok: false,
      message: 'Start date and time is required.',
    })
  })

  it('rejects a value that is not a date', () => {
    expect(validateStartsAt('not-a-date', now)).toEqual({
      ok: false,
      message: 'Enter a valid start date and time.',
    })
  })

  it('rejects past times and times inside the 1-minute margin', () => {
    expect(validateStartsAt('2030-01-14T12:00', now)).toMatchObject({ ok: false })
    expect(validateStartsAt('2030-01-15T12:00', now)).toMatchObject({ ok: false })
    expect(validateStartsAt('2030-01-15T12:00:59', now)).toMatchObject({ ok: false })
  })

  it('accepts exactly now plus 1 minute and returns an ISO UTC value', () => {
    expect(validateStartsAt('2030-01-15T12:01', now)).toEqual({
      ok: true,
      value: new Date(2030, 0, 15, 12, 1).toISOString(),
    })
    expect(validateStartsAt('2030-01-15T12:01:01', now)).toMatchObject({ ok: true })
  })
})
