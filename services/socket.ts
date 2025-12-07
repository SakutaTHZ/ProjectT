
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

  // Default to localhost, but will be updated dynamically in connect()
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

    // Dynamic URL: Use the hostname the browser is currently using.
    // This allows devices on the same WiFi (e.g., 192.168.1.5) to connect to the server running on that IP.
    const hostname = window.location.hostname;
    this.url = `ws://${hostname}:8080`;
    
    // Determine if we are on localhost
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';

    try {
      console.log(`Attempting to connect to ${this.url}...`);
      this.socket = new WebSocket(`${this.url}?room=${roomId}&name=${playerName}`);

      // Set a timeout: If we don't connect in 2 seconds, handle failure
      this.connectionTimeout = setTimeout(() => {
          if (!this.isConnected) {
              console.warn("Server connection timed out.");
              if (this.socket) {
                  this.socket.close(); 
                  this.socket = null;
              }
              
              if (isLocalhost) {
                  // Only fallback to BroadcastChannel if we are actually on localhost dev environment
                  console.log("Switching to Local Fallback (BroadcastChannel)");
                  this.switchToFallback(roomId, playerName, onConnected);
              } else {
                  // If on LAN/IP, fallback is useless for multiplayer. Error out to warn user.
                  onError("Connection Timed Out. Check Firewall/IP.");
              }
          }
      }, 2000);

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
        
        if (isLocalhost) {
             this.switchToFallback(roomId, playerName, onConnected);
        } else {
             onError("Connection Failed. Is the Server Running? Check Firewall.");
        }
      };

    } catch (e) {
      if (isLocalhost) {
           this.switchToFallback(roomId, playerName, onConnected);
      } else {
           onError("Connection Error. Check Host IP.");
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
