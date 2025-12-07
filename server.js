/*
  SIMPLE WEBSOCKET SERVER FOR SOUL ROTATION TCG
  
  How to run:
  1. Install ws: `npm install ws`
  2. Run server: `node server.js`
*/

import { WebSocketServer, WebSocket } from 'ws';
import { networkInterfaces } from 'os';

// host: '0.0.0.0' ensures we listen on all network interfaces, not just localhost
const wss = new WebSocketServer({ host: '0.0.0.0', port: 8080 });

// Store clients by room: { [roomId]: Set<WebSocket> }
const rooms = {};

// Helper to find ALL LAN IP addresses
const getLocalIps = () => {
  const nets = networkInterfaces();
  const results = [];

  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      // Skip internal (localhost) and non-IPv4
      if (net.family === 'IPv4' && !net.internal) {
        results.push({ name, address: net.address });
      }
    }
  }
  return results;
};

const ips = getLocalIps();

console.log('\n==================================================');
console.log('SOUL ROTATION GAME SERVER RUNNING');
console.log(`Listening on port: 8080`);
console.log('--------------------------------------------------');
console.log('Available Network Interfaces:');
if (ips.length === 0) {
    console.log('  > No External IP found. Are you connected to Wi-Fi?');
} else {
    ips.forEach(ip => {
        console.log(`  > [${ip.name}] ${ip.address}`);
        console.log(`    App:    http://${ip.address}:3000`);
        console.log(`    Server: ws://${ip.address}:8080`);
    });
}
console.log('--------------------------------------------------');
console.log('TIP: If using VPN, turn it OFF or enable "Allow LAN".');
console.log('     Use the IP that looks like 192.168.x.x');
console.log('==================================================\n');

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