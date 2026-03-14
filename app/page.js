'use client'
import dynamic from 'next/dynamic'

const StarScene = dynamic(() => import('@/components/StarScene'), { ssr: false })
const ImageScroll = dynamic(() => import('@/components/ImageScroll'), { ssr: false })

export default function Home() {
  return (
    <>
      <StarScene />
      <ImageScroll />
    </>
  )
}
