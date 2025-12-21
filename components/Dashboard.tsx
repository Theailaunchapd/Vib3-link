

import React, { useState, useEffect } from 'react';
import { UserProfile, AnalyticsData, Product, ContentItem } from '../types';
import { generateAnalyticsInsights } from '../services/geminiService';
import { db_getAnalytics } from '../services/storage';
import { auth_logout } from '../services/auth';
import { 
  ArrowLeft, BarChart3, TrendingUp, Users, 
  DollarSign, MousePointer2, Smartphone, Globe, Activity,
  BrainCircuit, Loader2, AlertCircle, ShoppingBag, Plus, Edit2, Trash2, Save, X, Image as ImageIcon, Layers, Link as LinkIcon, ExternalLink, Power, Eye, GraduationCap, LogOut
} from 'lucide-react';
import ProductForm from './ProductForm';

interface DashboardProps {
  profile: UserProfile;
  setProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  onBack: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ profile, setProfile, onBack }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'links' | 'store'>('overview');
  const [insight, setInsight] = useState<string | null>(null);
  const [loadingInsight, setLoadingInsight] = useState(false);
  const [stats, setStats] = useState<AnalyticsData | null>(null);

  // Store Management State
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  // Check for Skool membership via localStorage user session
  const sessionUser = localStorage.getItem('vib3_session');
  const [isSkool, setIsSkool] = useState(false);

  useEffect(() => {
    const data = db_getAnalytics(profile.username);
    setStats(data);
    
    // Check Skool Status
    const usersStr = localStorage.getItem('vib3_users');
    if (usersStr && sessionUser) {
        const users = JSON.parse(usersStr);
        const u = users.find((x: any) => x.id === sessionUser);
        if (u && u.isVib3Skool) setIsSkool(true);
    }
  }, [profile.username, sessionUser]);

  if (!stats) return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-slate-900"><Loader2 className="animate-spin text-blue-600"/></div>;

  const totalClicks = (Object.values(stats.linkClicks) as number[]).reduce((a, b) => a + b, 0);
  
  // Simple CTR calculation (clicks / views)
  const ctrValue = stats.totalViews > 0 ? ((totalClicks / stats.totalViews) * 100).toFixed(1) : "0.0";

  const handleGenerateInsight = async () => {
    if (!stats) return;
    setLoadingInsight(true);
    try {
        const topLinkEntry = (Object.entries(stats.linkClicks) as [string, number][]).sort((a, b) => b[1] - a[1])[0];
        // Try to find title from content list
        const topLinkBlock = profile.content.find(b => b.id === topLinkEntry[0] && b.type === 'link');
        const topLinkTitle = (topLinkBlock && 'title' in topLinkBlock) ? topLinkBlock.title : topLinkEntry[0];

        const analysisData = {
            totalViews: stats.totalViews,
            clicks: totalClicks,
            ctr: ctrValue + "%",
            topLink: topLinkTitle,
            history: stats.history
        };

        const result = await generateAnalyticsInsights({
            ...analysisData,
            viewsTrend: "+Unknown",
            clicksTrend: "+Unknown",
            revenue: `$${stats.totalRevenue}`,
            revenueTrend: "0%",
            topSource: "Direct" 
        });
        setInsight(result);
    } catch (e) {
        setInsight("Failed to generate insights. Please try again.");
    } finally {
        setLoadingInsight(false);
    }
  };

  // --- Link Management Functions ---
  const handleAddLink = () => {
    const newLink: ContentItem = {
      type: 'link',
      id: Date.now().toString(),
      title: "New Link",
      url: "https://",
      active: true
    };
    setProfile(prev => ({
      ...prev,
      content: [newLink, ...prev.content]
    }));
  };

  const handleUpdateLink = (id: string, field: string, value: any) => {
    setProfile(prev => ({
        ...prev,
        content: prev.content.map(item => item.id === id ? { ...item, [field]: value } : item)
    }));
  };

  const handleDeleteLink = (id: string) => {
      if(confirm('Are you sure you want to delete this link?')) {
          setProfile(prev => ({
              ...prev,
              content: prev.content.filter(item => item.id !== id)
          }));
      }
  };

  // --- Store Management Functions ---
  const handleAddProduct = () => {
      const newProduct = {
          type: 'product' as const,
          id: Date.now().toString(),
          title: "New Product",
          price: "$0.00",
          description: "",
          imageUrl: "",
          images: [],
          variations: [],
          active: true,
          imageFit: 'cover' as const
      };
      setProfile(prev => ({
          ...prev,
          content: [newProduct, ...prev.content]
      }));
      setEditingProduct(newProduct);
  };

  const handleDeleteProduct = (id: string) => {
      if(confirm('Are you sure you want to delete this product?')) {
          setProfile(prev => ({
              ...prev,
              content: prev.content.filter(item => item.id !== id)
          }));
      }
  };

  const handleSaveProduct = (updated: Product) => {
       setProfile(prev => ({
          ...prev,
          content: prev.content.map(item => item.id === updated.id ? { ...updated, type: 'product' as const } : item)
       }));
       setEditingProduct(null);
  };

  const linkBlocks = profile.content.filter(b => b.type === 'link');
  const productBlocks = profile.content.filter(b => b.type === 'product') as Product[];

  return (
    <div className="min-h-screen bg-gray-50 text-slate-900 flex flex-col">
      {/* Top Navigation */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
        <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <button 
                    onClick={onBack}
                    className="p-2 hover:bg-gray-100 rounded-lg text-slate-500 hover:text-slate-900 transition-colors"
                >
                    <ArrowLeft size={20}/>
                </button>
                <div>
                    <h1 className="text-lg font-bold flex items-center gap-2 text-slate-900">
                        <Activity size={18} className="text-blue-600"/>
                        Analytics Portal
                    </h1>
                    <div className="flex items-center gap-2">
                        <p className="text-xs text-slate-500">Dashboard for @{profile.username}</p>
                        {isSkool && (
                            <span className="flex items-center gap-1 text-[10px] font-bold uppercase bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full border border-indigo-100">
                                <GraduationCap size={10}/> Vib3 Skool Member
                            </span>
                        )}
                    </div>
                </div>
            </div>
            <div className="flex gap-2">
                 <button 
                    onClick={() => setActiveTab('overview')}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'overview' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-gray-100'}`}
                 >
                     Overview
                 </button>
                 <button 
                    onClick={() => setActiveTab('links')}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'links' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-gray-100'}`}
                 >
                     Links
                 </button>
                 <button 
                    onClick={() => setActiveTab('store')}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'store' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-gray-100'}`}
                 >
                     Inventory
                 </button>
                 <div className="w-px bg-gray-200 mx-1 my-2"></div>
                 <button 
                    onClick={auth_logout}
                    className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg transition-colors"
                    title="Sign Out"
                 >
                     <LogOut size={20}/>
                 </button>
            </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 max-w-7xl mx-auto w-full space-y-8">
          {!profile.isPublished && (
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-amber-800 flex items-center gap-3">
                  <AlertCircle size={20} className="text-amber-600"/>
                  <div>
                      <p className="font-bold text-sm">Your site is not published yet.</p>
                      <p className="text-xs opacity-80">Analytics will start tracking once you publish and share your link.</p>
                  </div>
              </div>
          )}

          {activeTab === 'overview' && (
              <>
                {/* Key Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard 
                        title="Total Views" 
                        value={stats.totalViews.toLocaleString()} 
                        trend="Live" 
                        isPositive={true}
                        icon={<Users size={20} className="text-blue-600"/>}
                    />
                    <StatCard 
                        title="Link Clicks" 
                        value={totalClicks.toLocaleString()} 
                        trend="Live" 
                        isPositive={true}
                        icon={<MousePointer2 size={20} className="text-purple-600"/>}
                    />
                    <StatCard 
                        title="Click-Through Rate" 
                        value={`${ctrValue}%`} 
                        trend="Avg" 
                        isPositive={Number(ctrValue) > 5}
                        icon={<BarChart3 size={20} className="text-orange-600"/>}
                    />
                    <StatCard 
                        title="Store Revenue" 
                        value={`$${stats.totalRevenue.toFixed(2)}`} 
                        trend="Live" 
                        isPositive={true}
                        icon={<DollarSign size={20} className="text-green-600"/>}
                    />
                </div>

                {/* Main Layout: Charts & AI */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* Left Column: Charts */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Traffic Chart */}
                        <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-6">
                            <h3 className="font-bold mb-6 flex items-center gap-2 text-slate-900">
                                <TrendingUp size={18} className="text-blue-600"/>
                                Activity History (Last 30 Days)
                            </h3>
                            <div className="h-64 flex items-end justify-start gap-2 px-2 overflow-x-auto">
                                {stats.history.length === 0 ? (
                                    <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">No data yet</div>
                                ) : (
                                    stats.history.map((h, i) => (
                                        <div key={i} className="flex-1 min-w-[20px] bg-blue-100 hover:bg-blue-200 rounded-t-sm relative group transition-all" style={{ height: `${Math.max(10, h.views * 10)}%` }}>
                                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                                                {h.date}: {h.views} views
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Top Links */}
                        <div className="bg-white border border-gray-200 shadow-sm rounded-xl overflow-hidden">
                            <div className="p-6 border-b border-gray-200">
                                <h3 className="font-bold text-slate-900">Link Performance</h3>
                            </div>
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 text-slate-500 uppercase text-xs">
                                    <tr>
                                        <th className="px-6 py-3">Link Name</th>
                                        <th className="px-6 py-3">Clicks</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {linkBlocks.map((block) => {
                                        // Cast block as any to safely access link properties since we filtered by type='link'
                                        const link = block as any; 
                                        const clicks = stats.linkClicks[link.id] || 0;
                                        return (
                                            <tr key={link.id} className="hover:bg-gray-50 transition-colors text-slate-700">
                                                <td className="px-6 py-4 font-medium">{link.title}</td>
                                                <td className="px-6 py-4">{clicks}</td>
                                            </tr>
                                        );
                                    })}
                                    {linkBlocks.length === 0 && (
                                        <tr><td colSpan={2} className="px-6 py-4 text-center text-slate-400">No links added yet</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Right Column: AI & Breakdown */}
                    <div className="space-y-6">
                        {/* AI Analyst */}
                        <div className="bg-white border border-indigo-100 shadow-sm rounded-xl p-6 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <BrainCircuit size={100} className="text-indigo-600"/>
                            </div>
                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                        <BrainCircuit size={20} className="text-indigo-600"/>
                                        AI Analyst
                                    </h3>
                                    <span className="text-[10px] uppercase tracking-wider bg-indigo-50 text-indigo-600 px-2 py-1 rounded border border-indigo-100">Gemini 3.0 Pro</span>
                                </div>
                                
                                {!insight ? (
                                    <div className="text-center py-8">
                                        <p className="text-slate-500 text-sm mb-6">
                                            Use our AI to analyze your dashboard data and discover actionable growth strategies.
                                        </p>
                                        <button 
                                            onClick={handleGenerateInsight}
                                            disabled={loadingInsight}
                                            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 transition-all"
                                        >
                                            {loadingInsight ? <Loader2 size={18} className="animate-spin"/> : "Generate Insights"}
                                        </button>
                                    </div>
                                ) : (
                                    <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-100 text-sm space-y-4 animate-fade-in max-h-96 overflow-y-auto custom-scrollbar">
                                        <div className="whitespace-pre-line text-indigo-900 leading-relaxed">
                                            {insight}
                                        </div>
                                        <button 
                                            onClick={() => setInsight(null)}
                                            className="text-xs text-indigo-600 hover:text-indigo-800 underline"
                                        >
                                            Reset Analysis
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Device Breakdown */}
                        <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-6">
                            <h3 className="font-bold mb-4 flex items-center gap-2 text-slate-900">
                                <Smartphone size={18} className="text-slate-400"/>
                                Device Type
                            </h3>
                            <div className="flex items-center gap-4">
                                <div className="flex-1 text-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                                    <Smartphone size={24} className="mx-auto mb-2 text-slate-500"/>
                                    <div className="text-lg font-bold text-slate-900">100%</div>
                                    <div className="text-xs text-slate-500">Web</div>
                                </div>
                                <div className="flex-1 text-center p-3 bg-gray-50 rounded-lg border border-gray-100 opacity-50">
                                    <Globe size={24} className="mx-auto mb-2 text-slate-500"/>
                                    <div className="text-lg font-bold text-slate-900">0%</div>
                                    <div className="text-xs text-slate-500">App</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
              </>
          )}

          {/* --- LINKS TAB --- */}
          {activeTab === 'links' && (
               <div className="space-y-6 animate-fade-in">
                   <div className="flex justify-between items-center">
                      <div>
                          <h2 className="text-2xl font-bold text-slate-900">Link Management</h2>
                          <p className="text-slate-500">Add, edit, and track your profile links.</p>
                      </div>
                      <button 
                          onClick={handleAddLink}
                          className="bg-black hover:bg-slate-800 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition-colors shadow-lg shadow-gray-200"
                      >
                          <Plus size={18}/> Add Link
                      </button>
                  </div>

                  <div className="bg-white border border-gray-200 shadow-sm rounded-xl overflow-hidden">
                      <table className="w-full text-left">
                          <thead className="bg-gray-50 border-b border-gray-200">
                              <tr>
                                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Link Title & URL</th>
                                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Clicks</th>
                                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-center">Status</th>
                                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Actions</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                              {linkBlocks.map((block) => {
                                  const link = block as any;
                                  return (
                                      <tr key={link.id} className="hover:bg-slate-50/50 transition-colors">
                                          <td className="px-6 py-4">
                                              <div className="space-y-2">
                                                  <input 
                                                    value={link.title}
                                                    onChange={(e) => handleUpdateLink(link.id, 'title', e.target.value)}
                                                    className="block w-full font-bold text-slate-900 bg-transparent focus:bg-blue-50 focus:outline-none rounded px-2 py-1 -ml-2"
                                                    placeholder="Link Title"
                                                  />
                                                  <div className="flex items-center gap-2 text-slate-500 text-sm">
                                                      <LinkIcon size={14}/>
                                                      <input 
                                                        value={link.url}
                                                        onChange={(e) => handleUpdateLink(link.id, 'url', e.target.value)}
                                                        className="flex-1 bg-transparent focus:bg-blue-50 focus:outline-none rounded px-2 py-0.5 -ml-2"
                                                        placeholder="https://"
                                                      />
                                                  </div>
                                              </div>
                                          </td>
                                          <td className="px-6 py-4">
                                              <div className="flex items-center gap-2">
                                                  <MousePointer2 size={16} className="text-slate-400"/>
                                                  <span className="font-bold">{stats.linkClicks[link.id] || 0}</span>
                                              </div>
                                          </td>
                                          <td className="px-6 py-4 text-center">
                                              <button 
                                                onClick={() => handleUpdateLink(link.id, 'active', !link.active)}
                                                className={`p-2 rounded-lg transition-colors ${link.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}
                                                title={link.active ? "Active" : "Inactive"}
                                              >
                                                  <Power size={18}/>
                                              </button>
                                          </td>
                                          <td className="px-6 py-4 text-right">
                                              <div className="flex justify-end gap-2">
                                                  <a 
                                                    href={link.url} 
                                                    target="_blank" 
                                                    rel="noreferrer"
                                                    className="p-2 hover:bg-gray-100 text-slate-400 hover:text-slate-900 rounded-lg transition-colors"
                                                  >
                                                      <ExternalLink size={18}/>
                                                  </a>
                                                  <button 
                                                    onClick={() => handleDeleteLink(link.id)}
                                                    className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition-colors"
                                                  >
                                                      <Trash2 size={18}/>
                                                  </button>
                                              </div>
                                          </td>
                                      </tr>
                                  );
                              })}
                               {linkBlocks.length === 0 && (
                                  <tr>
                                      <td colSpan={4} className="px-6 py-16 text-center text-slate-400">
                                          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <LinkIcon size={32} className="opacity-20"/>
                                          </div>
                                          <p className="font-medium">No links added yet.</p>
                                          <button onClick={handleAddLink} className="text-blue-600 hover:underline mt-2 text-sm font-bold">Add your first link</button>
                                      </td>
                                  </tr>
                              )}
                          </tbody>
                      </table>
                  </div>
               </div>
          )}

          {/* --- STORE INVENTORY TAB --- */}
          {activeTab === 'store' && (
              <div className="space-y-6 animate-fade-in">
                  <div className="flex justify-between items-center">
                      <div>
                          <h2 className="text-2xl font-bold text-slate-900">Store Inventory</h2>
                          <p className="text-slate-500">Manage products, images, and variations.</p>
                      </div>
                      <button 
                          onClick={handleAddProduct}
                          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition-colors shadow-lg shadow-green-200"
                      >
                          <Plus size={18}/> Add Product
                      </button>
                  </div>

                  <div className="bg-white border border-gray-200 shadow-sm rounded-xl overflow-hidden">
                      <table className="w-full text-left">
                          <thead className="bg-gray-50 border-b border-gray-200">
                              <tr>
                                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Product</th>
                                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Details</th>
                                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Price</th>
                                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Actions</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                              {productBlocks.map(product => (
                                  <tr key={product.id} className="hover:bg-slate-50/50 transition-colors">
                                      <td className="px-6 py-4">
                                          <div className="flex items-center gap-3">
                                              <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center shrink-0 border border-gray-200 relative group">
                                                  {product.imageUrl ? (
                                                      <img src={product.imageUrl} className={`w-full h-full ${product.imageFit === 'contain' ? 'object-contain p-1' : 'object-cover'}`} alt={product.title}/>
                                                  ) : (
                                                      <ShoppingBag size={20} className="text-slate-400"/>
                                                  )}
                                                  {product.images && product.images.length > 1 && (
                                                      <div className="absolute bottom-0 right-0 bg-black/60 text-white text-[9px] px-1 rounded-tl">
                                                          +{product.images.length - 1}
                                                      </div>
                                                  )}
                                              </div>
                                              <div>
                                                <div className="font-bold text-slate-900">{product.title}</div>
                                                {product.variations && product.variations.length > 0 && (
                                                    <div className="flex items-center gap-1 text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full w-fit mt-1">
                                                        <Layers size={10}/>
                                                        {product.variations.length} Variants
                                                    </div>
                                                )}
                                              </div>
                                          </div>
                                      </td>
                                      <td className="px-6 py-4 text-sm text-slate-500 max-w-xs truncate">
                                          {product.description || "No description"}
                                      </td>
                                      <td className="px-6 py-4 font-mono text-sm font-bold text-slate-700">
                                          {product.price}
                                      </td>
                                      <td className="px-6 py-4 text-right">
                                          <div className="flex justify-end gap-2">
                                              <button 
                                                onClick={() => setEditingProduct(product)} 
                                                className="p-2 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-lg transition-colors" 
                                                title="Edit Details & Images"
                                              >
                                                  <Edit2 size={18}/>
                                              </button>
                                              <button 
                                                onClick={() => handleDeleteProduct(product.id)} 
                                                className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition-colors" 
                                                title="Delete"
                                              >
                                                  <Trash2 size={18}/>
                                              </button>
                                          </div>
                                      </td>
                                  </tr>
                              ))}
                              {productBlocks.length === 0 && (
                                  <tr>
                                      <td colSpan={4} className="px-6 py-16 text-center text-slate-400">
                                          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <ShoppingBag size={32} className="opacity-20"/>
                                          </div>
                                          <p className="font-medium">Your store is empty.</p>
                                          <button onClick={handleAddProduct} className="text-green-600 hover:underline mt-2 text-sm font-bold">Add your first product</button>
                                      </td>
                                  </tr>
                              )}
                          </tbody>
                      </table>
                  </div>
              </div>
          )}

          {/* Detailed Product Editor Modal */}
          {editingProduct && (
              <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-6 animate-fade-in">
                  <ProductForm 
                      initialProduct={editingProduct}
                      onSave={handleSaveProduct}
                      onCancel={() => setEditingProduct(null)}
                  />
              </div>
          )}
      </div>
    </div>
  );
};

const StatCard: React.FC<{
    title: string; 
    value: string; 
    trend: string; 
    isPositive: boolean;
    icon: React.ReactNode;
}> = ({ title, value, trend, isPositive, icon }) => (
    <div className="bg-white border border-gray-200 shadow-sm p-6 rounded-xl hover:border-gray-300 transition-colors">
        <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-gray-50 rounded-lg">{icon}</div>
            <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${isPositive ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                {trend}
            </div>
        </div>
        <div className="text-2xl font-bold mb-1 text-slate-900">{value}</div>
        <div className="text-xs text-slate-500">{title}</div>
    </div>
);

export default Dashboard;