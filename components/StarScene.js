'use client'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'

// 用 Canvas 生成一個柔邊圓形漸層，模擬雲霧團
function createCloudTexture() {
  const size = 256
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  const cx = size / 2

  const gradient = ctx.createRadialGradient(cx, cx, 0, cx, cx, cx)
  gradient.addColorStop(0,   'rgba(200, 210, 255, 0.18)')
  gradient.addColorStop(0.4, 'rgba(180, 190, 240, 0.10)')
  gradient.addColorStop(1,   'rgba(150, 160, 220, 0)')

  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, size, size)
  return new THREE.CanvasTexture(canvas)
}

export default function StarScene() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setClearColor(0x000000, 1)

    const scene = new THREE.Scene()
    scene.fog = new THREE.FogExp2(0x000000, 0.0008)

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 3000)
    camera.position.z = 0

    const texture = createCloudTexture()
    const cloudCount = 80

    // 每朵雲的狀態
    const clouds = Array.from({ length: cloudCount }, () => {
      const sprite = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: texture,
          transparent: true,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          opacity: Math.random() * 0.5 + 0.15,
        })
      )

      const size = Math.random() * 600 + 200
      sprite.scale.set(size, size, 1)

      // 隨機初始位置（深空到近處）
      sprite.position.set(
        (Math.random() - 0.5) * 2000,
        (Math.random() - 0.5) * 1200,
        -Math.random() * 2000
      )

      // 每朵雲獨立的漂移速度
      sprite.userData = {
        speedZ: Math.random() * 0.8 + 0.3,
        driftX: (Math.random() - 0.5) * 0.3,
        driftY: (Math.random() - 0.5) * 0.15,
      }

      scene.add(sprite)
      return sprite
    })

    let animId
    function animate() {
      animId = requestAnimationFrame(animate)

      clouds.forEach(sprite => {
        const { speedZ, driftX, driftY } = sprite.userData
        sprite.position.z += speedZ
        sprite.position.x += driftX
        sprite.position.y += driftY

        // 超過鏡頭後重置到深處
        if (sprite.position.z > 200) {
          sprite.position.set(
            (Math.random() - 0.5) * 2000,
            (Math.random() - 0.5) * 1200,
            -2000
          )
        }
      })

      renderer.render(scene, camera)
    }
    animate()

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', onResize)
      texture.dispose()
      renderer.dispose()
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0, pointerEvents: 'none' }}
    />
  )
}
