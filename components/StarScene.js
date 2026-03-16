'use client'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { gsap } from 'gsap'

const STAR_COUNT = 3000
const SPAWN_DEPTH = 2000
const SCROLL_MULTIPLIER = 0.1

function createStar(cameraZ = 0) {
  const angle = Math.random() * Math.PI * 2
  const radius = 20 + Math.sqrt(Math.random()) * 600
  const colorRoll = Math.random()
  return {
    x: Math.cos(angle) * radius,
    y: Math.sin(angle) * radius,
    z: cameraZ - Math.random() * SPAWN_DEPTH,
    r: colorRoll > 0.85 ? 0.7 : 1.0,
    g: colorRoll > 0.85 ? 0.85 : 1.0,
    intrinsicBrightness: 0.4 + Math.random() * 0.6,  // 每顆星固有亮度
    twinkleFreq: 1.0 + Math.random() * 1.0,           // 呼吸週期約 3~6 秒
    twinklePhase: Math.random() * Math.PI * 2,
  }
}

export default function StarScene() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current, antialias: true })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(0x050505)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 5000)

    const starData = Array.from({ length: STAR_COUNT }, () => createStar(0))

    const positions = new Float32Array(STAR_COUNT * 3)
    const colors = new Float32Array(STAR_COUNT * 3)

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))

    // 放射漸層星形貼圖：中心亮、邊緣透明，有光暈感
    const circleCanvas = document.createElement('canvas')
    circleCanvas.width = 64
    circleCanvas.height = 64
    const ctx = circleCanvas.getContext('2d')
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32)
    gradient.addColorStop(0, '#ffffff')
    gradient.addColorStop(0.1, 'rgba(255,255,255,0.6)')
    gradient.addColorStop(1, '#000000')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 64, 64)
    const circleTexture = new THREE.CanvasTexture(circleCanvas)

    const material = new THREE.PointsMaterial({
      size: 1.5,                          // ← 星星大小，可調整
      map: circleTexture,                 // ← 加上圓形貼圖
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      transparent: true,
      sizeAttenuation: true,            // 遠小近大，有透視感
    })
    scene.add(new THREE.Points(geometry, material))

    const state = { cameraZ: 0, fov: 75 }
    let prevCameraZ = 0

    const handleScroll = () => {
      gsap.to(state, {
        cameraZ: -window.scrollY * SCROLL_MULTIPLIER,
        duration: 0.4,
        ease: 'power2.out',
        overwrite: true,
      })
    }
    window.addEventListener('scroll', handleScroll)

    let animId = null
    let elapsed = 0
    const animate = () => {
      animId = requestAnimationFrame(animate)
      elapsed += 0.016
      const cameraZ = state.cameraZ
      camera.position.z = cameraZ
      camera.fov = state.fov
      camera.updateProjectionMatrix()

      const speed = Math.abs(cameraZ - prevCameraZ)
      prevCameraZ = cameraZ

      for (let i = 0; i < STAR_COUNT; i++) {
        const s = starData[i]

        const respawn = () => {
          const angle = Math.random() * Math.PI * 2
          const radius = 40 + Math.sqrt(Math.random()) * 600
          s.x = Math.cos(angle) * radius
          s.y = Math.sin(angle) * radius
        }

        if (s.z > cameraZ + 5) {
          respawn()
          s.z = cameraZ - SPAWN_DEPTH
        } else if (s.z < cameraZ - SPAWN_DEPTH) {
          respawn()
          s.z = cameraZ - Math.random() * SPAWN_DEPTH
        }

        const dist = cameraZ - s.z
        const depthFade = Math.max(0, 1 - dist / SPAWN_DEPTH)
        const twinkle = 0.4 + 0.6 * Math.sin(elapsed * s.twinkleFreq + s.twinklePhase) // 0.4~1.0
        const brightness = s.intrinsicBrightness * twinkle * depthFade

        positions[i * 3 + 0] = s.x
        positions[i * 3 + 1] = s.y
        positions[i * 3 + 2] = s.z

        colors[i * 3 + 0] = s.r * brightness
        colors[i * 3 + 1] = s.g * brightness
        colors[i * 3 + 2] = brightness
      }

      geometry.attributes.position.needsUpdate = true
      geometry.attributes.color.needsUpdate = true
      renderer.render(scene, camera)
    }
    animate()

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }
    window.addEventListener('resize', handleResize)

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleResize)
      geometry.dispose()
      material.dispose()
      renderer.dispose()
    }
  }, [])

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: -1 }}>
      <canvas ref={canvasRef} style={{ display: 'block' }} />
    </div>
  )
}
