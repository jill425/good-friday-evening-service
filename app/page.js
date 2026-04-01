'use client'
import { useState, useCallback } from 'react'
import StarBackground from '@/components/StarBackground'
import StoryScroll from '@/components/StoryScroll'
import EmailGate from '@/components/EmailGate'

export default function Home() {
  const [unlocked, setUnlocked] = useState(false)

  const handleUnlock = useCallback(() => {
    setUnlocked(true)
  }, [])

  return (
    <div>
      {!unlocked && <EmailGate onUnlock={handleUnlock} />}
      <StarBackground />
      {unlocked && <StoryScroll />}
    </div>
  )
}