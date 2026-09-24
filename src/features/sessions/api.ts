import { SESSION_STATUSES } from './types.ts'
import type { NewSessionInput, Session } from './types.ts'

const SESSIONS_PATH = '/api/sessions'

export class ApiError extends Error {
  status: number | null

  constructor(message: string, status: number | null = null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

function isSession(value: unknown): value is Session {
  if (typeof value !== 'object' || value === null) return false
  const { id, title, status, startsAt } = value as Record<string, unknown>
  return (
    typeof id === 'string' &&
    typeof title === 'string' &&
    typeof status === 'string' &&
    (SESSION_STATUSES as readonly string[]).includes(status) &&
    typeof startsAt === 'string' &&
    !Number.isNaN(Date.parse(startsAt))
  )
}

async function request(init?: RequestInit): Promise<unknown> {
  const url = new URL(SESSIONS_PATH, window.location.origin).toString()
  let response: Response
  try {
    response = await fetch(url, init)
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    throw new ApiError('Network request failed')
  }
  if (!response.ok) {
    throw new ApiError(`Request failed with status ${response.status}`, response.status)
  }
  try {
    return await response.json()
  } catch {
    throw new ApiError('Response was not valid JSON', response.status)
  }
}

export async function fetchSessions(signal?: AbortSignal): Promise<Session[]> {
  const body = await request({ signal })
  if (!Array.isArray(body) || !body.every(isSession)) {
    throw new ApiError('Unexpected sessions response')
  }
  return body
}

export async function createSession(input: NewSessionInput): Promise<Session> {
  const body = await request({
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!isSession(body)) throw new ApiError('Unexpected session response')
  return body
}
