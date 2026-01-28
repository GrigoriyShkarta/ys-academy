'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'
import type { ExcalidrawElement } from '@excalidraw/excalidraw/types/element/types'
import type { Collaborator } from '@excalidraw/excalidraw/types/types'

interface UseBoardSyncOptions {
  roomId: string
  userId: string
  userName?: string
}

interface RemotePointer {
  odiserId: string
  odiserName: string
  pointer: { x: number; y: number }
  button: 'up' | 'down'
  selectedElementIds: Record<string, boolean>
  username: string
}

// Generate a consistent color from a user ID
function getUserColor(userId: string): string {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
    '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
    '#BB8FCE', '#85C1E9', '#F8B500', '#00CED1',
  ]
  
  let hash = 0
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash)
  }
  
  return colors[Math.abs(hash) % colors.length]
}

export function useBoardSync({
  roomId,
  odiserId,
  userName = 'Anonymous',
}: UseBoardSyncOptions) {
  const socketRef = useRef<Socket | null>(null)
  const isApplyingRemoteChange = useRef(false)
  const lastCursorEmit = useRef(0)
  const lastElementsHash = useRef<string>('')
  
  const [collaborators, setCollaborators] = useState<Map<string, Collaborator>>(new Map())
  const [initialElements, setInitialElements] = useState<ExcalidrawElement[] | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  // Callback to send element updates
  const sendElementsUpdate = useCallback((elements: readonly ExcalidrawElement[]) => {
    const socket = socketRef.current
    if (!socket?.connected || isApplyingRemoteChange.current) return

    // Create a simple hash to avoid sending duplicate updates
    const hash = JSON.stringify(elements.map(e => ({ id: e.id, version: e.version })))
    if (hash === lastElementsHash.current) return
    lastElementsHash.current = hash

    socket.emit('update', elements)
  }, [])

  // Callback to send cursor position
  const sendCursorPosition = useCallback((pointer: { x: number; y: number }, button: 'up' | 'down') => {
    const socket = socketRef.current
    if (!socket?.connected) return

    // Throttle cursor updates to max 20 per second
    const now = Date.now()
    if (now - lastCursorEmit.current < 50) return
    lastCursorEmit.current = now

    socket.emit('cursor', {
      odiserId,
      userName,
      pointer,
      button,
    })
  }, [odiserId, userName])

  // Handle incoming element updates
  const handleRemoteElements = useCallback((elements: ExcalidrawElement[]) => {
    isApplyingRemoteChange.current = true
    // Will be handled by the component
    setTimeout(() => {
      isApplyingRemoteChange.current = false
    }, 100)
    return elements
  }, [])

  useEffect(() => {
    if (!roomId || !odiserId) return

    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
    
    console.log('[useBoardSync] Connecting to', baseUrl)

    const socket = io(baseUrl, {
      transports: ['websocket', 'polling'],
      query: { roomId, odiserId, userName },
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    })
    
    socketRef.current = socket

    // === CONNECTION ===
    socket.on('connect', () => {
      console.log('✅ Board Sync connected:', socket.id)
      setIsConnected(true)
      // Request initial board state from server
      socket.emit('get-board', { roomId })
    })

    socket.on('disconnect', (reason) => {
      console.warn('⚠️ Board Sync disconnected:', reason)
      setIsConnected(false)
    })

    socket.on('connect_error', (error) => {
      console.error('❌ Connection error:', error.message)
      setIsConnected(false)
    })

    // === INITIAL DATA ===
    socket.on('init', (data: { elements: ExcalidrawElement[] }) => {
      console.log('[useBoardSync] Received init with', data.elements?.length || 0, 'elements')
      if (data.elements) {
        setInitialElements(data.elements)
      }
    })

    // === REMOTE UPDATES ===
    socket.on('update', (elements: ExcalidrawElement[]) => {
      console.log('[useBoardSync] Received update with', elements?.length || 0, 'elements')
      // This will be handled by the component through onRemoteUpdate callback
      window.dispatchEvent(new CustomEvent('excalidraw-remote-update', { 
        detail: { elements } 
      }))
    })

    // === CURSORS / COLLABORATORS ===
    socket.on('cursor', (data: RemotePointer) => {
      if (data.odiserId === odiserId) return // Ignore own cursor
      
      setCollaborators((prev) => {
        const next = new Map(prev)
        next.set(data.odiserId, {
          pointer: data.pointer,
          button: data.button,
          selectedElementIds: data.selectedElementIds || {},
          username: data.odiserName || data.username || 'Anonymous',
          color: { background: getUserColor(data.odiserId), stroke: getUserColor(data.odiserId) },
        })
        return next
      })
    })

    // Remove collaborator when user disconnects
    socket.on('user-left', (leftUserId: string) => {
      setCollaborators((prev) => {
        const next = new Map(prev)
        next.delete(leftUserId)
        return next
      })
    })

    // === CLEANUP ===
    return () => {
      console.log('[useBoardSync] Disconnecting...')
      
      socket.off('connect')
      socket.off('disconnect')
      socket.off('connect_error')
      socket.off('init')
      socket.off('update')
      socket.off('cursor')
      socket.off('user-left')
      
      socket.disconnect()
      socketRef.current = null
    }
  }, [roomId, odiserId, userName])

  return {
    collaborators,
    initialElements,
    isConnected,
    sendElementsUpdate,
    sendCursorPosition,
    isApplyingRemoteChange,
  }
}
