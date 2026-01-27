import { useEffect, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import { Editor } from 'tldraw'

// Храним инстансы сокетов вне компонента, но привязанные к roomId
const socketInstances: Record<string, Socket> = {}

export function getSocket(roomId: string, userId: string) {
  const key = `${roomId}-${userId}`
  
  if (!socketInstances[key] || !socketInstances[key].connected) {
    // Если сокета нет или он закрыт — создаем новый
    socketInstances[key] = io(`${process.env.NEXT_PUBLIC_API_URL}/board-sync`, {
      query: { roomId, userId },
      transports: ['polling', 'websocket'], // Позволяем fallback на polling для стабильности
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
  const socketRef = useRef<Socket | null>(null)
  const isApplyingRemoteChange = useRef(false)

  // 1. Инициализация сокета и обработка подключения
  useEffect(() => {
    if (!roomId || !userId) return

    const socket = getSocket(roomId, userId)
    socketRef.current = socket // КРИТИЧЕСКИ ВАЖНО: сохраняем в Ref

    const onConnect = () => {
      console.log('✅ Socket connected:', socket.id)
      socket.emit('get-board', { roomId })
    }

    const onDisconnect = (reason: string) => {
      console.warn('⚠️ Socket disconnected:', reason)
    }

    const onConnectError = (err: Error) => {
      console.error('❌ Socket connect error:', err.message)
    }

    socket.on('connect', onConnect)
    socket.on('disconnect', onDisconnect)
    socket.on('connect_error', onConnectError)

    // Если сокет уже подключен (из-за синглтона), вызываем init вручную
    if (socket.connected) onConnect()

    return () => {
      socket.off('connect', onConnect)
      socket.off('disconnect', onDisconnect)
      socket.off('connect_error', onConnectError)
    }
  }, [roomId, userId])

  // 2. Прием данных (висит, пока есть editor и socketRef)
  useEffect(() => {
    const socket = socketRef.current
    if (!editor || !socket) return

    const applyRecords = (records: any[]) => {
      if (!records.length) return
      const valid = records.filter((r) => r?.id && r?.typeName)

      isApplyingRemoteChange.current = true
      try {
        editor.store.mergeRemoteChanges(() => {
          valid.forEach((r) => editor.store.put([r]))
        })
      } finally {
        isApplyingRemoteChange.current = false
      }
    }

    socket.on('init', applyRecords)
    socket.on('update', applyRecords)
    socket.on('delete', (ids: string[]) => {
      isApplyingRemoteChange.current = true
      try {
        editor.store.mergeRemoteChanges(() => {
          ids.forEach((id) => editor.store.remove([id as any]))
        })
      } finally {
        isApplyingRemoteChange.current = false
      }
    })

    socket.on('cursor', (data) => {
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
      } finally {
        isApplyingRemoteChange.current = false
      }
    })

    return () => {
      socket.off('init', applyRecords)
      socket.off('update', applyRecords)
      socket.off('delete')
      socket.off('cursor')
    }
  }, [editor, roomId]) // Добавил roomId в зависимости

  // 3. Отправка изменений
  useEffect(() => {
    const socket = socketRef.current
    if (!editor || !socket) return

    const unsubscribe = editor.store.listen(
      (changes) => {
        if (isApplyingRemoteChange.current) return
        if (!socket.connected) return

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

    return unsubscribe
  }, [editor, roomId])

  // 4. Курсор
  useEffect(() => {
    const socket = socketRef.current
    if (!editor || !socket) return

    let last = 0
    const handlePointer = () => {
      const now = Date.now()
      if (now - last < 50) return
      last = now
      if (!socket.connected) return

      const p = editor.inputs.currentPagePoint
      socket.emit('cursor', {
        userId,
        userName,
        cursor: { x: p.x, y: p.y, type: 'default', rotation: 0 },
      })
    }

    const handleEvent = (e: any) => {
      if (e.type === 'pointer' && e.name === 'pointer_move') {
        handlePointer()
      }
    }

    editor.on('event', handleEvent)

    return () => {
      editor.off('event', handleEvent)
    }
  }, [editor, userId, userName, roomId])

  return {}
}