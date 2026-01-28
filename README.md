This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Backend Requirements for Board Synchronization

To enable real-time collaboration and persistence for Boards (using tldraw), the backend must implement a Socket.IO namespace `/board-sync`.

### Connection
Clients connect to `{NEXT_PUBLIC_API_URL}/board-sync`.
Query parameters provided by client:
- `roomId`: string (Board or Student ID)
- `userId`: string (User ID)

### Events

#### Server -> Client
1. `init`
   - **Trigger**: On client connection.
   - **Payload**: `Record[]` (Snapshot of current board state, including shapes and assets).
   - **Description**: Sends the full current state of the board to the newly connected user.

2. `update`
   - **Trigger**: When another user makes changes.
   - **Payload**: `Record[]` (Array of updated/added records, which can be shapes or assets).
   - **Description**: Broadcasts updates to all other users in the room.

3. `delete`
   - **Trigger**: When another user removes shapes.
   - **Payload**: `string[]` (Array of record IDs).
   - **Description**: Broadcasts deletions to all other users in the room.

4. `cursor`
   - **Trigger**: When another user moves their cursor.
   - **Payload**: `{ userId, cursor: { x, y }, color, userName }`.
   - **Description**: Broadcasts cursor positions.

#### Client -> Server
1. `update`
   - **Data**: `Record[]` (Contains both updated shapes and their associated assets if any).
   - **Action**: Server must save these records (shapes/assets) to the database for the given `roomId` and then broadcast the `update` event to other clients (excluding sender).

2. `delete`
   - **Data**: `string[]` (Record IDs).
   - **Action**: Server must delete these records from the database for the given `roomId` and then broadcast the `delete` event to other clients (excluding sender).

3. `cursor`
   - **Data**: `{ userId, cursor, ... }`.
   - **Action**: Server should broadcast this to other clients. No persistence needed.

4. `get-board`
   - **Data**: `{ roomId }`.
   - **Action**: Client explicitly requests the latest board state. Server must select all records for `roomId` and send them back to the requester via `init` event.

### Database Schema Suggestion
A simple table to store board records:

```sql
CREATE TABLE board_records (
  room_id VARCHAR(255) NOT NULL,
  record_id VARCHAR(255) NOT NULL,
  content JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (room_id, record_id)
);
```

When `update` is received, perform UPSERT (Insert or Update).
When `delete` is received, Delete.
When client connects, Select all records for `room_id` and send as `init`.
