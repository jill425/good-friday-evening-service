'use client'
import { useRef } from 'react'

export default function ProgressBar({ barRef }) {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      height: '4px',
      zIndex: 60,
      backgroundColor: 'rgba(196,146,58,0.2)',
    }}>
      <div
        ref={barRef}
        style={{
          height: '100%',
          width: '0%',
          backgroundColor: '#c4923a',
          transformOrigin: 'left',
          transition: 'none',
        }}
      />
    </div>
  )
}
