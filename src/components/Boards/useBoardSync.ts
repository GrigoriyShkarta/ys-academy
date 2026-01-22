import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { Editor } from 'tldraw';

interface UseBoardSyncOptions {
  editor: Editor | null;
  roomId: string;
  userId: string;
  userName?: string;
}

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export function useBoardSync({ editor, roomId, userId, userName }: UseBoardSyncOptions) {
  const socketRef = useRef<Socket | null>(null);
  const isApplyingRemoteChange = useRef(false);

  useEffect(() => {
    if (!editor || !roomId || !userId) return;

    console.log(`Connecting to board sync: room=${roomId}, user=${userId}`);

    const socket = io(`${BACKEND_URL}/board-sync`, {
      query: {
        roomId: String(roomId),
        userId: String(userId),
      },
      transports: ['websocket'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log(`Connected to board sync room: ${roomId}`);
      
      // Request the latest board state from the server
      // Server should respond with 'init' event containing the data
      socket.emit('get-board', { roomId });
    });

    // Receive updates from other clients
    socket.on('update', (payload) => {
      console.log('Received update from server:', payload);
      
      if (!payload) return;
      
      // Handle both array and object with numeric keys (from backend)
      let records: any[] = [];
      
      if (Array.isArray(payload)) {
        records = payload;
      } else if (typeof payload === 'object') {
        // Convert object with numeric keys to array
        // Backend sends: { "0": [...], "userId": "4" }
        const keys = Object.keys(payload).filter(key => !isNaN(Number(key)));
        records = keys.flatMap(key => payload[key]);
      }
      
      if (records.length === 0) {
        console.warn('No valid records in update payload');
        return;
      }
      
      isApplyingRemoteChange.current = true;
      
      try {
        editor.store.mergeRemoteChanges(() => {
          records.forEach((record: any) => {
            editor.store.put([record]);
          });
        });
        console.log('Applied', records.length, 'remote changes');
      } catch (error) {
        console.error('Error applying remote changes:', error);
      } finally {
        isApplyingRemoteChange.current = false;
      }
    });

    // Receive initial state from other clients
    socket.on('init', (payload) => {
      console.log('Received init from server:', payload);
      
      if (!payload) return;
      
      // Handle both array and object with numeric keys
      let records: any[] = [];
      
      if (Array.isArray(payload)) {
        records = payload;
      } else if (typeof payload === 'object') {
        const keys = Object.keys(payload).filter(key => !isNaN(Number(key)));
        records = keys.flatMap(key => payload[key]);
      }
      
      if (records.length === 0) {
        console.warn('No valid records in init payload');
        return;
      }
      
      isApplyingRemoteChange.current = true;
      
      try {
        editor.store.mergeRemoteChanges(() => {
          records.forEach((record: any) => {
            editor.store.put([record]);
          });
        });
        console.log('Applied', records.length, 'init records');
      } catch (error) {
        console.error('Error applying init state:', error);
      } finally {
        isApplyingRemoteChange.current = false;
      }
    });

    // Receive cursor updates from other users
    socket.on('cursor', (data: { userId: string; cursor: any; userName?: string; color?: string }) => {
      if (data.userId === userId) return; // Ignore own cursor
      
      try {
        const presenceId = `instance_presence:${data.userId}`;
        const presence = {
          id: presenceId,
          typeName: 'instance_presence',
          userId: data.userId,
          userName: data.userName || `User ${data.userId}`,
          cursor: data.cursor,
          color: data.color || getColorForUser(data.userId),
          currentPageId: editor.getCurrentPageId(),
          followingUserId: null,
          brush: null,
          scribbles: [],
          chatMessage: '',
          meta: {},
        };
        
        editor.store.put([presence as any]);
      } catch (error) {
        console.error('Error updating remote cursor:', error);
      }
    });

    // Receive delete events from other users
    socket.on('delete', (payload) => {
      console.log('Received delete from server:', payload);
      
      if (!payload) return;
      
      // Handle both array and object with numeric keys
      let recordIds: string[] = [];
      
      if (Array.isArray(payload)) {
        recordIds = payload;
      } else if (typeof payload === 'object') {
        const keys = Object.keys(payload).filter(key => !isNaN(Number(key)));
        recordIds = keys.flatMap(key => payload[key]);
      }
      
      if (recordIds.length === 0) {
        console.warn('No valid record IDs in delete payload');
        return;
      }
      
      isApplyingRemoteChange.current = true;
      
      try {
        editor.store.mergeRemoteChanges(() => {
          recordIds.forEach((id: string) => {
            editor.store.remove([id as any]);
          });
        });
        console.log('Deleted', recordIds.length, 'remote records');
      } catch (error) {
        console.error('Error deleting remote records:', error);
      } finally {
        isApplyingRemoteChange.current = false;
      }
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from board sync');
    });

    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    // Listen to local changes and send to server (automatic sync)
    const handleChange = (changes: any) => {
      if (isApplyingRemoteChange.current) return;
      if (!socket.connected) return;

      const added = Object.values(changes.changes.added) as any[];
      const updated = Object.values(changes.changes.updated) as any[];
      const removed = Object.keys(changes.changes.removed);

      const updates = [...added, ...updated];

      if (updates.length > 0) {
        // Collect assetIds from image and video shapes to ensure associated assets are sent
        const assetIds = new Set<string>();
        updates.forEach((record: any) => {
          if ((record.type === 'image' || record.type === 'video') && record.props?.assetId) {
            assetIds.add(record.props.assetId);
          }
        });

        // Get referenced asset records from store
        const referencedAssets = Array.from(assetIds)
          .map(assetId => editor.store.get(assetId as any))
          .filter(Boolean);

        // Combine updates and referenced assets, avoiding duplicates
        const allRecords = [...updates];
        referencedAssets.forEach((asset: any) => {
          if (!allRecords.find(r => r.id === asset.id)) {
            allRecords.push(asset);
          }
        });

        // Process records asynchronously to convert blob URLs to base64
        (async () => {
          const processedRecords = await Promise.all(
            allRecords.map(async (record: any) => {
              // If it's an asset with a local blob URL, convert it to base64
              if (record.typeName === 'asset' && record.props?.src?.startsWith('blob:')) {
                try {
                  const base64 = await blobToBase64(record.props.src);
                  return {
                    ...record,
                    props: {
                      ...record.props,
                      src: base64,
                    },
                  };
                } catch (error) {
                  console.error('Failed to convert asset blob to base64:', error);
                }
              }
              return record;
            })
          );
          
          console.log('Sending update to server:', processedRecords.length, 'records (including assets with data)');
          socket.emit('update', processedRecords);
        })();
      }

      if (removed.length > 0) {
        // console.log('Sending delete to server:', removed.length, 'records');
        socket.emit('delete', removed);
      }
    };

    // Subscribe to store changes for automatic synchronization
    const unsubscribe = editor.store.listen(handleChange, {
      scope: 'document',
      source: 'user',
    });

    // Track and send cursor position
    let lastCursorUpdate = 0;
    const CURSOR_THROTTLE = 50; // ms

    const handlePointerMove = () => {
      const now = Date.now();
      if (now - lastCursorUpdate < CURSOR_THROTTLE) return;
      lastCursorUpdate = now;

      if (!socket.connected) return;

      const pagePoint = editor.inputs.currentPagePoint;
      const screenPoint = editor.inputs.currentScreenPoint;

      socket.emit('cursor', {
        userId,
        userName: userName || `User ${userId}`,
        cursor: {
          x: pagePoint.x,
          y: pagePoint.y,
          type: 'default',
        },
        color: getColorForUser(userId),
      });
    };

    editor.on('event', (event) => {
      if (event.type === 'pointer' && event.name === 'pointer_move') {
        handlePointerMove();
      }
    });

    return () => {
      console.log('Cleaning up board sync');
      unsubscribe();
      socket.disconnect();
      socketRef.current = null;
    };
  }, [editor, roomId, userId, userName]);

  // Manual functions for sending updates (if needed)
  const sendUpdate = (data: any) => {
    if (!socketRef.current?.connected) {
      console.warn('Socket not connected, cannot send update');
      return;
    }
    console.log('Manually sending update to server');
    socketRef.current.emit('update', data);
  };

  const sendInit = (data: any) => {
    if (!socketRef.current?.connected) {
      console.warn('Socket not connected, cannot send init');
      return;
    }
    console.log('Manually sending init to server');
    socketRef.current.emit('init', data);
  };

  return {
    sendUpdate,
    sendInit,
  };
}

// Generate consistent color for each user
function getColorForUser(userId: string): string {
  const colors = [
    '#FF6B6B', // Red
    '#4ECDC4', // Teal
    '#45B7D1', // Blue
    '#FFA07A', // Light Salmon
    '#98D8C8', // Mint
    '#F7DC6F', // Yellow
    '#BB8FCE', // Purple
    '#85C1E2', // Sky Blue
    '#F8B739', // Orange
    '#52B788', // Green
  ];
  
  const hash = userId.split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);
  
  return colors[Math.abs(hash) % colors.length];
}

async function blobToBase64(url: string): Promise<string> {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

