'use client'
import StarBackground from '@/components/StarBackground'
import StoryScroll from '@/components/StoryScroll'
import dynamic from 'next/dynamic'
import EmailGate from '@/components/EmailGate'


export default function Home() {
  return (

    <div>
      <EmailGate />
      <StarBackground />
      <StoryScroll />
    </div>
  )
}