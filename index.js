const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());

// Health check
app.get('/', (req, res) => res.send('Server running'));

// Proxy endpoint for notifications
app.post('/proxy', (req, res) => {
  console.log('Proxy payload:', req.body);
  res.json({ status: 'ok' });
});

const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

io.on('connection', socket => {
  console.log('User connected:', socket.id);

  socket.on('joinChat', chatId => socket.join(chatId));
  socket.on('leaveChat', chatId => socket.leave(chatId));

  socket.on('sendMessage', msg => {
    io.to(msg.chatId).emit('receiveMessage', msg);
  });

  socket.on('chatUpdated', chat => io.emit('chatUpdated', chat));
  socket.on('messagesRead', info => io.to(info.chatId).emit('messagesRead', info));

  socket.on('disconnect', () => console.log('User disconnected:', socket.id));
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server listening on ${PORT}`));
