import { motion } from 'framer-motion'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { haptic } from '../../utils/helpers'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'gold'

const styles: Record<Variant, string> = {
  primary: 'bg-rose text-white shadow-[0_10px_24px_rgba(255,105,180,0.28)]',
  secondary: 'glass text-ink dark:text-white',
  ghost: 'bg-transparent text-ink/70 dark:text-white/70',
  danger: 'bg-red-500 text-white shadow-[0_10px_24px_rgba(239,68,68,0.35)]',
  gold: 'bg-gold text-ink shadow-[0_10px_24px_rgba(255,215,0,0.28)]',
}

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onDrag' | 'onDragStart' | 'onDragEnd' | 'onAnimationStart'> {
  variant?: Variant
  children: ReactNode
}

export function Button({ variant = 'primary', children, className = '', onClick, type = 'button', disabled, ...props }: ButtonProps) {
  return (
    <motion.button
      type={type}
      whileTap={disabled ? undefined : { scale: 0.97 }}
      whileHover={disabled ? undefined : { scale: 1.02 }}
      disabled={disabled}
      onClick={(event) => {
        if (!disabled) haptic(10)
        onClick?.(event)
      }}
      className={`inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl px-5 py-3 font-heading text-sm font-bold tracking-wide transition disabled:cursor-not-allowed disabled:opacity-40 ${styles[variant]} ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  )
}
