import React, { createContext, useContext, ReactNode, useEffect, useState } from 'react';
import { CustomSocketClient } from '@/types';

interface SocketIOContextProps {
  socket: CustomSocketClient | null;
  setSocket: React.Dispatch<React.SetStateAction<CustomSocketClient | null>>;
}

const SocketIOContext = createContext<SocketIOContextProps | undefined>(undefined);

interface SocketIOProviderProps {
  children: ReactNode;
}

export const SocketIOProvider: React.FC<SocketIOProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<CustomSocketClient | null>(null);

  return (
    <SocketIOContext.Provider value={{ socket, setSocket }}>
      {children}
    </SocketIOContext.Provider>
  );
};

export const useSocketIO = (): SocketIOContextProps => {
  const context = useContext(SocketIOContext);

  if (!context) {
    throw new Error('useSocketIO must be used within a SocketIOProvider');
  }

  return context;
};
