import { useCallback, useEffect, useMemo, useState } from 'react'
import { createSession, fetchSessions } from './api.ts'
import type { NewSessionInput, Session, SessionStatus } from './types.ts'

export type LoadStatus = 'loading' | 'error' | 'ready'
export type SessionFilterValue = 'all' | SessionStatus

export function useSessions() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loadStatus, setLoadStatus] = useState<LoadStatus>('loading')
  const [filter, setFilter] = useState<SessionFilterValue>('all')
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    fetchSessions(controller.signal)
      .then((data) => {
        setSessions(data)
        setLoadStatus('ready')
      })
      .catch(() => {
        if (!controller.signal.aborted) setLoadStatus('error')
      })
    return () => controller.abort()
  }, [attempt])

  const retry = useCallback(() => {
    setLoadStatus('loading')
    setAttempt((current) => current + 1)
  }, [])

  const create = useCallback(async (input: NewSessionInput) => {
    const session = await createSession(input)
    setSessions((current) => [...current, session])
  }, [])

  const visibleSessions = useMemo(
    () =>
      sessions
        .filter((session) => filter === 'all' || session.status === filter)
        .toSorted((a, b) => a.startsAt.localeCompare(b.startsAt)),
    [sessions, filter],
  )

  return { loadStatus, filter, setFilter, visibleSessions, retry, create }
}
