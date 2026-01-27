import { useEffect, useState, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import { Editor } from 'tldraw'

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
  
  // КРИТИЧЕСЕКИ ВАЖНО: Используем Ref для динамических значений, 
  // чтобы не перезапускать useEffect при их изменении
  const editorRef = useRef<Editor | null>(null)
  const userRef = useRef({ userId, userName })

  // Синхронизируем рефы при каждом рендере
  editorRef.current = editor
  userRef.current = { userId, userName }

  // 1. Получаем сокет (зависит только от roomId/userId)
  useEffect(() => {
    if (!roomId || !userId) return
    const s = getSocket(roomId, userId)
    setSocket(s)
  }, [roomId, userId])

  // 2. Основная логика (теперь НЕ зависит от userName и userId напрямую)
  useEffect(() => {
    if (!editor || !socket) {
      console.log('[useBoardSync] Hook waiting for prerequisites...', { 
        hasEditor: !!editor, 
        hasSocket: !!socket 
      })
      return
    }

    console.log('[useBoardSync] START Sync Effect', { roomId, socketId: socket.id })

    // Отладка: логируем ВООБЩЕ ВСЕ события от сервера
    socket.onAny((event, ...args) => {
      console.log(`[Socket] <<< Incoming Event: ${event}`, args)
    })

    const handleApplyRecords = (records: any[]) => {
      const ed = editorRef.current
      if (!records.length || !ed) return
      
      const valid = records.filter((r) => r?.id && r?.typeName)
      isApplyingRemoteChange.current = true
      try {
        ed.store.mergeRemoteChanges(() => {
          valid.forEach((r) => ed.store.put([r]))
        })
      } catch (err) {
        console.error('[useBoardSync] Apply records error:', err)
      } finally {
        isApplyingRemoteChange.current = false
      }
    }

    const handleDeleteRecords = (ids: string[]) => {
      const ed = editorRef.current
      if (!ed) return
      isApplyingRemoteChange.current = true
      try {
        ed.store.mergeRemoteChanges(() => {
          ids.forEach((id) => ed.store.remove([id as any]))
        })
      } finally {
        isApplyingRemoteChange.current = false
      }
    }

    const handleCursor = (data: any) => {
      const ed = editorRef.current
      if (!ed || data.userId === userRef.current.userId) return
      
      const presence = {
        id: `instance_presence:remote-${data.userId}`,
        typeName: 'instance_presence',
        userId: data.userId,
        userName: data.userName || `User ${data.userId}`,
        cursor: data.cursor,
        color: data.color,
        currentPageId: ed.getCurrentPageId(),
        lastActivityTimestamp: Date.now(),
      }
      isApplyingRemoteChange.current = true
      try {
        ed.store.mergeRemoteChanges(() => {
          ed.store.put([presence as any])
        })
      } finally {
        isApplyingRemoteChange.current = false
      }
    }

    const onConnect = () => {
      console.log('✅ [Socket] Connected. Requesting board data...')
      socket.emit('get-board', { roomId })
    }

    const onDisconnect = (reason: string) => {
      console.warn('⚠️ [Socket] Disconnected. Reason:', reason)
    }

    socket.on('connect', onConnect)
    socket.on('disconnect', onDisconnect)
    socket.on('init', handleApplyRecords)
    socket.on('update', handleApplyRecords)
    socket.on('delete', handleDeleteRecords)
    socket.on('cursor', handleCursor)

    if (socket.connected) {
      onConnect()
    }

    // Слушаем изменения в сторе tldraw
    const unsubscribeStore = editor.store.listen(
      (changes) => {
        if (isApplyingRemoteChange.current || !socket.connected) return

        const added = Object.values(changes.changes.added)
        const updated = Object.values(changes.changes.updated)
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

    // Курсор
    let lastCursorEmit = 0
    const handleEvent = (e: any) => {
      if (e.type === 'pointer' && e.name === 'pointer_move') {
        const now = Date.now()
        if (now - lastCursorEmit < 50 || !socket.connected) return
        lastCursorEmit = now
        const p = editor.inputs.currentPagePoint
        socket.emit('cursor', {
          userId: userRef.current.userId,
          userName: userRef.current.userName,
          cursor: { x: p.x, y: p.y, type: 'default', rotation: 0 },
        })
      }
    }
    editor.on('event', handleEvent)

    return () => {
      console.log('[useBoardSync] CLEANUP Sync Effect', { roomId })
      socket.offAny() // убираем глобальный слушатель
      socket.off('connect', onConnect)
      socket.off('disconnect', onDisconnect)
      socket.off('init', handleApplyRecords)
      socket.off('update', handleApplyRecords)
      socket.off('delete', handleDeleteRecords)
      socket.off('cursor', handleCursor)
      unsubscribeStore()
      editor.off('event', handleEvent)
    }
    // Зависимости сокращены до минимума
  }, [editor, socket, roomId])

  return {}
}