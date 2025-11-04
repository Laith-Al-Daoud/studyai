/**
 * Animated Card Wrapper
 * 
 * Provides hover and tap animations for card elements
 */

'use client'

import { motion, HTMLMotionProps } from 'framer-motion'
import { ReactNode } from 'react'

interface AnimatedCardProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children: ReactNode
  hoverScale?: number
  tapScale?: number
  delay?: number
}

export function AnimatedCard({ 
  children, 
  hoverScale = 1.02, 
  tapScale = 0.98,
  delay = 0,
  ...props 
}: AnimatedCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.3,
        delay,
        ease: 'easeOut',
      }}
      whileHover={{ 
        scale: hoverScale,
        transition: { duration: 0.2 }
      }}
      whileTap={{ scale: tapScale }}
      {...props}
    >
      {children}
    </motion.div>
  )
}


