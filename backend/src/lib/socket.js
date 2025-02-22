import { Server } from 'socket.io'
import http from 'http'
import express from 'express'

const app = express();
const server = http.createServer(app)

const io = new Server(server, {
  cors: {
    origin: ['http://localhost:5173']
  }
})

export function getReceiverSocketId(userId) {
  return userSocketMap[userId];
}

const userSocketMap = {}; //{userId: socketId} from db and this socket id

// none of this makes any sense so learn it
io.on('connection', (socket) => {
  console.log("A user connected: ", socket.id);

  const userId = socket.handshake.query.userId; // from the socket object.
  if (userId) userSocketMap[userId] = socket.id // this appends ???

  // used to send events to all the connected clients
  io.emit('getOnlineUsers', Object.keys(userSocketMap));

  socket.on('disconnect', () => {
    console.log('A user disconnected', socket.id)
    delete userSocketMap[userId];
    io.emit('getOnlineUsers', Object.keys(userSocketMap));
  })
})

export { io, app, server };