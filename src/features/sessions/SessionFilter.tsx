import { SESSION_STATUSES, STATUS_LABELS } from './types.ts'
import type { SessionFilterValue } from './useSessions.ts'

interface SessionFilterProps {
  value: SessionFilterValue
  onChange: (value: SessionFilterValue) => void
}

const OPTIONS: { value: SessionFilterValue; label: string }[] = [
  { value: 'all', label: 'All' },
  ...SESSION_STATUSES.map((status) => ({ value: status, label: STATUS_LABELS[status] })),
]

export default function SessionFilter({ value, onChange }: SessionFilterProps) {
  return (
    <fieldset className="filter">
      <legend>Filter by status</legend>
      {OPTIONS.map((option) => (
        <label key={option.value}>
          <input
            type="radio"
            name="status-filter"
            value={option.value}
            checked={value === option.value}
            onChange={() => onChange(option.value)}
          />
          {option.label}
        </label>
      ))}
    </fieldset>
  )
}
