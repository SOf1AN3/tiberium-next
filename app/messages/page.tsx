'use client';

import { useAuth } from '@/lib/contexts/AuthContext';
import { useWebSocketMessages } from '@/lib/hooks/useWebSocketMessages';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

interface LinkedUser {
   _id: string;
   linkedUserId: string;
   linkedUser: {
      name: string;
      email: string;
      type: string;
   };
   status: string;
   createdAt: string;
}

interface UnassignedClient {
   _id: string;
   name: string;
   email: string;
   type: string;
   isConfirmed: boolean;
   createdAt: string;
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

   const [conversations, setConversations] = useState<LinkedUser[]>([]);
   const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
   const [messageText, setMessageText] = useState('');
   const [search, setSearch] = useState('');
   const [isLoading, setIsLoading] = useState(true);
   const [historyMessages, setHistoryMessages] = useState<Message[]>([]);

   const [showNewClientModal, setShowNewClientModal] = useState(false);
   const [unassignedClients, setUnassignedClients] = useState<UnassignedClient[]>([]);
   const [loadingUnassigned, setLoadingUnassigned] = useState(false);
   const [creatingConversation, setCreatingConversation] = useState(false);

   const isAdmin = user?.type === 'admin';

   useEffect(() => {
      if (!isAuthenticated) {
         router.push('/login');
      }
   }, [isAuthenticated, router]);

   useEffect(() => {
      const fetchConversations = async () => {
         if (!token) return;

         try {
            const response = await fetch('/api/conversations', {
               headers: { Authorization: `Bearer ${token}` },
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
               headers: { Authorization: `Bearer ${token}` },
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

   const openNewClientModal = async () => {
      setShowNewClientModal(true);
      setLoadingUnassigned(true);
      try {
         const response = await fetch('/api/conversations/unassigned', {
            headers: { Authorization: `Bearer ${token}` },
         });
         if (response.ok) {
            const data = await response.json();
            setUnassignedClients(data.clients || []);
         }
      } catch (error) {
         console.error('Failed to fetch unassigned clients:', error);
      } finally {
         setLoadingUnassigned(false);
      }
   };

   const startConversation = async (clientId: string) => {
      setCreatingConversation(true);
      try {
         const response = await fetch('/api/conversations', {
            method: 'POST',
            headers: {
               'Content-Type': 'application/json',
               Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ clientId }),
         });

         if (response.ok) {
            setShowNewClientModal(false);
            const convsResp = await fetch('/api/conversations', {
               headers: { Authorization: `Bearer ${token}` },
            });
            if (convsResp.ok) {
               const data = await convsResp.json();
               setConversations(data.conversations || []);
            }
            setSelectedUserId(clientId);
         }
      } catch (error) {
         console.error('Failed to create conversation:', error);
      } finally {
         setCreatingConversation(false);
      }
   };

   const closeConversation = async () => {
      if (!selectedUserId || !token) return;

      const conv = conversations.find((c) => c.linkedUserId === selectedUserId);
      if (!conv) return;

      try {
         const response = await fetch(`/api/conversations/${conv._id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
         });

         if (response.ok) {
            setConversations((prev) => prev.filter((c) => c._id !== conv._id));
            setSelectedUserId(null);
            setHistoryMessages([]);
         }
      } catch (error) {
         console.error('Failed to close conversation:', error);
      }
   };

   if (!isAuthenticated) {
      return null;
   }

   const selectedConv = conversations.find((c) => c.linkedUserId === selectedUserId);
   const visibleConversations = conversations.filter((conv) =>
      conv.linkedUser.name.toLowerCase().includes(search.toLowerCase())
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
               {isAdmin && (
                  <button
                     className="btn btn-primary"
                     style={{ marginTop: 12, width: '100%' }}
                     onClick={openNewClientModal}
                  >
                     + New client
                  </button>
               )}
            </div>
            <div className="chat-list">
               {isLoading ? (
                  <div className="chat-empty">
                     <p>Loading conversations...</p>
                  </div>
               ) : visibleConversations.length === 0 ? (
                  <div className="chat-empty">
                     {isAdmin ? (
                        <p>No clients assigned yet</p>
                     ) : (
                        <p>Waiting for an admin to contact you...</p>
                     )}
                  </div>
               ) : (
                  visibleConversations.map((conv) => (
                     <button
                        key={conv.linkedUserId}
                        onClick={() => setSelectedUserId(conv.linkedUserId)}
                        className={`chat-item ${selectedUserId === conv.linkedUserId ? 'selected' : ''}`}
                     >
                        <span className="chat-avatar">
                           {toInitials(conv.linkedUser.name)}
                        </span>
                        <span className="chat-item-body">
                           <h3>{conv.linkedUser.name}</h3>
                           <p>{conv.linkedUser.email}</p>
                        </span>
                        <span className="chat-item-time">
                           {new Date(conv.createdAt).toLocaleDateString()}
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
                     <h2>{selectedConv?.linkedUser.name || 'Chat'}</h2>
                     <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <span className={`chat-status ${isConnected ? 'online' : 'offline'}`}>
                           <span className="chat-status-dot"></span>
                           {isConnected ? 'Connected' : 'Offline'}
                        </span>
                        <button
                           className="btn btn-ghost"
                           style={{ fontSize: '0.8rem', color: 'var(--danger)' }}
                           onClick={closeConversation}
                        >
                           Close
                        </button>
                     </div>
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
                  {isAdmin ? (
                     <p>Select a client or assign a new one</p>
                  ) : (
                     <p>Your admin will reach out to you soon</p>
                  )}
               </div>
            )}
         </section>

         {showNewClientModal && (
            <div
               className="modal-overlay"
               onClick={() => setShowNewClientModal(false)}
            >
               <div
                  className="modal-content"
                  onClick={(e) => e.stopPropagation()}
                  style={{ maxWidth: 480, maxHeight: '80vh', overflow: 'auto' }}
               >
                  <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
                     <h3>Assign a client</h3>
                  </div>
                  <div style={{ padding: 16 }}>
                     {loadingUnassigned ? (
                        <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                           Loading...
                        </p>
                     ) : unassignedClients.length === 0 ? (
                        <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                           All clients are assigned
                        </p>
                     ) : (
                        unassignedClients.map((client) => (
                           <button
                              key={client._id}
                              style={{
                                 width: '100%',
                                 padding: '12px 16px',
                                 display: 'flex',
                                 alignItems: 'center',
                                 gap: 12,
                                 textAlign: 'left',
                                 borderBottom: '1px solid var(--surface-2)',
                                 background: 'none',
                                 cursor: 'pointer',
                              }}
                              onClick={() => startConversation(client._id)}
                              disabled={creatingConversation}
                           >
                              <span className="chat-avatar">{toInitials(client.name)}</span>
                              <span className="chat-item-body">
                                 <h3>{client.name}</h3>
                                 <p>{client.email}</p>
                              </span>
                           </button>
                        ))
                     )}
                  </div>
                  <div
                     style={{
                        padding: '12px 24px',
                        borderTop: '1px solid var(--border)',
                        textAlign: 'right',
                     }}
                  >
                     <button
                        className="btn btn-ghost"
                        onClick={() => setShowNewClientModal(false)}
                     >
                        Cancel
                     </button>
                  </div>
               </div>
            </div>
         )}
      </div>
   );
}
