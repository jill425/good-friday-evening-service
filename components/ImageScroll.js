'use client'
import { useEffect } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

const images = ['2', '3', '5', '6', '7', '8', '9', '10', '11']

const directions = [
  { x: '180%', y: '0%' },
  { x: '-180%', y: '0%' },
]

export default function ImageScroll() {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)

    const sections = document.querySelectorAll('.zoom-container')
    sections.forEach((section, i) => {
      const img = section.querySelector('.zoom-image')
      const dir = directions[i % directions.length]

      gsap.set(img, { scale: 0.2, xPercent: -50, yPercent: -50, x: 0, y: 0, opacity: 0 })

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: '+=2000',
          scrub: 1,
          pin: true,
          anticipatePin: 1,
          onEnter: () => gsap.set(img, { opacity: 0.8 }),
          onLeaveBack: () => gsap.set(img, { opacity: 0 }),
        },
      })

      tl.to(img, {
        scale: 1.5,
        x: dir.x,
        y: dir.y,
        opacity: 0,
        ease: 'power2.in',
        duration: 2,
      })
    })

    return () => ScrollTrigger.getAll().forEach(t => t.kill())
  }, [])

  return (
    <div style={{ position: 'relative', zIndex: 1 }}>
      {images.map((num) => (
        <section
          key={num}
          className="zoom-container"
          style={{ position: 'relative', width: '100%', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <img
            className="zoom-image"
            src={`/images/${num}.webp`}
            alt={num}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: '480px',
              height: '480px',
              objectFit: 'cover',
              borderRadius: '16px',
              transformOrigin: 'center center',
              boxShadow: '0 0 60px rgba(180,160,255,0.4)',
              willChange: 'transform, opacity',
            }}
          />
        </section>
      ))}
    </div>
  )
}
