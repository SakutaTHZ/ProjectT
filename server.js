
/*
  SIMPLE WEBSOCKET SERVER FOR SOUL ROTATION TCG
  
  How to run:
  1. Install ws: `npm install ws`
  2. Run server: `node server.js`
*/

import { WebSocketServer, WebSocket } from 'ws';

// host: '0.0.0.0' ensures we listen on all network interfaces, not just localhost
const wss = new WebSocketServer({ host: '0.0.0.0', port: 8080 });

// Store clients by room: { [roomId]: Set<WebSocket> }
const rooms = {};

console.log('Soul Rotation Game Server running on port 8080');

wss.on('connection', (ws, req) => {
  let currentRoom = null;
  let playerName = 'Unknown';

  console.log('New client connected');

  ws.on('message', (message) => {
    try {
      // message is a Buffer in ws, need to convert to string
      const messageStr = message.toString();
      const data = JSON.parse(messageStr);

      if (data.type === 'JOIN_ROOM') {
        const { roomId, name } = data.payload;
        currentRoom = roomId;
        playerName = name;

        // Initialize room if not exists
        if (!rooms[roomId]) {
          rooms[roomId] = new Set();
        }
        rooms[roomId].add(ws);

        console.log(`[${roomId}] ${name} joined.`);

        // Broadcast to OTHERS in the room that a player joined
        broadcastToRoom(roomId, ws, {
          type: 'PLAYER_JOINED',
          payload: { name: name }
        });
      } 
      
      else {
        // Forward ANY other message (ACTION, WELCOME, SYNC_LOADOUT) to everyone else in room
        if (currentRoom) {
          broadcastToRoom(currentRoom, ws, data);
        }
      }

    } catch (e) {
      console.error('Error processing message:', e);
    }
  });

  ws.on('close', () => {
    if (currentRoom && rooms[currentRoom]) {
      rooms[currentRoom].delete(ws);
      console.log(`Client disconnected from room ${currentRoom}`);
      if (rooms[currentRoom].size === 0) {
        delete rooms[currentRoom];
      }
    }
  });
});

function broadcastToRoom(roomId, senderWs, message) {
  if (rooms[roomId]) {
    rooms[roomId].forEach(client => {
      if (client !== senderWs && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    });
  }
}