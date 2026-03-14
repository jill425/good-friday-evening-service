'use client'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { gsap } from 'gsap'

const STAR_COUNT = 1500
const SPAWN_DEPTH = 2000

function createStar() {
  const angle = Math.random() * Math.PI * 2
  const radius = 40 + Math.sqrt(Math.random()) * 600
  const colorRoll = Math.random()
  return {
    x: Math.cos(angle) * radius,
    y: Math.sin(angle) * radius,
    z: -(Math.random() * SPAWN_DEPTH),
    r: colorRoll > 0.85 ? 0.7 : 1.0,
    g: colorRoll > 0.85 ? 0.85 : 1.0,
  }
}

export default function StarScene() {
  const mountRef = useRef(null)

  useEffect(() => {
    // Renderer
    const container = mountRef.current
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(0x050505)
    container.appendChild(renderer.domElement)

    // Scene & camera
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 5000)

    // Stars: each star = one line segment (head + tail)
    const starData = Array.from({ length: STAR_COUNT }, createStar)
    const positions = new Float32Array(STAR_COUNT * 6)
    const colors = new Float32Array(STAR_COUNT * 6)

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))

    const material = new THREE.LineBasicMaterial({
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      transparent: true,
    })

    scene.add(new THREE.LineSegments(geometry, material))

    // Warp state
    const state = { speed: 2, fov: 75 }
    let cameraZ = 0
    let warpActive = false

    const triggerWarp = () => {
      if (warpActive) return
      warpActive = true
      gsap.to(state, { speed: 80, fov: 110, duration: 3, ease: 'power3.in' })
    }
    const releaseWarp = () => {
      if (!warpActive) return
      warpActive = false
      gsap.to(state, { speed: 2, fov: 75, duration: 2, ease: 'power2.out' })
    }

    // Trigger warp at ~85% of scroll (5 sections × 1500px = 7500px total)
    const handleScroll = () => {
      if (window.scrollY > 6000) triggerWarp()
      else releaseWarp()
    }
    window.addEventListener('scroll', handleScroll)

    // Animation loop
    let animId
    const animate = () => {
      animId = requestAnimationFrame(animate)

      cameraZ -= state.speed
      camera.position.z = cameraZ
      camera.fov = state.fov
      camera.updateProjectionMatrix()

      const tailLength = Math.max(2, state.speed * 3)

      for (let i = 0; i < STAR_COUNT; i++) {
        const s = starData[i]

        // Recycle stars that passed the camera
        if (s.z > cameraZ + 5) {
          const angle = Math.random() * Math.PI * 2
          const radius = 40 + Math.sqrt(Math.random()) * 600
          s.x = Math.cos(angle) * radius
          s.y = Math.sin(angle) * radius
          s.z = cameraZ - SPAWN_DEPTH
        }

        // Brightness: dim when far, bright when close
        const dist = cameraZ - s.z
        const brightness = Math.max(0, 1 - dist / SPAWN_DEPTH)

        // Head vertex
        positions[i * 6 + 0] = s.x
        positions[i * 6 + 1] = s.y
        positions[i * 6 + 2] = s.z
        // Tail vertex (trails behind in z)
        positions[i * 6 + 3] = s.x
        positions[i * 6 + 4] = s.y
        positions[i * 6 + 5] = s.z + tailLength

        // Head: coloured & bright
        colors[i * 6 + 0] = s.r * brightness
        colors[i * 6 + 1] = s.g * brightness
        colors[i * 6 + 2] = brightness
        // Tail: fades to black
        colors[i * 6 + 3] = 0
        colors[i * 6 + 4] = 0
        colors[i * 6 + 5] = 0
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
      if (container?.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement)
      }
    }
  }, [])

  return (
    <div ref={mountRef} style={{
      position: 'fixed',
      top: 0, left: 0,
      width: '100vw',
      height: '100vh',
      zIndex: -1,
    }} />
  )
}
