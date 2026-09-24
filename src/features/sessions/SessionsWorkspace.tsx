import { useState } from 'react'
import CreateSessionForm from './CreateSessionForm.tsx'
import SessionFilter from './SessionFilter.tsx'
import SessionList from './SessionList.tsx'
import type { NewSessionInput } from './types.ts'
import { useSessions } from './useSessions.ts'

export default function SessionsWorkspace() {
  const { loadStatus, filter, setFilter, visibleSessions, retry, create } = useSessions()
  const [isFormOpen, setIsFormOpen] = useState(false)

  async function handleCreate(input: NewSessionInput) {
    await create(input)
    setIsFormOpen(false)
  }

  return (
    <main className="workspace">
      <h1>Training sessions</h1>

      {isFormOpen ? (
        <CreateSessionForm onSubmit={handleCreate} onCancel={() => setIsFormOpen(false)} />
      ) : (
        <button
          type="button"
          onClick={() => setIsFormOpen(true)}
          disabled={loadStatus !== 'ready'}
        >
          New session
        </button>
      )}

      <SessionFilter value={filter} onChange={setFilter} />

      {loadStatus === 'loading' && <p role="status">Loading sessions…</p>}
      {loadStatus === 'error' && (
        <div role="alert">
          <p>We could not load the sessions. Check your connection and try again.</p>
          <button type="button" onClick={retry}>
            Retry
          </button>
        </div>
      )}
      {loadStatus === 'ready' && (
        <SessionList sessions={visibleSessions} isFiltered={filter !== 'all'} />
      )}
    </main>
  )
}
