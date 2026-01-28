# Backend Implementation for Board Synchronization

To support real-time synchronization for Excalidraw boards, the backend should implement a Socket.io server with the following events and logic.

## Socket Events

### Client -> Server

1. `join-board(boardId: string)`
   - The user joins a room identified by `boardId`.
   - **Response**: Emit `init-board` to the joining client with the current state of the board from the database.

2. `update-board(data: { boardId: string, elements: any[], appState: any, files: any })`
   - Save the latest board state (elements and files) to the database.
   - **Broadcast**: Emit `board-update` to all other clients in the same `boardId` room.
   - *Optimization*: You may want to debounce the database saving, but broadcast should be immediate for smoothness.

3. `pointer-move(data: { boardId: string, userId: number, userName: string, pointer: { x: number, y: number } })`
   - **Broadcast**: Emit `pointer-move` to everyone else in the room to show other users' cursors.

### Server -> Client

1. `init-board({ elements: any[], appState: any, files: any })`
   - Sent only to the user who just joined.

2. `board-update({ elements: any[], files: any })`
   - Sent to participants when someone makes changes.

3. `pointer-move({ userId: number, userName: string, pointer: { x: number, y: number } })`
   - Sent to participants to sync cursors.

## Data Structure

Excalidraw items consist of:
- **Elements**: Array of objects (shapes, text, etc.).
- **Files**: An object mapping `fileId` to file data (necessary for images).

### Sample Prisma Schema (Suggestion)

```prisma
model Board {
  id        String   @id @default(uuid())
  elements  Json     // Store the elements array
  files     Json?    // Store the files mapping
  updatedAt DateTime @updatedAt
}
```

## Implementation Notes

- **Room Names**: Use `board:${boardId}` for room names to avoid collisions.
- **Persistence**: Ensure `files` are also persisted, otherwise images added by one user won't be visible to others after a page refresh.
- **Binary Data**: Socket.io handles binary data well, but storing large files in JSON fields might be slow. Consider using an S3-like storage for images if they are large.
