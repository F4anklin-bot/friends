import { initials } from '../../utils/helpers'

interface AvatarProps {
  name: string
  color: string
  size?: string
  dim?: boolean
}

export function Avatar({ name, color, size = 'h-10 w-10', dim }: AvatarProps) {
  return (
    <span
      className={`inline-flex ${size} items-center justify-center rounded-full text-xs font-bold text-white ${dim ? 'opacity-35' : ''}`}
      style={{ background: color }}
    >
      {initials(name)}
    </span>
  )
}
