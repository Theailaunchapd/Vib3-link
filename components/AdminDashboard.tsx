
import React, { useState, useEffect } from 'react';
import { User, PromoCode } from '../types';
import { db_getAllUsers, db_deleteUser, db_seedTestUsers, db_getAllPromoCodes, db_savePromoCode, db_deletePromoCode, db_updatePromoCode } from '../services/storage';
import { 
  Users, DollarSign, Clock, ShieldCheck, GraduationCap, 
  Trash2, Search, Filter, LogOut, Tag, Plus, X, Edit2
} from 'lucide-react';

interface AdminDashboardProps {
  onLogout: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<'all' | 'active' | 'trial' | 'expired' | 'skool' | 'promo'>('all');
  const [activeTab, setActiveTab] = useState<'users' | 'promos'>('users');
  const [showPromoForm, setShowPromoForm] = useState(false);
  
  // Promo Form State
  const [promoFormData, setPromoFormData] = useState({
    code: '',
    description: '',
    type: 'lifetime' as PromoCode['type'],
    usageLimit: '',
    active: true
  });

  useEffect(() => {
    loadUsers();
    loadPromoCodes();
  }, []);

  const loadUsers = () => {
    const allUsers = db_getAllUsers();
    setUsers(allUsers);
  };

  const loadPromoCodes = () => {
    const codes = db_getAllPromoCodes();
    setPromoCodes(codes);
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

  const handleCreatePromo = (e: React.FormEvent) => {
    e.preventDefault();
    const newPromo: PromoCode = {
      id: 'promo_' + Date.now(),
      code: promoFormData.code.toUpperCase().trim(),
      description: promoFormData.description,
      type: promoFormData.type,
      usageLimit: promoFormData.usageLimit ? parseInt(promoFormData.usageLimit) : undefined,
      usedCount: 0,
      createdAt: new Date().toISOString(),
      createdBy: 'admin',
      active: promoFormData.active
    };
    
    db_savePromoCode(newPromo);
    loadPromoCodes();
    setShowPromoForm(false);
    setPromoFormData({
      code: '',
      description: '',
      type: 'lifetime',
      usageLimit: '',
      active: true
    });
  };

  const handleDeletePromo = (promoId: string) => {
    if (confirm("Delete this promo code? Users who already used it will keep their access.")) {
      db_deletePromoCode(promoId);
      loadPromoCodes();
    }
  };

  const handleTogglePromoActive = (promo: PromoCode) => {
    const updated = { ...promo, active: !promo.active };
    db_updatePromoCode(updated);
    loadPromoCodes();
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filter === 'all') return matchesSearch;
    if (filter === 'skool') return matchesSearch && user.isVib3Skool;
    if (filter === 'active') return matchesSearch && user.subscriptionStatus === 'active';
    if (filter === 'trial') return matchesSearch && user.subscriptionStatus === 'trial';
    if (filter === 'expired') return matchesSearch && user.subscriptionStatus === 'expired';
    if (filter === 'promo') return matchesSearch && user.subscriptionStatus === 'promo_access';
    
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
          {/* Tab Navigation */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-2 flex gap-2">
              <button 
                onClick={() => setActiveTab('users')}
                className={`flex-1 py-3 px-4 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all ${activeTab === 'users' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-gray-50'}`}
              >
                  <Users size={18}/> Users
              </button>
              <button 
                onClick={() => setActiveTab('promos')}
                className={`flex-1 py-3 px-4 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all ${activeTab === 'promos' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-gray-50'}`}
              >
                  <Tag size={18}/> Promo Codes
              </button>
          </div>

      {activeTab === 'users' ? (
        <>
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
                  {['all', 'active', 'trial', 'promo', 'skool', 'expired'].map(f => (
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
                                      <div className="flex flex-col gap-1">
                                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize w-fit
                                            ${user.subscriptionStatus === 'active' ? 'bg-green-100 text-green-800' : 
                                              user.subscriptionStatus === 'trial' ? 'bg-orange-100 text-orange-800' :
                                              user.subscriptionStatus === 'promo_access' ? 'bg-purple-100 text-purple-800' :
                                              user.subscriptionStatus === 'skool_member' ? 'bg-indigo-100 text-indigo-800' :
                                              'bg-red-100 text-red-800'}`}>
                                              {user.subscriptionStatus.replace('_', ' ')}
                                          </span>
                                          {user.promoCodeUsed && (
                                              <span className="text-xs text-slate-500 font-mono">Code: {user.promoCodeUsed}</span>
                                          )}
                                      </div>
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
      </>
      ) : (
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
      )}
      </div>
    </div>
  );
};

export default AdminDashboard;