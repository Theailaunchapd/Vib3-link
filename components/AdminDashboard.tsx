
import React, { useState, useEffect } from 'react';
import { User, PromoCode, StripePayment } from '../types';
import { db_getAllUsers, db_deleteUser, db_seedTestUsers, db_updateUser, db_getAllPromoCodes, db_savePromoCode, db_updatePromoCode, db_deletePromoCode, db_getAllPayments, db_seedTestPayments } from '../services/storage';
import {
  Users, DollarSign, Clock, ShieldCheck, GraduationCap,
  Trash2, Search, Filter, LogOut, TrendingUp, Calendar,
  Ban, PlayCircle, CheckCircle, XCircle, UserX, Settings,
  X, Plus, Tag, Edit2, CreditCard, Key
} from 'lucide-react';

interface AdminDashboardProps {
  onLogout: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [payments, setPayments] = useState<StripePayment[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<'all' | 'active' | 'trial' | 'expired' | 'skool'>('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showPromoForm, setShowPromoForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'users' | 'promos' | 'payments'>('users');
  const [promoFormData, setPromoFormData] = useState({
    code: '',
    description: '',
    type: 'lifetime' as PromoCode['type'],
    usageLimit: undefined as number | undefined
  });

  useEffect(() => {
    loadUsers();
    loadPromoCodes();
    loadPayments();
  }, []);

  const loadUsers = () => {
    const allUsers = db_getAllUsers();
    setUsers(allUsers);
  };

  const loadPromoCodes = () => {
    const codes = db_getAllPromoCodes();
    setPromoCodes(codes);
  };

  const loadPayments = () => {
    const allPayments = db_getAllPayments();
    setPayments(allPayments);
  };

  const handleDelete = (userId: string) => {
    if (confirm("Are you sure you want to delete this user? This cannot be undone.")) {
      db_deleteUser(userId);
      loadUsers();
      setSelectedUser(null);
    }
  };

  const handleSuspendUser = (user: User) => {
    if (confirm(`Suspend subscription for ${user.username}?`)) {
      user.subscriptionStatus = 'expired';
      db_updateUser(user);
      loadUsers();
      setSelectedUser(null);
    }
  };

  const handleActivateUser = (user: User) => {
    if (confirm(`Activate subscription for ${user.username}?`)) {
      user.subscriptionStatus = 'active';
      user.trialEndsAt = undefined;
      db_updateUser(user);
      loadUsers();
      setSelectedUser(null);
    }
  };

  const handleExtendTrial = (user: User, days: number) => {
    if (confirm(`Extend trial for ${user.username} by ${days} days?`)) {
      const currentEnd = user.trialEndsAt ? new Date(user.trialEndsAt) : new Date();
      currentEnd.setDate(currentEnd.getDate() + days);
      user.trialEndsAt = currentEnd.toISOString();
      user.subscriptionStatus = 'trial';
      db_updateUser(user);
      loadUsers();
      setSelectedUser(null);
    }
  };

  const handleResetPassword = (user: User) => {
    const newPassword = prompt(`Enter new password for ${user.username}:`);
    if (newPassword && newPassword.trim()) {
      if (confirm(`Reset password for ${user.username}?\n\nNew password: ${newPassword}`)) {
        user.password = newPassword;
        db_updateUser(user);
        loadUsers();
        alert(`Password reset successfully for ${user.username}!\n\nNew password: ${newPassword}\n\nMake sure to share this with the user securely.`);
        setSelectedUser(null);
      }
    }
  };

  const handleSeed = () => {
    db_seedTestUsers();
    db_seedTestPayments();
    loadUsers();
    loadPayments();
  };

  const handleCreatePromo = (e: React.FormEvent) => {
    e.preventDefault();
    const newPromo: PromoCode = {
      id: 'promo_' + Date.now(),
      code: promoFormData.code.toUpperCase(),
      description: promoFormData.description,
      type: promoFormData.type,
      usageLimit: promoFormData.usageLimit,
      usedCount: 0,
      createdAt: new Date().toISOString(),
      createdBy: 'admin',
      active: true
    };
    db_savePromoCode(newPromo);
    loadPromoCodes();
    setShowPromoForm(false);
    setPromoFormData({ code: '', description: '', type: 'lifetime', usageLimit: undefined });
  };

  const handleTogglePromoActive = (promo: PromoCode) => {
    promo.active = !promo.active;
    db_updatePromoCode(promo);
    loadPromoCodes();
  };

  const handleDeletePromo = (promoId: string) => {
    if (confirm("Are you sure you want to delete this promo code?")) {
      db_deletePromoCode(promoId);
      loadPromoCodes();
    }
  };

  const getDaysRemaining = (user: User): number | null => {
    if (user.subscriptionStatus !== 'trial' || !user.trialEndsAt) return null;
    const now = new Date();
    const trialEnd = new Date(user.trialEndsAt);
    const diff = trialEnd.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
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

  // Analytics Calculations
  const stats = {
    total: users.length,
    active: users.filter(u => u.subscriptionStatus === 'active').length,
    trial: users.filter(u => u.subscriptionStatus === 'trial').length,
    expired: users.filter(u => u.subscriptionStatus === 'expired').length,
    skool: users.filter(u => u.isVib3Skool).length,
    mrr: users.filter(u => u.subscriptionStatus === 'active').length * 15, // $15/mo per active user
    newThisWeek: users.filter(u => {
      if (!u.createdAt) return false;
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return new Date(u.createdAt) > weekAgo;
    }).length,
    expiringThisWeek: users.filter(u => {
      if (u.subscriptionStatus !== 'trial' || !u.trialEndsAt) return false;
      const weekFromNow = new Date();
      weekFromNow.setDate(weekFromNow.getDate() + 7);
      return new Date(u.trialEndsAt) <= weekFromNow;
    }).length
  };

  return (
    <div className="min-h-screen bg-gray-50 text-slate-900 font-sans">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
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
          {/* Primary Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                      <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Users size={20}/></div>
                      <span className="text-xs font-bold text-green-600 flex items-center gap-1">
                          <TrendingUp size={12}/> +{stats.newThisWeek} this week
                      </span>
                  </div>
                  <div className="text-3xl font-bold text-slate-900">{stats.total}</div>
                  <div className="text-xs text-slate-500 font-semibold uppercase mt-1">Total Users</div>
              </div>

              <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-5 rounded-xl shadow-sm text-white">
                  <div className="flex items-center justify-between mb-3">
                      <div className="p-2 bg-white/20 rounded-lg"><DollarSign size={20}/></div>
                      <span className="text-xs font-bold bg-white/20 px-2 py-1 rounded-full">
                          {stats.active} subscriptions
                      </span>
                  </div>
                  <div className="text-3xl font-bold">${stats.mrr.toLocaleString()}/mo</div>
                  <div className="text-xs font-semibold uppercase mt-1 opacity-90">Monthly Recurring Revenue</div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                      <div className="p-2 bg-orange-50 text-orange-600 rounded-lg"><Clock size={20}/></div>
                      <span className="text-xs font-bold text-red-600 flex items-center gap-1">
                          {stats.expiringThisWeek} expiring soon
                      </span>
                  </div>
                  <div className="text-3xl font-bold text-slate-900">{stats.trial}</div>
                  <div className="text-xs text-slate-500 font-semibold uppercase mt-1">Active Trials</div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                      <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><GraduationCap size={20}/></div>
                  </div>
                  <div className="text-3xl font-bold text-slate-900">{stats.skool}</div>
                  <div className="text-xs text-slate-500 font-semibold uppercase mt-1">Skool Members</div>
              </div>
          </div>

          {/* Additional Analytics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
                  <div className="p-3 bg-green-50 text-green-600 rounded-lg"><CheckCircle size={24}/></div>
                  <div>
                      <div className="text-2xl font-bold text-slate-900">{stats.active}</div>
                      <div className="text-xs text-slate-500 font-semibold">Paid Subscriptions</div>
                  </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
                  <div className="p-3 bg-red-50 text-red-600 rounded-lg"><XCircle size={24}/></div>
                  <div>
                      <div className="text-2xl font-bold text-slate-900">{stats.expired}</div>
                      <div className="text-xs text-slate-500 font-semibold">Expired Accounts</div>
                  </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-lg"><Calendar size={24}/></div>
                  <div>
                      <div className="text-2xl font-bold text-slate-900">{stats.expiringThisWeek}</div>
                      <div className="text-xs text-slate-500 font-semibold">Expiring This Week</div>
                  </div>
              </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-2 border-b border-gray-200 pb-4">
            <button
              onClick={() => setActiveTab('users')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${activeTab === 'users' ? 'bg-slate-900 text-white' : 'bg-gray-100 text-slate-600 hover:bg-gray-200'}`}
            >
              <Users size={16} className="inline mr-2" />
              Users
            </button>
            <button
              onClick={() => setActiveTab('promos')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${activeTab === 'promos' ? 'bg-slate-900 text-white' : 'bg-gray-100 text-slate-600 hover:bg-gray-200'}`}
            >
              <Tag size={16} className="inline mr-2" />
              Promo Codes
            </button>
            <button
              onClick={() => setActiveTab('payments')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${activeTab === 'payments' ? 'bg-slate-900 text-white' : 'bg-gray-100 text-slate-600 hover:bg-gray-200'}`}
            >
              <CreditCard size={16} className="inline mr-2" />
              Stripe Payments
            </button>
          </div>

          {activeTab === 'users' ? (
          <>
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
                          <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Trial Info</th>
                          <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Joined</th>
                          <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Actions</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                      {filteredUsers.length > 0 ? (
                          filteredUsers.map(user => {
                              const daysRemaining = getDaysRemaining(user);
                              return (
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
                                  <td className="px-6 py-4">
                                      {daysRemaining !== null ? (
                                          <div className="flex flex-col">
                                              <span className={`text-sm font-bold ${daysRemaining <= 3 ? 'text-red-600' : 'text-orange-600'}`}>
                                                  {daysRemaining} days left
                                              </span>
                                              <span className="text-xs text-slate-400">
                                                  Expires: {new Date(user.trialEndsAt!).toLocaleDateString()}
                                              </span>
                                          </div>
                                      ) : (
                                          <span className="text-xs text-slate-400">N/A</span>
                                      )}
                                  </td>
                                  <td className="px-6 py-4 text-sm text-slate-500">
                                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}
                                  </td>
                                  <td className="px-6 py-4 text-right">
                                      <div className="flex items-center justify-end gap-2">
                                          <button
                                            onClick={() => setSelectedUser(user)}
                                            className="p-2 text-slate-400 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors"
                                            title="Manage User"
                                          >
                                              <Settings size={18}/>
                                          </button>
                                          <button
                                            onClick={() => handleDelete(user.id)}
                                            className="p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
                                            title="Delete User"
                                          >
                                              <Trash2 size={18}/>
                                          </button>
                                      </div>
                                  </td>
                              </tr>
                          )})
                      ) : (
                          <tr>
                              <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                                  No users found. Try seeding test data.
                              </td>
                          </tr>
                      )}
                  </tbody>
              </table>
          </div>
      </>
      ) : activeTab === 'promos' ? (
        <>
          {/* Promo Codes Tab */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <div className="flex justify-between items-center mb-6">
                  <div>
                      <h2 className="text-xl font-bold text-slate-900">Promo Codes</h2>
                      <p className="text-sm text-slate-500 mt-1">Create and manage promotional access codes</p>
                  </div>
                  <button 
                    onClick={() => setShowPromoForm(!showPromoForm)}
                    className="px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-lg hover:bg-indigo-700 flex items-center gap-2"
                  >
                      {showPromoForm ? <X size={16}/> : <Plus size={16}/>}
                      {showPromoForm ? 'Cancel' : 'Create Code'}
                  </button>
              </div>

              {showPromoForm && (
                  <form onSubmit={handleCreatePromo} className="bg-slate-50 rounded-xl p-6 mb-6 border border-slate-200 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                              <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Code</label>
                              <input 
                                  required
                                  value={promoFormData.code}
                                  onChange={e => setPromoFormData({...promoFormData, code: e.target.value.toUpperCase()})}
                                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-mono uppercase"
                                  placeholder="SUMMER2024"
                              />
                          </div>
                          <div>
                              <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Type</label>
                              <select 
                                  value={promoFormData.type}
                                  onChange={e => setPromoFormData({...promoFormData, type: e.target.value as PromoCode['type']})}
                                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm"
                              >
                                  <option value="lifetime">Lifetime Access</option>
                                  <option value="free_month">Free Month</option>
                                  <option value="trial_extension">Trial Extension (30 days)</option>
                              </select>
                          </div>
                      </div>
                      <div>
                          <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Description</label>
                          <input 
                              required
                              value={promoFormData.description}
                              onChange={e => setPromoFormData({...promoFormData, description: e.target.value})}
                              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm"
                              placeholder="For VIP members"
                          />
                      </div>
                      <div>
                          <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Usage Limit (Optional)</label>
                          <input 
                              type="number"
                              value={promoFormData.usageLimit}
                              onChange={e => setPromoFormData({...promoFormData, usageLimit: e.target.value})}
                              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm"
                              placeholder="Leave empty for unlimited"
                              min="1"
                          />
                      </div>
                      <button 
                        type="submit"
                        className="w-full py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700"
                      >
                          Create Promo Code
                      </button>
                  </form>
              )}

              {promoCodes.length > 0 ? (
                  <div className="space-y-3">
                      {promoCodes.map(promo => (
                          <div key={promo.id} className={`border rounded-xl p-4 ${promo.active ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-300 opacity-60'}`}>
                              <div className="flex justify-between items-start">
                                  <div className="flex-1">
                                      <div className="flex items-center gap-3 mb-2">
                                          <span className="font-mono font-bold text-lg text-slate-900">{promo.code}</span>
                                          <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                                              promo.type === 'lifetime' ? 'bg-purple-100 text-purple-700' :
                                              promo.type === 'free_month' ? 'bg-blue-100 text-blue-700' :
                                              'bg-orange-100 text-orange-700'
                                          }`}>
                                              {promo.type === 'lifetime' ? 'Lifetime' : promo.type === 'free_month' ? 'Free Month' : 'Trial Extension'}
                                          </span>
                                          {!promo.active && <span className="text-xs font-bold px-2 py-1 rounded-full bg-red-100 text-red-700">Inactive</span>}
                                      </div>
                                      <p className="text-sm text-slate-600 mb-2">{promo.description}</p>
                                      <div className="flex items-center gap-4 text-xs text-slate-500">
                                          <span>Used: <strong>{promo.usedCount}</strong>{promo.usageLimit ? ` / ${promo.usageLimit}` : ' (unlimited)'}</span>
                                          <span>Created: {new Date(promo.createdAt).toLocaleDateString()}</span>
                                      </div>
                                  </div>
                                  <div className="flex gap-2">
                                      <button 
                                        onClick={() => handleTogglePromoActive(promo)}
                                        className={`p-2 rounded-lg transition-colors ${promo.active ? 'text-slate-400 hover:bg-orange-50 hover:text-orange-600' : 'text-slate-400 hover:bg-green-50 hover:text-green-600'}`}
                                        title={promo.active ? 'Deactivate' : 'Activate'}
                                      >
                                          <Edit2 size={18}/>
                                      </button>
                                      <button 
                                        onClick={() => handleDeletePromo(promo.id)}
                                        className="p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
                                        title="Delete"
                                      >
                                          <Trash2 size={18}/>
                                      </button>
                                  </div>
                              </div>
                          </div>
                      ))}
                  </div>
              ) : (
                  <div className="text-center py-12 text-slate-500">
                      <Tag size={48} className="mx-auto mb-4 opacity-20"/>
                      <p>No promo codes yet. Create one to get started!</p>
                  </div>
              )}
          </div>
        </>
      ) : activeTab === 'payments' ? (
        <>
          {/* Stripe Payments Tab */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <CreditCard size={24} className="text-green-600"/>
                  Stripe Payment History
                </h2>
                <p className="text-sm text-slate-500 mt-1">Track all payment transactions and their status</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-green-600">
                  ${payments.filter(p => p.status === 'success').reduce((sum, p) => sum + p.amount, 0).toLocaleString()}
                </div>
                <div className="text-xs text-slate-500 font-medium">Total Revenue</div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">User</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Product/Service</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Stripe ID</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {payments.length > 0 ? (
                    payments.map(payment => (
                      <tr key={payment.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 text-sm">
                          <div className="font-medium text-slate-900">
                            {new Date(payment.createdAt).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-slate-500">
                            {new Date(payment.createdAt).toLocaleTimeString()}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-900">{payment.username}</div>
                          <div className="text-xs text-slate-500">{payment.email}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize bg-blue-100 text-blue-800">
                            {payment.paymentType}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-700">
                          {payment.productName || 'Monthly Subscription'}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-lg font-bold text-slate-900">
                            ${payment.amount.toFixed(2)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-start gap-2">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold capitalize
                              ${payment.status === 'success' ? 'bg-green-100 text-green-800' : 
                                payment.status === 'failed' ? 'bg-red-100 text-red-800' :
                                payment.status === 'refunded' ? 'bg-orange-100 text-orange-800' :
                                'bg-yellow-100 text-yellow-800'}`}>
                              {payment.status === 'success' && <CheckCircle size={12} className="mr-1"/>}
                              {payment.status === 'failed' && <XCircle size={12} className="mr-1"/>}
                              {payment.status}
                            </span>
                          </div>
                          {payment.errorMessage && (
                            <div className="text-xs text-red-600 mt-1">{payment.errorMessage}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-xs font-mono text-slate-500">
                          {payment.stripePaymentId || '—'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                        <CreditCard size={48} className="mx-auto mb-4 opacity-20"/>
                        <p className="font-medium">No payment records yet</p>
                        <p className="text-sm mt-1">Click "Seed Test Data" to generate sample payments</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Payment Stats Footer */}
            {payments.length > 0 && (
              <div className="px-6 py-4 bg-slate-50 border-t border-gray-200 grid grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {payments.filter(p => p.status === 'success').length}
                  </div>
                  <div className="text-xs text-slate-500 font-medium uppercase">Successful</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {payments.filter(p => p.status === 'failed').length}
                  </div>
                  <div className="text-xs text-slate-500 font-medium uppercase">Failed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">
                    {payments.filter(p => p.status === 'pending').length}
                  </div>
                  <div className="text-xs text-slate-500 font-medium uppercase">Pending</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {payments.filter(p => p.status === 'refunded').length}
                  </div>
                  <div className="text-xs text-slate-500 font-medium uppercase">Refunded</div>
                </div>
              </div>
            )}
          </div>
        </>
      ) : null}
      </div>

      {/* User Management Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setSelectedUser(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900">Manage User</h2>
              <button onClick={() => setSelectedUser(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                <XCircle size={20} className="text-slate-400"/>
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <div className="text-sm font-bold text-slate-500 uppercase mb-1">Username</div>
                <div className="text-lg font-bold text-slate-900">{selectedUser.username}</div>
              </div>
              <div>
                <div className="text-sm font-bold text-slate-500 uppercase mb-1">Email</div>
                <div className="text-sm text-slate-700">{selectedUser.email}</div>
              </div>
              <div>
                <div className="text-sm font-bold text-slate-500 uppercase mb-1">Current Status</div>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium capitalize
                  ${selectedUser.subscriptionStatus === 'active' ? 'bg-green-100 text-green-800' :
                    selectedUser.subscriptionStatus === 'trial' ? 'bg-orange-100 text-orange-800' :
                    selectedUser.subscriptionStatus === 'skool_member' ? 'bg-indigo-100 text-indigo-800' :
                    'bg-red-100 text-red-800'}`}>
                    {selectedUser.subscriptionStatus.replace('_', ' ')}
                </span>
              </div>
              {getDaysRemaining(selectedUser) !== null && (
                <div>
                  <div className="text-sm font-bold text-slate-500 uppercase mb-1">Trial Remaining</div>
                  <div className="text-lg font-bold text-orange-600">{getDaysRemaining(selectedUser)} days</div>
                </div>
              )}
              <div>
                <div className="text-sm font-bold text-slate-500 uppercase mb-1">Payment Method</div>
                {selectedUser.paymentMethodSaved ? (
                  <div className="flex items-center gap-2">
                    <CreditCard size={16} className="text-green-600"/>
                    <span className="text-sm text-slate-700 font-medium">
                      {selectedUser.cardBrand?.toUpperCase()} •••• {selectedUser.lastFourDigits}
                    </span>
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">
                      Auto-charge enabled
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <XCircle size={16} className="text-red-600"/>
                    <span className="text-sm text-slate-500">No payment method</span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3 mt-6">
              <div className="text-sm font-bold text-slate-500 uppercase mb-2">Quick Actions</div>

              {selectedUser.subscriptionStatus !== 'active' && (
                <button
                  onClick={() => handleActivateUser(selectedUser)}
                  className="w-full py-3 bg-green-50 text-green-700 font-bold rounded-lg hover:bg-green-100 transition-colors flex items-center justify-center gap-2"
                >
                  <PlayCircle size={18}/> Activate Subscription
                </button>
              )}

              {selectedUser.subscriptionStatus === 'trial' && (
                <>
                  <button
                    onClick={() => handleExtendTrial(selectedUser, 7)}
                    className="w-full py-3 bg-blue-50 text-blue-700 font-bold rounded-lg hover:bg-blue-100 transition-colors flex items-center justify-center gap-2"
                  >
                    <Calendar size={18}/> Extend Trial +7 Days
                  </button>
                  <button
                    onClick={() => handleExtendTrial(selectedUser, 14)}
                    className="w-full py-3 bg-blue-50 text-blue-700 font-bold rounded-lg hover:bg-blue-100 transition-colors flex items-center justify-center gap-2"
                  >
                    <Calendar size={18}/> Extend Trial +14 Days
                  </button>
                </>
              )}

              {selectedUser.subscriptionStatus === 'active' && (
                <button
                  onClick={() => handleSuspendUser(selectedUser)}
                  className="w-full py-3 bg-red-50 text-red-700 font-bold rounded-lg hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                >
                  <Ban size={18}/> Suspend Subscription
                </button>
              )}

              <button
                onClick={() => handleResetPassword(selectedUser)}
                className="w-full py-3 bg-purple-50 text-purple-700 font-bold rounded-lg hover:bg-purple-100 transition-colors flex items-center justify-center gap-2"
              >
                <Key size={18}/> Reset Password
              </button>

              <button
                onClick={() => handleDelete(selectedUser.id)}
                className="w-full py-3 bg-gray-100 text-red-600 font-bold rounded-lg hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
              >
                <UserX size={18}/> Delete User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
