import { Socket } from "socket.io";
import { Socket as SocketClient } from "socket.io-client";

export interface CustomSocket extends Socket {
    username?: string;
    roomId?: string;
}

export interface CustomSocketClient extends SocketClient {
    username?: string;
    roomId?: string;
}

export interface User {
    username: string;
    socketId: string;
}