
import { SocketMessage, OnlineActionPayload } from '../types';

type MessageHandler = (message: SocketMessage) => void;

class SocketService {
  private socket: WebSocket | null = null;
  private messageHandlers: Set<MessageHandler> = new Set();
  private isConnected: boolean = false;
  
  // Fallback for local testing between tabs
  private broadcastChannel: BroadcastChannel | null = null;
  private useFallback: boolean = false;
  private connectionTimeout: any = null;

  // Default
  private url: string = 'ws://localhost:8080'; 

  connect(roomId: string, playerName: string, onConnected: () => void, onError: (err: string) => void) {
    // Reset state
    this.useFallback = false;
    if (this.broadcastChannel) {
        this.broadcastChannel.close();
        this.broadcastChannel = null;
    }
    if (this.connectionTimeout) {
        clearTimeout(this.connectionTimeout);
    }
    if (this.socket) {
        this.socket.close();
        this.socket = null;
    }

    // 1. Check for Production Environment Variable first
    const envUrl = (import.meta as any).env.VITE_WS_URL;
    
    // 2. Dynamic Local URL
    const hostname = window.location.hostname;
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
    
    // Priority: Env Var -> Localhost Logic
    if (envUrl) {
        this.url = envUrl;
    } else {
        this.url = `ws://${hostname}:8080`;
    }

    try {
      console.log(`Attempting to connect to ${this.url}...`);
      this.socket = new WebSocket(`${this.url}?room=${roomId}&name=${playerName}`);

      // Set a timeout: If we don't connect in 5 seconds, handle failure
      this.connectionTimeout = setTimeout(() => {
          if (!this.isConnected) {
              console.warn("Server connection timed out.");
              if (this.socket) {
                  this.socket.close(); 
                  this.socket = null;
              }
              
              if (isLocalhost && !envUrl) {
                  // Only fallback to BroadcastChannel if we are actually on localhost dev environment AND no env var was set
                  console.log("Switching to Local Fallback (BroadcastChannel)");
                  this.switchToFallback(roomId, playerName, onConnected);
              } else {
                  onError("Connection Timed Out. Server might be waking up.");
              }
          }
      }, 5000); // Increased timeout for free tier servers (Render spins down)

      this.socket.onopen = () => {
        if (this.connectionTimeout) clearTimeout(this.connectionTimeout);
        this.isConnected = true;
        console.log('Connected to Game Server (WebSocket)');
        onConnected();
        
        this.send({
          type: 'JOIN_ROOM',
          payload: { roomId, playerName }
        });
      };

      this.socket.onmessage = (event) => {
        try {
          const message: SocketMessage = JSON.parse(event.data);
          this.notifyHandlers(message);
        } catch (e) {
          console.error('Failed to parse socket message', e);
        }
      };

      this.socket.onclose = () => {
        this.isConnected = false;
        console.log('Disconnected from WebSocket');
      };

      this.socket.onerror = (error) => {
        console.log('WebSocket connection error.');
        if (this.connectionTimeout) clearTimeout(this.connectionTimeout);
        
        if (isLocalhost && !envUrl) {
             this.switchToFallback(roomId, playerName, onConnected);
        } else {
             onError("Connection Failed. Server may be offline.");
        }
      };

    } catch (e) {
      if (isLocalhost && !envUrl) {
           this.switchToFallback(roomId, playerName, onConnected);
      } else {
           onError("Connection Error.");
      }
    }
  }

  private switchToFallback(roomId: string, playerName: string, onConnected: () => void) {
      if (this.useFallback) return; // Already switched
      this.useFallback = true;
      this.isConnected = true; // Virtual connection
      
      // Create a local channel for this room
      this.broadcastChannel = new BroadcastChannel(`soul_rotation_room_${roomId}`);
      
      this.broadcastChannel.onmessage = (event) => {
          // Receive messages from other tabs
          this.notifyHandlers(event.data as SocketMessage);
      };

      console.log(`Connected to Local Room "${roomId}" via BroadcastChannel`);
      onConnected();

      // Simulate sending the Join message immediately
      setTimeout(() => {
          this.send({
              type: 'JOIN_ROOM',
              payload: { roomId, playerName }
          });
      }, 500);
  }

  send(message: SocketMessage) {
    if (this.socket && this.isConnected && !this.useFallback) {
      this.socket.send(JSON.stringify(message));
    } else if (this.useFallback && this.broadcastChannel) {
      // --- SIMULATED SERVER LOGIC FOR LOCAL PLAY ---
      
      if (message.type === 'JOIN_ROOM') {
          // When we "send" JOIN_ROOM, the "server" usually broadcasts PLAYER_JOINED to others.
          // We simulate this by posting PLAYER_JOINED to the channel.
          this.broadcastChannel.postMessage({
              type: 'PLAYER_JOINED',
              payload: message.payload
          });
      } else {
          // All other messages (ACTION, INTRODUCE) are just broadcasted to the other tab
          this.broadcastChannel.postMessage(message);
      }
    } else {
      console.warn('Cannot send message: Not connected');
    }
  }

  sendAction(actionPayload: OnlineActionPayload) {
    this.send({
      type: 'ACTION',
      payload: actionPayload
    });
  }

  subscribe(handler: MessageHandler) {
    this.messageHandlers.add(handler);
    return () => this.messageHandlers.delete(handler);
  }

  private notifyHandlers(message: SocketMessage) {
    this.messageHandlers.forEach(handler => handler(message));
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    if (this.broadcastChannel) {
        this.broadcastChannel.close();
        this.broadcastChannel = null;
    }
    this.isConnected = false;
    this.useFallback = false;
  }
}

export const socketService = new SocketService();
