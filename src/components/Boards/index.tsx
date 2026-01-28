'use client'

import { useEffect, useState, useRef } from 'react'
import { useTheme } from 'next-themes'
import '@excalidraw/excalidraw/index.css'
import ChoosePhotoModal from '@/common/MaterialsCommon/ChoosePhotoModal'
import ChooseVideoModal from '@/common/MaterialsCommon/ChooseVideoModal'
import ChooseAudioModal from '@/common/MaterialsCommon/ChooseAudioModal'
import { LessonItemType } from '@/components/Materials/utils/interfaces'
import { Image, Video, Music, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export default function BoardLayout() {
  const [ExcalidrawComponent, setExcalidrawComponent] = useState<React.ComponentType<any> | null>(null)
  const [excalidrawAPI, setExcalidrawAPI] = useState<any>(null)
  const { theme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false)
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false)
  const [isAudioModalOpen, setIsAudioModalOpen] = useState(false)

  const handleAdd = async (type: LessonItemType, content?: string | File, bankId?: number) => {
    if (!excalidrawAPI || !content || typeof content !== 'string') return

    const generateId = () => Math.random().toString(36).substr(2, 9)
    const appState = excalidrawAPI.getAppState()
    
    // Common properties for all elements to avoid undefined checks in Excalidraw
    const commonProps = {
      strokeColor: 'transparent',
      backgroundColor: 'transparent',
      fillStyle: 'hachure',
      strokeWidth: 1,
      strokeStyle: 'solid',
      roughness: 1,
      opacity: 100,
      angle: 0,
      seed: Math.floor(Math.random() * 2 ** 31),
      version: 1,
      versionNonce: Math.floor(Math.random() * 2 ** 31),
      groupIds: [],
      frameId: null,
      boundElements: null,
      updated: Date.now(),
      link: null,
      locked: false,
    }

    if (type === 'image') {
      try {
        const response = await fetch(content)
        const blob = await response.blob()

        const reader = new FileReader()
        reader.readAsDataURL(blob)
        reader.onloadend = () => {
          const base64data = reader.result as string
          const fileId = bankId ? `bank-${bankId}` : `img-${generateId()}`

          excalidrawAPI.addFiles([
            {
              id: fileId,
              dataURL: base64data,
              mimeType: blob.type,
              created: Date.now(),
            },
          ])

          excalidrawAPI.updateScene({
            elements: [
              ...excalidrawAPI.getSceneElements(),
              {
                ...commonProps,
                id: generateId(),
                type: 'image',
                fileId: fileId,
                status: 'saved',
                x: -appState.scrollX + (window.innerWidth / 2) - 150,
                y: -appState.scrollY + (window.innerHeight / 2) - 150,
                width: 300,
                height: 300,
              },
            ],
          })
        }
      } catch (error) {
        console.error('Failed to add image to board', error)
      }
    } else if (type === 'video') {
      excalidrawAPI.updateScene({
        elements: [
          ...excalidrawAPI.getSceneElements(),
          {
            ...commonProps,
            id: generateId(),
            type: 'embeddable',
            link: content,
            customData: { type: 'video' },
            x: -appState.scrollX + (window.innerWidth / 2) - 300,
            y: -appState.scrollY + (window.innerHeight / 2) - 225,
            width: 600,
            height: 450,
          },
        ],
      })
    } else if (type === 'audio') {
      excalidrawAPI.updateScene({
        elements: [
          ...excalidrawAPI.getSceneElements(),
          {
            ...commonProps,
            id: generateId(),
            type: 'embeddable',
            link: content,
            customData: { type: 'audio' },
            x: -appState.scrollX + (window.innerWidth / 2) - 250,
            y: -appState.scrollY + (window.innerHeight / 2) - 40,
            width: 500,
            height: 80,
          },
        ],
      })
    }
  }

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
        excalidrawAPI={(api: any) => setExcalidrawAPI(api)}
        renderEmbeddable={(element: any) => {
          if (element.type === 'embeddable' && element.customData) {
            if (element.customData.type === 'audio') {
              return (
                <div style={{ 
                  width: '100%', 
                  height: '100%', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  background: 'transparent',
                  padding: '10px'
                }}>
                  <audio 
                    controls 
                    src={element.link} 
                    style={{ width: '100%' }}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              )
            }
            if (element.customData.type === 'video') {
              return (
                <div style={{ 
                  width: '100%', 
                  height: '100%', 
                  background: '#000',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center' 
                }}>
                  <video 
                    controls 
                    playsInline 
                    src={element.link} 
                    style={{ width: '100%', maxHeight: '100%' }}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              )
            }
          }
          return null
        }}
        renderTopRightUI={() => (
          <div style={{ display: 'flex', gap: '8px', marginRight: '8px' }}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon" variant="outline" className="rounded-full shadow-md bg-white dark:bg-zinc-800">
                  <Plus className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setIsPhotoModalOpen(true)}>
                  <Image className="mr-2 h-4 w-4" />
                  <span>Фото</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsVideoModalOpen(true)}>
                  <Video className="mr-2 h-4 w-4" />
                  <span>Відео</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsAudioModalOpen(true)}>
                  <Music className="mr-2 h-4 w-4" />
                  <span>Аудіо</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      />

      <ChoosePhotoModal
        open={isPhotoModalOpen}
        closeModal={() => setIsPhotoModalOpen(false)}
        handleAdd={handleAdd}
      />
      <ChooseVideoModal
        open={isVideoModalOpen}
        closeModal={() => setIsVideoModalOpen(false)}
        handleAdd={handleAdd}
      />
      <ChooseAudioModal
        open={isAudioModalOpen}
        closeModal={() => setIsAudioModalOpen(false)}
        handleAdd={handleAdd}
      />
    </div>
  )
}