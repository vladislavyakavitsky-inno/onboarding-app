import type { Session } from '../features/sessions/types.ts'

export const seedSessions: Session[] = [
  { id: 's-1', title: 'Onboarding basics', status: 'completed', startsAt: '2026-01-12T09:00:00.000Z' },
  { id: 's-2', title: 'Advanced React patterns', status: 'completed', startsAt: '2026-02-03T13:30:00.000Z' },
  { id: 's-3', title: 'Testing workshop', status: 'in-progress', startsAt: '2026-09-24T10:00:00.000Z' },
  { id: 's-4', title: 'Accessibility deep dive', status: 'planned', startsAt: '2027-03-10T14:00:00.000Z' },
  { id: 's-5', title: 'Performance clinic', status: 'planned', startsAt: '2027-04-02T11:00:00.000Z' },
  { id: 's-6', title: 'Design systems intro', status: 'cancelled', startsAt: '2026-06-18T15:00:00.000Z' },
]
