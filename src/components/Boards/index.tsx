'use client'

import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import '@excalidraw/excalidraw/index.css'

export default function BoardLayout() {
  const [ExcalidrawComponent, setExcalidrawComponent] = useState<React.ComponentType<any> | null>(null)
  const { theme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Wait for theme to be resolved on client
  useEffect(() => {
    setMounted(true)
  }, [])

  // Dynamic import of Excalidraw (it doesn't support SSR)
  useEffect(() => {
    import('@excalidraw/excalidraw').then((module) => {
      setExcalidrawComponent(() => module.Excalidraw)
    })
  }, [])

  // Determine the actual theme (resolvedTheme handles 'system' preference)
  const currentTheme = resolvedTheme || theme || 'light'
  const isDark = currentTheme === 'dark'
  
  // Background colors based on theme
  const backgroundColor = isDark ? '#1e1e1e' : '#ffffff'

  if (!ExcalidrawComponent || !mounted) {
    return (
      <div 
        style={{
          width: '100%',
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: isDark ? '#121212' : '#f5f5f5',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div 
            style={{
              width: 48,
              height: 48,
              border: '4px solid #3b82f6',
              borderTopColor: 'transparent',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 16px',
            }}
          />
          <p style={{ color: isDark ? '#aaa' : '#666' }}>Завантаження дошки...</p>
        </div>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    )
  }

  return (
    <div 
      style={{
        width: '100%',
        height: '100vh',
        position: 'relative',
      }}
    >
      <ExcalidrawComponent
        langCode="uk-UA"
        theme={isDark ? 'dark' : 'light'}
        initialData={{
          appState: {
            viewBackgroundColor: backgroundColor,
          },
        }}
      />
    </div>
  )
}