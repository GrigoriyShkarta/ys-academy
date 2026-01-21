# Real-Time Board Collaboration

## Как это работает

### Фронтенд
1. **Hook `useBoardSync`** устанавливает WebSocket соединение с сервером
2. **Room ID** определяется на основе:
   - Если администратор просматривает доску студента → `roomId = studentId`
   - Если студент работает со своей доской → `roomId = user.id`
3. **Синхронизация**:
   - Локальные изменения отправляются на сервер через WebSocket
   - Изменения от других пользователей применяются через `editor.store.mergeRemoteChanges()`

### Бэкенд (нужно реализовать)

Вам нужно создать WebSocket сервер на бэкенде (Node.js/Nest.js) который будет:

#### 1. Принимать подключения
```typescript
// Пример на Node.js с ws
import { WebSocketServer } from 'ws';

const wss = new WebSocketServer({ port: 3001 });

// Хранилище комнат (room -> Set<WebSocket>)
const rooms = new Map<string, Set<WebSocket>>();
```

#### 2. Обрабатывать события
```typescript
wss.on('connection', (ws, req) => {
  const url = new URL(req.url, 'http://localhost');
  const roomId = url.searchParams.get('roomId');
  const userId = url.searchParams.get('userId');
  
  // Добавить клиента в комнату
  if (!rooms.has(roomId)) {
    rooms.set(roomId, new Set());
  }
  rooms.get(roomId).add(ws);
  
  ws.on('message', (data) => {
    const message = JSON.parse(data.toString());
    
    // Отправить всем клиентам в комнате, кроме отправителя
    rooms.get(roomId).forEach((client) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          ...message,
          userId: userId,
        }));
      }
    });
  });
  
  ws.on('close', () => {
    // Удалить клиента из комнаты
    rooms.get(roomId)?.delete(ws);
  });
});
```

## Настройка

1. **Измените URL WebSocket** в `useBoardSync.ts`:
   ```typescript
   const wsUrl = `ws://your-backend-url/board-sync?roomId=${roomId}&userId=${userId}`;
   ```

2. **Добавьте эндпоинт на бэкенде** для обработки WebSocket соединений

## Альтернативные решения

Если не хотите писать свой WebSocket сервер, можете использовать:
- **Liveblocks** - готовое решение для коллаборации
- **Yjs + y-websocket** - CRDT библиотека с WebSocket провайдером
- **Pusher/Ably** - облачные решения для real-time

## Пример интеграции с существующим бэкендом

```typescript
// board-sync.gateway.ts (NestJS)
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ namespace: 'board-sync' })
export class BoardSyncGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    const { roomId, userId } = client.handshake.query;
    client.join(`room-${roomId}`);
    console.log(`User ${userId} joined room ${roomId}`);
  }

  handleDisconnect(client: Socket) {
    const { roomId, userId } = client.handshake.query;
    console.log(`User ${userId} left room ${roomId}`);
  }

  @SubscribeMessage('update')
  handleUpdate(client: Socket, payload: any) {
    const { roomId } = client.handshake.query;
    client.to(`room-${roomId}`).emit('update', payload);
  }

  @SubscribeMessage('init')
  handleInit(client: Socket, payload: any) {
    const { roomId } = client.handshake.query;
    client.to(`room-${roomId}`).emit('init', payload);
  }
}
```

## Тестирование

Для тестирования:
1. Откройте две вкладки браузера
2. В первой войдите как студент
3. Во второй войдите как администратор и выберите этого студента
4. Рисуйте на доске - изменения должны синхронизироваться

## Важные замечания

- **localStorage** сохраняет локальное состояние для offline работы
- **WebSocket** синхронизирует изменения в реальном времени
- **Используйте `persistenceKey`** для разделения досок разных студентов
