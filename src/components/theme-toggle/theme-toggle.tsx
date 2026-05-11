'use client'

import { useState, useEffect, useCallback } from 'react'

export function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark' | null>(null)

  useEffect(() => {
    const current = document.documentElement.getAttribute('data-theme')
    setTheme(current === 'dark' ? 'dark' : 'light')
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem('theme')) {
        const next = e.matches ? 'dark' : 'light'
        setTheme(next)
        document.documentElement.setAttribute('data-theme', next)
      }
    }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  const toggle = useCallback(() => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    document.documentElement.setAttribute('data-theme', next)
    localStorage.setItem('theme', next)
    document.documentElement.classList.add('theme-transitioning')
    setTimeout(() => {
      document.documentElement.classList.remove('theme-transitioning')
    }, 400)
  }, [theme])

  if (theme === null) {
    return <div style={{ width: 44, height: 44, position: 'fixed', top: 24, right: 24, zIndex: 40 }} />
  }

  return (
    <button
      onClick={toggle}
      aria-label={theme === 'dark' ? '切换到亮色模式' : '切换到暗色模式'}
      style={{
        position: 'fixed',
        top: 24,
        right: 24,
        zIndex: 40,
        width: 44,
        height: 44,
        borderRadius: 14,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        border: '1px solid var(--apple-border)',
        background: 'var(--apple-card)',
        boxShadow: 'var(--apple-shadow)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        outline: 'none',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.06)'
        e.currentTarget.style.boxShadow = 'var(--apple-shadow-lg)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)'
        e.currentTarget.style.boxShadow = 'var(--apple-shadow)'
      }}
    >
      <div style={{ position: 'relative', width: 22, height: 22 }}>
        {/* Sun icon */}
        <svg
          width="22" height="22" viewBox="0 0 22 22" fill="none"
          style={{
            position: 'absolute', inset: 0,
            color: 'var(--apple-orange)',
            opacity: theme === 'dark' ? 1 : 0,
            transform: theme === 'dark' ? 'rotate(0deg)' : 'rotate(-90deg)',
            transition: 'opacity 0.3s ease, transform 0.4s ease',
          }}
        >
          <circle cx="11" cy="11" r="4.5" fill="currentColor" />
          <g stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <line x1="11" y1="1.5" x2="11" y2="4" />
            <line x1="11" y1="18" x2="11" y2="20.5" />
            <line x1="1.5" y1="11" x2="4" y2="11" />
            <line x1="18" y1="11" x2="20.5" y2="11" />
            <line x1="4.27" y1="4.27" x2="6.04" y2="6.04" />
            <line x1="15.96" y1="15.96" x2="17.73" y2="17.73" />
            <line x1="4.27" y1="17.73" x2="6.04" y2="15.96" />
            <line x1="15.96" y1="6.04" x2="17.73" y2="4.27" />
          </g>
        </svg>
        {/* Moon icon */}
        <svg
          width="22" height="22" viewBox="0 0 22 22" fill="none"
          style={{
            position: 'absolute', inset: 0,
            color: 'var(--apple-blue)',
            opacity: theme === 'light' ? 1 : 0,
            transform: theme === 'light' ? 'rotate(0deg)' : 'rotate(90deg)',
            transition: 'opacity 0.3s ease, transform 0.4s ease',
          }}
        >
          <path
            d="M18.5 12.5C17.5 14 15.7 15 13.5 15C10.2 15 7.5 12.3 7.5 9C7.5 6.8 8.5 5 10 4C6.3 4.5 3.5 7.7 3.5 11.5C3.5 15.6 6.9 19 11 19C14.8 19 17.9 16.2 18.5 12.5Z"
            fill="currentColor"
          />
        </svg>
      </div>
    </button>
  )
}
