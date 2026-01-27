import { useEffect, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import { Editor } from 'tldraw'

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
  const editorRef = useRef<Editor | null>(null)
  const userRef = useRef({ userId, userName })
  const isApplyingRemoteChange = useRef(false)

  editorRef.current = editor
  userRef.current = { userId, userName }

  useEffect(() => {
    if (!editor || !roomId || !userId) return

    console.log('[useBoardSync] Creating socket')

    const socket = io(
      `${process.env.NEXT_PUBLIC_API_URL}/board-sync`,
      {
        query: { roomId, userId },
        transports: ['websocket'], // ВАЖНО
        reconnection: true,
        reconnectionAttempts: 10,
      }
    )

    socketRef.current = socket

    const onConnect = () => {
      console.log('✅ socket connected', socket.id)
      socket.emit('get-board', { roomId })
    }

    const onDisconnect = (reason: string) => {
      console.warn('⚠️ socket disconnected:', reason)
    }

    const applyRecords = (records: any[]) => {
      const ed = editorRef.current
      if (!ed || !records?.length) return

      isApplyingRemoteChange.current = true
      try {
        ed.store.mergeRemoteChanges(() => {
          records.forEach((r) => r?.id && r?.typeName && ed.store.put([r]))
        })
      } finally {
        isApplyingRemoteChange.current = false
      }
    }

    const deleteRecords = (ids: string[]) => {
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

    socket.on('connect', onConnect)
    socket.on('disconnect', onDisconnect)
    socket.on('init', applyRecords)
    socket.on('update', applyRecords)
    socket.on('delete', deleteRecords)

    // Store sync
    const unsubscribe = editor.store.listen(
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

    return () => {
      console.log('[useBoardSync] Destroy socket')

      unsubscribe()

      socket.off('connect', onConnect)
      socket.off('disconnect', onDisconnect)
      socket.off('init', applyRecords)
      socket.off('update', applyRecords)
      socket.off('delete', deleteRecords)

      socket.disconnect()
      socketRef.current = null
    }
  }, [editor, roomId, userId])
}