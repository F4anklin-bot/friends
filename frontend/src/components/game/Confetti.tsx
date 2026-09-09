import { useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'

export function Confetti() {
  const bits = useMemo(
    () =>
      Array.from({ length: 42 }, (_, index) => ({
        id: index,
        x: Math.random() * 100,
        delay: Math.random() * 0.6,
        color: ['#FF69B4', '#8B5CF6', '#FFD700', '#22D3EE', '#FB7185'][index % 5],
        rotate: Math.random() * 180,
      })),
    [],
  )

  useEffect(() => {
    document.body.classList.add('overflow-hidden')
    return () => document.body.classList.remove('overflow-hidden')
  }, [])

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {bits.map((bit) => (
        <motion.span
          key={bit.id}
          initial={{ y: -20, opacity: 1, x: `${bit.x}vw`, rotate: 0 }}
          animate={{ y: '110vh', rotate: bit.rotate + 220, opacity: [1, 1, 0] }}
          transition={{ duration: 2.4 + Math.random(), delay: bit.delay, ease: 'easeIn' }}
          className="absolute top-0 h-3 w-2 rounded-sm"
          style={{ background: bit.color }}
        />
      ))}
    </div>
  )
}
