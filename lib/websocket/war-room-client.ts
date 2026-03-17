import { useWarRoomStore } from '@/lib/stores/war-room-store'
import { WebSocketEvent } from '@/types/aie'

export class WarRoomWebSocketClient {
  private ws: WebSocket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private heartbeatInterval: NodeJS.Timeout | null = null
  private isConnecting = false

  constructor(private url: string) {}

  connect(): void {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
      return
    }

    this.isConnecting = true
    const store = useWarRoomStore.getState()

    try {
      this.ws = new WebSocket(this.url)
      this.setupEventListeners()
    } catch (error) {
      console.error('WebSocket connection error:', error)
      this.isConnecting = false
      store.setConnected(false)
      this.scheduleReconnect()
    }
  }

  private setupEventListeners(): void {
    if (!this.ws) return

    const store = useWarRoomStore.getState()

    this.ws.onopen = () => {
      console.log('War Room WebSocket connected')
      this.isConnecting = false
      this.reconnectAttempts = 0
      store.setConnected(true)
      this.startHeartbeat()
    }

    this.ws.onmessage = (event) => {
      try {
        const data: WebSocketEvent = JSON.parse(event.data)
        store.processWebSocketEvent(data)
      } catch (error) {
        console.error('Error parsing WebSocket message:', error)
      }
    }

    this.ws.onclose = (event) => {
      console.log('War Room WebSocket disconnected:', event.code, event.reason)
      this.isConnecting = false
      store.setConnected(false)
      this.stopHeartbeat()
      
      if (event.code !== 1000) { // Not a normal closure
        this.scheduleReconnect()
      }
    }

    this.ws.onerror = (error) => {
      console.error('War Room WebSocket error:', error)
      this.isConnecting = false
      store.setConnected(false)
    }
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping' }))
      }
    }, 30000) // 30 seconds
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnect attempts reached')
      return
    }

    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts)
    console.log(`Scheduling reconnect in ${delay}ms (attempt ${this.reconnectAttempts + 1})`)

    setTimeout(() => {
      this.reconnectAttempts++
      this.connect()
    }, delay)
  }

  disconnect(): void {
    this.stopHeartbeat()
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect')
      this.ws = null
    }
    useWarRoomStore.getState().setConnected(false)
  }

  send(event: WebSocketEvent): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(event))
    } else {
      console.warn('WebSocket not connected, cannot send message')
    }
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN
  }

  getConnectionState(): string {
    if (!this.ws) return 'DISCONNECTED'
    
    switch (this.ws.readyState) {
      case WebSocket.CONNECTING: return 'CONNECTING'
      case WebSocket.OPEN: return 'CONNECTED'
      case WebSocket.CLOSING: return 'CLOSING'
      case WebSocket.CLOSED: return 'DISCONNECTED'
      default: return 'UNKNOWN'
    }
  }
}

// Singleton instance
let warRoomWSClient: WarRoomWebSocketClient | null = null

export const getWarRoomWebSocketClient = (url?: string): WarRoomWebSocketClient => {
  if (!warRoomWSClient) {
    if (!url) {
      throw new Error('WebSocket URL required for first initialization')
    }
    warRoomWSClient = new WarRoomWebSocketClient(url)
  }
  return warRoomWSClient
}

// React Hook for WebSocket connection
export const useWarRoomWebSocket = (url: string) => {
  const { connected, setConnected } = useWarRoomStore()

  React.useEffect(() => {
    const client = getWarRoomWebSocketClient(url)
    client.connect()

    return () => {
      // Don't disconnect on unmount, as other components might be using it
    }
  }, [url])

  return {
    connected,
    disconnect: () => warRoomWSClient?.disconnect(),
    reconnect: () => warRoomWSClient?.connect(),
    send: (event: WebSocketEvent) => warRoomWSClient?.send(event),
    connectionState: warRoomWSClient?.getConnectionState() || 'DISCONNECTED'
  }
}
