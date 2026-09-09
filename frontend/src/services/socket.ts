import { io, type Socket } from 'socket.io-client'

let socket: Socket | null = null

export function getSocket(): Socket {
  if (!socket) {
    const url = import.meta.env.VITE_SOCKET_URL as string | undefined
    socket = io(url || window.location.origin, {
      autoConnect: false,
      transports: ['websocket', 'polling'],
      path: '/socket.io',
    })
  }
  return socket
}

export function disconnectSocket() {
  socket?.disconnect()
}

export function emitWhenConnected(event: string, payload?: unknown) {
  const client = getSocket()
  const send = () => {
    if (payload === undefined) client.emit(event)
    else client.emit(event, payload)
  }
  if (client.connected) send()
  else client.once('connect', send)
}
