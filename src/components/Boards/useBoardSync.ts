import { useEffect, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import { Editor } from 'tldraw'

let socket: Socket | null = null


export function getSocket(roomId: string, userId: string) {
if (!socket) {
socket = io(`${process.env.NEXT_PUBLIC_API_URL}/board-sync`, {
query: { roomId, userId },
transports: ['websocket'],
})
}
return socket
}

interface UseBoardSyncOptions {
  editor: Editor | null
  roomId: string
  userId: string
  userName?: string
}

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

export function useBoardSync({
  editor,
  roomId,
  userId,
  userName,
}: UseBoardSyncOptions) {
  const socketRef = useRef<Socket | null>(null)
  const isApplyingRemoteChange = useRef(false)

  console.log('roomId:', roomId, 'userId:', userId)

  /* ------------------------------------------------------------------
   * 1️⃣ SOCKET — создаётся ОДИН РАЗ (НЕ зависит от editor)
   * ------------------------------------------------------------------ */
  useEffect(() => {
if (!roomId || !userId) return


const socket = getSocket(roomId, userId)


socket.on('connect', () => {
console.log('✅ Socket connected')
socket.emit('get-board', { roomId })
})


return () => {
// ❗ НЕ disconnect тут
console.log('♻️ unmount board sync (socket alive)')
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
   * 4️⃣ CURSOR
   * ------------------------------------------------------------------ */
  useEffect(() => {
    if (!editor || !socketRef.current) return

    const socket = socketRef.current
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

    editor.on('event', (e) => {
      if (e.type === 'pointer' && e.name === 'pointer_move') {
        handlePointer()
      }
    })
  }, [editor, userId, userName])

  return {}
}