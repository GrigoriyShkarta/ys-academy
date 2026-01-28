'use client'

import { useEffect, useState } from 'react'

export default function BoardLayout() {
  const [Excalidraw, setExcalidraw] = useState<any>(null)

  // Dynamic import of Excalidraw (it doesn't support SSR)
  useEffect(() => {
    import('@excalidraw/excalidraw').then((module) => {
      setExcalidraw(() => module.Excalidraw)
    })
  }, [])

  if (!Excalidraw) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gray-100">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-600">Завантаження дошки...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-screen">
      <Excalidraw
        langCode="uk-UA"
        theme="light"
        initialData={{
          appState: {
            viewBackgroundColor: '#ffffff',
          },
        }}
      />
    </div>
  )
}