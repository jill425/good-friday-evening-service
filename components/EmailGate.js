'use client'

import { useState, useEffect } from 'react'

const GOOGLE_SCRIPT_URL = process.env.NEXT_PUBLIC_GOOGLE_SCRIPT_URL || 'YOUR_GOOGLE_SCRIPT_URL_HERE' // 請在環境變數中設定

export default function EmailGate({ onUnlock }) {
  const isDev = process.env.NODE_ENV === 'development'
  const [isVisible, setIsVisible] = useState(!isDev)
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('idle') // idle, submitting, success, error
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (isDev) {
      if (onUnlock) onUnlock()
    }
  }, [isDev, onUnlock])

  const handleSubmit = async (e) => {
    e.preventDefault()

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
      setTimeout(() => {
        setIsVisible(false)
        if (onUnlock) onUnlock()
      }, 500)
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

      // Wait a moment before closing
      setTimeout(() => {
        setIsVisible(false)
        if (onUnlock) onUnlock()
      }, 1500)

    } catch (error) {
      console.error('Form submission error:', error)
      setStatus('error')
      setMessage('發生錯誤，請稍後再試。')
    }
  }

  if (!isVisible) return null

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
          style={{ width: '100%', maxWidth: '320px', marginBottom: '1.5rem', filter: 'invert(1)' }}
        />
        <p style={{ marginBottom: '2rem', color: '#888' }}>
          請輸入您的 Email
          <br />
          與我們一同預備心，走進受難的旅程。
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Hidden input for Netlify bot field if needed, generally handled by build step via the static form, 
              but good to have consistent naming */}
          <input type="hidden" name="form-name" value="email-gate" />

          <input
            type="email"
            name="email"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
          您的 Email 僅用於本次受難復活活動，
          <br />
          我們重視您的隱私，不會用於其他用途。
        </p>
      </div>
    </div>
  )
}
