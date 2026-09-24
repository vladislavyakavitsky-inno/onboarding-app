import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { delay, http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { server } from '../../mocks/server.ts'
import SessionsWorkspace from './SessionsWorkspace.tsx'

function toLocalInputValue(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0')
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`
  )
}

function localValueFromNow(offsetMs: number): string {
  return toLocalInputValue(new Date(Date.now() + offsetMs))
}

const DAY_MS = 24 * 60 * 60 * 1000

async function renderLoaded() {
  const user = userEvent.setup()
  render(<SessionsWorkspace />)
  await screen.findByText('Onboarding basics')
  return user
}

async function openForm(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: 'New session' }))
  return screen.getByRole('form', { name: 'Create session' })
}

function titles() {
  return screen.getAllByRole('listitem').map((item) => item.querySelector('strong')?.textContent)
}

describe('sessions list', () => {
  it('shows a loading state, then the sessions with title, status and start', async () => {
    server.use(
      http.get('/api/sessions', async () => {
        await delay(50)
        return HttpResponse.json([
          { id: 'x-1', title: 'Slow session', status: 'planned', startsAt: '2027-05-01T10:00:00.000Z' },
        ])
      }),
    )
    render(<SessionsWorkspace />)

    expect(screen.getByRole('status')).toHaveTextContent('Loading sessions')

    const item = await screen.findByRole('listitem')
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(within(item).getByText('Slow session')).toBeInTheDocument()
    expect(within(item).getByText('Planned')).toBeInTheDocument()
    expect(item.querySelector('time')).toHaveAttribute('datetime', '2027-05-01T10:00:00.000Z')
  })

  it('shows a recoverable error and loads the list after retry', async () => {
    server.use(http.get('/api/sessions', () => new HttpResponse(null, { status: 500 }), { once: true }))
    const user = userEvent.setup()
    render(<SessionsWorkspace />)

    expect(await screen.findByRole('alert')).toHaveTextContent('could not load the sessions')
    expect(screen.queryByRole('listitem')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Retry' }))

    expect(await screen.findByText('Onboarding basics')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('does not allow creating a session until the list has loaded', async () => {
    server.use(
      http.get('/api/sessions', async () => {
        await delay(100)
        return HttpResponse.json([])
      }),
    )
    render(<SessionsWorkspace />)

    expect(screen.getByRole('button', { name: 'New session' })).toBeDisabled()
    await screen.findByText('No sessions yet.')
    expect(screen.getByRole('button', { name: 'New session' })).toBeEnabled()
  })

  it('does not allow creating a session while the list failed to load, until retry succeeds', async () => {
    server.use(http.get('/api/sessions', () => new HttpResponse(null, { status: 500 }), { once: true }))
    const user = userEvent.setup()
    render(<SessionsWorkspace />)
    await screen.findByRole('alert')

    expect(screen.getByRole('button', { name: 'New session' })).toBeDisabled()

    await user.click(screen.getByRole('button', { name: 'Retry' }))
    await screen.findByText('Onboarding basics')
    expect(screen.getByRole('button', { name: 'New session' })).toBeEnabled()
  })

  it.each([
    ['a JSON body that is not an array', () => HttpResponse.json({ sessions: [] })],
    [
      'a session with an unknown status',
      () => HttpResponse.json([{ id: '1', title: 'Bad', status: 'weird', startsAt: '2027-05-01T10:00:00.000Z' }]),
    ],
    [
      'a session with an invalid date',
      () => HttpResponse.json([{ id: '1', title: 'Bad', status: 'planned', startsAt: 'nope' }]),
    ],
    ['an HTML page instead of JSON', () => HttpResponse.html('<!doctype html><title>app</title>')],
  ])('shows the recoverable error instead of crashing on %s', async (_name, respond) => {
    server.use(http.get('/api/sessions', respond, { once: true }))
    const user = userEvent.setup()
    render(<SessionsWorkspace />)

    expect(await screen.findByRole('alert')).toHaveTextContent('could not load the sessions')

    await user.click(screen.getByRole('button', { name: 'Retry' }))
    expect(await screen.findByText('Onboarding basics')).toBeInTheDocument()
  })

  it('shows an empty message when there are no sessions', async () => {
    server.use(http.get('/api/sessions', () => HttpResponse.json([])))
    render(<SessionsWorkspace />)

    expect(await screen.findByText('No sessions yet.')).toBeInTheDocument()
  })
})

describe('status filter', () => {
  it('defaults to All and narrows the list to one status, then back to All', async () => {
    const user = await renderLoaded()
    expect(screen.getByRole('radio', { name: 'All' })).toBeChecked()
    expect(screen.getAllByRole('listitem')).toHaveLength(6)

    await user.click(screen.getByRole('radio', { name: 'Completed' }))
    expect(screen.getAllByRole('listitem')).toHaveLength(2)
    for (const item of screen.getAllByRole('listitem')) {
      expect(within(item).getByText('Completed')).toBeInTheDocument()
    }

    await user.click(screen.getByRole('radio', { name: 'All' }))
    expect(screen.getAllByRole('listitem')).toHaveLength(6)
  })

  it('shows a filtered empty message when no session has the selected status', async () => {
    server.use(
      http.get('/api/sessions', () =>
        HttpResponse.json([
          { id: 'x-1', title: 'Only planned', status: 'planned', startsAt: '2027-05-01T10:00:00.000Z' },
        ]),
      ),
    )
    const user = userEvent.setup()
    render(<SessionsWorkspace />)
    await screen.findByText('Only planned')

    await user.click(screen.getByRole('radio', { name: 'Cancelled' }))

    expect(screen.getByText('No sessions with this status.')).toBeInTheDocument()
  })
})

describe('create session', () => {
  it('creates a session with a trimmed title, closes the form and lists it as Planned', async () => {
    const user = await renderLoaded()
    const form = await openForm(user)

    await user.type(within(form).getByLabelText('Title'), '  Brand new session  ')
    await user.type(within(form).getByLabelText('Start date and time'), localValueFromNow(DAY_MS))
    await user.click(within(form).getByRole('button', { name: 'Create session' }))

    const created = await screen.findByText('Brand new session')
    expect(created).toBeInTheDocument()
    expect(within(created.closest('li')!).getByText('Planned')).toBeInTheDocument()
    expect(screen.queryByRole('form', { name: 'Create session' })).not.toBeInTheDocument()
    expect(screen.getAllByRole('listitem')).toHaveLength(7)
  })

  it('keeps the active filter and hides a created session that does not match it', async () => {
    const user = await renderLoaded()
    await user.click(screen.getByRole('radio', { name: 'Completed' }))
    const form = await openForm(user)

    await user.type(within(form).getByLabelText('Title'), 'Hidden by filter')
    await user.type(within(form).getByLabelText('Start date and time'), localValueFromNow(DAY_MS))
    await user.click(within(form).getByRole('button', { name: 'Create session' }))

    await screen.findByRole('button', { name: 'New session' })
    expect(screen.getByRole('radio', { name: 'Completed' })).toBeChecked()
    expect(screen.queryByText('Hidden by filter')).not.toBeInTheDocument()

    await user.click(screen.getByRole('radio', { name: 'Planned' }))
    expect(screen.getByText('Hidden by filter')).toBeInTheDocument()
  })

  it('blocks submission and explains each invalid field', async () => {
    const user = await renderLoaded()
    const form = await openForm(user)
    const title = within(form).getByLabelText('Title')
    const startsAt = within(form).getByLabelText('Start date and time')
    const submit = within(form).getByRole('button', { name: 'Create session' })

    await user.click(submit)
    expect(within(form).getByText('Title must be at least 3 characters.')).toBeInTheDocument()
    expect(within(form).getByText('Start date and time is required.')).toBeInTheDocument()
    expect(title).toHaveAttribute('aria-invalid', 'true')

    await user.clear(title)
    await user.type(title, '   ab   ')
    await user.type(startsAt, localValueFromNow(-DAY_MS))
    await user.click(submit)
    expect(within(form).getByText('Title must be at least 3 characters.')).toBeInTheDocument()
    expect(
      within(form).getByText('Start date and time must be at least 1 minute in the future.'),
    ).toBeInTheDocument()

    await user.clear(title)
    await user.type(title, 'x'.repeat(81))
    await user.click(submit)
    expect(within(form).getByText('Title must be at most 80 characters.')).toBeInTheDocument()

    expect(screen.getAllByRole('listitem')).toHaveLength(6)
  })

  it('rejects a start that is less than a minute ahead (boundary is covered in validation.test.ts)', async () => {
    const user = await renderLoaded()
    const form = await openForm(user)

    await user.type(within(form).getByLabelText('Title'), 'Too soon')
    await user.type(within(form).getByLabelText('Start date and time'), localValueFromNow(30_000))
    await user.click(within(form).getByRole('button', { name: 'Create session' }))

    expect(
      within(form).getByText('Start date and time must be at least 1 minute in the future.'),
    ).toBeInTheDocument()
  })

  it('creates only one session when submitted twice while pending', async () => {
    let postCount = 0
    server.use(
      http.post('/api/sessions', async ({ request }) => {
        postCount += 1
        await delay(100)
        const input = (await request.json()) as { title: string; startsAt: string }
        return HttpResponse.json({ id: 'new-1', status: 'planned', ...input }, { status: 201 })
      }),
    )
    const user = await renderLoaded()
    const form = await openForm(user)
    await user.type(within(form).getByLabelText('Title'), 'Double click')
    await user.type(within(form).getByLabelText('Start date and time'), localValueFromNow(DAY_MS))

    const submit = within(form).getByRole('button', { name: 'Create session' })
    await user.dblClick(submit)

    expect(await screen.findByText('Double click')).toBeInTheDocument()
    expect(postCount).toBe(1)
    expect(screen.getAllByText('Double click')).toHaveLength(1)
  })

  it('creates only one session when Enter is pressed twice while pending', async () => {
    let postCount = 0
    server.use(
      http.post('/api/sessions', async ({ request }) => {
        postCount += 1
        await delay(100)
        const input = (await request.json()) as { title: string; startsAt: string }
        return HttpResponse.json({ id: 'new-2', status: 'planned', ...input }, { status: 201 })
      }),
    )
    const user = await renderLoaded()
    const form = await openForm(user)
    await user.type(within(form).getByLabelText('Start date and time'), localValueFromNow(DAY_MS))
    await user.type(within(form).getByLabelText('Title'), 'Enter twice')

    await user.keyboard('{Enter}{Enter}')

    expect(await screen.findByText('Enter twice')).toBeInTheDocument()
    expect(postCount).toBe(1)
    expect(screen.getAllByText('Enter twice')).toHaveLength(1)
  })

  it('keeps the entered values and allows retry when creation fails', async () => {
    server.use(http.post('/api/sessions', () => new HttpResponse(null, { status: 500 }), { once: true }))
    const user = await renderLoaded()
    const form = await openForm(user)
    await user.type(within(form).getByLabelText('Title'), 'Retry me')
    await user.type(within(form).getByLabelText('Start date and time'), localValueFromNow(DAY_MS))

    await user.click(within(form).getByRole('button', { name: 'Create session' }))

    expect(await within(form).findByRole('alert')).toHaveTextContent('Could not create the session')
    expect(within(form).getByLabelText('Title')).toHaveValue('Retry me')
    expect(within(form).getByRole('button', { name: 'Create session' })).toBeEnabled()

    await user.click(within(form).getByRole('button', { name: 'Create session' }))

    expect(await screen.findByText('Retry me')).toBeInTheDocument()
    expect(titles()).toContain('Retry me')
  })
})
