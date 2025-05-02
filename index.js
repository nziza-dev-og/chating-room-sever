// server/index.js
const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
require('dotenv').config();

const app = express();

// Allow your front-end origin; replace with your actual Vercel URL
app.use(cors({
  origin: 'https://chating-room-gamma.vercel.app',
  methods: ['GET','POST'],
  credentials: true
}));
app.use(express.json());

// Health check
app.get('/', (req, res) => res.send('Server running'));

// Proxy endpoint (for notifications, etc.)
app.post('/proxy', (req, res) => {
  console.log('Proxy payload:', req.body);
  res.json({ status: 'ok' });
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'https://chating-room-gamma.vercel.app',
    methods: ['GET','POST'],
    credentials: true
  },
  // enable both websocket & polling with proper CORS
  transports: ['websocket', 'polling']
});

io.on('connection', socket => {
  console.log('User connected:', socket.id);

  socket.on('joinChat', chatId => socket.join(chatId));
  socket.on('leaveChat', chatId => socket.leave(chatId));

  socket.on('sendMessage', msg => {
    // broadcast on dynamic event and room
    io.to(msg.chatId).emit(`receiveMessage:${msg.chatId}`, msg);
  });

  socket.on('chatUpdated', chat => io.emit('chatUpdated', chat));
  socket.on('messagesRead', info => io.to(info.chatId).emit('messagesRead', info));

  socket.on('disconnect', () => console.log('User disconnected:', socket.id));
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server listening on ${PORT}`));
