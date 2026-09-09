import type { InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  hint?: string
}

export function Input({ label, hint, className = '', ...props }: InputProps) {
  return (
    <label className="block w-full">
      {label ? (
        <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-violet">
          {label}
        </span>
      ) : null}
      <input
        {...props}
        className={`w-full border-0 border-b-2 border-violet/40 bg-transparent px-1 py-3 text-base outline-none transition focus:border-rose ${className}`}
      />
      {hint ? <span className="mt-1 block text-xs text-ink/50 dark:text-white/50">{hint}</span> : null}
    </label>
  )
}
