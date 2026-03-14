'use client'
import dynamic from 'next/dynamic'

const StarScene = dynamic(() => import('@/components/StarScene'), { ssr: false })
const MainScroll = dynamic(() => import('@/components/MainScroll'), { ssr: false })

export default function Home() {
  return (
    <>
      <StarScene />
      <MainScroll />
    </>
  )
}
