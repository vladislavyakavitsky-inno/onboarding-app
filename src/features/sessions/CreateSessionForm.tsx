import { useRef, useState } from 'react'
import type { FormEvent } from 'react'
import type { NewSessionInput } from './types.ts'
import { validateStartsAt, validateTitle } from './validation.ts'

interface CreateSessionFormProps {
  onSubmit: (input: NewSessionInput) => Promise<void>
  onCancel: () => void
}

export default function CreateSessionForm({ onSubmit, onCancel }: CreateSessionFormProps) {
  const [title, setTitle] = useState('')
  const [startsAt, setStartsAt] = useState('')
  const [titleError, setTitleError] = useState<string | null>(null)
  const [startsAtError, setStartsAtError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isSubmittingRef = useRef(false)
  const titleRef = useRef<HTMLInputElement>(null)
  const startsAtRef = useRef<HTMLInputElement>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isSubmittingRef.current) return

    const titleResult = validateTitle(title)
    const startsAtResult = validateStartsAt(startsAt, new Date())
    setTitleError(titleResult.ok ? null : titleResult.message)
    setStartsAtError(startsAtResult.ok ? null : startsAtResult.message)
    setSubmitError(null)
    if (!titleResult.ok) return titleRef.current?.focus()
    if (!startsAtResult.ok) return startsAtRef.current?.focus()

    isSubmittingRef.current = true
    setIsSubmitting(true)
    try {
      await onSubmit({ title: titleResult.value, startsAt: startsAtResult.value })
      setTitle('')
      setStartsAt('')
    } catch {
      setSubmitError('Could not create the session. Please try again.')
    } finally {
      isSubmittingRef.current = false
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate aria-label="Create session">
      <div className="field">
        <label htmlFor="session-title">Title</label>
        <input
          id="session-title"
          name="title"
          ref={titleRef}
          value={title}
          autoComplete="off"
          aria-invalid={titleError !== null}
          aria-describedby={titleError ? 'session-title-error' : undefined}
          onChange={(event) => setTitle(event.target.value)}
        />
        {titleError !== null && (
          <p id="session-title-error" className="error">
            {titleError}
          </p>
        )}
      </div>
      <div className="field">
        <label htmlFor="session-starts-at">Start date and time</label>
        <input
          id="session-starts-at"
          name="startsAt"
          type="datetime-local"
          ref={startsAtRef}
          value={startsAt}
          aria-invalid={startsAtError !== null}
          aria-describedby={startsAtError ? 'session-starts-at-error' : undefined}
          onChange={(event) => setStartsAt(event.target.value)}
        />
        {startsAtError !== null && (
          <p id="session-starts-at-error" className="error">
            {startsAtError}
          </p>
        )}
      </div>
      {submitError !== null && (
        <p role="alert" className="error">
          {submitError}
        </p>
      )}
      <div className="actions">
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creating…' : 'Create session'}
        </button>
        <button type="button" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </button>
      </div>
    </form>
  )
}
