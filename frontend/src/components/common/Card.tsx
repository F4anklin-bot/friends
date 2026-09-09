import { motion } from 'framer-motion'
import type { CSSProperties, ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  onClick?: () => void
  style?: CSSProperties
}

export function Card({ children, className = '', onClick, style }: CardProps) {
  return (
    <motion.div
      layout
      style={style}
      onClick={onClick}
      whileTap={onClick ? { scale: 0.98 } : undefined}
      className={`glass rounded-3xl p-4 ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {children}
    </motion.div>
  )
}
