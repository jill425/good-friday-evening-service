'use client'

import { useState, useEffect } from 'react'
import { Slides } from '../data/slides'

const GOOGLE_SCRIPT_URL = process.env.NEXT_PUBLIC_GOOGLE_SCRIPT_URL || 'YOUR_GOOGLE_SCRIPT_URL_HERE' // 請在環境變數中設定

// ── 影片預載設定 ──
const PRELOAD_FIRST_VIDEO_ON_GATE = true              // true = email 送出後就開始下載 first_round，完成後才進入
const FIRST_VIDEO_SRC = '/final_video_first_round.mp4'
const PRELOAD_TIMEOUT = 15000                          // 最久等 15 秒，超時則跳過 first_round
const SLOW_NET_SKIP = true                             // true = 偵測到慢網路直接跳過 first_round

/** 偵測是否為慢網路（2G / slow-3G / saveData） */
function isSlowNetwork() {
  if (!SLOW_NET_SKIP) return false
  const conn = navigator?.connection || navigator?.mozConnection || navigator?.webkitConnection
  if (!conn) return false
  if (conn.saveData) return true
  const ect = conn.effectiveType
  if (ect === 'slow-2g' || ect === '2g') return true
  return false
}

/** 預載 first_round 影片，回傳 promise。若太慢或超時，設 skip flag */
let _videoPreloadPromise = null
function preloadFirstVideo() {
  if (_videoPreloadPromise) return _videoPreloadPromise
  if (!PRELOAD_FIRST_VIDEO_ON_GATE) return Promise.resolve()

  // 慢網路直接跳過
  if (isSlowNetwork()) {
    window.__skipFirstRound = true
    return Promise.resolve()
  }

  _videoPreloadPromise = new Promise((resolve) => {
    let settled = false
    const done = (skip) => {
      if (settled) return
      settled = true
      if (skip) window.__skipFirstRound = true
      resolve()
    }

    // 下載影片 blob 並存成 Object URL，讓 <video> 直接從記憶體讀
    fetch(FIRST_VIDEO_SRC)
      .then(res => {
        if (!res.ok) { done(true); return }
        return res.blob()
      })
      .then(blob => {
        if (blob) {
          window.__firstVideoBlobURL = URL.createObjectURL(blob)
        }
        done(false)
      })
      .catch(() => done(true))

    // 總超時保底
    setTimeout(() => done(true), PRELOAD_TIMEOUT)
  })
  return _videoPreloadPromise
}

/** 預載音檔 — module level singleton，不會重複下載 */
let _audioPreloadPromise = null
function _ensureAudioPreloaded() {
  if (_audioPreloadPromise) return _audioPreloadPromise
  _audioPreloadPromise = Promise.all([
    // sorroww.m4a → blob URL（保證記憶體裡有）
    fetch('/sorroww.m4a')
      .then(r => r.ok ? r.blob() : null)
      .then(blob => { if (blob) window.__sorrowBlobURL = URL.createObjectURL(blob) })
      .catch(() => {}),
    // cello-circle.m4a → 只暖 HTTP cache（BackgroundMusic 用 DOM <audio>）
    fetch('/cello-circle.m4a').then(r => r.blob()).catch(() => {}),
  ])
  // 保底 8 秒
  _audioPreloadPromise = Promise.race([
    _audioPreloadPromise,
    new Promise(r => setTimeout(r, 8000)),
  ])
  return _audioPreloadPromise
}

/** 預載所有 slide 圖片 + final.webp — 呼叫多次安全 */
let _imagePreloadPromise = null
function preloadSlideImages() {
  if (_imagePreloadPromise) return _imagePreloadPromise
  const srcs = [
    ...Slides.filter(s => s.type === 'image').map(s => `/images/${s.src}.webp`),
    '/images/final.webp',
  ]
  _imagePreloadPromise = Promise.all(
    srcs.map(src => new Promise((resolve) => {
      const img = new Image()
      img.onload = resolve
      img.onerror = resolve
      img.src = src
    }))
  )
  // 保底 12 秒（14 張圖共 ~1.75MB）
  _imagePreloadPromise = Promise.race([
    _imagePreloadPromise,
    new Promise(r => setTimeout(r, 12000)),
  ])
  return _imagePreloadPromise
}

/** 等字型載入完成（保底 5 秒） */
function waitForFonts() {
  return Promise.race([
    document.fonts.ready,
    new Promise(r => setTimeout(r, 5000)),
  ])
}

