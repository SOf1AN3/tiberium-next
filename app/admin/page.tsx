'use client';

import { useAuth } from '@/lib/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from '@/lib/i18n';

interface User {
   id: string;
   name: string;
   email: string;
   type: 'simple' | 'advanced' | 'premium' | 'admin';
   isConfirmed: boolean;
   createdAt?: string;
}

interface Stats {
   totalUsers: number;
   confirmedUsers: number;
   pendingUsers: number;
   byType: { simple: number; advanced: number; premium: number; admin: number };
   totalMessages: number;
   recentUsers: number;
   activeConversations: number;
}

interface Toast {
   id: number;
   message: string;
   type: 'success' | 'error';
}

export default function AdminPanel() {
   const { user, token, isAuthenticated, isLoading: authLoading } = useAuth();
   const router = useRouter();
   const { t } = useTranslation();

   const [users, setUsers] = useState<User[]>([]);
   const [stats, setStats] = useState<Stats | null>(null);
   const [isLoading, setIsLoading] = useState(true);
   const [error, setError] = useState('');

   const [search, setSearch] = useState('');
   const [filterType, setFilterType] = useState('');
   const [filterConfirmed, setFilterConfirmed] = useState('');
   const [page, setPage] = useState(1);
   const [totalPages, setTotalPages] = useState(1);
   const [total, setTotal] = useState(0);
   const [sort, setSort] = useState('createdAt');
   const [order, setOrder] = useState<'asc' | 'desc'>('desc');

   const [toasts, setToasts] = useState<Toast[]>([]);
   const toastIdRef = useRef(0);

   const [deleteModal, setDeleteModal] = useState<User | null>(null);
   const [detailModal, setDetailModal] = useState<User | null>(null);
   const [startingChat, setStartingChat] = useState<string | null>(null);

   useEffect(() => {
      if (authLoading) return;
      if (!isAuthenticated) {
         router.push('/login');
      } else if (user?.type !== 'admin') {
         router.push('/');
      }
   }, [authLoading, isAuthenticated, user, router]);

   const showToast = useCallback((message: string, type: 'success' | 'error') => {
      const id = ++toastIdRef.current;
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => {
         setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3000);
   }, []);

   const runFetchUsers = useCallback(async (cancelled?: () => boolean) => {
      if (!token) return;
      try {
         const params = new URLSearchParams();
         if (search) params.set('search', search);
         if (filterType) params.set('type', filterType);
         if (filterConfirmed) params.set('confirmed', filterConfirmed);
         params.set('page', String(page));
         params.set('limit', '20');
         params.set('sort', sort);
         params.set('order', order);

         const response = await fetch(`/api/auth/users?${params.toString()}`, {
            headers: { Authorization: `Bearer ${token}` },
         });

         if (cancelled?.()) return;

         if (response.ok) {
            const data = await response.json();
            setUsers(data.users || []);
            setTotalPages(data.totalPages || 1);
            setTotal(data.total || 0);
         } else {
            setError('Failed to fetch users');
         }
      } catch (err) {
         setError('Failed to fetch users');
         console.error('Fetch error:', err);
      } finally {
         if (!cancelled?.()) {
            setIsLoading(false);
         }
      }
   }, [token, search, filterType, filterConfirmed, page, sort, order]);

   const fetchStats = useCallback(async (cancelled?: () => boolean) => {
      if (!token) return;
      try {
         const response = await fetch('/api/auth/stats', {
            headers: { Authorization: `Bearer ${token}` },
         });
         if (cancelled?.()) return;
         if (response.ok) {
            const data = await response.json();
            setStats(data.stats);
         }
      } catch (err) {
         console.error('Stats error:', err);
      }
   }, [token]);

   useEffect(() => {
      let cancelled = false;
      (async () => {
         await runFetchUsers(() => cancelled);
      })();
      return () => {
         cancelled = true;
      };
   }, [runFetchUsers]);

   useEffect(() => {
      let cancelled = false;
      (async () => {
         await fetchStats(() => cancelled);
      })();
      return () => {
         cancelled = true;
      };
   }, [fetchStats]);

   const handleSort = (field: string) => {
      if (sort === field) {
         setOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      } else {
         setSort(field);
         setOrder('asc');
      }
      setPage(1);
   };

   const handleSearchChange = (value: string) => {
      setSearch(value);
      setPage(1);
   };

   const handleUpdateUserType = async (userId: string, newType: string) => {
      if (!token) return;
      try {
         const response = await fetch(`/api/auth/users/${userId}/type`, {
            method: 'PATCH',
            headers: {
               'Content-Type': 'application/json',
               Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ type: newType }),
         });

         if (response.ok) {
            const data = await response.json();
            setUsers((prev) => prev.map((u) => (u.id === userId ? data.user : u)));
            showToast(t('admin_toast_type_updated'), 'success');
            fetchStats();
         } else {
            const data = await response.json();
            showToast(data.message || t('admin_toast_type_error'), 'error');
         }
      } catch (err) {
         showToast(t('admin_toast_type_error'), 'error');
         console.error('Update error:', err);
      }
   };

   const handleToggleConfirm = async (userId: string) => {
      if (!token) return;
      try {
         const response = await fetch(`/api/auth/users/${userId}/confirm`, {
            method: 'PATCH',
            headers: { Authorization: `Bearer ${token}` },
         });

         if (response.ok) {
            const data = await response.json();
            setUsers((prev) => prev.map((u) => (u.id === userId ? data.user : u)));
            showToast(data.message, 'success');
            fetchStats();
         } else {
            const data = await response.json();
            showToast(data.message || t('admin_toast_type_error'), 'error');
         }
      } catch (err) {
         showToast(t('admin_toast_type_error'), 'error');
         console.error('Toggle confirm error:', err);
      }
   };

   const handleDeleteUser = async (userId: string) => {
      if (!token) return;
      try {
         const response = await fetch(`/api/auth/users/${userId}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
         });

         if (response.ok) {
            setDeleteModal(null);
            showToast(t('admin_toast_deleted'), 'success');
            runFetchUsers();
            fetchStats();
         } else {
            const data = await response.json();
            showToast(data.message || t('admin_toast_delete_error'), 'error');
         }
      } catch (err) {
         showToast(t('admin_toast_delete_error'), 'error');
         console.error('Delete error:', err);
      }
   };

   const handleStartConversation = async (userId: string) => {
      if (!token) return;
      setStartingChat(userId);
      try {
         const response = await fetch('/api/conversations', {
            method: 'POST',
            headers: {
               'Content-Type': 'application/json',
               Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ clientId: userId }),
         });

         if (response.ok) {
            showToast('Conversation started', 'success');
            router.push(`/messages`);
         } else {
            const data = await response.json();
            showToast(data.message || 'Could not start conversation', 'error');
         }
      } catch (err) {
         showToast('Could not start conversation', 'error');
         console.error('Start conversation error:', err);
      } finally {
         setStartingChat(null);
      }
   };

   const sortIcon = (field: string) => {
      if (sort !== field) return <span className="admin-sort-icon">↕</span>;
      return (
         <span className="admin-sort-icon">{order === 'asc' ? '↑' : '↓'}</span>
      );
   };

   const typeLabel = (type: string) => {
      switch (type) {
         case 'simple':
            return t('admin_type_simple');
         case 'advanced':
            return t('admin_type_advanced');
         case 'premium':
            return t('admin_type_premium');
         case 'admin':
            return t('admin_type_admin');
         default:
            return type;
      }
   };

   const initials = (name: string) =>
      name
         .split(' ')
         .filter(Boolean)
         .map((p) => p[0])
         .slice(0, 2)
         .join('')
         .toUpperCase();

   const pageNumbers = (() => {
      const pages: number[] = [];
      const start = Math.max(1, page - 2);
      const end = Math.min(totalPages, page + 2);
      for (let i = start; i <= end; i++) pages.push(i);
      return pages;
   })();

   if (authLoading || !isAuthenticated || user?.type !== 'admin') {
      return null;
   }

   return (
      <div className="admin-page">
         <header className="admin-topbar">
            <div className="admin-topbar-inner">
               <div className="admin-topbar-left">
                  <button
                     className="admin-back"
                     onClick={() => router.push('/')}
                     aria-label={t('admin_back_to_home')}
                     title={t('admin_back_to_home')}
                  >
                     ←
                  </button>
                  <div>
                     <h1 className="admin-title">{t('admin_title')}</h1>
                     <p className="admin-subtitle">{t('admin_users_count', { count: total })}</p>
                  </div>
               </div>
               <div className="admin-current-user">
                  <span className="admin-avatar">{user?.name ? initials(user.name) : 'A'}</span>
                  <div>
                     <span className="admin-current-name">{user?.name}</span>
                     <span className="admin-current-role">{t('admin_role')}</span>
                  </div>
               </div>
            </div>
         </header>

         <main className="admin-main">
            {stats && (
               <section className="admin-stats">
                  <div className="stat-card">
                     <div className="stat-card-top">
                        <span className="stat-card-icon">👥</span>
                        <strong>{stats.totalUsers}</strong>
                     </div>
                     <span className="stat-card-label">{t('admin_stat_users')}</span>
                     <em className="stat-card-sub">{t('admin_stat_users_week', { count: stats.recentUsers })}</em>
                  </div>
                  <div className="stat-card">
                     <div className="stat-card-top">
                        <span className="stat-card-icon">✅</span>
                        <strong>{stats.confirmedUsers}</strong>
                     </div>
                     <span className="stat-card-label">{t('admin_stat_confirmed')}</span>
                     <em className="stat-card-sub">{t('admin_stat_active_accounts')}</em>
                  </div>
                  <div className="stat-card">
                     <div className="stat-card-top">
                        <span className="stat-card-icon">⏳</span>
                        <strong>{stats.pendingUsers}</strong>
                     </div>
                     <span className="stat-card-label">{t('admin_stat_pending')}</span>
                     <em className="stat-card-sub">{t('admin_stat_not_confirmed')}</em>
                  </div>
                  <div className="stat-card">
                     <div className="stat-card-top">
                        <span className="stat-card-icon">🛡️</span>
                        <strong>{stats.byType.admin}</strong>
                     </div>
                     <span className="stat-card-label">{t('admin_stat_admins')}</span>
                     <em className="stat-card-sub">{t('admin_stat_administrators')}</em>
                  </div>
                  <div className="stat-card">
                     <div className="stat-card-top">
                        <span className="stat-card-icon">💬</span>
                        <strong>{stats.totalMessages}</strong>
                     </div>
                     <span className="stat-card-label">{t('admin_stat_messages')}</span>
                     <em className="stat-card-sub">{t('admin_stat_conversations', { count: stats.activeConversations })}</em>
                  </div>
               </section>
            )}

            {error && <div className="admin-error">{error}</div>}

            <section className="admin-panel">
               <div className="admin-toolbar">
                  <div className="admin-search-wrap">
                     <span className="admin-search-icon">⌕</span>
                     <input
                        type="text"
                        className="admin-search"
                        placeholder={t('admin_search_placeholder')}
                        value={search}
                        onChange={(e) => handleSearchChange(e.target.value)}
                     />
                  </div>
                  <select
                     className="admin-filter"
                     value={filterType}
                     onChange={(e) => {
                        setFilterType(e.target.value);
                        setPage(1);
                     }}
                     aria-label={t('admin_filter_by_type')}
                  >
                     <option value="">{t('admin_filter_all_types')}</option>
                     <option value="simple">{t('admin_type_simple')}</option>
                     <option value="advanced">{t('admin_type_advanced')}</option>
                     <option value="premium">{t('admin_type_premium')}</option>
                     <option value="admin">{t('admin_type_admin')}</option>
                  </select>
                  <select
                     className="admin-filter"
                     value={filterConfirmed}
                     onChange={(e) => {
                        setFilterConfirmed(e.target.value);
                        setPage(1);
                     }}
                     aria-label={t('admin_filter_by_status')}
                  >
                     <option value="">{t('admin_filter_all_status')}</option>
                     <option value="true">{t('admin_status_confirmed')}</option>
                     <option value="false">{t('admin_status_pending')}</option>
                  </select>
               </div>

               {isLoading ? (
                  <div className="admin-loading">
                     <div className="loading-spinner"></div>
                     <p>{t('admin_loading')}</p>
                  </div>
               ) : users.length === 0 ? (
                  <div className="admin-loading">
                     <p>{t('admin_no_users')}</p>
                  </div>
               ) : (
                  <>
                     <div className="admin-table-wrap">
                        <table className="admin-table">
                           <thead>
                              <tr>
                                 <th>
                                    <button
                                       className={`admin-sortable ${sort === 'name' ? 'admin-sort-active' : ''}`}
                                       onClick={() => handleSort('name')}
                                    >
                                       {t('admin_col_user')} {sortIcon('name')}
                                    </button>
                                 </th>
                                 <th>
                                    <button
                                       className={`admin-sortable ${sort === 'type' ? 'admin-sort-active' : ''}`}
                                       onClick={() => handleSort('type')}
                                    >
                                       {t('admin_col_type')} {sortIcon('type')}
                                    </button>
                                 </th>
                                 <th>{t('admin_col_status')}</th>
                                 <th>
                                    <button
                                       className={`admin-sortable ${sort === 'createdAt' ? 'admin-sort-active' : ''}`}
                                       onClick={() => handleSort('createdAt')}
                                    >
                                       {t('admin_col_signup')} {sortIcon('createdAt')}
                                    </button>
                                 </th>
                                 <th className="admin-th-actions">{t('admin_col_actions')}</th>
                              </tr>
                           </thead>
                           <tbody>
                              {users.map((u) => (
                                 <tr key={u.id} className="admin-row">
                                    <td>
                                       <div className="admin-user-cell">
                                          <span className="admin-user-avatar">{initials(u.name)}</span>
                                          <div>
                                             <div className="admin-name">{u.name}</div>
                                             <div className="admin-email">{u.email}</div>
                                          </div>
                                       </div>
                                    </td>
                                    <td>
                                       <span className={`admin-type-badge admin-type-${u.type}`}>
                                          {typeLabel(u.type)}
                                       </span>
                                    </td>
                                    <td>
                                       <button
                                          className={`admin-status-btn ${u.isConfirmed ? 'is-confirmed' : 'is-pending'}`}
                                          onClick={() => handleToggleConfirm(u.id)}
                                          title={u.isConfirmed ? t('admin_status_click_unconfirm') : t('admin_status_click_confirm')}
                                       >
                                          <span className="admin-status-dot"></span>
                                          {u.isConfirmed ? t('admin_status_confirmed') : t('admin_status_pending')}
                                       </button>
                                    </td>
                                    <td>
                                       <span className="admin-date">
                                          {u.createdAt
                                             ? new Date(u.createdAt).toLocaleDateString((i18n.language || 'fr').replace('-', '_'), {
                                                  day: '2-digit',
                                                  month: 'short',
                                                  year: 'numeric',
                                               })
                                             : '-'}
                                       </span>
                                    </td>
                                     <td>
                                        <div className="admin-actions-cell">
                                           {u.type !== 'admin' && (
                                              <button
                                                 className="admin-icon-btn"
                                                 onClick={() => handleStartConversation(u.id)}
                                                 title="Start conversation"
                                                 disabled={startingChat === u.id}
                                              >
                                                 💬
                                              </button>
                                           )}
                                           <select
                                             value={u.type}
                                             onChange={(e) =>
                                                handleUpdateUserType(u.id, e.target.value)
                                             }
                                             className="admin-select"
                                             title={t('admin_change_type')}
                                             aria-label={`${t('admin_change_type_of')} ${u.name}`}
                                          >
                                             <option value="simple">{t('admin_type_simple')}</option>
                                             <option value="advanced">{t('admin_type_advanced')}</option>
                                             <option value="premium">{t('admin_type_premium')}</option>
                                             <option value="admin">{t('admin_type_admin')}</option>
                                          </select>
                                          <button
                                             className="admin-icon-btn"
                                             onClick={() => setDetailModal(u)}
                                             title={t('admin_view_profile')}
                                             aria-label={`${t('admin_view_profile_of')} ${u.name}`}
                                          >
                                             👁
                                          </button>
                                          <button
                                             className="admin-icon-btn admin-icon-danger"
                                             onClick={() => setDeleteModal(u)}
                                             title={t('admin_delete')}
                                             aria-label={`${t('admin_delete_of')} ${u.name}`}
                                          >
                                             🗑
                                          </button>
                                       </div>
                                    </td>
                                 </tr>
                              ))}
                           </tbody>
                        </table>
                     </div>

                     <div className="admin-pagination">
                        <span className="admin-pagination-info">
                           {t('admin_result_count', { count: total })}
                        </span>
                        <div className="admin-pagination-buttons">
                           <button
                              className="admin-page-nav"
                              disabled={page <= 1}
                              onClick={() => setPage((p) => Math.max(1, p - 1))}
                              aria-label={t('admin_prev_page')}
                           >
                              ‹
                           </button>
                           {pageNumbers.map((n) => (
                              <button
                                 key={n}
                                 className={`admin-page-btn ${n === page ? 'admin-page-active' : ''}`}
                                 onClick={() => setPage(n)}
                              >
                                 {n}
                              </button>
                           ))}
                           <button
                              className="admin-page-nav"
                              disabled={page >= totalPages}
                              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                              aria-label={t('admin_next_page')}
                           >
                              ›
                           </button>
                        </div>
                     </div>
                  </>
               )}
            </section>
         </main>

         {detailModal && (
            <div
               className="admin-modal-overlay"
               onClick={() => setDetailModal(null)}
            >
               <div
                  className="admin-modal admin-modal-detail"
                  onClick={(e) => e.stopPropagation()}
               >
                  <div className="admin-modal-header">
                     <button
                        className="admin-modal-close"
                        onClick={() => setDetailModal(null)}
                        aria-label={t('admin_close')}
                     >
                        ✕
                     </button>
                  </div>
                  <div className="admin-modal-body">
                     <div className="admin-detail-hero">
                        <span className="admin-user-avatar admin-detail-avatar">
                           {initials(detailModal.name)}
                        </span>
                        <h2>{detailModal.name}</h2>
                        <p>{detailModal.email}</p>
                        <span className={`admin-type-badge admin-type-${detailModal.type}`}>
                           {typeLabel(detailModal.type)}
                        </span>
                     </div>
                     <div className="admin-detail-grid">
                        <div className="admin-detail-item">
                           <span className="admin-detail-label">{t('admin_col_status')}</span>
                           <span className={`admin-detail-value ${detailModal.isConfirmed ? 'text-ok' : 'text-warn'}`}>
                              {detailModal.isConfirmed ? t('admin_status_confirmed') : t('admin_status_pending')}
                           </span>
                        </div>
                        <div className="admin-detail-item">
                           <span className="admin-detail-label">{t('admin_col_signup')}</span>
                           <span className="admin-detail-value">
                              {detailModal.createdAt
                                 ? new Date(detailModal.createdAt).toLocaleDateString((i18n.language || 'fr').replace('-', '_'), {
                                      year: 'numeric',
                                      month: 'long',
                                      day: 'numeric',
                                   })
                                 : '-'}
                           </span>
                        </div>
                        <div className="admin-detail-item admin-detail-id">
                           <span className="admin-detail-label">ID</span>
                           <span className="admin-detail-value admin-detail-id-value">
                              {detailModal.id}
                           </span>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
         )}

         {deleteModal && (
            <div
               className="admin-modal-overlay"
               onClick={() => setDeleteModal(null)}
            >
               <div
                  className="admin-modal admin-modal-delete"
                  onClick={(e) => e.stopPropagation()}
               >
                  <div className="admin-modal-header">
                     <button
                        className="admin-modal-close"
                        onClick={() => setDeleteModal(null)}
                        aria-label={t('admin_close')}
                     >
                        ✕
                     </button>
                  </div>
                  <div className="admin-modal-body">
                     <div className="admin-delete-icon">🗑</div>
                     <h2>{t('admin_delete_title')}</h2>
                     <p>{t('admin_delete_message', { name: deleteModal.name, email: deleteModal.email })}</p>
                  </div>
                  <div className="admin-modal-footer">
                     <button
                        className="admin-ghost-btn"
                        onClick={() => setDeleteModal(null)}
                     >
                        {t('admin_cancel')}
                     </button>
                     <button
                        className="admin-danger-btn-lg"
                        onClick={() => handleDeleteUser(deleteModal.id)}
                     >
                        {t('admin_delete')}
                     </button>
                  </div>
               </div>
            </div>
         )}

         {toasts.length > 0 && (
            <div className="admin-toast-container">
               {toasts.map((t) => (
                  <div key={t.id} className={`admin-toast admin-toast-${t.type}`}>
                     {t.message}
                  </div>
               ))}
            </div>
         )}
      </div>
   );
}
