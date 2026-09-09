interface ToggleRowProps {
  label: string
  hint: string
  value: boolean
  onChange: (value: boolean) => void
}

export function ToggleRow({ label, hint, value, onChange }: ToggleRowProps) {
  return (
    <button type="button" onClick={() => onChange(!value)} className="flex w-full items-center justify-between py-2 text-left">
      <span>
        <span className="block text-sm font-semibold">{label}</span>
        <span className="text-xs text-ink/50 dark:text-white/50">{hint}</span>
      </span>
      <span className={`h-7 w-12 rounded-full p-1 ${value ? 'bg-violet' : 'bg-white/10'}`}>
        <span className={`block h-5 w-5 rounded-full bg-white transition ${value ? 'translate-x-5' : ''}`} />
      </span>
    </button>
  )
}
