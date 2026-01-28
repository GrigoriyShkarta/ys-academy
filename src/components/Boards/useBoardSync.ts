'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import { Editor, TLRecord } from 'tldraw'

interface UseBoardSyncOptions {
  editor: Editor | null
  roomId: string
  userId: string
  userName?: string
}

interface RemoteCursor {
  odiserId: string
  userName: string
  x: number
  y: number
  color: string
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
  editor,
  roomId,
  userId,
  userName = 'Anonymous',
}: UseBoardSyncOptions) {
  const socketRef = useRef<Socket | null>(null)
  const isApplyingRemoteChange = useRef(false)
  const lastCursorEmit = useRef(0)
  
  const [remoteCursors, setRemoteCursors] = useState<Map<string, RemoteCursor>>(new Map())

  useEffect(() => {
    if (!editor || !roomId || !userId) return

    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
    
    console.log('[useBoardSync] Connecting to', baseUrl)

    // Connect to default namespace - server should handle board-sync events
    const socket = io(baseUrl, {
      transports: ['websocket', 'polling'],
      query: { roomId, userId, userName },
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    })
    
    socketRef.current = socket

    // === CONNECTION ===
    socket.on('connect', () => {
      console.log('✅ Board Sync connected:', socket.id)
      // Request initial board state from server
      socket.emit('get-board', { roomId })
    })

    socket.on('disconnect', (reason) => {
      console.warn('⚠️ Board Sync disconnected:', reason)
    })

    socket.on('connect_error', (error) => {
      console.error('❌ Connection error:', error.message)
    })

    // === APPLY REMOTE CHANGES ===
    const applyRecords = (records: TLRecord[]) => {
      if (!records?.length) return
      
      console.log('[useBoardSync] Applying', records.length, 'records')
      
      isApplyingRemoteChange.current = true
      try {
        editor.store.mergeRemoteChanges(() => {
          records.forEach((record) => {
            if (record?.id && record?.typeName) {
              editor.store.put([record])
            }
          })
        })
      } finally {
        isApplyingRemoteChange.current = false
      }
    }

    const deleteRecords = (ids: string[]) => {
      if (!ids?.length) return
      
      console.log('[useBoardSync] Deleting', ids.length, 'records')
      
      isApplyingRemoteChange.current = true
      try {
        editor.store.mergeRemoteChanges(() => {
          ids.forEach((id) => {
            try {
              editor.store.remove([id as any])
            } catch (e) {
              // Record may already be deleted
            }
          })
        })
      } finally {
        isApplyingRemoteChange.current = false
      }
    }

    // Initial data from server
    socket.on('init', applyRecords)
    
    // Real-time updates from other users
    socket.on('update', applyRecords)
    
    // Deletions from other users
    socket.on('delete', deleteRecords)

    // === CURSORS ===
    socket.on('cursor', (data: { userId: string; userName: string; x: number; y: number }) => {
      if (data.userId === userId) return // Ignore own cursor
      
      setRemoteCursors((prev) => {
        const next = new Map(prev)
        next.set(data.userId, {
          odiserId: data.userId,
          userName: data.userName || 'Anonymous',
          x: data.x,
          y: data.y,
          color: getUserColor(data.userId),
        })
        return next
      })
    })

    // Remove cursor when user disconnects
    socket.on('user-left', (leftUserId: string) => {
      setRemoteCursors((prev) => {
        const next = new Map(prev)
        next.delete(leftUserId)
        return next
      })
    })

    // === LOCAL CHANGES -> SERVER ===
    const unsubscribe = editor.store.listen(
      (changes) => {
        if (isApplyingRemoteChange.current || !socket.connected) return

        const added = Object.values(changes.changes.added)
        // Get only the NEW version from [old, new] tuple
        const updated = Object.values(changes.changes.updated).map(
          ([_old, curr]) => curr
        )
        const removed = Object.keys(changes.changes.removed)

        if (added.length || updated.length) {
          socket.emit('update', [...added, ...updated])
        }
        
        if (removed.length) {
          socket.emit('delete', removed)
        }
      },
      { scope: 'document', source: 'user' }
    )

    // === POINTER MOVE -> CURSOR BROADCAST ===
    const handleEvent = (info: any) => {
      if (info.name !== 'pointer_move') return
      if (!socket.connected) return

      // Throttle cursor updates to max 20 per second
      const now = Date.now()
      if (now - lastCursorEmit.current < 50) return
      lastCursorEmit.current = now

      const point = editor.inputs.currentPagePoint
      socket.emit('cursor', {
        x: point.x,
        y: point.y,
        userName,
      })
    }

    editor.on('event', handleEvent)

    // === CLEANUP ===
    return () => {
      console.log('[useBoardSync] Disconnecting...')
      
      unsubscribe()
      editor.off('event', handleEvent)
      
      socket.off('connect')
      socket.off('disconnect')
      socket.off('connect_error')
      socket.off('init')
      socket.off('update')
      socket.off('delete')
      socket.off('cursor')
      socket.off('user-left')
      
      socket.disconnect()
      socketRef.current = null
    }
  }, [editor, roomId, userId, userName])

  return { remoteCursors }
}