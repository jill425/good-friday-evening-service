'use client'
import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Section as sections } from './Section'

const directions = [
  { x: () => window.innerWidth * 0.8, y: '-60%', rotateY: -25, rotateX: 12 },
  { x: () => -window.innerWidth * 0.8, y: '60%', rotateY: 25, rotateX: -12 },
]

export default function MainScroll() {
  const containerRef = useRef(null)

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)

    const ctx = gsap.context(() => {
      const sectionsElements = gsap.utils.toArray('.zoom-container')

      gsap.set('.zoom-image', {
        scale: 0.2, x: 0, y: 0,
        opacity: 0.1,
        rotateY: 0, rotateX: 0,
        transformPerspective: 800,
      })

      gsap.set('.zoom-content', {
        z: -1000,
        opacity: 0,
        scale: 0.5,
        transformPerspective: 1000
      })

      const masterTl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top top',
          end: () => `+=${sectionsElements.length * 1500}`,
          scrub: 1,
          pin: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      })

      sectionsElements.forEach((el, i) => {
        const images = el.querySelectorAll('.zoom-image')
        const content = el.querySelector('.zoom-content')
        const sectionLabel = `section-${i}`

        masterTl.add(sectionLabel, i === 0 ? 0 : ">-0.1")

        // 1. Section fade in
        masterTl.to(el, { opacity: 1, duration: 0.1 }, sectionLabel)

        // 2. Images animation (parallel)
        images.forEach((img, imgIdx) => {
          const dir = directions[(i + imgIdx) % directions.length]
          masterTl.to(img, {
            scale: 1.5,
            x: dir.x,
            y: dir.y,
            rotateY: dir.rotateY,
            rotateX: dir.rotateX,
            opacity: 1,
            ease: 'power1.inOut',
            duration: 1,
          }, `${sectionLabel}+=0.5`)
        })

        // 3. Content 3D animation (parallel to images)
        masterTl.to(content, {
          z: 10,
          opacity: 1,
          scale: 1,
          ease: 'power2.out',
          duration: 0.5,
        }, sectionLabel)
          .to(content, {
            z: 1000,
            opacity: 0,
            scale: 1.5,
            ease: 'power2.in',
            duration: 0.5,
          }, `${sectionLabel}+=0.5`)

        // 4. Section fade out (except last)
        if (i < sectionsElements.length - 1) {
          masterTl.to(el, { opacity: 0, duration: 0.2 }, `${sectionLabel}+=1.0`)
        }
      })
    }, containerRef)

    return () => ctx.revert()
  }, [])

  return (
    <div ref={containerRef} className="main-scroll-wrapper" style={{ position: 'relative', zIndex: 1, height: '100vh' }}>
      {sections.map((section, i) => (
        <section
          key={i}
          className="zoom-container"
          style={{
            position: 'absolute', // Stack layers on top of each other
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            perspective: '1000px',
            opacity: i === 0 ? 1 : 0 // Initial state: only show first section
          }}
        >
          {section.images.map((num, imgIdx) => (
            <img
              key={num}
              className="zoom-image"
              src={`/images/${num}.webp`}
              alt={num.toString()}
              style={{
                position: 'absolute',
                width: 'clamp(200px, 60vw, 480px)',
                height: 'clamp(200px, 60vw, 480px)',
                objectFit: 'cover',
                borderRadius: '16px',
                transformOrigin: 'center center',
                filter: 'brightness(1.4)',
                willChange: 'transform, opacity',
                zIndex: 1
              }}
            />
          ))}
          <div
            className="zoom-content"
            style={{
              position: 'relative',
              zIndex: 10,
              color: '#fff',
              textAlign: 'center',
              maxWidth: 'min(800px, 90vw)',
              padding: 'clamp(16px, 5vw, 40px)',
            }}
          >
            <p style={{
              fontSize: 'clamp(0.65rem, 2.5vw, 0.9rem)',
              fontWeight: '400',
              letterSpacing: '0.15em',
              opacity: 0.6,
              marginBottom: '4px',
              textTransform: 'uppercase',
            }}>
              {section.subtitle}
            </p>
            <h2 style={{
              fontSize: 'clamp(1.1rem, 4vw, 1.8rem)',
              fontWeight: '600',
              marginBottom: 'clamp(10px, 2vw, 18px)',
              textShadow: '0 2px 10px rgba(0,0,0,0.8)',
              lineHeight: '1.4',
            }}>
              {section.title}
            </h2>
            <p style={{
              fontSize: 'clamp(0.8rem, 2.8vw, 1.1rem)',
              lineHeight: '1.8',
              fontWeight: '300',
              textShadow: '0 2px 8px rgba(0,0,0,0.8)',
              opacity: 0.9,
            }}>
              {section.content}
            </p>
          </div>
        </section>
      ))}
    </div>
  )
}
