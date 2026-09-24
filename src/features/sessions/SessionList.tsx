import { STATUS_LABELS } from './types.ts'
import type { Session } from './types.ts'

interface SessionListProps {
  sessions: Session[]
  isFiltered: boolean
}

const dateFormat = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
})

export default function SessionList({ sessions, isFiltered }: SessionListProps) {
  if (sessions.length === 0) {
    return <p>{isFiltered ? 'No sessions with this status.' : 'No sessions yet.'}</p>
  }

  return (
    <ul className="session-list">
      {sessions.map((session) => (
        <li key={session.id}>
          <strong>{session.title}</strong>
          <span className="status">{STATUS_LABELS[session.status]}</span>
          <time dateTime={session.startsAt}>
            {dateFormat.format(new Date(session.startsAt))}
          </time>
        </li>
      ))}
    </ul>
  )
}
