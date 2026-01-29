import { useEffect, useRef, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import { Editor, TLInstancePresence } from 'tldraw'

interface UseBoardSyncOptions {
  editor: Editor | null
  roomId: string
  userId: string
  userName?: string
}

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

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
  userName,
}: UseBoardSyncOptions) {
  const socketRef = useRef<Socket | null>(null)
  const isApplyingRemoteChange = useRef(false)
  const userColorRef = useRef<string>('')
  const lastCursorEmit = useRef(0)
  const [remoteCursors, setRemoteCursors] = useState<Map<string, RemoteCursor>>(new Map())
  

  /* ------------------------------------------------------------------
   * 1️⃣ SOCKET — создаётся ОДИН РАЗ (НЕ зависит от editor)
   * ------------------------------------------------------------------ */
  useEffect(() => {
    if (!roomId || !userId) return
    if (socketRef.current) return

    const socket = io(`${BACKEND_URL}/board-sync`, {
      query: {
        roomId: String(roomId),
        userId: String(userId),
      },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    })

    socketRef.current = socket

    socket.on('connect', () => {
      console.log('✅ Socket connected')
      socket.emit('get-board', { roomId })
    })

    socket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason)
    })

    socket.on('error', (err) => {
      console.error('🔥 Socket error:', err)
    })

    return () => {
      console.log('🧹 Destroy socket')
      socket.disconnect()
      socketRef.current = null
    }
  }, [roomId, userId])

  /* ------------------------------------------------------------------
   * 2️⃣ ПРИЁМ ДАННЫХ С СЕРВЕРА (editor может меняться)
   * ------------------------------------------------------------------ */
  useEffect(() => {
    if (!editor || !socketRef.current) return

    const socket = socketRef.current

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
      if (!ids?.length) return
      isApplyingRemoteChange.current = true
      try {
        editor.store.mergeRemoteChanges(() => {
          ids.forEach((id) => editor.store.remove([id as any]))
        })
      } finally {
        isApplyingRemoteChange.current = false
      }
    })

    socket.on('cursor', (data: { userId: string; userName: string; cursor: { x: number; y: number }; color: string }) => {
      if (!editor || data.userId === userId) return

      // Создаем полную запись присутствия, соответствующую схеме tldraw v3
      const presence = {
        id: `instance_presence:remote-${data.userId}` as any,
        typeName: 'instance_presence' as const,
        userId: data.userId,
        userName: data.userName || `User ${data.userId.slice(0, 8)}`,
        cursor: { 
          x: data.cursor.x, 
          y: data.cursor.y, 
          type: 'default', 
          rotation: 0 
        },
        color: data.color || generateUserColor(data.userId),
        currentPageId: editor.getCurrentPageId(),
        lastActivityTimestamp: Date.now(),
        // Обязательные поля для TLInstancePresence
        camera: { x: 0, y: 0, z: 1 },
        selectedShapeIds: [],
        brush: null,
        scribbles: [],
        followingUserId: null,
        chatMessage: '',
        screenBounds: { x: 0, y: 0, w: 1, h: 1 },
        meta: {}, // Добавлено поле meta
      }

      isApplyingRemoteChange.current = true
      try {
        editor.store.put([presence as any])
      } finally {
        isApplyingRemoteChange.current = false
      }
    })

    socket.on('disconnect', () => {
      if (!editor) return
      // При отключении можно не чистить специально, tldraw сам скроет по тайм-ауту
      // но для порядка удалим запись
    })

    socket.on('user-left', (leftUserId: string) => {
      try {
        editor.store.remove([`instance_presence:remote-${leftUserId}` as any])
      } catch (e) {}
    })

    return () => {
      socket.off('init', applyRecords)
      socket.off('update', applyRecords)
      socket.off('delete')
      socket.off('cursor')
    }
  }, [editor, userId])

  /* ------------------------------------------------------------------
   * 3️⃣ ОТПРАВКА ЛОКАЛЬНЫХ ИЗМЕНЕНИЙ
   * ------------------------------------------------------------------ */
  useEffect(() => {
    if (!editor || !socketRef.current) return

    const socket = socketRef.current

    const unsubscribe = editor.store.listen(
      (changes) => {
        if (isApplyingRemoteChange.current) return
        if (!socket.connected) return

        const added = Object.values(changes.changes.added)
        const updated = Object.values(changes.changes.updated)
        const removed = Object.keys(changes.changes.removed)

        const records = [...added, ...updated]

        if (records.length) {
          socket.emit('update', records)
        }

        if (removed.length) {
          socket.emit('delete', removed)
        }
      },
      { scope: 'document', source: 'user' }
    )

    return unsubscribe
  }, [editor])

  /* ------------------------------------------------------------------
   * 4️⃣ CURSOR — отправка позиции своего курсора
   * ------------------------------------------------------------------ */
  useEffect(() => {
    if (!editor || !socketRef.current) return

    const socket = socketRef.current
    let last = 0

    // Генерируем цвет для текущего пользователя (один раз)
    if (!userColorRef.current) {
      userColorRef.current = generateUserColor(userId)
    }

    const handlePointer = () => {
      const now = Date.now()
      if (now - last < 50) return
      last = now

      if (!socket.connected) return

      const p = editor.inputs.currentPagePoint

      socket.emit('cursor', {
        userId,
        userName: userName || `User ${userId.slice(0, 8)}`,
        cursor: { x: p.x, y: p.y, type: 'default', rotation: 0 },
        color: userColorRef.current,
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
  }, [editor, userId, userName])

  return {}
}

// Генерация уникального цвета для пользователя
function generateUserColor(userId: string): string {
  const colors = [
    '#FF6B6B', // красный
    '#4ECDC4', // бирюзовый
    '#45B7D1', // голубой
    '#FFA07A', // оранжевый
    '#98D8C8', // мятный
    '#F7DC6F', // жёлтый
    '#BB8FCE', // фиолетовый
    '#85C1E2', // светло-синий
  ]

  let hash = 0
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}