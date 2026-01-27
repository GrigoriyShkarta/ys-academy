import { useEffect, useState, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import { Editor } from 'tldraw'

// Кэш сокетов вне компонента
const socketInstances: Record<string, Socket> = {}

export function getSocket(roomId: string, userId: string) {
  const key = `${roomId}-${userId}`
  if (!socketInstances[key]) {
    console.log(`[Socket] Creating new instance for room: ${roomId}, user: ${userId}`)
    socketInstances[key] = io(`${process.env.NEXT_PUBLIC_API_URL}/board-sync`, {
      query: { roomId, userId },
      transports: ['polling', 'websocket'],
      reconnection: true,
      reconnectionAttempts: 10,
    })
  }
  return socketInstances[key]
}

interface UseBoardSyncOptions {
  editor: Editor | null
  roomId: string
  userId: string
  userName?: string
}

export function useBoardSync({
  editor,
  roomId,
  userId,
  userName,
}: UseBoardSyncOptions) {
  const [socket, setSocket] = useState<Socket | null>(null)
  const isApplyingRemoteChange = useRef(false)

  // 1. Создаем или получаем сокет
  useEffect(() => {
    if (!roomId || !userId) {
      console.warn('[useBoardSync] roomId or userId is missing', { roomId, userId })
      return
    }
    const s = getSocket(roomId, userId)
    setSocket(s)
  }, [roomId, userId])

  // 2. Основная логика синхронизации
  useEffect(() => {
    if (!editor) {
      console.log('[useBoardSync] Waiting for editor...')
      return
    }
    if (!socket) {
      console.log('[useBoardSync] Waiting for socket...')
      return
    }

    console.log('[useBoardSync] Initializing synchronization hooks...')

    const handleApplyRecords = (records: any[]) => {
      if (!records.length) return
      console.log(`[Socket] Received records: ${records.length}`)
      
      const valid = records.filter((r) => r?.id && r?.typeName)
      isApplyingRemoteChange.current = true
      try {
        editor.store.mergeRemoteChanges(() => {
          valid.forEach((r) => editor.store.put([r]))
        })
      } catch (err) {
        console.error('[useBoardSync] Error applying remote change:', err)
      } finally {
        isApplyingRemoteChange.current = false
      }
    }

    const handleDeleteRecords = (ids: string[]) => {
      console.log(`[Socket] Received delete for: ${ids.length} items`)
      isApplyingRemoteChange.current = true
      try {
        editor.store.mergeRemoteChanges(() => {
          ids.forEach((id) => editor.store.remove([id as any]))
        })
      } catch (err) {
        console.error('[useBoardSync] Error deleting remote records:', err)
      } finally {
        isApplyingRemoteChange.current = false
      }
    }

    const handleCursor = (data: any) => {
      if (data.userId === userId) return
      const presence = {
        id: `instance_presence:remote-${data.userId}`,
        typeName: 'instance_presence',
        userId: data.userId,
        userName: data.userName || `User ${data.userId}`,
        cursor: data.cursor,
        color: data.color,
        currentPageId: editor.getCurrentPageId(),
        lastActivityTimestamp: Date.now(),
      }
      isApplyingRemoteChange.current = true
      try {
        editor.store.mergeRemoteChanges(() => {
          editor.store.put([presence as any])
        })
      } catch (err) {
        console.error('[useBoardSync] Error updating remote cursor:', err)
      } finally {
        isApplyingRemoteChange.current = false
      }
    }

    // Обработка системных событий сокета
    const onConnect = () => {
      console.log('✅ [Socket] Connected. ID:', socket.id)
      console.log(`[Socket] Requesting board data for room: ${roomId}`)
      socket.emit('get-board', { roomId })
    }

    const onDisconnect = (reason: string) => {
      console.warn('⚠️ [Socket] Disconnected. Reason:', reason)
    }

    const onConnectError = (error: Error) => {
      console.error('❌ [Socket] Connection error:', error.message)
    }

    // Регистрируем все события
    socket.on('connect', onConnect)
    socket.on('disconnect', onDisconnect)
    socket.on('connect_error', onConnectError)
    socket.on('init', handleApplyRecords)
    socket.on('update', handleApplyRecords)
    socket.on('delete', handleDeleteRecords)
    socket.on('cursor', handleCursor)

    // Если сокет уже в сети на момент подписки
    if (socket.connected) {
      console.log('[Socket] Already connected, triggering initial data fetch')
      onConnect()
    } else {
      console.log('[Socket] Socket is not connected yet, waiting for connect event...')
    }

    // Отправка локальных изменений
    const unsubscribeStore = editor.store.listen(
      (changes) => {
        if (isApplyingRemoteChange.current) return
        if (!socket.connected) {
          console.warn('[Socket] Attempted to send changes while disconnected')
          return
        }

        const added = Object.values(changes.changes.added)
        const updated = Object.values(changes.changes.updated)
        const removed = Object.keys(changes.changes.removed)

        if (added.length || updated.length) {
          console.log(`[Socket] Sending update: ${added.length + updated.length} items`)
          socket.emit('update', [...added, ...updated])
        }
        if (removed.length) {
          console.log(`[Socket] Sending delete: ${removed.length} items`)
          socket.emit('delete', removed)
        }
      },
      { scope: 'document', source: 'user' }
    )

    // Отправка курсора
    let lastCursorEmit = 0
    const handlePointerMove = (e: any) => {
      if (e.type === 'pointer' && e.name === 'pointer_move') {
        const now = Date.now()
        if (now - lastCursorEmit < 50 || !socket.connected) return
        lastCursorEmit = now
        const p = editor.inputs.currentPagePoint
        socket.emit('cursor', {
          userId,
          userName,
          cursor: { x: p.x, y: p.y, type: 'default', rotation: 0 },
        })
      }
    }
    
    editor.on('event', handlePointerMove)

    return () => {
      console.log('[useBoardSync] Cleaning up synchronization...')
      socket.off('connect', onConnect)
      socket.off('disconnect', onDisconnect)
      socket.off('connect_error', onConnectError)
      socket.off('init', handleApplyRecords)
      socket.off('update', handleApplyRecords)
      socket.off('delete', handleDeleteRecords)
      socket.off('cursor', handleCursor)
      unsubscribeStore()
      editor.off('event', handlePointerMove)
    }
  }, [editor, socket, roomId, userId, userName])

  return {}
}