
import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { db_getAllUsers, db_deleteUser, db_seedTestUsers } from '../services/storage';
import { 
  Users, DollarSign, Clock, ShieldCheck, GraduationCap, 
  Trash2, Search, Filter, LogOut
} from 'lucide-react';

interface AdminDashboardProps {
  onLogout: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<'all' | 'active' | 'trial' | 'expired' | 'skool'>('all');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = () => {
    const allUsers = db_getAllUsers();
    setUsers(allUsers);
  };

  const handleDelete = (userId: string) => {
    if (confirm("Are you sure you want to delete this user? This cannot be undone.")) {
      db_deleteUser(userId);
      loadUsers();
    }
  };

  const handleSeed = () => {
    db_seedTestUsers();
    loadUsers();
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filter === 'all') return matchesSearch;
    if (filter === 'skool') return matchesSearch && user.isVib3Skool;
    if (filter === 'active') return matchesSearch && user.subscriptionStatus === 'active';
    if (filter === 'trial') return matchesSearch && user.subscriptionStatus === 'trial';
    if (filter === 'expired') return matchesSearch && user.subscriptionStatus === 'expired';
    
    return matchesSearch;
  });

  const stats = {
    total: users.length,
    revenue: users.filter(u => u.subscriptionStatus === 'active').length * 15,
    skool: users.filter(u => u.isVib3Skool).length,
    trial: users.filter(u => u.subscriptionStatus === 'trial').length
  };

  return (
    <div className="min-h-screen bg-gray-50 text-slate-900 font-sans">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-3">
            <div className="bg-slate-900 text-white p-2 rounded-lg"><ShieldCheck size={20}/></div>
            <h1 className="font-bold text-xl">Admin Console</h1>
        </div>
        <div className="flex gap-3">
             <button onClick={handleSeed} className="px-4 py-2 bg-indigo-50 text-indigo-700 text-sm font-bold rounded-lg hover:bg-indigo-100">
                Seed Test Data
             </button>
             <button onClick={onLogout} className="px-4 py-2 bg-gray-100 text-slate-600 text-sm font-bold rounded-lg hover:bg-gray-200 flex items-center gap-2">
                <LogOut size={16}/> Logout
             </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-6">
          {/* Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-lg"><Users size={24}/></div>
                  <div>
                      <div className="text-2xl font-bold">{stats.total}</div>
                      <div className="text-xs text-slate-500 font-bold uppercase">Total Users</div>
                  </div>
              </div>
              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
                  <div className="p-3 bg-green-50 text-green-600 rounded-lg"><DollarSign size={24}/></div>
                  <div>
                      <div className="text-2xl font-bold">${stats.revenue}/mo</div>
                      <div className="text-xs text-slate-500 font-bold uppercase">MRR (Est)</div>
                  </div>
              </div>
              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
                  <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg"><GraduationCap size={24}/></div>
                  <div>
                      <div className="text-2xl font-bold">{stats.skool}</div>
                      <div className="text-xs text-slate-500 font-bold uppercase">Skool Members</div>
                  </div>
              </div>
              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
                  <div className="p-3 bg-orange-50 text-orange-600 rounded-lg"><Clock size={24}/></div>
                  <div>
                      <div className="text-2xl font-bold">{stats.trial}</div>
                      <div className="text-xs text-slate-500 font-bold uppercase">Active Trials</div>
                  </div>
              </div>
          </div>

          {/* Filters & Search */}
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="relative w-full md:w-96">
                  <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                  <input 
                    placeholder="Search by username or email..." 
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
              </div>
              <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto">
                  <Filter size={16} className="text-slate-400 mr-1"/>
                  {['all', 'active', 'trial', 'skool', 'expired'].map(f => (
                      <button 
                        key={f}
                        onClick={() => setFilter(f as any)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold capitalize whitespace-nowrap ${filter === f ? 'bg-slate-900 text-white' : 'bg-gray-100 text-slate-500 hover:bg-gray-200'}`}
                      >
                          {f}
                      </button>
                  ))}
              </div>
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <table className="w-full text-left">
                  <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                          <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">User</th>
                          <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Status</th>
                          <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Joined</th>
                          <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Actions</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                      {filteredUsers.length > 0 ? (
                          filteredUsers.map(user => (
                              <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                                  <td className="px-6 py-4">
                                      <div>
                                          <div className="font-bold text-slate-900 flex items-center gap-2">
                                              {user.username}
                                              {user.isVib3Skool && <div title="Skool Member"><GraduationCap size={14} className="text-indigo-600"/></div>}
                                          </div>
                                          <div className="text-xs text-slate-500">{user.email}</div>
                                      </div>
                                  </td>
                                  <td className="px-6 py-4">
                                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                                        ${user.subscriptionStatus === 'active' ? 'bg-green-100 text-green-800' : 
                                          user.subscriptionStatus === 'trial' ? 'bg-orange-100 text-orange-800' :
                                          user.subscriptionStatus === 'skool_member' ? 'bg-indigo-100 text-indigo-800' :
                                          'bg-red-100 text-red-800'}`}>
                                          {user.subscriptionStatus.replace('_', ' ')}
                                      </span>
                                  </td>
                                  <td className="px-6 py-4 text-sm text-slate-500">
                                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}
                                  </td>
                                  <td className="px-6 py-4 text-right">
                                      <button 
                                        onClick={() => handleDelete(user.id)}
                                        className="p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
                                        title="Delete User"
                                      >
                                          <Trash2 size={18}/>
                                      </button>
                                  </td>
                              </tr>
                          ))
                      ) : (
                          <tr>
                              <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                                  No users found. Try seeding test data.
                              </td>
                          </tr>
                      )}
                  </tbody>
              </table>
          </div>
      </div>
    </div>
  );
};

export default AdminDashboard;