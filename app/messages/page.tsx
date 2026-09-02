'use client';

import { useAuth } from '@/lib/contexts/AuthContext';
import { useWebSocketMessages } from '@/lib/hooks/useWebSocketMessages';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface Conversation {
   otherUserId: string;
   otherUser: {
      name: string;
      email: string;
      type: string;
   };
   lastMessage: string;
   lastTimestamp: Date;
}

interface Message {
   id?: string;
   senderId: string;
   receiverId: string;
   content: string;
   timestamp: Date;
   isSentByMe: boolean;
}

export default function MessagesPage() {
   const { user, token, isAuthenticated } = useAuth();
   const router = useRouter();
   const { messages, isConnected, sendMessage } = useWebSocketMessages();

   const [conversations, setConversations] = useState<Conversation[]>([]);
   const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
   const [messageText, setMessageText] = useState('');
   const [isLoading, setIsLoading] = useState(true);
   const [filteredMessages, setFilteredMessages] = useState<Message[]>([]);

   // Redirect if not authenticated
   useEffect(() => {
      if (!isAuthenticated) {
         router.push('/login');
      }
   }, [isAuthenticated, router]);

   // Fetch conversations
   useEffect(() => {
      const fetchConversations = async () => {
         if (!token) return;

         try {
            const response = await fetch('/api/messages/conversations', {
               headers: {
                  Authorization: `Bearer ${token}`,
               },
            });

            if (response.ok) {
               const data = await response.json();
               setConversations(data.conversations || []);
            }
         } catch (error) {
            console.error('Failed to fetch conversations:', error);
         } finally {
            setIsLoading(false);
         }
      };

      fetchConversations();
   }, [token]);

   // Filter messages for selected conversation
   useEffect(() => {
      if (selectedUserId) {
         const filtered = messages.filter(
            (msg) =>
               (msg.senderId === user?.id && msg.receiverId === selectedUserId) ||
               (msg.senderId === selectedUserId && msg.receiverId === user?.id)
         );
         setFilteredMessages(filtered);
      }
   }, [messages, selectedUserId, user?.id]);

   // Load message history when selecting a conversation
   useEffect(() => {
      const loadHistory = async () => {
         if (!selectedUserId || !token) return;

         try {
            const response = await fetch(`/api/messages/history/${selectedUserId}`, {
               headers: {
                  Authorization: `Bearer ${token}`,
               },
            });

            if (response.ok) {
               const data = await response.json();
               const history = (data.messages || []).map((msg: any) => ({
                  ...msg,
                  timestamp: new Date(msg.timestamp),
               }));
               setFilteredMessages(history);
            }
         } catch (error) {
            console.error('Failed to load message history:', error);
         }
      };

      loadHistory();
   }, [selectedUserId, token]);

   const handleSendMessage = (e: React.FormEvent) => {
      e.preventDefault();

      if (!messageText.trim() || !selectedUserId) return;

      // Send via REST API
      fetch('/api/messages', {
         method: 'POST',
         headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
         },
         body: JSON.stringify({
            receiverId: selectedUserId,
            content: messageText,
         }),
      }).catch((error) => {
         console.error('Failed to send message:', error);
      });

      // Also send via WebSocket for real-time
      sendMessage(selectedUserId, messageText);

      setMessageText('');
   };

   if (!isAuthenticated) {
      return null;
   }

   return (
      <div className="flex h-screen bg-gray-50">
         {/* Sidebar */}
         <div className="w-1/3 bg-white border-r border-gray-200 flex flex-col">
            <div className="p-4 border-b">
               <h2 className="text-xl font-bold text-gray-900">Messages</h2>
            </div>

            {isLoading ? (
               <div className="flex items-center justify-center flex-1">
                  <p className="text-gray-500">Loading conversations...</p>
               </div>
            ) : conversations.length === 0 ? (
               <div className="flex items-center justify-center flex-1">
                  <p className="text-gray-500">No conversations yet</p>
               </div>
            ) : (
               <div className="flex-1 overflow-y-auto">
                  {conversations.map((conv) => (
                     <button
                        key={conv.otherUserId}
                        onClick={() => setSelectedUserId(conv.otherUserId)}
                        className={`w-full p-4 text-left border-b hover:bg-gray-50 ${selectedUserId === conv.otherUserId ? 'bg-blue-50' : ''
                           }`}
                     >
                        <h3 className="font-medium text-gray-900">{conv.otherUser.name}</h3>
                        <p className="text-sm text-gray-600 truncate">{conv.lastMessage}</p>
                        <p className="text-xs text-gray-400 mt-1">
                           {new Date(conv.lastTimestamp).toLocaleDateString()}
                        </p>
                     </button>
                  ))}
               </div>
            )}
         </div>

         {/* Chat Area */}
         <div className="flex-1 flex flex-col bg-white">
            {selectedUserId ? (
               <>
                  {/* Header */}
                  <div className="p-4 border-b bg-gray-50">
                     <h2 className="text-lg font-bold text-gray-900">
                        {conversations.find((c) => c.otherUserId === selectedUserId)?.otherUser.name ||
                           'Chat'}
                     </h2>
                     <p className={`text-sm ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
                        {isConnected ? '✓ Connected' : '✗ Disconnected'}
                     </p>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                     {filteredMessages.length === 0 ? (
                        <div className="flex items-center justify-center h-full">
                           <p className="text-gray-500">No messages yet. Start the conversation!</p>
                        </div>
                     ) : (
                        filteredMessages.map((msg, idx) => (
                           <div
                              key={idx}
                              className={`flex ${msg.isSentByMe ? 'justify-end' : 'justify-start'}`}
                           >
                              <div
                                 className={`max-w-xs px-4 py-2 rounded-lg ${msg.isSentByMe
                                       ? 'bg-blue-600 text-white'
                                       : 'bg-gray-200 text-gray-900'
                                    }`}
                              >
                                 <p className="text-sm">{msg.content}</p>
                                 <p className="text-xs mt-1 opacity-70">
                                    {new Date(msg.timestamp).toLocaleTimeString()}
                                 </p>
                              </div>
                           </div>
                        ))
                     )}
                  </div>

                  {/* Input */}
                  <form onSubmit={handleSendMessage} className="p-4 border-t bg-gray-50">
                     <div className="flex gap-2">
                        <input
                           type="text"
                           value={messageText}
                           onChange={(e) => setMessageText(e.target.value)}
                           placeholder="Type a message..."
                           className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                           type="submit"
                           disabled={!messageText.trim() || !isConnected}
                           className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                           Send
                        </button>
                     </div>
                  </form>
               </>
            ) : (
               <div className="flex items-center justify-center h-full">
                  <p className="text-gray-500">Select a conversation to start messaging</p>
               </div>
            )}
         </div>
      </div>
   );
}
