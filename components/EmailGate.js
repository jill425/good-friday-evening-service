'use client'

import { useState, useEffect } from 'react'

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
function preloadFirstVideo() {
  if (!PRELOAD_FIRST_VIDEO_ON_GATE) return Promise.resolve()

  // 慢網路直接跳過
  if (isSlowNetwork()) {
    window.__skipFirstRound = true
    return Promise.resolve()
  }

  return new Promise((resolve) => {
    const start = Date.now()
    const video = document.createElement('video')
    video.preload = 'auto'
    video.muted = true
    video.playsInline = true
    video.src = FIRST_VIDEO_SRC

    const done = (skip) => {
      if (skip) window.__skipFirstRound = true
      video.removeAttribute('src')
      video.load() // release memory
      resolve()
    }

    // 在前 5 秒內檢查下載進度，若太慢就標記跳過
    const speedCheckTimer = setTimeout(() => {
      const elapsed = (Date.now() - start) / 1000
      if (video.readyState < 3 && elapsed >= 5) {
        done(true) // 5 秒都還沒 ready → 太慢，跳過
      }
    }, 5000)

    video.addEventListener('canplaythrough', () => {
      clearTimeout(speedCheckTimer)
      done(false) // 完整載入成功
    }, { once: true })

    // 總超時保底
    setTimeout(() => {
      clearTimeout(speedCheckTimer)
      done(video.readyState < 3) // 若還沒載完就跳過
    }, PRELOAD_TIMEOUT)
  })
}

export default function EmailGate({ onUnlock }) {
  const isDev = process.env.NODE_ENV === 'development'
  const [hydrated, setHydrated] = useState(false)
  const [isVisible, setIsVisible] = useState(true)
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('idle') // idle, submitting, success, error
  const [message, setMessage] = useState('')

  // Preload audio files — shared promise so it only runs once
  const audioReadyRef = { current: null }
  const ensureAudioPreloaded = () => {
    if (audioReadyRef.current) return audioReadyRef.current
    const files = ['/sorroww.m4a', '/cello-circle.m4a']
    audioReadyRef.current = Promise.all(files.map(src => new Promise((resolve) => {
      const a = new Audio()
      a.preload = 'auto'
      a.addEventListener('canplaythrough', () => resolve(), { once: true })
      a.addEventListener('error', () => resolve(), { once: true })
      a.src = src
      setTimeout(resolve, 8000)
    })))
    return audioReadyRef.current
  }

  useEffect(() => {
    setHydrated(true)
    ensureAudioPreloaded()
  }, [])

  // Also preload on input focus as a fallback
  const handleInputFocus = () => {
    ensureAudioPreloaded()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Dev: skip email validation and API call
    if (isDev) {
      setStatus('success')
      setMessage('（Dev 模式）即將進入...')
      Promise.all([ensureAudioPreloaded(), preloadFirstVideo()]).then(() => {
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
      Promise.all([ensureAudioPreloaded(), preloadFirstVideo()]).then(() => {
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

      // Preload audio + video before entering — wait at least 1.5s for UX
      await Promise.all([
        ensureAudioPreloaded(),
        preloadFirstVideo(),
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
