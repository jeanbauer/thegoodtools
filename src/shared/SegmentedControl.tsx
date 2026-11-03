interface SegmentedControlProps<T extends string> {
  label: string
  value: T
  onChange: (value: T) => void
  options: { value: T; label: string }[]
}

/** Shared pill-style segmented control. Styles live in app.css (.segmented). */
export function SegmentedControl<T extends string>({
  label,
  value,
  onChange,
  options,
}: SegmentedControlProps<T>) {
  return (
    <div className="segmented-field">
      <span className="label">{label}</span>
      <div className="segmented" role="group" aria-label={label}>
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={option.value === value}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}
