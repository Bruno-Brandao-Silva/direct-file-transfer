"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = require("http");
const url_1 = require("url");
const next_1 = __importDefault(require("next"));
const socket_io_1 = require("socket.io");
const port = parseInt(process.env.PORT || '3000', 10);
const dev = process.env.NODE_ENV !== 'production';
const app = (0, next_1.default)({ dev });
const handle = app.getRequestHandler();
app.prepare().then(() => {
    const server = (0, http_1.createServer)((req, res) => {
        const parsedUrl = (0, url_1.parse)(req.url, true);
        handle(req, res, parsedUrl);
    });
    const io = new socket_io_1.Server(server);
    io.on('connection', (socket) => {
        console.log('User connected, id:', socket.id);
        // Handle WebSocket connection
        socket.on('message', (message) => {
            // Handle incoming messages
            console.log('Received message:', message);
        });
        socket.on('disconnect', () => {
            // Handle WebSocket connection close
            console.log('User disconnected, id:', socket.id);
        });
        socket.on('offer', (offer) => {
            // Handle incoming offer
            console.log('Received offer:', offer);
            // Process the offer and send an answer
            socket.broadcast.emit('offer', offer);
        });
        socket.on('answer', (answer) => {
            // Handle incoming answer
            console.log('Received answer:', answer);
            // Process the answer
            socket.broadcast.emit('answer', answer);
        });
        socket.on('iceCandidate', (iceCandidate) => {
            // Handle incoming ICE candidate
            console.log('Received ICE candidate:', iceCandidate);
            // Add the ICE candidate to the peer connection
            socket.broadcast.emit('iceCandidate', iceCandidate);
        });
        socket.on('file', (name, size) => {
            console.log('Received file:', name, size);
            socket.broadcast.emit('file', name, size);
        });
    });
    server.listen(port, () => {
        console.log(`> Server listening at http://localhost:${port} as ${dev ? 'development' : process.env.NODE_ENV}`);
    });
});
