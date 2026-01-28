'use client'

import { useEffect, useRef, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import { useUser } from '@/providers/UserContext'

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

export const useBoardSync = (boardId: string | undefined, excalidrawAPI: any) => {
  const socketRef = useRef<Socket | null>(null)
  const isImportingRef = useRef(false)
  const { user } = useUser()
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    if (!boardId || !excalidrawAPI || !user) return

    const socket = io(SOCKET_URL, {
      query: { boardId, userId: user.id },
    })
    socketRef.current = socket

    socket.on('connect', () => {
      console.log('Connected to board sync socket')
      socket.emit('join-board', boardId)
    })

    // Listen for initial data
    socket.on('init-board', (data: { elements: any[]; appState: any; files?: any }) => {
      isImportingRef.current = true
      
      // Filter out collaborators from appState to avoid JSON serialization issues (Map becomes {} )
      const { collaborators: _, ...cleanAppState } = data.appState || {}

      excalidrawAPI.updateScene({
        elements: data.elements,
        appState: { ...cleanAppState, collaboratorId: socket.id },
        commitToHistory: false,
      })
      if (data.files) {
        excalidrawAPI.addFiles(Object.values(data.files))
      }
      isImportingRef.current = false
      setIsLoaded(true)
    })

    // Listen for updates from other users
    socket.on('board-update', (data: { elements: any[]; appState?: any; files?: any }) => {
      isImportingRef.current = true
      
      const updateData: any = {
        elements: data.elements,
        commitToHistory: false,
      }

      if (data.appState) {
        const { collaborators: _, ...cleanAppState } = data.appState
        updateData.appState = cleanAppState
      }

      excalidrawAPI.updateScene(updateData)
      
      if (data.files) {
         excalidrawAPI.addFiles(Object.values(data.files))
      }
      isImportingRef.current = false
    })

    // Handle user cursors
    socket.on('pointer-move', (data: { userId: number, userName: string, pointer: { x: number, y: number } }) => {
       if (data.userId === user.id) return
       
       const appState = excalidrawAPI.getAppState()
       const collaborators = new Map(appState.collaborators instanceof Map ? appState.collaborators : [])
       
       collaborators.set(String(data.userId), {
         pointer: data.pointer,
         username: data.userName,
         button: "up",
         selectedElementIds: {},
       })

       excalidrawAPI.updateScene({
         collaborators
       })
    })

    return () => {
      socket.disconnect()
    }
  }, [boardId, excalidrawAPI, user])

  const handleBoardChange = (elements: any[], appState: any, files: any) => {
    if (isImportingRef.current || !socketRef.current || !boardId) return

    // Filter out collaborators from appState before sending to avoid serialization issues
    const { collaborators: _, ...cleanAppState } = appState

    // Debounce to avoid flooding the socket during drawing
    const timeoutId = (handleBoardChange as any)._timeoutId
    if (timeoutId) clearTimeout(timeoutId)

    ;(handleBoardChange as any)._timeoutId = setTimeout(() => {
      socketRef.current?.emit('update-board', {
        boardId,
        elements,
        appState: cleanAppState,
        files,
      })
    }, 100)
  }

  const handlePointerMove = (pointer: { x: number, y: number }) => {
    if (!socketRef.current || !boardId || !user) return
    socketRef.current.emit('pointer-move', {
      boardId,
      userId: user.id,
      userName: user.name,
      pointer,
    })
  }

  return { handleBoardChange, handlePointerMove, isLoaded }
}
