import type { Server as SocketIOServer } from 'socket.io';

declare global {
  // eslint-disable-next-line no-var
  var __velvetIO: SocketIOServer | undefined;
}

export function getIO(): SocketIOServer | null {
  return global.__velvetIO ?? null;
}

export function emitRealtimeEvent(event: string, payload: unknown, rooms?: string[]) {
  const io = getIO();
  if (!io) return;

  if (rooms && rooms.length > 0) {
    for (const room of rooms) {
      io.to(room).emit(event, payload);
    }
  } else {
    io.emit(event, payload);
  }
}
