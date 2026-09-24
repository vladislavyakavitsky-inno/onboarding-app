import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import CreateSessionForm from './CreateSessionForm.tsx'

function futureLocalValue(): string {
  const date = new Date(Date.now() + 24 * 60 * 60 * 1000)
  const pad = (value: number) => String(value).padStart(2, '0')
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`
  )
}

describe('CreateSessionForm', () => {
  it('resets its fields and re-enables submit after a successful submit even if it stays mounted', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    const user = userEvent.setup()
    render(<CreateSessionForm onSubmit={onSubmit} onCancel={() => {}} />)

    await user.type(screen.getByLabelText('Title'), 'Standalone form')
    await user.type(screen.getByLabelText('Start date and time'), futureLocalValue())
    await user.click(screen.getByRole('button', { name: 'Create session' }))

    await waitFor(() => expect(screen.getByRole('button', { name: 'Create session' })).toBeEnabled())
    expect(onSubmit).toHaveBeenCalledTimes(1)
    expect(screen.getByLabelText('Title')).toHaveValue('')
    expect(screen.getByLabelText('Start date and time')).toHaveValue('')
  })
})
