import { createServer } from 'http'
import { parse } from 'url'
import next from 'next'
import { CustomSocket } from './types';
import { Server as SocketIOServer } from 'socket.io'

const port = parseInt(process.env.PORT || '3000', 10)
const dev = process.env.NODE_ENV !== 'production'
const app = next({ dev });
const handle = app.getRequestHandler()

const idSet = new Set<string>();

function newId(): string {
  let _newId: string;

  do {
    const random = Math.floor(Math.random() * 1000000);
    _newId = random.toString().padStart(6, '0');
  } while (idSet.has(_newId));

  idSet.add(_newId);
  return _newId;
}

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true)
    handle(req, res, parsedUrl)
  });

  const io = new SocketIOServer(server)

  io.on('connection', (socket: CustomSocket) => {
    console.log('User connected, id:', socket.id)

    socket.on('create-room', (name) => {
      const roomId = newId();
      socket.username = name;
      socket.roomId = roomId;
      socket.join(roomId);
      socket.emit('room-created', roomId);
      io.to(roomId).emit('joined', `${name} entrou na sala.`);
    });



    socket.on('join-room', (roomId, name) => {
      socket.username = name;
      if(socket.roomId) {
        socket.leave(socket.roomId);
        io.to(socket.roomId).emit('exited', `${socket.username} saiu da sala.`);
      }
      socket.roomId = roomId;
      socket.join(roomId);
      socket.emit('joined', `${name} entrou na sala.`);
    });

    socket.on('disconnect', () => {
      // Handle WebSocket connection close
      console.log('User disconnected, id:', socket.id)
      if (socket.username && socket.roomId) {
        socket.leave(socket.roomId);

        io.to(socket.roomId).emit('exited', `${socket.username} saiu da sala.`);

        const roomSockets = io.sockets.adapter.rooms.get(socket.roomId);
        if (!roomSockets || roomSockets.size === 0) {
          idSet.delete(socket.roomId);
        }
      }
    });

    socket.on('offer', (offer) => {
      // Handle incoming offer
      console.log('Received offer:', offer)
      // Process the offer and send an answer
      socket.broadcast.emit('offer', offer);
    });

    socket.on('answer', (answer) => {
      // Handle incoming answer
      console.log('Received answer:', answer)
      // Process the answer
      socket.broadcast.emit('answer', answer);
    });

    socket.on('iceCandidate', (iceCandidate) => {
      // Handle incoming ICE candidate
      console.log('Received ICE candidate:', iceCandidate)
      // Add the ICE candidate to the peer connection
      socket.broadcast.emit('iceCandidate', iceCandidate);
    });

    socket.on('file', (name, size) => {
      console.log('Received file:', name, size)
      socket.broadcast.emit('file', name, size);
    });

  });

  server.listen(port, () => {
    console.log(
      `> Server listening at http://localhost:${port} as ${dev ? 'development' : process.env.NODE_ENV
      }`
    )
  });

});