export default function EmailGate({ onUnlock }) {
  const isDev = process.env.NODE_ENV === 'development'
  const [hydrated, setHydrated] = useState(false)
  const [isVisible, setIsVisible] = useState(true)
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('idle') // idle, submitting, success, error
  const [message, setMessage] = useState('')

  const ensureAudioPreloaded = _ensureAudioPreloaded

  useEffect(() => {
    setHydrated(true)
    ensureAudioPreloaded()
    // 網頁 init 就開始預載影片和所有 slide 圖
    preloadFirstVideo()
    preloadSlideImages()
  }, [])

  // 點擊 email 輸入框時再次確認預載啟動
  const handleInputFocus = () => {
    ensureAudioPreloaded()
    preloadFirstVideo()
    preloadSlideImages()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Dev: skip email validation and API call
    if (isDev) {
      setStatus('success')
      setMessage('（Dev 模式）即將進入...')
      Promise.all([ensureAudioPreloaded(), preloadFirstVideo(), preloadSlideImages(), waitForFonts()]).then(() => {
        setIsVisible(false)
        if (onUnlock) onUnlock()
      })
      return
    }

    if (!email || !email.includes('@')) {
      setMessage('請輸入有效的 Email')
      return
    }

    if (!GOOGLE_SCRIPT_URL || GOOGLE_SCRIPT_URL === 'YOUR_GOOGLE_SCRIPT_URL_HERE') {
      console.warn('Google Sheet URL 未設定，將進行模擬提交')
      // 如果未設定，為避免卡住，先允許通過但 Console 會提示
      setStatus('success')
      setMessage('感謝您的參與！')
      localStorage.setItem('email_gate_unlocked', 'true')
      Promise.all([ensureAudioPreloaded(), preloadFirstVideo(), preloadSlideImages(), waitForFonts()]).then(() => {
        setIsVisible(false)
        if (onUnlock) onUnlock()
      })
      return
    }

    setStatus('submitting')

    try {
      // 建立 FormData 物件
      const formData = new FormData();
      formData.append('Email', email);

      // 發送至 Google Sheet
      await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        body: formData,
        mode: "no-cors" // Google Script 跨域需要 no-cors，雖然無法讀取回傳值，但可確保發送成功
      })

      setStatus('success')
      setMessage('感謝您的參與！')
      localStorage.setItem('email_gate_unlocked', 'true')

      // Preload audio + video + image before entering — wait at least 1.5s for UX
      await Promise.all([
        ensureAudioPreloaded(),
        preloadFirstVideo(),
        preloadSlideImages(),
        waitForFonts(),
        new Promise(r => setTimeout(r, 1500)),
      ])

      setIsVisible(false)
      if (onUnlock) onUnlock()

    } catch (error) {
      console.error('Form submission error:', error)
      setStatus('error')
      setMessage('發生錯誤，請稍後再試。')
    }
  }

  if (!isVisible) return null

  if (!hydrated) return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: '#000',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '1.2rem',
      color: 'rgba(255,255,255,0.5)',
      fontFamily: 'sans-serif',
      fontSize: '0.85rem',
      letterSpacing: '0.2em',
    }}>
      <div style={{
        width: '28px',
        height: '28px',
        border: '2px solid rgba(255,255,255,0.15)',
        borderTop: '2px solid rgba(255,255,255,0.7)',
        borderRadius: '50%',
        animation: 'spin 0.9s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      載入中
    </div>
  )

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: '#000',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#fff',
      fontFamily: 'sans-serif'
    }}>
      <div style={{
        maxWidth: '400px',
        width: '90%',
        textAlign: 'center',
        padding: '2rem',
        border: '1px solid #333',
        borderRadius: '8px',
        background: '#111'
      }}>
        <img
          src="/under_crown_title.png"
          alt="Under The Crown 冠冕之下"
          loading="lazy"
          style={{ width: '100%', maxWidth: '320px', marginBottom: '1.5rem', filter: 'invert(1)' }}
        />
        <p style={{ marginBottom: '2rem', color: '#888' }}>
          邀請您輸入 Email 一起延續今晚的感動
        </p>

        <form onSubmit={handleSubmit} method="post" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Hidden input for Netlify bot field if needed, generally handled by build step via the static form, 
              but good to have consistent naming */}
          <input type="hidden" name="form-name" value="email-gate" />

          <input
            type="email"
            name="email"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onFocus={handleInputFocus}
            disabled={status === 'submitting' || status === 'success'}
            style={{
              padding: '12px',
              borderRadius: '4px',
              border: '1px solid #444',
              background: '#222',
              color: '#fff',
              fontSize: '1rem',
              outline: 'none'
            }}
          />

          <button
            type="submit"
            disabled={status === 'submitting' || status === 'success'}
            style={{
              padding: '12px',
              borderRadius: '4px',
              border: 'none',
              background: status === 'success' ? '#4CAF50' : '#fff',
              color: status === 'success' ? '#fff' : '#000',
              fontSize: '1rem',
              fontWeight: 'bold',
              cursor: status === 'submitting' ? 'wait' : 'pointer',
              transition: 'background 0.3s'
            }}
          >
            {status === 'submitting' ? '處理中...' : status === 'success' ? '成功！即將進入...' : '進入網站'}
          </button>
        </form>

        {message && (
          <p style={{
            marginTop: '1rem',
            fontSize: '0.9rem',
            color: status === 'error' ? '#ff4d4d' : status === 'success' ? '#4CAF50' : '#ccc'
          }}>
            {message}
          </p>
        )}

        <p style={{
          marginTop: '1.5rem',
          paddingTop: '1.2rem',
          borderTop: '1px solid #222',
          fontSize: '0.72rem',
          color: '#444',
          lineHeight: '1.6',
          letterSpacing: '0.03em',
        }}>
          所有 Email 僅用於本次受難復活活動
        </p>
      </div>
    </div>
  )
}
