'use client'
import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Slides } from '../data/slides'
import ProgressBar from './ProgressBar'
import styles from './StoryScroll.module.css'

const directions = [
  { x: () => window.innerWidth * 0.8, y: '-60%', rotateY: -25, rotateX: 12 },
  { x: () => -window.innerWidth * 0.8, y: '60%', rotateY: 25, rotateX: -12 },
]

export default function MainScroll() {
  const containerRef = useRef(null)
  const progressBarRef = useRef(null)
  const scrollHintRef = useRef(null)

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)

    const ctx = gsap.context(() => {
      const slideElements = gsap.utils.toArray('.zoom-container')

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
        transformPerspective: 1000,
      })

      // Make first slide visible immediately
      const firstSlideEl = slideElements[0]
      if (firstSlideEl) {
        const firstType = Slides[0]?.type
        if (firstType === 'image') {
          gsap.set(firstSlideEl.querySelector('.zoom-image'), { scale: 1, opacity: 1, x: 0, y: 0, rotateY: 0, rotateX: 0 })
        } else {
          gsap.set(firstSlideEl.querySelector('.zoom-content'), { z: -100, opacity: 1, scale: 1 })
        }
      }

      const masterTl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top top',
          end: () => `+=${slideElements.length * 600}`,
          scrub: 1,
          pin: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            if (progressBarRef.current) {
              progressBarRef.current.style.width = `${self.progress * 100}%`
            }
            if (scrollHintRef.current) {
              scrollHintRef.current.style.opacity = self.progress > 0.02 ? '0' : '1'
            }
          },
        },
      })

      let imageCount = 0

      slideElements.forEach((el, i) => {
        const slide = Slides[i]
        if (!slide) return

        const label = `slide-${i}`

        const prevSlide = Slides[i - 1]
        const overlap = i === 0
          ? 0
          : (prevSlide?.type === 'text' || slide.type === 'text')
            ? '>-0.05'
            : '>-0.55'
        masterTl.add(label, overlap)
        masterTl.to(el, { opacity: 1, duration: 0.1 }, label)

        if (slide.type === 'image') {
          const img = el.querySelector('.zoom-image')
          if (!img) return

          const dir = directions[imageCount % directions.length]
          imageCount++

          masterTl.to(img, {
            scale: 1.5,
            x: dir.x,
            y: dir.y,
            rotateY: dir.rotateY,
            rotateX: dir.rotateX,
            opacity: 1,
            ease: 'power1.inOut',
            duration: 0.65,
          }, `${label}+=0.05`)

        } else {
          const content = el.querySelector('.zoom-content')
          if (!content) return

          const isLast = i === slideElements.length - 1
          masterTl.to(content, {
            z: -100, opacity: 1, scale: 1,
            ease: 'power2.out', duration: 0.4,
          }, label)
          if (!isLast) {
            masterTl.to(content, {
              z: 1000, opacity: 0, scale: 1.5,
              ease: 'power2.in', duration: 0.4,
            }, `${label}+=0.4`)
          } else {
            masterTl.to(content, {
              z: 100, opacity: 1, scale: 1.5,
              ease: 'power2.in', duration: 0.4,
            })
          }
        }

        if (i < slideElements.length - 1) {
          masterTl.to(el, { opacity: 0, duration: 0.12 }, `${label}+=0.65`)
        }
      })
    }, containerRef)

    return () => ctx.revert()
  }, [])

  return (
    <>
      <ProgressBar barRef={progressBarRef} />
      <div ref={containerRef} className="main-scroll-wrapper" style={{ position: 'relative', zIndex: 1, height: '100vh' }}>
        <div ref={scrollHintRef} className={styles.scrollHint}>
          <span className={styles.scrollHintText}>向下滾動</span>
          <div className={styles.chevron} />
          <div className={styles.chevron} />
          <div className={styles.chevron} />
        </div>
        {Slides.map((slide, i) => (
          <section
            key={i}
            className="zoom-container"
            style={{
              position: 'absolute',
              top: 0, left: 0,
              width: '100%', height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              // paddingTop: slide.type === 'text' ? '20vh' : 0,
              paddingTop: 0,
              overflow: 'hidden',
              perspective: '1000px',
              opacity: i === 0 ? 1 : 0,
            }}
          >
            {slide.type === 'image' ? (
              <img
                className="zoom-image"
                src={`/images/${slide.src}.webp`}
                alt={slide.src.toString()}
                style={{
                  position: 'absolute',
                  width: 'clamp(200px, 60vw, 480px)',
                  height: 'clamp(200px, 60vw, 480px)',
                  objectFit: 'cover',
                  borderRadius: '16px',
                  transformOrigin: 'center center',
                  filter: 'brightness(1.4)',
                  willChange: 'transform, opacity',
                  zIndex: 1,
                }}
              />
            ) : (
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
                  {slide.subtitle}
                </p>
                <h2 style={{
                  fontSize: 'clamp(1.1rem, 4vw, 1.8rem)',
                  fontWeight: '600',
                  marginBottom: 'clamp(10px, 2vw, 18px)',
                  textShadow: '0 2px 10px rgba(0,0,0,0.8)',
                  lineHeight: '1.4',
                }}>
                  {slide.title}
                </h2>
                <p style={{
                  fontSize: 'clamp(0.8rem, 2.8vw, 1.1rem)',
                  lineHeight: '1.8',
                  fontWeight: '300',
                  textShadow: '0 2px 8px rgba(0,0,0,0.8)',
                  opacity: 0.9,
                  whiteSpace: 'pre-wrap',
                }}>
                  {slide.content}
                </p>
              </div>
            )}
          </section>
        ))}
      </div>
    </>
  )
}
