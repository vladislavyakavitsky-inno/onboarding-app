import { setupServer } from 'msw/node'
import { createHandlers } from './handlers.ts'

const { handlers, reset } = createHandlers()

export const server = setupServer(...handlers)
export const resetMockSessions = reset
