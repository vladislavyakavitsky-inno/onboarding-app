export const SESSION_STATUSES = [
  'planned',
  'in-progress',
  'completed',
  'cancelled',
] as const

export type SessionStatus = (typeof SESSION_STATUSES)[number]

export const STATUS_LABELS: Record<SessionStatus, string> = {
  planned: 'Planned',
  'in-progress': 'In progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

export interface Session {
  id: string
  title: string
  status: SessionStatus
  startsAt: string
}

export interface NewSessionInput {
  title: string
  startsAt: string
}
