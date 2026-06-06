import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const listenersRef = useRef(new Map());

  useEffect(() => {
    if (!user) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsConnected(false);
      }
      return;
    }

    const token = localStorage.getItem('token');
    const socket = io(import.meta.env.VITE_SOCKET_URL || '/', {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    socketRef.current = socket;

    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));
    socket.on('connect_error', (err) => {
      console.error('Socket error:', err.message);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    };
  }, [user]);

  const emit = (event, data) => {
    socketRef.current?.emit(event, data);
  };

  const on = (event, handler) => {
    socketRef.current?.on(event, handler);
  };

  const off = (event, handler) => {
    socketRef.current?.off(event, handler);
  };

  const joinConversation = (conversationId) => {
    socketRef.current?.emit('conversation:join', conversationId);
  };

  const leaveConversation = (conversationId) => {
    socketRef.current?.emit('conversation:leave', conversationId);
  };

  const sendTypingStart = (conversationId) => {
    socketRef.current?.emit('typing:start', { conversationId });
  };

  const sendTypingStop = (conversationId) => {
    socketRef.current?.emit('typing:stop', { conversationId });
  };

  return (
    <SocketContext.Provider value={{
      socket: socketRef.current,
      isConnected,
      emit,
      on,
      off,
      joinConversation,
      leaveConversation,
      sendTypingStart,
      sendTypingStop,
    }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocket must be used within SocketProvider');
  return ctx;
};
