import { ROLE_COPY } from '../../game/impostorCopy'
import type { ImpostorRole } from '../../types/game'

const sizes = {
  sm: { box: 'h-8 w-8', icon: 16 },
  md: { box: 'h-12 w-12', icon: 22 },
  lg: { box: 'h-20 w-20', icon: 36 },
  xl: { box: 'h-24 w-24', icon: 56 },
} as const

interface RoleIconProps {
  role: ImpostorRole
  size?: keyof typeof sizes
  showLabel?: boolean
  plain?: boolean
}

export function RoleIcon({ role, size = 'md', showLabel = false, plain = false }: RoleIconProps) {
  const meta = ROLE_COPY[role]
  const Icon = meta.icon
  const dim = sizes[size]

  if (plain) {
    return <Icon size={dim.icon} strokeWidth={2.2} aria-label={meta.title} />
  }

  return (
    <span className={`inline-flex items-center ${size === 'sm' && showLabel ? 'flex-row gap-2' : 'flex-col gap-1'}`}>
      <span
        className={`inline-flex ${dim.box} items-center justify-center rounded-2xl`}
        style={{ background: meta.bg, color: meta.fg }}
        aria-label={meta.title}
      >
        <Icon size={dim.icon} strokeWidth={2.2} />
      </span>
      {showLabel ? (
        <span className="text-[11px] font-heading font-bold uppercase tracking-wide">{meta.title}</span>
      ) : null}
    </span>
  )
}
