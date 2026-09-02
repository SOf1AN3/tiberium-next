'use client';

import { useAuth } from '@/lib/contexts/AuthContext';
import { useWebSocketMessages } from '@/lib/hooks/useWebSocketMessages';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

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

const toInitials = (name: string) =>
   name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((n) => n[0]?.toUpperCase())
      .join('');

export default function MessagesPage() {
   const { user, token, isAuthenticated } = useAuth();
   const router = useRouter();
   const { messages, isConnected, sendMessage } = useWebSocketMessages();

   const [conversations, setConversations] = useState<Conversation[]>([]);
   const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
   const [messageText, setMessageText] = useState('');
   const [search, setSearch] = useState('');
   const [isLoading, setIsLoading] = useState(true);
   const [historyMessages, setHistoryMessages] = useState<Message[]>([]);

   useEffect(() => {
      if (!isAuthenticated) {
         router.push('/login');
      }
   }, [isAuthenticated, router]);

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

   const filteredMessages = useMemo(() => {
      if (!selectedUserId || !user?.id) return [];

      const liveMessages = messages.filter(
         (msg) =>
            (msg.senderId === user.id && msg.receiverId === selectedUserId) ||
            (msg.senderId === selectedUserId && msg.receiverId === user.id)
      );

      const seen = new Set<string>();
      return [...historyMessages, ...liveMessages].filter((msg) => {
         if (msg.id && seen.has(msg.id)) return false;
         if (msg.id) seen.add(msg.id);
         return true;
      });
   }, [messages, historyMessages, selectedUserId, user]);

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
               const history = (data.messages || []).map((msg: Message) => ({
                  ...msg,
                  timestamp: new Date(msg.timestamp),
               }));
               setHistoryMessages(history);
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

      sendMessage(selectedUserId, messageText);
      setMessageText('');
   };

   if (!isAuthenticated) {
      return null;
   }

   const selectedConv = conversations.find((c) => c.otherUserId === selectedUserId);
   const visibleConversations = conversations.filter((conv) =>
      conv.otherUser.name.toLowerCase().includes(search.toLowerCase())
   );

   return (
      <div className="chat-page">
         <aside className="chat-sidebar">
            <div className="chat-sidebar-header">
               <h2>Messages</h2>
               <input
                  type="search"
                  className="chat-search"
                  placeholder="Search..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
               />
            </div>
            <div className="chat-list">
               {isLoading ? (
                  <div className="chat-empty">
                     <p>Loading conversations...</p>
                  </div>
               ) : visibleConversations.length === 0 ? (
                  <div className="chat-empty">
                     <p>No conversations yet</p>
                  </div>
               ) : (
                  visibleConversations.map((conv) => (
                     <button
                        key={conv.otherUserId}
                        onClick={() => setSelectedUserId(conv.otherUserId)}
                        className={`chat-item ${selectedUserId === conv.otherUserId ? 'selected' : ''}`}
                     >
                        <span className="chat-avatar">{toInitials(conv.otherUser.name)}</span>
                        <span className="chat-item-body">
                           <h3>{conv.otherUser.name}</h3>
                           <p>{conv.lastMessage}</p>
                        </span>
                        <span className="chat-item-time">
                           {new Date(conv.lastTimestamp).toLocaleDateString()}
                        </span>
                     </button>
                  ))
               )}
            </div>
         </aside>

         <section className="chat-main">
            {selectedUserId ? (
               <>
                  <header className="chat-header">
                     <h2>{selectedConv?.otherUser.name || 'Chat'}</h2>
                     <span className={`chat-status ${isConnected ? 'online' : 'offline'}`}>
                        <span className="chat-status-dot"></span>
                        {isConnected ? 'Connected' : 'Offline'}
                     </span>
                  </header>

                  <div className="chat-body">
                     {filteredMessages.length === 0 ? (
                        <div className="chat-empty">
                           <p>No messages yet. Start the conversation!</p>
                        </div>
                     ) : (
                        filteredMessages.map((msg, idx) => (
                           <div
                              key={idx}
                              className={`chat-bubble ${msg.isSentByMe ? 'sent' : 'received'}`}
                           >
                              <p>{msg.content}</p>
                              <span className="bubble-time">
                                 {new Date(msg.timestamp).toLocaleTimeString()}
                              </span>
                           </div>
                        ))
                     )}
                  </div>

                  <form onSubmit={handleSendMessage} className="chat-input-row">
                     <input
                        type="text"
                        className="input-base"
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        placeholder="Type a message..."
                     />
                     <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={!messageText.trim() || !isConnected}
                     >
                        Send
                     </button>
                  </form>
               </>
            ) : (
               <div className="chat-empty">
                  <p>Select a conversation to start messaging</p>
               </div>
            )}
         </section>
      </div>
   );
}