import { delay, http, HttpResponse } from 'msw'
import type { NewSessionInput, Session } from '../features/sessions/types.ts'
import { seedSessions } from './seed.ts'

interface HandlerOptions {
  latencyMs?: number
}

export function createHandlers({ latencyMs = 0 }: HandlerOptions = {}) {
  let sessions: Session[] = structuredClone(seedSessions)
  let nextId = sessions.length + 1

  return {
    reset() {
      sessions = structuredClone(seedSessions)
      nextId = sessions.length + 1
    },
    handlers: [
      http.get('/api/sessions', async () => {
        if (latencyMs > 0) await delay(latencyMs)
        return HttpResponse.json(sessions)
      }),
      http.post('/api/sessions', async ({ request }) => {
        if (latencyMs > 0) await delay(latencyMs)
        const input = (await request.json()) as NewSessionInput
        if (!input.title || !input.startsAt) {
          return HttpResponse.json({ message: 'Invalid session' }, { status: 400 })
        }
        const session: Session = {
          id: `s-${nextId++}`,
          title: input.title,
          status: 'planned',
          startsAt: input.startsAt,
        }
        sessions = [...sessions, session]
        return HttpResponse.json(session, { status: 201 })
      }),
    ],
  }
}
