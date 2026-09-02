export interface WebSocketMessage {
   type: 'MESSAGE_SEND' | 'MESSAGE_RECEIVE' | 'USER_TYPING' | 'ERROR' | 'CONNECTED';
   data: any;
}

class WebSocketClient {
   private ws: WebSocket | null = null;
   private url: string;
   private token: string;
   private reconnectAttempts = 0;
   private maxReconnectAttempts = 5;
   private reconnectDelay = 3000;
   private listeners: Map<string, Set<(data: any) => void>> = new Map();
   private messageQueue: WebSocketMessage[] = [];

   constructor(url: string, token: string) {
      this.url = url;
      this.token = token;
   }

   connect(): Promise<void> {
      return new Promise((resolve, reject) => {
         try {
            const wsUrl = new URL(this.url);
            if (wsUrl.pathname === '/' || wsUrl.pathname === '') {
               wsUrl.pathname = '/ws';
            }
            wsUrl.searchParams.append('token', this.token);

            this.ws = new WebSocket(wsUrl.toString());

            this.ws.onopen = () => {
               console.log('✓ WebSocket connected');
               this.reconnectAttempts = 0;

               // Send queued messages
               while (this.messageQueue.length > 0) {
                  const message = this.messageQueue.shift();
                  if (message) {
                     this.send(message);
                  }
               }

               this.emit('CONNECTED', {});
               resolve();
            };

            this.ws.onmessage = (event) => {
               try {
                  const message = JSON.parse(event.data) as WebSocketMessage;
                  this.emit(message.type, message.data);
               } catch (error) {
                  console.error('Failed to parse WebSocket message:', error);
               }
            };

            this.ws.onerror = (error) => {
               console.error('WebSocket error:', error);
               this.emit('ERROR', { error: 'WebSocket connection error' });
               reject(error);
            };

            this.ws.onclose = () => {
               console.log('WebSocket disconnected');
               this.attemptReconnect();
            };
         } catch (error) {
            reject(error);
         }
      });
   }

   private attemptReconnect() {
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
         this.reconnectAttempts++;
         console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);

         setTimeout(() => {
            this.connect().catch((error) => {
               console.error('Reconnection failed:', error);
            });
         }, this.reconnectDelay);
      } else {
         console.error('Max reconnection attempts reached');
         this.emit('ERROR', { error: 'Connection lost permanently' });
      }
   }

   send(message: WebSocketMessage) {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
         this.ws.send(JSON.stringify(message));
      } else {
         // Queue message if not connected
         this.messageQueue.push(message);
      }
   }

   sendMessage(receiverId: string, content: string) {
      this.send({
         type: 'MESSAGE_SEND',
         data: {
            receiverId,
            content,
            timestamp: new Date().toISOString(),
         },
      });
   }

   on(event: string, callback: (data: any) => void) {
      if (!this.listeners.has(event)) {
         this.listeners.set(event, new Set());
      }
      this.listeners.get(event)!.add(callback);

      // Return unsubscribe function
      return () => {
         this.listeners.get(event)?.delete(callback);
      };
   }

   private emit(event: string, data: any) {
      const callbacks = this.listeners.get(event);
      if (callbacks) {
         callbacks.forEach((callback) => {
            try {
               callback(data);
            } catch (error) {
               console.error(`Error in listener for event ${event}:`, error);
            }
         });
      }
   }

   disconnect() {
      if (this.ws) {
         this.ws.close();
         this.ws = null;
      }
      this.listeners.clear();
      this.messageQueue = [];
   }

   isConnected(): boolean {
      return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
   }
}

// Global WebSocket instance
let wsClient: WebSocketClient | null = null;

export function createWebSocketClient(token: string): WebSocketClient {
   const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3000/ws';
   wsClient = new WebSocketClient(wsUrl, token);
   return wsClient;
}

export function getWebSocketClient(): WebSocketClient | null {
   return wsClient;
}

export default WebSocketClient;
