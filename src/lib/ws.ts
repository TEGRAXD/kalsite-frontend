export interface WsMessage<T = unknown> {
  event: string;
  payload: T;
}

type Listener = (payload: any) => void;

const DEFAULT_WS_URL =
  process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:5000/ws";

export class KalsiteWebSocketClient {
  private socket: WebSocket | null = null;
  private listeners = new Map<string, Set<Listener>>();
  private statusListeners = new Set<(connected: boolean) => void>();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private subscribedRoomCode: string | null = null;
  private intentionallyClosed = false;
  private reconnectAttempt = 0;

  connect(roomCode: string) {
    this.subscribedRoomCode = roomCode;
    this.intentionallyClosed = false;

    if (
      this.socket &&
      (this.socket.readyState === WebSocket.OPEN ||
        this.socket.readyState === WebSocket.CONNECTING)
    ) {
      if (this.socket.readyState === WebSocket.OPEN) {
        this.send("room:subscribe", { roomCode });
      }
      return;
    }

    this.openSocket();
  }

  private openSocket() {
    if (typeof window === "undefined") return;

    const ws = new WebSocket(DEFAULT_WS_URL);
    this.socket = ws;

    ws.onopen = () => {
      this.reconnectAttempt = 0;
      this.notifyStatus(true);
      if (this.subscribedRoomCode) {
        this.send("room:subscribe", { roomCode: this.subscribedRoomCode });
      }
    };

    ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data as string) as WsMessage;
        const handlers = this.listeners.get(msg.event);
        if (handlers) {
          for (const handler of handlers) {
            handler(msg.payload);
          }
        }
      } catch {
        // Ignore malformed messages
      }
    };

    ws.onclose = () => {
      this.notifyStatus(false);
      this.socket = null;
      if (!this.intentionallyClosed && this.subscribedRoomCode) {
        const delay = Math.min(1000 * 2 ** this.reconnectAttempt, 8000);
        this.reconnectAttempt += 1;
        this.reconnectTimer = setTimeout(() => this.openSocket(), delay);
      }
    };

    ws.onerror = () => {
      // onclose handles reconnect
    };
  }

  disconnect() {
    this.intentionallyClosed = true;
    this.subscribedRoomCode = null;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.notifyStatus(false);
  }

  send(event: string, payload: Record<string, unknown> = {}) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      return false;
    }
    this.socket.send(JSON.stringify({ event, payload }));
    return true;
  }

  on(event: string, listener: Listener): () => void {
    let set = this.listeners.get(event);
    if (!set) {
      set = new Set();
      this.listeners.set(event, set);
    }
    set.add(listener);
    return () => {
      set?.delete(listener);
    };
  }

  onStatus(listener: (connected: boolean) => void): () => void {
    this.statusListeners.add(listener);
    return () => {
      this.statusListeners.delete(listener);
    };
  }

  private notifyStatus(connected: boolean) {
    for (const listener of this.statusListeners) {
      listener(connected);
    }
  }
}

export const wsClient = new KalsiteWebSocketClient();
