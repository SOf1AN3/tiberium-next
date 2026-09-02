'use client';

import { useAuth } from '@/lib/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface User {
   id: string;
   name: string;
   email: string;
   type: 'simple' | 'advanced' | 'premium' | 'admin';
   isConfirmed: boolean;
}

export default function AdminPanel() {
   const { user, token, isAuthenticated, isLoading: authLoading } = useAuth();
   const router = useRouter();
   const [users, setUsers] = useState<User[]>([]);
   const [isLoading, setIsLoading] = useState(true);
   const [error, setError] = useState('');

   // Redirect if not authenticated or not admin
   useEffect(() => {
      if (authLoading) return;
      if (!isAuthenticated) {
         router.push('/login');
      } else if (user?.type !== 'admin') {
         router.push('/');
      }
   }, [authLoading, isAuthenticated, user, router]);

   // Fetch users
   useEffect(() => {
      const fetchUsers = async () => {
         if (!token) return;

         try {
            const response = await fetch('/api/auth/users', {
               headers: {
                  Authorization: `Bearer ${token}`,
               },
            });

            if (response.ok) {
               const data = await response.json();
               setUsers(data.users || []);
            } else {
               setError('Failed to fetch users');
            }
         } catch (err) {
            setError('Failed to fetch users');
            console.error('Fetch error:', err);
         } finally {
            setIsLoading(false);
         }
      };

      fetchUsers();
   }, [token]);

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
            setUsers(users.map((u) => (u.id === userId ? data.user : u)));
         } else {
            setError('Failed to update user type');
         }
      } catch (err) {
         setError('Failed to update user type');
         console.error('Update error:', err);
      }
   };

   const confirmedCount = users.filter((u) => u.isConfirmed).length;
   const adminCount = users.filter((u) => u.type === 'admin').length;

   if (authLoading || !isAuthenticated || user?.type !== 'admin') {
      return null;
   }

   return (
      <div className="admin-page">
         <main className="page-main">
            <div className="admin-stats">
               <div className="stat-card">
                  <strong>{users.length}</strong>
                  <span>Total users</span>
               </div>
               <div className="stat-card">
                  <strong>{confirmedCount}</strong>
                  <span>Confirmed</span>
               </div>
               <div className="stat-card">
                  <strong>{adminCount}</strong>
                  <span>Admins</span>
               </div>
            </div>
            <div className="admin-panel">
               <div className="admin-panel-header">
                  <h1 className="admin-title no-select">Admin Panel</h1>
                  <span className="admin-subtitle no-select">
                     User Management — {users.length} user{users.length === 1 ? '' : 's'}
                  </span>
                  <button className="btn btn-secondary admin-link" onClick={() => router.push('/')}>
                     Back to Home
                  </button>
               </div>

               {error && <div className="admin-error">{error}</div>}

               {isLoading ? (
                  <div className="admin-loading">
                     <div className="loading-spinner"></div>
                     <p>Loading users...</p>
                  </div>
               ) : users.length === 0 ? (
                  <div className="admin-loading">
                     <p>No users found</p>
                  </div>
               ) : (
                  <div className="admin-table-wrap">
                     <table className="admin-table">
                        <thead>
                           <tr>
                              <th>Name</th>
                              <th>Email</th>
                              <th>Type</th>
                              <th>Status</th>
                              <th>Actions</th>
                           </tr>
                        </thead>
                        <tbody>
                           {users.map((u) => (
                              <tr key={u.id} className="admin-row">
                                 <td className="admin-name">{u.name}</td>
                                 <td className="admin-email">{u.email}</td>
                                 <td>
                                    <select
                                       value={u.type}
                                       onChange={(e) => handleUpdateUserType(u.id, e.target.value)}
                                       className="admin-select"
                                    >
                                       <option value="simple">Simple</option>
                                       <option value="advanced">Advanced</option>
                                       <option value="premium">Premium</option>
                                       <option value="admin">Admin</option>
                                    </select>
                                 </td>
<td>
                     <span className={`badge ${u.isConfirmed ? 'badge-confirmed' : 'badge-pending'}`}>
                        {u.isConfirmed ? 'Confirmed' : 'Pending'}
                     </span>
                  </td>
                                 <td>
                                    <button className="btn admin-link">View Profile</button>
                                 </td>
                              </tr>
                           ))}
                        </tbody>
                     </table>
                  </div>
               )}
            </div>
         </main>
      </div>
   );
}
