'use client'
import { useState } from 'react'
import StarBackground from '@/components/StarBackground'
import StoryScroll from '@/components/StoryScroll'
import EmailGate from '@/components/EmailGate'

export default function Home() {
  const [unlocked, setUnlocked] = useState(false)

  return (
    <div>
      {!unlocked && <EmailGate onUnlock={() => setUnlocked(true)} />}
      <StarBackground />
      {unlocked && <StoryScroll />}
    </div>
  )
}