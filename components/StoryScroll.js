'use client'
import { useEffect, useRef, useCallback } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Slides, finalImage } from '../data/slides'
import ProgressBar from './ProgressBar'
import styles from './StoryScroll.module.css'

// ── Heat haze config ──
const HEAT_HAZE_ENABLED = false   // true = 開啟空氣浮動特效, false = 關閉
const HEAT_HAZE_START_Y = 40     // 從圖片高度的幾 % 開始有特效 (0 = 頂部, 100 = 底部)

const directions = [
  { x: () => window.innerWidth * 0.8, y: '-60%', rotateY: -25, rotateX: 12 },
  { x: () => -window.innerWidth * 0.8, y: '60%', rotateY: 25, rotateX: -12 },
]

// Pre-compute image info (direction index for each image slide)
const imageInfos = (() => {
  let count = 0
  return Slides.filter(s => s.type === 'image').map(s => {
    const dirIdx = count % directions.length
    count++
    return { src: s.src, dirIdx }
  })
})()

export default function MainScroll() {
  const containerRef = useRef(null)
  const progressBarRef = useRef(null)
  const scrollHintRef = useRef(null)
  const journeyBtnRef = useRef(null)
  const rewindRef = useRef(null)
  const finalImgRef = useRef(null)
  const entranceTextRef = useRef(null)
  const hazeOverlayRef = useRef(null)
  const journeyBgmRef = useRef(null)
  const whooshPoolRef = useRef(null)

  // Preload audio files on mount so they're ready when needed
  useEffect(() => {
    const bgm = new Audio('/sorroww.m4a')
    bgm.preload = 'auto'
    bgm.volume = 0
    journeyBgmRef.current = bgm

    const pool = Array.from({ length: 3 }, () => {
      const a = new Audio('/wooshh.m4a')
      a.preload = 'auto'
      a.volume = 0.15
      return a
    })
    whooshPoolRef.current = pool
  }, [])

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)

    const ctx = gsap.context(() => {
      const slideElements = gsap.utils.toArray('.zoom-container')

      // Global text scale multiplier — increase to make text larger during the "stay" phase
      const textScale = 1.7

      gsap.set('.zoom-image', {
        scale: 0.2, x: 0, y: 0,
        opacity: 0.1,
        rotateY: 0, rotateX: 0,
        transformPerspective: 800,
      })

      gsap.set('.zoom-content', {
        z: -1000,
        opacity: 0,
        scale: 0.5 * textScale,
        transformPerspective: 1000,
      })

      // Make first slide visible immediately
      const firstSlideEl = slideElements[0]
      if (firstSlideEl) {
        const firstType = Slides[0]?.type
        if (firstType === 'image') {
          gsap.set(firstSlideEl.querySelector('.zoom-image'), { scale: 1, opacity: 1, x: 0, y: 0, rotateY: 0, rotateX: 0 })
        } else {
          gsap.set(firstSlideEl.querySelector('.zoom-content'), { z: -100, opacity: 1, scale: 1 * textScale })
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
            if (journeyBtnRef.current) {
              const show = self.progress > 0.97
              if (show) {
                journeyBtnRef.current.classList.add(styles.journeyBtnVisible)
              } else {
                journeyBtnRef.current.classList.remove(styles.journeyBtnVisible)
              }
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
          const isTitleOnly = slide.title && !slide.content
          const pauseDur = isTitleOnly ? 1 : 0 // extra timeline duration for title slides

          masterTl.to(content, {
            z: -100, opacity: 1, scale: 1 * textScale,
            ease: 'power2.out', duration: 0.4,
          }, label)
          if (!isLast) {
            masterTl.to(content, {
              z: 1000, opacity: 0, scale: 1.5 * textScale,
              ease: 'power2.in', duration: 0.4,
            }, `${label}+=${0.4 + pauseDur}`)
          } else {
            // Keep last slide visible with extra dwell time so journey button can appear
            masterTl.to(content, {
              z: -100, opacity: 1, scale: 1 * textScale,
              duration: 2,
            }, `${label}+=0.4`)
          }
        }

        const isTitleSlide = slide.title && !slide.content
        const slideTotalDur = isTitleSlide ? 0.4 + 1 + 0.4 : 0.65
        if (i < slideElements.length - 1) {
          masterTl.to(el, { opacity: 0, duration: 0.12 }, `${label}+=${slideTotalDur}`)
        }
      })
    }, containerRef)

    return () => ctx.revert()
  }, [])

  const handleJourneyStart = useCallback(() => {
    const overlay = rewindRef.current
    if (!overlay) return

    document.body.style.overflow = 'hidden'
    overlay.style.visibility = 'visible'
    overlay.style.pointerEvents = 'auto'

    // Fade out background music, start journey BGM
    window.dispatchEvent(new Event('journey-start'))
    const journeyBgm = journeyBgmRef.current
    journeyBgm.loop = false
    journeyBgm.volume = 0
    journeyBgm.play().catch(() => {})
    gsap.to(journeyBgm, { volume: 0.3, duration: 4, ease: 'power2.inOut' })

    // Fade out journey BGM 3.31s before the track ends, then fade back in on restart
    let bgmFading = false
    let bgmTween = null
    const onTimeUpdate = () => {
      if (!bgmFading && journeyBgm.duration && journeyBgm.currentTime >= journeyBgm.duration - 3.31) {
        bgmFading = true
        bgmTween = gsap.to(journeyBgm, { volume: 0, duration: 3.31, ease: 'power2.inOut' })
      }
    }
    journeyBgm.addEventListener('timeupdate', onTimeUpdate)
    journeyBgm.addEventListener('ended', () => {
      if (bgmTween) bgmTween.kill()
      bgmFading = false
      journeyBgm.currentTime = 0
      journeyBgm.volume = 0
      journeyBgm.play().catch(() => {})
      bgmTween = gsap.to(journeyBgm, { volume: 0.3, duration: 3, ease: 'power2.inOut' })
    })

    // Use preloaded whoosh sound pool
    const whooshPool = whooshPoolRef.current
    let whooshIdx = 0
    const playWhoosh = (vol) => {
      const w = whooshPool[whooshIdx % whooshPool.length]
      w.volume = Math.min(1, vol)
      w.currentTime = 0
      w.play().catch(() => {})
      whooshIdx++
    }

    // Hide progress bar
    if (progressBarRef.current) {
      gsap.to(progressBarRef.current.parentElement, { opacity: 0, duration: 0.3 })
    }

    const imgs = gsap.utils.toArray(overlay.querySelectorAll('.rewind-img'))
    const finalImg = finalImgRef.current

    gsap.set(imgs, { opacity: 0, scale: 1.5, transformPerspective: 800 })
    gsap.set(finalImg, { opacity: 0, scale: 1.05 })

    const entranceText = entranceTextRef.current
    gsap.set(entranceText, { opacity: 0, y: 20 })

    const tl = gsap.timeline()

    // Fade in the overlay
    tl.to(overlay, { opacity: 1, duration: 0.6, ease: 'power2.inOut' })

    // Rewind: play images in reverse order, each from outside → center, getting faster
    const total = imageInfos.length
    const maxDriftY = -20
    let dur = 0.4
    const minDur = 0.12
    let rewindIdx = 0

    for (let i = total - 1; i >= 0; i--) {
      const img = imgs[i]
      const dir = directions[imageInfos[i].dirIdx]
      const startX = typeof dir.x === 'function' ? dir.x() : dir.x
      const progress = (rewindIdx + 1) / total
      const gray = Math.pow(progress, 0.5)
      const driftY = maxDriftY * Math.pow(progress, 2)
      const driftYpx = (driftY / 100) * window.innerHeight
      const whooshVol = 0.2 + 0.6 * progress // louder as it speeds up

      // Set to scattered position + play whoosh
      tl.set(img, {
        opacity: 0,
        scale: 1.5,
        x: startX,
        y: dir.y,
        rotateY: dir.rotateY,
        rotateX: dir.rotateX,
        filter: `grayscale(${gray})`,
        onComplete: () => playWhoosh(whooshVol),
      })

      // Fly in from outside to converge point
      tl.to(img, {
        opacity: 1,
        scale: 1,
        x: 0,
        y: driftYpx,
        rotateY: 0,
        rotateX: 0,
        duration: dur * 0.95,
        ease: 'power2.out',
      })

      // Shrink and fade
      tl.to(img, {
        opacity: 0,
        scale: 0.3,
        duration: dur * 0.05,
        ease: 'power2.in',
      })

      dur = Math.max(minDur, dur * 0.87)
      rewindIdx++
    }

    // Reveal final image
    tl.to(finalImg, {
      opacity: 1,
      scale: 1,
      duration: 0.4,
      ease: 'power2.inOut',
      onComplete: () => {
        if (!HEAT_HAZE_ENABLED) return
        // Activate CSS heat haze animation
        const hazeEl = hazeOverlayRef.current
        if (hazeEl) hazeEl.classList.add(styles.hazeActive)
      },
    }, '-=0.2')

    // Show entrance text after delay
    tl.to(entranceText, {
      opacity: 1,
      y: 0,
      duration: 0.8,
      ease: 'power2.out',
    }, '+=1')
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
                  maskImage: 'radial-gradient(ellipse 70% 50% at center, black 20%, transparent 100%)',
                  WebkitMaskImage: 'radial-gradient(ellipse 80% 50% at center, black 70%, transparent 100%)',
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
                  maxWidth: slide.amplify ? undefined : 'min(800px, 90vw)',
                  padding: 'clamp(16px, 5vw, 40px)',
                }}
              >
                {(() => {
                  const amp = slide.amplify || 1
                  return (<>
                <p style={{
                  fontSize: `clamp(${0.65 * amp}rem, ${2.5 * amp}vw, ${0.9 * amp}rem)`,
                  fontWeight: '400',
                  letterSpacing: '0.15em',
                  opacity: 0.6,
                  marginBottom: '4px',
                  textTransform: 'uppercase',
                }}>
                  {slide.subtitle}
                </p>
                <h2 style={{
                  fontSize: `clamp(${1.1 * amp}rem, ${4 * amp}vw, ${1.8 * amp}rem)`,
                  fontWeight: '600',
                  marginBottom: 'clamp(10px, 2vw, 18px)',
                  textShadow: '0 2px 10px rgba(0,0,0,0.8)',
                  lineHeight: '1.4',
                  whiteSpace: slide.amplify ? 'nowrap' : undefined,
                  color: slide.title && !slide.content ? 'rgba(255,255,255,0.55)' : undefined,
                }}>
                  {slide.title}
                </h2>
                <p style={{
                  fontSize: `clamp(${0.8 * amp}rem, ${2.8 * amp}vw, ${1.1 * amp}rem)`,
                  lineHeight: '1.8',
                  fontWeight: '300',
                  textShadow: '0 2px 8px rgba(0,0,0,0.8)',
                  opacity: 0.9,
                  whiteSpace: slide.amplify ? 'pre' : 'pre-wrap',
                }}>
                  {slide.content}
                </p>
                  </>)
                })()}
              </div>
            )}
          </section>
        ))}
        {/* Journey start button — appears at the end */}
        <div
          ref={journeyBtnRef}
          className={styles.journeyBtn}
          onClick={handleJourneyStart}
        >
          <span className={styles.arrowLeft}>›</span>
          旅程開始
          <span className={styles.arrowRight}>‹</span>
        </div>
      </div>

      {/* Rewind overlay — always rendered, initially hidden */}
      <div
        ref={rewindRef}
        style={{
          position: 'fixed',
          inset: 0,
          background: '#000',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: 0,
          visibility: 'hidden',
          pointerEvents: 'none',
        }}
      >
        {imageInfos.map((info, i) => (
          <img
            key={i}
            className="rewind-img"
            src={`/images/${info.src}.webp`}
            alt=""
            style={{
              position: 'absolute',
              width: 'clamp(200px, 60vw, 480px)',
              height: 'clamp(200px, 60vw, 480px)',
              objectFit: 'cover',
              borderRadius: '16px',
              transformOrigin: 'center center',
              filter: 'brightness(1.4)',
              willChange: 'transform, opacity',
              maskImage: 'radial-gradient(ellipse 70% 50% at center, black 20%, transparent 100%)',
              WebkitMaskImage: 'radial-gradient(ellipse 80% 50% at center, black 70%, transparent 100%)',
            }}
          />
        ))}
        {/* Final image wrapper — contains sharp base + haze overlay */}
        <div
          ref={finalImgRef}
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
          }}
        >
          {/* Sharp base layer */}
          <img
            src={`/images/${finalImage}.png`}
            alt=""
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
          {/* CSS heat haze overlay — clipped to bottom portion */}
          {HEAT_HAZE_ENABLED && (
            <div
              ref={hazeOverlayRef}
              className={styles.hazeOverlay}
              style={{
                top: `${HEAT_HAZE_START_Y}%`,
              }}
            />
          )}
        </div>
        <div
          ref={entranceTextRef}
          style={{
            position: 'absolute',
            bottom: '3rem',
            left: '50%',
            transform: 'translateX(-50%)',
            color: 'rgba(255, 255, 255, 0.85)',
            fontSize: 'clamp(0.9rem, 2.5vw, 1.2rem)',
            letterSpacing: '0.3em',
            textShadow: '0 2px 10px rgba(0,0,0,0.8)',
            whiteSpace: 'nowrap',
            opacity: 0,
            zIndex: 10,
          }}
        >
          出示此畫面即可入場
        </div>
      </div>
    </>
  )
}
