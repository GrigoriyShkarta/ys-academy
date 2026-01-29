'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'
import { useUser } from '@/providers/UserContext'

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

export const useBoardSync = (boardId: string | undefined, excalidrawAPI: any) => {
  const socketRef = useRef<Socket | null>(null)
  const isImportingRef = useRef(false)
  const apiRef = useRef<any>(null)
  const { user } = useUser()
  const [isLoaded, setIsLoaded] = useState(false)
  const pendingFilesRef = useRef<Record<string, any>>({})

  // Update apiRef whenever excalidrawAPI changes
  useEffect(() => {
    apiRef.current = excalidrawAPI
  }, [excalidrawAPI])

  useEffect(() => {
    const userId = user?.id
    const userName = user?.name

    if (!boardId || !userId) return

    // Prevent multiple connections for the same parameters
    if (socketRef.current?.connected && 
        socketRef.current.io.opts.query?.boardId === boardId) {
      return
    }

    const socket = io(SOCKET_URL, {
      query: { 
        boardId, 
        userId, 
        userName
      },
      transports: ['websocket'],
    })
    socketRef.current = socket

    socket.on('connect', () => {
      console.log('Connected to board sync socket', { boardId, userId })
      socket.emit('join-board', boardId)
    })

    socket.on('init-board', (data: { elements: any[]; appState: any; files?: any }) => {
      if (!apiRef.current) return
      isImportingRef.current = true
      
      const { collaborators: _, ...cleanAppState } = data.appState || {}

      apiRef.current.updateScene({
        elements: data.elements,
        appState: { ...cleanAppState, collaboratorId: socket.id },
        commitToHistory: false,
      })
      if (data.files) {
        apiRef.current.addFiles(Object.values(data.files))
      }
      isImportingRef.current = false
      setIsLoaded(true)
    })

    socket.on('board-update', (data: { elements: any[]; appState?: any; files?: any }) => {
      if (!apiRef.current) return
      isImportingRef.current = true
      
      if (data.files) {
         apiRef.current.addFiles(Object.values(data.files))
      }

      const updateData: any = {
        elements: data.elements,
        commitToHistory: false,
      }

      if (data.appState) {
        const { collaborators: _, ...cleanAppState } = data.appState
        updateData.appState = cleanAppState
      }

      apiRef.current.updateScene(updateData)
      isImportingRef.current = false
    })

    socket.on('pointer-move', (data: { userId: number, userName: string, pointer: { x: number, y: number } }) => {
       if (data.userId === userId || !apiRef.current) return
       
       isImportingRef.current = true
       const appState = apiRef.current.getAppState()
       const collaborators = new Map(appState.collaborators instanceof Map ? appState.collaborators : [])
       
       collaborators.set(String(data.userId), {
         pointer: data.pointer,
         username: data.userName,
         button: "up",
         selectedElementIds: {},
       })

       apiRef.current.updateScene({ collaborators })
       isImportingRef.current = false
    })

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [boardId, user?.id]) // Stable dependencies

  const handleBoardChange = useCallback((elements: any[], appState: any, files: any) => {
    if (isImportingRef.current || !socketRef.current?.connected || !boardId) return

    if (files) {
      Object.assign(pendingFilesRef.current, files)
    }

    const { collaborators: _, ...cleanAppState } = appState

    const timeoutId = (handleBoardChange as any)._timeoutId
    if (timeoutId) clearTimeout(timeoutId)

    ;(handleBoardChange as any)._timeoutId = setTimeout(() => {
      const filesToSend = { ...pendingFilesRef.current }
      pendingFilesRef.current = {}

      socketRef.current?.emit('update-board', {
        boardId,
        elements,
        appState: cleanAppState,
        files: Object.keys(filesToSend).length > 0 ? filesToSend : undefined,
      })
    }, 100)
  }, [boardId])

  const handlePointerMove = useCallback((pointer: { x: number, y: number }) => {
    if (!socketRef.current?.connected || !boardId || !user) return
    socketRef.current.emit('pointer-move', {
      boardId,
      userId: user.id,
      userName: user.name,
      pointer,
    })
  }, [boardId, user?.id, user?.name])

  return { handleBoardChange, handlePointerMove, isLoaded }
}
