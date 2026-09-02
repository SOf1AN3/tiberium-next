import { useAuth } from '@/lib/contexts/AuthContext';
import { useEffect, useState, useCallback } from 'react';
import WebSocketClient, { createWebSocketClient, getWebSocketClient } from '@/lib/websocket';

interface Message {
   id?: string;
   senderId: string;
   receiverId: string;
   content: string;
   timestamp: Date;
   isSentByMe: boolean;
}

export function useWebSocketMessages() {
   const { token } = useAuth();
   const [ws, setWs] = useState<WebSocketClient | null>(null);
   const [messages, setMessages] = useState<Message[]>([]);
   const [isConnected, setIsConnected] = useState(false);
   const [isTyping, setIsTyping] = useState<{ [key: string]: boolean }>({});

   // Connect WebSocket
   useEffect(() => {
      if (!token) return;

      let existingWs = getWebSocketClient();
      if (!existingWs) {
         existingWs = createWebSocketClient(token);
      }

      setWs(existingWs);

      existingWs
         .connect()
         .then(() => {
            setIsConnected(true);
         })
         .catch(() => {
            // Connection failed; reconnection is handled by WebSocketClient
         });

      // Listen for incoming messages
      const unsubscribeMessage = existingWs.on('MESSAGE_RECEIVE', (data) => {
         const newMessage: Message = {
            id: data.id,
            senderId: data.senderId,
            receiverId: data.receiverId,
            content: data.content,
            timestamp: new Date(data.timestamp),
            isSentByMe: data.isSentByMe,
         };
         setMessages((prev) => [...prev, newMessage]);
      });

      // Listen for typing indicator
      const unsubscribeTyping = existingWs.on('USER_TYPING', (data) => {
         setIsTyping((prev) => ({
            ...prev,
            [data.userId]: data.isTyping,
         }));
      });

      // Listen for connection status
      const unsubscribeConnected = existingWs.on('CONNECTED', () => {
         setIsConnected(true);
      });

      return () => {
         unsubscribeMessage();
         unsubscribeTyping();
         unsubscribeConnected();
      };
   }, [token]);

   const sendMessage = useCallback((receiverId: string, content: string) => {
      if (!ws || !isConnected) {
         console.error('WebSocket not connected');
         return;
      }

      ws.sendMessage(receiverId, content);
   }, [ws, isConnected]);

   const sendTypingIndicator = useCallback((receiverId: string, isTypingFlag: boolean) => {
      if (!ws || !isConnected) return;

      ws.send({
         type: 'USER_TYPING',
         data: {
            receiverId,
            isTyping: isTypingFlag,
         },
      });
   }, [ws, isConnected]);

   return {
      messages,
      isConnected,
      isTyping,
      sendMessage,
      sendTypingIndicator,
   };
}
