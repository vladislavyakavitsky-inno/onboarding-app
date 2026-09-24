import { setupWorker } from 'msw/browser'
import { createHandlers } from './handlers.ts'

export const worker = setupWorker(...createHandlers({ latencyMs: 500 }).handlers)
