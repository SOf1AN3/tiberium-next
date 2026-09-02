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
   const { user, token, isAuthenticated } = useAuth();
   const router = useRouter();
   const [users, setUsers] = useState<User[]>([]);
   const [isLoading, setIsLoading] = useState(true);
   const [error, setError] = useState('');

   // Redirect if not authenticated or not admin
   useEffect(() => {
      if (!isAuthenticated) {
         router.push('/login');
      } else if (user?.type !== 'admin') {
         router.push('/');
      }
   }, [isAuthenticated, user, router]);

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

   if (!isAuthenticated || user?.type !== 'admin') {
      return null;
   }

   return (
      <div className="min-h-screen bg-gray-50">
         {/* Header */}
         <header className="bg-white shadow">
            <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
               <h1 className="text-2xl font-bold text-blue-600">Admin Panel</h1>
               <button
                  onClick={() => router.push('/')}
                  className="text-gray-600 hover:text-gray-900"
               >
                  Back to Home
               </button>
            </nav>
         </header>

         {/* Main Content */}
         <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="bg-white rounded-lg shadow">
               <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-bold text-gray-900">User Management</h2>
               </div>

               {error && (
                  <div className="px-6 py-4 bg-red-50 border-b border-red-200">
                     <p className="text-sm text-red-700">{error}</p>
                  </div>
               )}

               {isLoading ? (
                  <div className="px-6 py-12 text-center">
                     <p className="text-gray-500">Loading users...</p>
                  </div>
               ) : users.length === 0 ? (
                  <div className="px-6 py-12 text-center">
                     <p className="text-gray-500">No users found</p>
                  </div>
               ) : (
                  <div className="overflow-x-auto">
                     <table className="w-full">
                        <thead className="bg-gray-50">
                           <tr>
                              <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                                 Name
                              </th>
                              <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                                 Email
                              </th>
                              <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                                 Type
                              </th>
                              <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                                 Status
                              </th>
                              <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                                 Actions
                              </th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                           {users.map((u) => (
                              <tr key={u.id} className="hover:bg-gray-50">
                                 <td className="px-6 py-4 text-sm text-gray-900">{u.name}</td>
                                 <td className="px-6 py-4 text-sm text-gray-600">{u.email}</td>
                                 <td className="px-6 py-4 text-sm">
                                    <select
                                       value={u.type}
                                       onChange={(e) => handleUpdateUserType(u.id, e.target.value)}
                                       className="rounded border border-gray-300 px-2 py-1 text-sm"
                                    >
                                       <option value="simple">Simple</option>
                                       <option value="advanced">Advanced</option>
                                       <option value="premium">Premium</option>
                                       <option value="admin">Admin</option>
                                    </select>
                                 </td>
                                 <td className="px-6 py-4 text-sm">
                                    <span
                                       className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${u.isConfirmed
                                             ? 'bg-green-100 text-green-800'
                                             : 'bg-yellow-100 text-yellow-800'
                                          }`}
                                    >
                                       {u.isConfirmed ? 'Confirmed' : 'Pending'}
                                    </span>
                                 </td>
                                 <td className="px-6 py-4 text-sm">
                                    <button className="text-blue-600 hover:text-blue-900">
                                       View Profile
                                    </button>
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
