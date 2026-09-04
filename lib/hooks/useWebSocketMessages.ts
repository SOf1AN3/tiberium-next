import { useAuth } from '@/lib/contexts/AuthContext';
import { useEffect, useState, useCallback, useRef } from 'react';
import WebSocketClient, { createWebSocketClient, getWebSocketClient } from '@/lib/websocket';

interface Message {
   id?: string;
   senderId: string;
   receiverId: string;
   content: string;
   timestamp: Date;
   isSentByMe: boolean;
   clientMessageId?: string;
}

let messageIdCounter = 0;

export function useWebSocketMessages() {
   const { token } = useAuth();
   const [ws, setWs] = useState<WebSocketClient | null>(null);
   const [messages, setMessages] = useState<Message[]>([]);
   const [isConnected, setIsConnected] = useState(false);
   const [isTyping, setIsTyping] = useState<{ [key: string]: boolean }>({});

   const messagesRef = useRef(messages);
   messagesRef.current = messages;

   useEffect(() => {
      if (!token) return;

      let existingWs = getWebSocketClient();
      if (!existingWs) {
         existingWs = createWebSocketClient(token);
      }

      setWs(existingWs);
      setIsConnected(existingWs.isConnected());

      existingWs
         .connect()
         .then(() => {
            setIsConnected(true);
         })
         .catch(() => {});

      const unsubscribeMessage = existingWs.on('MESSAGE_RECEIVE', (data) => {
         const existing = messagesRef.current.find(
            (m) =>
               (data.clientMessageId && m.clientMessageId === data.clientMessageId) ||
               (!data.clientMessageId &&
                  m.senderId === data.senderId &&
                  m.receiverId === data.receiverId &&
                  m.content === data.content &&
                  Math.abs(m.timestamp.getTime() - new Date(data.timestamp).getTime()) < 2000)
         );
         if (existing) return;

         const newMessage: Message = {
            id: data.id,
            senderId: data.senderId,
            receiverId: data.receiverId,
            content: data.content,
            timestamp: new Date(data.timestamp),
            isSentByMe: data.isSentByMe,
            clientMessageId: data.clientMessageId,
         };
         setMessages((prev) => [...prev, newMessage]);
      });

      const unsubscribeTyping = existingWs.on('USER_TYPING', (data) => {
         setIsTyping((prev) => ({
            ...prev,
            [data.userId]: data.isTyping,
         }));
      });

      const unsubscribeConnected = existingWs.on('CONNECTED', () => {
         setIsConnected(true);
      });

      const unsubscribeDisconnected = existingWs.on('DISCONNECTED', () => {
         setIsConnected(false);
      });

      return () => {
         unsubscribeMessage();
         unsubscribeTyping();
         unsubscribeConnected();
         unsubscribeDisconnected();
      };
   }, [token]);

   const sendMessage = useCallback((receiverId: string, content: string) => {
      const clientMessageId = `client-${Date.now()}-${++messageIdCounter}`;

      const newMessage: Message = {
         senderId: '',
         receiverId,
         content,
         timestamp: new Date(),
         isSentByMe: true,
         clientMessageId,
      };

      setMessages((prev) => [...prev, newMessage]);

      const currentWs = ws || getWebSocketClient();
      if (currentWs) {
         currentWs.sendMessage(receiverId, content, clientMessageId);
      }
   }, [ws]);

   const sendTypingIndicator = useCallback((receiverId: string, isTypingFlag: boolean) => {
      const currentWs = ws || getWebSocketClient();
      if (!currentWs) return;

      currentWs.send({
         type: 'USER_TYPING',
         data: {
            receiverId,
            isTyping: isTypingFlag,
         },
      });
   }, [ws]);

   return {
      messages,
      isConnected,
      isTyping,
      sendMessage,
      sendTypingIndicator,
   };
}
