import { useEffect, useState, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import { Editor } from 'tldraw'

// Кэш сокетов вне компонента
const socketInstances: Record<string, Socket> = {}

export function getSocket(roomId: string, userId: string) {
  const key = `${roomId}-${userId}`
  if (!socketInstances[key]) {
    socketInstances[key] = io(`${process.env.NEXT_PUBLIC_API_URL}/board-sync`, {
      query: { roomId, userId },
      transports: ['polling', 'websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
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
    if (!roomId || !userId) return
    const s = getSocket(roomId, userId)
    setSocket(s)
  }, [roomId, userId])

  // 2. Основная логика синхронизации
  useEffect(() => {
    if (!editor || !socket) return

    const handleApplyRecords = (records: any[]) => {
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

    const handleDeleteRecords = (ids: string[]) => {
      isApplyingRemoteChange.current = true
      try {
        editor.store.mergeRemoteChanges(() => {
          ids.forEach((id) => editor.store.remove([id as any]))
        })
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
      } finally {
        isApplyingRemoteChange.current = false
      }
    }

    // Сначала вешаем обработчики!
    socket.on('init', handleApplyRecords)
    socket.on('update', handleApplyRecords)
    socket.on('delete', handleDeleteRecords)
    socket.on('cursor', handleCursor)

    const onConnect = () => {
      console.log('✅ Connected to room:', roomId)
      socket.emit('get-board', { roomId })
    }

    socket.on('connect', onConnect)
    
    // Если уже подключен — запрашиваем данные сразу
    if (socket.connected) {
      onConnect()
    }

    // Отправка локальных изменений
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
      socket.off('init', handleApplyRecords)
      socket.off('update', handleApplyRecords)
      socket.off('delete', handleDeleteRecords)
      socket.off('cursor', handleCursor)
      socket.off('connect', onConnect)
      unsubscribeStore()
      editor.off('event', handlePointerMove)
    }
  }, [editor, socket, roomId, userId, userName])

  return {}
}