import { WebSocketServer, WebSocket } from 'ws';
import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';

interface AuthenticatedWebSocket extends WebSocket {
   userId?: string;
   userType?: string;
   isAlive?: boolean;
}

interface WebSocketMessage {
   type: 'MESSAGE_SEND' | 'MESSAGE_RECEIVE' | 'MESSAGE_SENT_ACK' | 'USER_TYPING' | 'CONNECTED' | 'ERROR';
   data: any;
}

class WebSocketManager {
   private wss: WebSocketServer | null = null;
   private userConnections: Map<string, AuthenticatedWebSocket[]> = new Map();

   constructor() { }

   initialize(server: HTTPServer) {
      this.wss = new WebSocketServer({ noServer: true });

      server.on('upgrade', (req, socket, head) => {
         const url = new URL(req.url || '/', `http://${req.headers.host}`);
         // Only handle our custom WebSocket path; let Next.js handle the rest (HMR, etc.)
         if (url.pathname !== '/ws') {
            return;
         }

         this.wss!.handleUpgrade(req, socket, head, (ws) => {
            this.handleConnection(ws, req);
         });
      });

      // Heartbeat to detect stale connections
      const heartbeatInterval = setInterval(() => {
         this.wss?.clients.forEach((ws: AuthenticatedWebSocket) => {
            if (ws.isAlive === false) {
               return ws.terminate();
            }
            ws.isAlive = false;
            ws.ping();
         });
      }, 30000); // Every 30 seconds

      return this.wss;
   }

   private handleConnection(ws: AuthenticatedWebSocket, req: any) {
      // Extract token from URL query string
      const url = new URL(req.url, `http://${req.headers.host}`);
      const token = url.searchParams.get('token');

      // Verify token
      if (!token) {
         ws.close(1008, 'Token required');
         return;
      }

      try {
         const JWT_SECRET = process.env.JWT_SECRET;
         if (!JWT_SECRET) {
            ws.close(1011, 'Server not configured');
            return;
         }
         const decoded = jwt.verify(token, JWT_SECRET) as any;
         if (!decoded.userId || !decoded.type) {
            ws.close(1008, 'Invalid token payload');
            return;
         }

         ws.userId = decoded.userId as string;
         ws.userType = decoded.type as string;
         ws.isAlive = true;

         // Add to user connections
         if (!this.userConnections.has(ws.userId)) {
            this.userConnections.set(ws.userId, []);
         }
         this.userConnections.get(ws.userId)!.push(ws);

         console.log(`✓ User ${ws.userId} connected`);

         // Send connection confirmation
         this.sendToSocket(ws, {
            type: 'CONNECTED',
            data: { userId: ws.userId, message: 'Connected to WebSocket' },
         });

         // Setup message handler
         ws.on('message', (data) => this.handleMessage(ws, data));

         // Setup close handler
         ws.on('close', () => this.handleClose(ws));

         // Setup pong handler for heartbeat
         ws.on('pong', () => {
            ws.isAlive = true;
         });

         // Setup error handler
         ws.on('error', (error) => {
            console.error(`WebSocket error for user ${ws.userId}:`, error);
         });
      } catch (error) {
         console.error('WebSocket authentication failed:', error);
         ws.close(1008, 'Invalid token');
      }
   }

   private handleMessage(ws: AuthenticatedWebSocket, data: any) {
      try {
         const message = JSON.parse(data.toString ? data.toString() : data) as WebSocketMessage;

         switch (message.type) {
            case 'MESSAGE_SEND':
               this.handleMessageSend(ws, message.data);
               break;
            case 'USER_TYPING':
               this.handleUserTyping(ws, message.data);
               break;
            default:
               console.warn(`Unknown message type: ${message.type}`);
         }
      } catch (error) {
         console.error('Failed to parse WebSocket message:', error);
         this.sendToSocket(ws, {
            type: 'ERROR',
            data: { message: 'Invalid message format' },
         });
      }
   }

   private handleMessageSend(ws: AuthenticatedWebSocket, data: any) {
      const { receiverId, content, timestamp } = data;

      if (!receiverId || !content) {
         this.sendToSocket(ws, {
            type: 'ERROR',
            data: { message: 'Missing receiverId or content' },
         });
         return;
      }

      const message: WebSocketMessage = {
         type: 'MESSAGE_RECEIVE',
         data: {
            senderId: ws.userId,
            receiverId,
            content,
            timestamp,
            isSentByMe: false,
            clientMessageId: data.clientMessageId,
         },
      };

      // Send to receiver only
      const receiverConnections = this.userConnections.get(receiverId);
      if (receiverConnections) {
         receiverConnections.forEach((socket) => {
            this.sendToSocket(socket, message);
         });
      }

      // Send ack to sender (not a full MESSAGE_RECEIVE, just confirmation)
      this.sendToSocket(ws, {
         type: 'MESSAGE_SENT_ACK',
         data: {
            clientMessageId: data.clientMessageId,
            timestamp,
         },
      });

      console.log(`Message sent from ${ws.userId} to ${receiverId}`);
   }

   private handleUserTyping(ws: AuthenticatedWebSocket, data: any) {
      const { receiverId, isTyping } = data;

      if (!receiverId) {
         return;
      }

      const typingMessage: WebSocketMessage = {
         type: 'USER_TYPING',
         data: {
            userId: ws.userId,
            isTyping,
         },
      };

      // Send to receiver
      const receiverConnections = this.userConnections.get(receiverId);
      if (receiverConnections) {
         receiverConnections.forEach((socket) => {
            this.sendToSocket(socket, typingMessage);
         });
      }
   }

   private handleClose(ws: AuthenticatedWebSocket) {
      if (!ws.userId) return;

      const connections = this.userConnections.get(ws.userId);
      if (connections) {
         const index = connections.indexOf(ws);
         if (index > -1) {
            connections.splice(index, 1);
         }

         if (connections.length === 0) {
            this.userConnections.delete(ws.userId);
            console.log(`✗ User ${ws.userId} disconnected`);
         }
      }
   }

   private sendToSocket(ws: AuthenticatedWebSocket, message: WebSocketMessage) {
      if (ws.readyState === WebSocket.OPEN) {
         ws.send(JSON.stringify(message));
      }
   }

   broadcastToUser(userId: string, message: WebSocketMessage) {
      const connections = this.userConnections.get(userId);
      if (connections) {
         connections.forEach((socket) => {
            this.sendToSocket(socket, message);
         });
      }
   }
}

export const wsManager = new WebSocketManager();
