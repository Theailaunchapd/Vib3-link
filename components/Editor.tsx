

import React, { useState } from 'react';
import { UserProfile, AIModel, ContentItem, Product } from '../types';
import { generateBioWithThinking, generateProfileImage, generateBackgroundVideo, editImageWithPrompt, generateWelcomeSpeech, getTrendingTopics, fileToBase64, generateProductDescription, generateThemeFromDescription } from '../services/geminiService';
import { generateThemeWithAI } from '../services/openaiService';
import { db_saveProfile } from '../services/storage';
import { Wand2, Image as ImageIcon, Video, Mic, Plus, Trash2, Layout, Link as LinkIcon, Edit3, Loader2, Sparkles, AlertCircle, ShoppingBag, CreditCard, X, CheckCircle2, BarChart2, Globe, Copy, ExternalLink, Calendar, MoveUp, MoveDown, ArrowUp, ArrowDown, ChevronsUp, GripVertical, Settings, LogOut, Upload, Paintbrush } from 'lucide-react';
import ProductForm from './ProductForm';
import { auth_logout } from '../services/auth';

interface EditorProps {
  profile: UserProfile;
  setProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  onOpenDashboard: () => void;
}

const Editor: React.FC<EditorProps> = ({ profile, setProfile, onOpenDashboard }) => {
  const [activeTab, setActiveTab] = useState<'content' | 'store' | 'bookings' | 'appearance' | 'ai'>('content');
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [themePrompt, setThemePrompt] = useState(""); // For Magic Theme
  const [aiError, setAiError] = useState<string | null>(null);
  const [showStripeModal, setShowStripeModal] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [calendarIdInput, setCalendarIdInput] = useState(profile.consultation.calendarId || "");
  const [newSlotInput, setNewSlotInput] = useState("");
  const [ttsVoice, setTtsVoice] = useState("Kore");
  
  // Product Deep Edit State
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Unified Content Management
  const addLink = () => {
    const newLink: ContentItem = {
      type: 'link',
      id: Date.now().toString(),
      title: "New Link",
      url: "https://",
      active: true
    };
    setProfile(p => ({ ...p, content: [newLink, ...p.content] })); // Add to top by default
  };

  const removeContentBlock = (id: string) => {
    setProfile(p => ({ ...p, content: p.content.filter(b => b.id !== id) }));
  };

  const updateContentBlock = (id: string, updates: Partial<ContentItem>) => {
    setProfile(p => ({
      ...p,
      content: p.content.map(b => b.id === id ? { ...b, ...updates } as ContentItem : b)
    }));
  };

  const moveContentBlock = (index: number, direction: 'up' | 'down' | 'top') => {
    const newContent = [...profile.content];
    if (direction === 'top') {
        const item = newContent.splice(index, 1)[0];
        newContent.unshift(item);
    } else {
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex >= 0 && targetIndex < newContent.length) {
          [newContent[index], newContent[targetIndex]] = [newContent[targetIndex], newContent[index]];
        }
    }
    setProfile(p => ({ ...p, content: newContent }));
  };

  // Product Management (Still called from Store tab, but updates content array)
  const addProduct = () => {
    const newProduct: ContentItem = {
        type: 'product' as const,
        id: Date.now().toString(),
        title: "New Product",
        price: "$19.99",
        description: "",
        imageUrl: "",
        images: [],
        variations: [],
        active: true,
        imageFit: 'cover' as const
    };
    setProfile(p => ({ ...p, content: [newProduct, ...p.content] }));
  };
  
  const handleSaveProduct = (updatedProduct: Product) => {
    setProfile(p => ({
      ...p,
      content: p.content.map(b => b.id === updatedProduct.id ? { ...b, ...updatedProduct } : b)
    }));
    setEditingProduct(null);
  };

  // Booking Management (Toggles existence of consultation block)
  const toggleConsultationBlock = (enabled: boolean) => {
      setProfile(p => {
          let newContent = [...p.content];
          const exists = newContent.some(b => b.type === 'consultation');
          
          if (enabled && !exists) {
              // Add to top or specific position? Let's add after bio (top of list)
              newContent.unshift({ type: 'consultation', id: 'consultation', active: true });
          } else if (!enabled && exists) {
              newContent = newContent.filter(b => b.type !== 'consultation');
          }

          return {
              ...p,
              content: newContent,
              consultation: { ...p.consultation, enabled }
          };
      });
  };

  const handleConnectStripe = (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingAction('stripe');
    setTimeout(() => {
        setProfile(p => ({ ...p, stripeConnected: true }));
        setLoadingAction(null);
        setShowStripeModal(false);
    }, 1500);
  };
  
  const handleConnectGoogleCalendar = () => {
      if (!calendarIdInput) {
          alert("Please enter a Calendar ID");
          return;
      }
      setLoadingAction('calendar');
      setTimeout(() => {
          setProfile(p => ({
              ...p,
              consultation: { ...p.consultation, calendarConnected: true, calendarId: calendarIdInput }
          }));
          setLoadingAction(null);
      }, 2000);
  };

  const getPublicUrl = () => {
      // Use URL object for robust parsing of current location (handles subdirectories/sandboxes)
      const url = new URL(window.location.href);
      url.search = ''; // Clear existing params
      url.hash = ''; // Clear hash if any
      url.searchParams.set('u', profile.username);
      return url.toString();
  };

  const handlePublish = () => {
      const updated = { ...profile, isPublished: true };
      setProfile(updated);
      db_saveProfile(updated); // Explicitly save to ensure data is ready for public view
      setShowPublishModal(true);
  };

  const toggleDayAvailability = (day: string) => {
      const current = profile.consultation.availability;
      const updated = current.includes(day) 
        ? current.filter(d => d !== day)
        : [...current, day];
      setProfile(p => ({...p, consultation: {...p.consultation, availability: updated}}));
  };

  const addSlot = () => {
      if (!newSlotInput.trim()) return;
      if (!newSlotInput.match(/\d{1,2}:\d{2}\s?(AM|PM)/i)) {
          alert("Please use format like '09:00 AM'");
          return;
      }
      const updated = [...profile.consultation.slots, newSlotInput.trim()];
      updated.sort((a,b) => {
          const dateA = new Date('1970/01/01 ' + a);
          const dateB = new Date('1970/01/01 ' + b);
          return dateA.getTime() - dateB.getTime();
      });
      setProfile(p => ({...p, consultation: {...p.consultation, slots: updated}}));
      setNewSlotInput("");
  };

  const removeSlot = (slot: string) => {
      const updated = profile.consultation.slots.filter(s => s !== slot);
      setProfile(p => ({...p, consultation: {...p.consultation, slots: updated}}));
  };

  // AI Actions
  const handleGenerateBio = async () => {
    setLoadingAction('bio');
    setAiError(null);
    try {
      const links = profile.content.filter(b => b.type === 'link').map((b: any) => b.title).join(', ');
      const bio = await generateBioWithThinking(profile.bio, `User name: ${profile.name}. Links: ${links}`);
      setProfile(p => ({ ...p, bio }));
    } catch (e: any) {
      setAiError(e.message);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleSuggestLinks = async () => {
    setLoadingAction('trends');
    try {
        const trends = await getTrendingTopics();
        const bio = await generateBioWithThinking(profile.bio, `Suggest 3 links based on these trends: ${trends.text}`);
        alert(`Trends found: ${trends.text}\n\nSuggestion: ${bio}`);
    } catch(e) {
        setAiError("Failed to fetch trends.");
    } finally {
        setLoadingAction(null);
    }
  };

  const handleGenerateAvatar = async () => {
    if (!prompt) return;
    setLoadingAction('avatar');
    setAiError(null);
    try {
      if ((window as any).aistudio && !(await (window as any).aistudio.hasSelectedApiKey())) {
          await (window as any).aistudio.openSelectKey();
      }
      const imageUrl = await generateProfileImage(prompt, '1K');
      setProfile(p => ({ ...p, avatarUrl: imageUrl }));
    } catch (e: any) {
      setAiError(e.message);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleEditAvatar = async () => {
     if (!prompt) return;
     setLoadingAction('editAvatar');
     try {
         if (!profile.avatarUrl.startsWith('data:')) {
             setAiError("Can only edit AI generated or uploaded images (base64) in this demo.");
             return;
         }
         const base64 = profile.avatarUrl.split(',')[1];
         const newUrl = await editImageWithPrompt(base64, prompt);
         setProfile(p => ({...p, avatarUrl: newUrl}));
     } catch(e: any) {
         setAiError(e.message);
     } finally {
         setLoadingAction(null);
     }
  };

  const handleGenerateVideoBg = async () => {
    if (!prompt) return;
    setLoadingAction('videobg');
    setAiError(null);
    try {
        if ((window as any).aistudio && !(await (window as any).aistudio.hasSelectedApiKey())) {
            await (window as any).aistudio.openSelectKey();
        }
        const videoUrl = await generateBackgroundVideo(prompt, '9:16');
        setProfile(p => ({ ...p, backgroundUrl: videoUrl, backgroundType: 'video' }));
    } catch (e: any) {
        setAiError("Video generation failed. Ensure you selected a paid project key.");
    } finally {
        setLoadingAction(null);
    }
  };

  const handleGenerateTTS = async () => {
    // If prompt is empty, fallback to a standard welcome using bio
    const textToSpeak = prompt.trim() || `Hi! I'm ${profile.name}. ${profile.bio}`;
    
    if (!textToSpeak) {
        setAiError("Please enter text or ensure your bio is not empty.");
        return;
    }

    setLoadingAction('tts');
    setAiError(null);
    try {
        const audioData = await generateWelcomeSpeech(textToSpeak, ttsVoice);
        setProfile(p => ({ ...p, voiceWelcomeUrl: audioData }));
    } catch(e: any) {
        setAiError(e.message);
    } finally {
        setLoadingAction(null);
    }
  };
  
  const handleMagicTheme = async () => {
    if (!themePrompt) return;
    setLoadingAction('magicTheme');
    setAiError(null);
    try {
        // Use OpenAI to generate theme configuration
        const themeResult = await generateThemeWithAI(themePrompt);
        
        // Update Profile with the generated theme
        setProfile(p => ({
            ...p,
            backgroundColor: themeResult.backgroundColor,
            theme: themeResult.theme,
            backgroundType: themeResult.backgroundType,
            backgroundUrl: themeResult.backgroundUrl || p.backgroundUrl
        }));

        // Show success message with reasoning
        if (themeResult.reasoning) {
            console.log('AI Theme Reasoning:', themeResult.reasoning);
        }

    } catch (e: any) {
        setAiError(e.message || 'Failed to generate theme');
    } finally {
        setLoadingAction(null);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files?.[0]) {
          const base64 = await fileToBase64(e.target.files[0]);
          setProfile(p => ({ ...p, avatarUrl: `data:image/png;base64,${base64}` }));
      }
  };

  const handleBackgroundUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video') => {
    if (e.target.files?.[0]) {
        const file = e.target.files[0];
        const base64 = await fileToBase64(file);
        const dataUrl = `data:${file.type};base64,${base64}`;
        setProfile(p => ({ 
            ...p, 
            backgroundType: type, 
            backgroundUrl: dataUrl 
        }));
    }
  };

  const handleProductImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, prodId: string) => {
     if (e.target.files?.[0]) {
         const base64 = await fileToBase64(e.target.files[0]);
         const newUrl = `data:image/png;base64,${base64}`;
         // Also append to images array logic if needed, but here simple inline
         const prod = profile.content.find(b => b.id === prodId) as Product;
         if (prod) {
             const newImages = prod.images ? [...prod.images, newUrl] : [newUrl];
             updateContentBlock(prodId, { imageUrl: newUrl, images: newImages });
         }
     }
  };

  const generateProductDesc = async (prodId: string, title: string) => {
     if(!title) return;
     setLoadingAction(`desc-${prodId}`);
     try {
         const desc = await generateProductDescription(title);
         updateContentBlock(prodId, { description: desc });
     } catch(e) {
         console.error(e);
     } finally {
         setLoadingAction(null);
     }
  };

  const generateProductImg = async (prodId: string, title: string) => {
      if(!title) return;
      setLoadingAction(`img-${prodId}`);
      try {
        if ((window as any).aistudio && !(await (window as any).aistudio.hasSelectedApiKey())) {
            await (window as any).aistudio.openSelectKey();
        }
        const url = await generateProfileImage(`Product photography of ${title}, clean lighting, high resolution, minimalist background`, '1K');
        const prod = profile.content.find(b => b.id === prodId) as Product;
        if (prod) {
            const newImages = prod.images ? [...prod.images, url] : [url];
            updateContentBlock(prodId, { imageUrl: url, images: newImages });
        }
      } catch(e) {
          console.error(e);
      } finally {
          setLoadingAction(null);
      }
  };

  return (
    <div className="h-full flex flex-col bg-white border-r border-gray-200 overflow-hidden relative text-slate-900">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-white">
        <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Vib3 Idea Link
            </h1>
            <p className="text-slate-500 text-sm mt-1">Enhance your bio with Gemini 2.5 & 3.0</p>
        </div>
        <div className="flex gap-2">
            <button 
                onClick={onOpenDashboard}
                className="p-2 bg-gray-100 hover:bg-gray-200 text-slate-600 rounded-lg transition-colors flex flex-col items-center gap-1 group border border-gray-200"
                title="Analytics"
            >
                <BarChart2 size={20} className="group-hover:text-blue-600 transition-colors"/>
            </button>
            <button 
                onClick={handlePublish}
                className="px-4 py-2 bg-black hover:bg-slate-800 text-white rounded-lg font-bold text-sm transition-all shadow-lg shadow-slate-200 flex items-center gap-2"
            >
                <Globe size={16} /> Publish
            </button>
            <button 
                onClick={auth_logout}
                className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg transition-colors ml-1"
                title="Log Out"
            >
                <LogOut size={20} />
            </button>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex border-b border-gray-200 bg-white">
        <button 
          onClick={() => setActiveTab('content')}
          className={`flex-1 py-4 text-sm font-medium transition-colors ${activeTab === 'content' ? 'text-black border-b-2 border-blue-600' : 'text-slate-500 hover:text-black'}`}
        >
          <div className="flex items-center justify-center gap-2"><Layout size={16}/> Content</div>
        </button>
        <button 
          onClick={() => setActiveTab('store')}
          className={`flex-1 py-4 text-sm font-medium transition-colors ${activeTab === 'store' ? 'text-black border-b-2 border-green-600' : 'text-slate-500 hover:text-black'}`}
        >
          <div className="flex items-center justify-center gap-2"><ShoppingBag size={16}/> Store</div>
        </button>
        <button 
          onClick={() => setActiveTab('bookings')}
          className={`flex-1 py-4 text-sm font-medium transition-colors ${activeTab === 'bookings' ? 'text-black border-b-2 border-orange-500' : 'text-slate-500 hover:text-black'}`}
        >
          <div className="flex items-center justify-center gap-2"><Calendar size={16}/> Bookings</div>
        </button>
        <button 
          onClick={() => setActiveTab('appearance')}
          className={`flex-1 py-4 text-sm font-medium transition-colors ${activeTab === 'appearance' ? 'text-black border-b-2 border-blue-600' : 'text-slate-500 hover:text-black'}`}
        >
          <div className="flex items-center justify-center gap-2"><Paintbrush size={16}/> Style</div>
        </button>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-white">
        {aiError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex items-start gap-2">
                <AlertCircle size={16} className="mt-0.5 shrink-0"/>
                {aiError}
            </div>
        )}

        {/* --- CONTENT TAB --- */}
        {activeTab === 'content' && (
          <div className="space-y-6">
            <div className="space-y-4">
              <label className="text-xs font-semibold text-slate-500 uppercase">Profile Header</label>
              
              {/* Profile Large Image Editor */}
              <div className="relative w-full bg-gray-100 rounded-xl overflow-hidden border border-gray-200 group shadow-sm" style={{ height: `${profile.headerHeight || 300}px` }}>
                  {profile.avatarUrl ? (
                      <img 
                        src={profile.avatarUrl} 
                        className="w-full h-full" 
                        style={{
                          objectFit: profile.headerImageFit || 'cover',
                          objectPosition: profile.headerImagePosition || 'center'
                        }}
                        alt="Profile Header" 
                      />
                  ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                          <ImageIcon size={32} className="mb-2 opacity-50"/>
                          <span className="text-xs font-medium">No header image set</span>
                      </div>
                  )}
                  
                  {/* Overlay Controls */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                      <label className="cursor-pointer bg-white text-slate-900 px-4 py-2.5 rounded-lg font-bold text-xs flex items-center gap-2 hover:bg-gray-100 transition-colors shadow-lg">
                          <Upload size={14}/> Upload Photo
                          <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                      </label>
                  </div>
              </div>

              {/* Header Image Controls */}
              {profile.avatarUrl && (
                <div className="space-y-3 bg-gray-50 p-4 rounded-lg border border-gray-200">
                  {/* Height Control */}
                  <div>
                    <label className="text-xs font-medium text-slate-700 mb-2 block flex items-center gap-2">
                      <span>Header Height: {profile.headerHeight || 300}px</span>
                    </label>
                    <input 
                      type="range"
                      min="200"
                      max="600"
                      value={profile.headerHeight || 300}
                      onChange={(e) => setProfile({...profile, headerHeight: parseInt(e.target.value)})}
                      className="w-full accent-blue-600"
                    />
                  </div>

                  {/* Image Fit Control */}
                  <div>
                    <label className="text-xs font-medium text-slate-700 mb-2 block">Image Fit</label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setProfile({...profile, headerImageFit: 'cover'})}
                        className={`flex-1 px-3 py-2 rounded-lg text-xs font-bold transition-colors ${
                          (profile.headerImageFit || 'cover') === 'cover' 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-white text-slate-600 border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        Fill Screen
                      </button>
                      <button
                        onClick={() => setProfile({...profile, headerImageFit: 'contain'})}
                        className={`flex-1 px-3 py-2 rounded-lg text-xs font-bold transition-colors ${
                          profile.headerImageFit === 'contain' 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-white text-slate-600 border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        Fit to Screen
                      </button>
                    </div>
                  </div>

                  {/* Position Control */}
                  <div>
                    <label className="text-xs font-medium text-slate-700 mb-2 block">Image Position</label>
                    <div className="grid grid-cols-3 gap-2">
                      {['top', 'center', 'bottom'].map((vertical) => 
                        ['left', 'center', 'right'].map((horizontal) => {
                          const position = `${vertical} ${horizontal}`;
                          const isActive = (profile.headerImagePosition || 'center') === position;
                          return (
                            <button
                              key={position}
                              onClick={() => setProfile({...profile, headerImagePosition: position})}
                              className={`px-2 py-2 rounded text-xs font-medium transition-colors ${
                                isActive 
                                  ? 'bg-blue-600 text-white' 
                                  : 'bg-white text-slate-600 border border-gray-300 hover:bg-gray-50'
                              }`}
                            >
                              {vertical === 'center' && horizontal === 'center' ? 'Center' : 
                               vertical === 'top' && horizontal === 'left' ? '↖' :
                               vertical === 'top' && horizontal === 'center' ? '↑' :
                               vertical === 'top' && horizontal === 'right' ? '↗' :
                               vertical === 'center' && horizontal === 'left' ? '←' :
                               vertical === 'center' && horizontal === 'right' ? '→' :
                               vertical === 'bottom' && horizontal === 'left' ? '↙' :
                               vertical === 'bottom' && horizontal === 'center' ? '↓' :
                               '↘'}
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-4">
                 <div className="flex-1 space-y-2">
                     <input 
                        value={profile.name}
                        onChange={e => setProfile({...profile, name: e.target.value})}
                        className="w-full bg-gray-50 border border-gray-300 rounded-lg px-4 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Display Name"
                     />
                     <a 
                       href={getPublicUrl()} 
                       target="_blank" 
                       rel="noreferrer"
                       className="flex items-center bg-gray-50 border border-gray-300 rounded-lg px-4 py-2 text-slate-400 text-sm hover:bg-gray-100 transition-colors cursor-pointer group"
                    >
                       <span className="group-hover:text-blue-500 transition-colors">vib3link.com/</span>
                       <span className="text-slate-900 font-medium group-hover:text-blue-600 transition-colors">{profile.username}</span>
                       <ExternalLink size={14} className="ml-2 text-slate-400 group-hover:text-blue-500 transition-colors"/>
                    </a>
                     <textarea 
                        value={profile.bio}
                        onChange={e => setProfile({...profile, bio: e.target.value})}
                        className="w-full bg-gray-50 border border-gray-300 rounded-lg px-4 py-2 text-slate-900 h-20 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Bio"
                     />
                 </div>
                 <button onClick={handleGenerateBio} className="w-20 bg-purple-50 border border-purple-200 rounded-lg flex flex-col items-center justify-center text-purple-600 text-xs hover:bg-purple-100">
                    <Wand2 size={16} className="mb-1"/>
                    AI Write
                 </button>
              </div>
            </div>

            <div className="space-y-4">
               <div className="flex justify-between items-center">
                 <label className="text-xs font-semibold text-slate-500 uppercase">Blocks</label>
                 <button onClick={addLink} className="text-xs bg-black text-white px-3 py-1.5 rounded-full hover:bg-slate-800 flex items-center gap-1">
                    <Plus size={14}/> Add Link
                 </button>
               </div>
               
               {profile.content.length === 0 && (
                   <div className="text-center py-8 text-slate-400 text-sm border-2 border-dashed border-gray-200 rounded-xl">
                       Your page is empty. Add links, products, or enable bookings.
                   </div>
               )}

               <div className="space-y-3">
               {profile.content.map((block, index) => (
                 <div key={block.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm group hover:border-gray-300 transition-colors flex gap-4">
                    {/* Drag Handle Area */}
                    <div className="flex flex-col items-center justify-center gap-1 text-slate-300">
                        <GripVertical size={16}/>
                    </div>

                    <div className="flex-1 space-y-2">
                        {/* TYPE: LINK */}
                        {block.type === 'link' && (
                            <>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-[10px] font-bold uppercase text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded">Link</span>
                                    <input 
                                        value={block.title}
                                        onChange={e => updateContentBlock(block.id, { title: e.target.value })}
                                        className="bg-transparent text-slate-900 font-bold focus:outline-none w-full"
                                        placeholder="Link Title"
                                    />
                                </div>
                                <input 
                                    value={block.url}
                                    onChange={e => updateContentBlock(block.id, { url: e.target.value })}
                                    className="w-full bg-gray-50 border border-gray-200 rounded px-2 py-1 text-sm text-slate-600 focus:outline-none"
                                    placeholder="https://"
                                />
                            </>
                        )}

                        {/* TYPE: PRODUCT */}
                        {block.type === 'product' && (
                             <div className="flex items-center gap-3">
                                 <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center text-slate-400 shrink-0 overflow-hidden">
                                     {block.imageUrl ? <img src={block.imageUrl} className={`w-full h-full ${(block as Product).imageFit === 'contain' ? 'object-contain p-1' : 'object-cover'}`}/> : <ShoppingBag size={16}/>}
                                 </div>
                                 <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-bold uppercase text-green-600 bg-green-50 px-1.5 py-0.5 rounded">Product</span>
                                        <span className="font-bold text-sm">{block.title}</span>
                                    </div>
                                    <p className="text-xs text-slate-500 truncate">{block.price} • {block.description || "No description"}</p>
                                 </div>
                                 <button onClick={() => setEditingProduct(block as Product)} className="text-xs text-blue-500 hover:underline font-semibold flex items-center gap-1">
                                    <Settings size={12}/> Deep Edit
                                 </button>
                             </div>
                        )}

                        {/* TYPE: CONSULTATION */}
                        {block.type === 'consultation' && (
                             <div className="flex items-center gap-3">
                                 <div className="w-10 h-10 bg-orange-100 rounded flex items-center justify-center text-orange-500 shrink-0">
                                     <Calendar size={16}/>
                                 </div>
                                 <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-bold uppercase text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded">Booking</span>
                                        <span className="font-bold text-sm">{profile.consultation.title}</span>
                                    </div>
                                    <p className="text-xs text-slate-500">{profile.consultation.duration} min • {profile.consultation.price}</p>
                                 </div>
                                 <button onClick={() => setActiveTab('bookings')} className="text-xs text-blue-500 hover:underline">Configure</button>
                             </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-1 items-end">
                        <button onClick={() => removeContentBlock(block.id)} className="text-slate-300 hover:text-red-500 p-1 rounded hover:bg-red-50">
                            <Trash2 size={16}/>
                        </button>
                        <div className="flex flex-col gap-0.5 mt-auto">
                            <button 
                                disabled={index === 0}
                                onClick={() => moveContentBlock(index, 'top')}
                                className="text-slate-400 hover:text-blue-600 disabled:opacity-20 p-1 hover:bg-blue-50 rounded"
                                title="Move to Top"
                            >
                                <ChevronsUp size={16}/>
                            </button>
                            <button 
                                disabled={index === 0}
                                onClick={() => moveContentBlock(index, 'up')}
                                className="text-slate-400 hover:text-slate-800 disabled:opacity-20 p-1 hover:bg-gray-100 rounded"
                                title="Move Up"
                            >
                                <ArrowUp size={16}/>
                            </button>
                            <button 
                                disabled={index === profile.content.length - 1}
                                onClick={() => moveContentBlock(index, 'down')}
                                className="text-slate-400 hover:text-slate-800 disabled:opacity-20 p-1 hover:bg-gray-100 rounded"
                                title="Move Down"
                            >
                                <ArrowDown size={16}/>
                            </button>
                        </div>
                    </div>
                 </div>
               ))}
               </div>

               <button 
                  onClick={handleSuggestLinks} 
                  className="w-full py-3 border border-dashed border-gray-300 rounded-xl text-slate-500 hover:border-slate-400 hover:text-slate-800 flex items-center justify-center gap-2 text-sm"
               >
                   {loadingAction === 'trends' ? <Loader2 size={16} className="animate-spin"/> : <Sparkles size={16}/>}
                   Find Trending Links (Search Grounding)
               </button>
            </div>
          </div>
        )}

        {/* --- BOOKINGS TAB --- */}
        {activeTab === 'bookings' && (
            <div className="space-y-6">
                <div className="bg-orange-50 p-5 rounded-xl border border-orange-200">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                             <div className="p-2 bg-orange-100 rounded-lg text-orange-600"><Calendar size={20}/></div>
                             <div>
                                 <h3 className="text-sm font-bold text-slate-900">1:1 Consultations</h3>
                                 <p className="text-xs text-slate-500">Allow users to book time with you.</p>
                             </div>
                        </div>
                        <div className="flex items-center">
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    checked={profile.consultation.enabled} 
                                    onChange={e => toggleConsultationBlock(e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                            </label>
                        </div>
                    </div>

                    <div className={`space-y-4 transition-all duration-300 ${!profile.consultation.enabled ? 'opacity-50 pointer-events-none' : ''}`}>
                         {/* Fields... (Keeping same inputs as before) */}
                         <div>
                            <label className="text-xs font-bold uppercase text-slate-500 mb-1 block">Service Title</label>
                            <input 
                                value={profile.consultation.title}
                                onChange={e => setProfile({...profile, consultation: {...profile.consultation, title: e.target.value}})}
                                className="w-full bg-white border border-orange-200 rounded-lg px-3 py-2 text-sm"
                            />
                         </div>
                         <div>
                            <label className="text-xs font-bold uppercase text-slate-500 mb-1 block">Description</label>
                            <textarea 
                                value={profile.consultation.description}
                                onChange={e => setProfile({...profile, consultation: {...profile.consultation, description: e.target.value}})}
                                className="w-full bg-white border border-orange-200 rounded-lg px-3 py-2 text-sm h-20"
                            />
                         </div>
                         <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold uppercase text-slate-500 mb-1 block">Price</label>
                                <input 
                                    value={profile.consultation.price}
                                    onChange={e => setProfile({...profile, consultation: {...profile.consultation, price: e.target.value}})}
                                    className="w-full bg-white border border-orange-200 rounded-lg px-3 py-2 text-sm text-green-600 font-bold"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold uppercase text-slate-500 mb-1 block">Duration (min)</label>
                                <select 
                                    value={profile.consultation.duration}
                                    onChange={e => setProfile({...profile, consultation: {...profile.consultation, duration: e.target.value}})}
                                    className="w-full bg-white border border-orange-200 rounded-lg px-3 py-2 text-sm"
                                >
                                    <option value="15">15 min</option>
                                    <option value="30">30 min</option>
                                    <option value="45">45 min</option>
                                    <option value="60">60 min</option>
                                </select>
                            </div>
                         </div>
                         
                         <div>
                            <label className="text-xs font-bold uppercase text-slate-500 mb-2 block">Card Color</label>
                            <div className="flex items-center gap-2">
                                <input 
                                    type="color" 
                                    value={profile.consultation.cardColor || '#fff7ed'} 
                                    onChange={e => setProfile({...profile, consultation: {...profile.consultation, cardColor: e.target.value}})}
                                    className="h-10 w-10 rounded cursor-pointer border-0"
                                />
                            </div>
                         </div>
                         
                         {/* Availability Logic */}
                         <div>
                            <label className="text-xs font-bold uppercase text-slate-500 mb-2 block">Availability (Days)</label>
                            <div className="flex flex-wrap gap-2">
                                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                                    <button 
                                        key={day}
                                        onClick={() => toggleDayAvailability(day)}
                                        className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${profile.consultation.availability.includes(day) ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-slate-500 border-gray-200 hover:border-orange-300'}`}
                                    >
                                        {day}
                                    </button>
                                ))}
                            </div>
                         </div>

                         <div>
                            <label className="text-xs font-bold uppercase text-slate-500 mb-2 block">Available Slots</label>
                            <div className="flex flex-wrap gap-2 mb-3">
                                {profile.consultation.slots && profile.consultation.slots.map((slot, index) => (
                                    <div key={slot} className="px-3 py-1 bg-white border border-orange-200 rounded-full text-sm flex items-center gap-2 text-slate-700">
                                        {slot}
                                        <button onClick={() => removeSlot(slot)} className="text-slate-400 hover:text-red-500 flex items-center justify-center h-4 w-4 rounded-full hover:bg-red-50 ml-1"><X size={12}/></button>
                                    </div>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <input 
                                    value={newSlotInput}
                                    onChange={e => setNewSlotInput(e.target.value)}
                                    placeholder="e.g. 09:00 AM"
                                    className="flex-1 bg-white border border-orange-200 rounded-lg px-3 py-2 text-sm"
                                    onKeyDown={(e) => e.key === 'Enter' && addSlot()}
                                />
                                <button 
                                    onClick={addSlot}
                                    className="px-4 py-2 bg-orange-100 hover:bg-orange-200 text-orange-700 rounded-lg text-sm font-semibold"
                                >
                                    Add
                                </button>
                            </div>
                         </div>
                    </div>
                </div>
                {/* Calendar Connect (Same as before) */}
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                        <Calendar size={16} /> Google Calendar
                    </h3>
                    <p className="text-xs text-slate-500 mb-4">Sync bookings directly to your Google Calendar.</p>
                    
                    {!profile.consultation.calendarConnected ? (
                        <div className="space-y-3">
                             <input 
                                placeholder="Enter Google Calendar ID" 
                                value={calendarIdInput}
                                onChange={e => setCalendarIdInput(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                            />
                            <button 
                                onClick={handleConnectGoogleCalendar}
                                disabled={!!loadingAction}
                                className="w-full py-2.5 bg-white border border-gray-300 hover:bg-gray-50 text-slate-700 rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2"
                            >
                                {loadingAction === 'calendar' ? <Loader2 size={16} className="animate-spin"/> : (
                                    <img src="https://upload.wikimedia.org/wikipedia/commons/a/a5/Google_Calendar_icon_%282020%29.svg" alt="Google" className="w-5 h-5"/>
                                )}
                                Connect Calendar
                            </button>
                        </div>
                    ) : (
                         <div className="flex items-center justify-between bg-green-50 border border-green-200 p-3 rounded-lg">
                            <div className="flex items-center gap-2">
                                <CheckCircle2 size={16} className="text-green-600" />
                                <span className="text-xs font-semibold text-green-700">Calendar Connected</span>
                            </div>
                            <button 
                                onClick={() => setProfile(p => ({...p, consultation: {...p.consultation, calendarConnected: false, calendarId: undefined}}))}
                                className="text-xs text-slate-400 hover:text-red-500 ml-2"
                            >
                                Disconnect
                            </button>
                        </div>
                    )}
                </div>
            </div>
        )}

        {/* --- STORE TAB --- */}
        {activeTab === 'store' && (
            <div className="space-y-6">
                <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
                    <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                        <CreditCard size={16} /> Payment Gateway
                    </h3>
                    {!profile.stripeConnected ? (
                        <div className="text-center space-y-3">
                            <p className="text-xs text-slate-500">Connect your Stripe account.</p>
                            <button 
                                onClick={() => setShowStripeModal(true)}
                                className="w-full py-2.5 bg-[#635BFF] hover:bg-[#5851E3] text-white rounded-lg font-medium text-sm flex items-center justify-center gap-2"
                            >
                                 <span>Connect with <b>Stripe</b></span>
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center justify-between bg-[#635BFF]/10 border border-[#635BFF]/30 p-3 rounded-lg">
                            <div className="flex items-center gap-2">
                                <CheckCircle2 size={16} className="text-[#635BFF]" />
                                <span className="text-xs font-semibold text-[#635BFF]">Stripe Connected</span>
                            </div>
                            <button 
                                onClick={() => setProfile(p => ({...p, stripeConnected: false}))}
                                className="text-xs text-slate-500 hover:text-red-500 underline"
                            >
                                Disconnect
                            </button>
                        </div>
                    )}
                </div>

                <div className="flex justify-between items-center">
                    <label className="text-xs font-semibold text-slate-500 uppercase">Products</label>
                    <button onClick={addProduct} className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-full hover:bg-green-500 flex items-center gap-1">
                        <Plus size={14}/> Add Product
                    </button>
                </div>

                {profile.content.filter(b => b.type === 'product').map((product: any, index) => (
                    <div key={product.id} className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-4">
                        <div className="flex gap-4">
                            <div className="w-20 h-20 shrink-0 bg-white rounded-lg overflow-hidden border border-gray-200 relative group">
                                {product.imageUrl ? (
                                    <img src={product.imageUrl} alt="product" className={`w-full h-full ${product.imageFit === 'contain' ? 'object-contain p-1' : 'object-cover'}`}/>
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                                        <ImageIcon size={20}/>
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1">
                                     <label className="cursor-pointer text-xs text-white hover:underline">
                                         Upload
                                         <input type="file" className="hidden" onChange={(e) => handleProductImageUpload(e, product.id)}/>
                                     </label>
                                     <button 
                                        onClick={() => generateProductImg(product.id, product.title)}
                                        className="text-xs text-blue-300 hover:text-blue-200"
                                     >
                                         {loadingAction === `img-${product.id}` ? "..." : "AI Gen"}
                                     </button>
                                </div>
                            </div>

                            <div className="flex-1 space-y-2">
                                <div className="flex justify-between items-start">
                                    <input 
                                        value={product.title}
                                        onChange={e => updateContentBlock(product.id, { title: e.target.value })}
                                        placeholder="Product Name"
                                        className="bg-transparent text-slate-900 font-bold focus:outline-none border-b border-transparent focus:border-blue-500 w-full"
                                    />
                                    <div className="flex gap-1 ml-2">
                                        <button onClick={() => setEditingProduct(product)} className="text-slate-400 hover:text-blue-500 p-1 hover:bg-blue-50 rounded" title="Edit details">
                                            <Settings size={16}/>
                                        </button>
                                        <button onClick={() => removeContentBlock(product.id)} className="text-slate-400 hover:text-red-500 p-1 hover:bg-red-50 rounded">
                                            <Trash2 size={16}/>
                                        </button>
                                    </div>
                                </div>
                                <input 
                                    value={product.price}
                                    onChange={e => updateContentBlock(product.id, { price: e.target.value })}
                                    placeholder="$0.00"
                                    className="bg-white border border-gray-200 rounded px-2 py-1 text-sm text-green-600 w-24 focus:outline-none"
                                />
                            </div>
                        </div>

                        <div className="relative">
                             <textarea 
                                value={product.description}
                                onChange={e => updateContentBlock(product.id, { description: e.target.value })}
                                placeholder="Product description..."
                                className="w-full bg-white border border-gray-200 rounded px-3 py-2 text-sm text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500 h-20"
                             />
                             <button 
                                onClick={() => generateProductDesc(product.id, product.title)}
                                className="absolute bottom-2 right-2 p-1.5 bg-gray-100 rounded-md text-blue-500 hover:bg-gray-200 transition-colors"
                                title="Generate Description"
                             >
                                 {loadingAction === `desc-${product.id}` ? <Loader2 size={12} className="animate-spin"/> : <Wand2 size={12}/>}
                             </button>
                        </div>
                    </div>
                ))}
            </div>
        )}

        {/* --- APPEARANCE TAB --- */}
        {activeTab === 'appearance' && (
           <div className="space-y-8 animate-fade-in">
              {/* Magic Theme Generator */}
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-5 rounded-xl border border-purple-100 shadow-sm">
                  <h3 className="text-sm font-bold text-purple-900 mb-3 flex items-center gap-2">
                      <Sparkles size={16} className="text-purple-600"/> Magic Theme Generator
                  </h3>
                  <div className="space-y-3">
                      <textarea 
                          value={themePrompt}
                          onChange={e => setThemePrompt(e.target.value)}
                          placeholder="Describe a vibe (e.g. 'Cyberpunk coffee shop at night' or 'Minimalist beige aesthetics')"
                          className="w-full bg-white border border-purple-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-400 h-20 resize-none"
                      />
                      <button 
                          onClick={handleMagicTheme}
                          disabled={!themePrompt || !!loadingAction}
                          className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-bold text-sm shadow-lg hover:shadow-purple-200 hover:scale-[1.02] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:hover:scale-100"
                      >
                          {loadingAction === 'magicTheme' ? <Loader2 size={16} className="animate-spin"/> : "Generate Theme"}
                      </button>
                  </div>
              </div>

              <div className="space-y-4">
                 <label className="text-xs font-semibold text-slate-500 uppercase">Theme Preset</label>
                 <div className="grid grid-cols-3 gap-3">
                    {['modern', 'retro', 'glass'].map((theme) => (
                        <button 
                            key={theme}
                            onClick={() => setProfile({...profile, theme: theme as any})}
                            className={`py-3 rounded-lg border text-sm capitalize ${profile.theme === theme ? 'bg-blue-600 border-blue-600 text-white' : 'bg-gray-50 border-gray-200 text-slate-700 hover:bg-gray-100'}`}
                        >
                            {theme}
                        </button>
                    ))}
                 </div>
              </div>

              <div className="space-y-4">
                 <label className="text-xs font-semibold text-slate-500 uppercase">Background</label>
                 <div className="grid grid-cols-3 gap-2">
                     <button onClick={() => setProfile({...profile, backgroundType: 'color'})} className={`h-24 rounded-lg bg-gray-200 text-slate-500 text-xs font-bold ${profile.backgroundType === 'color' ? 'ring-2 ring-blue-500' : ''}`}>Color</button>
                     
                     {/* Image Option with Upload */}
                     <div className={`relative h-24 rounded-lg bg-gray-200 overflow-hidden group ${profile.backgroundType === 'image' ? 'ring-2 ring-blue-500' : ''}`}>
                         {profile.backgroundType === 'image' && profile.backgroundUrl ? (
                             <img src={profile.backgroundUrl} alt="bg" className="w-full h-full object-cover" />
                         ) : (
                             <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-slate-800">Image</span>
                         )}
                         <label className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-white opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity z-10">
                             <Upload size={20} />
                             <span className="text-[10px] font-bold mt-1">Upload</span>
                             <input type="file" className="hidden" accept="image/*" onChange={(e) => handleBackgroundUpload(e, 'image')} />
                         </label>
                     </div>

                     {/* Video Option with Upload */}
                     <div className={`relative h-24 rounded-lg bg-gray-200 overflow-hidden group ${profile.backgroundType === 'video' ? 'ring-2 ring-blue-500' : ''}`}>
                         {profile.backgroundType === 'video' ? (
                             <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                                 <Video size={24} className="text-white"/>
                             </div>
                         ) : (
                            <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-slate-800">Video</span>
                         )}
                         <label className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-white opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity z-10">
                             <Upload size={20} />
                             <span className="text-[10px] font-bold mt-1">Upload</span>
                             <input type="file" className="hidden" accept="video/*" onChange={(e) => handleBackgroundUpload(e, 'video')} />
                         </label>
                     </div>
                 </div>
              </div>
              {profile.backgroundType === 'color' && (
                  <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-500 uppercase">Color Value</label>
                      <input type="color" value={profile.backgroundColor} onChange={e => setProfile({...profile, backgroundColor: e.target.value})} className="w-full h-10 rounded cursor-pointer border border-gray-200"/>
                  </div>
              )}

              {/* Button Colors Section */}
              <div className="space-y-4">
                 <label className="text-xs font-semibold text-slate-500 uppercase">Button Colors</label>
                 
                 <div className="space-y-3">
                   {/* Button Background Color */}
                   <div className="space-y-2">
                     <label className="text-xs font-medium text-slate-700">Button Background</label>
                     <div className="flex gap-2 items-center">
                       <input 
                         type="color" 
                         value={profile.buttonColor || '#000000'} 
                         onChange={e => setProfile({...profile, buttonColor: e.target.value})} 
                         className="w-16 h-10 rounded cursor-pointer border border-gray-200"
                       />
                       <input 
                         type="text" 
                         value={profile.buttonColor || '#000000'} 
                         onChange={e => setProfile({...profile, buttonColor: e.target.value})} 
                         className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
                         placeholder="#000000"
                       />
                     </div>
                   </div>

                   {/* Button Text Color */}
                   <div className="space-y-2">
                     <label className="text-xs font-medium text-slate-700">Button Text</label>
                     <div className="flex gap-2 items-center">
                       <input 
                         type="color" 
                         value={profile.buttonTextColor || '#ffffff'} 
                         onChange={e => setProfile({...profile, buttonTextColor: e.target.value})} 
                         className="w-16 h-10 rounded cursor-pointer border border-gray-200"
                       />
                       <input 
                         type="text" 
                         value={profile.buttonTextColor || '#ffffff'} 
                         onChange={e => setProfile({...profile, buttonTextColor: e.target.value})} 
                         className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
                         placeholder="#ffffff"
                       />
                     </div>
                   </div>

                   {/* Preview Button */}
                   <div className="pt-2">
                     <div 
                       className="w-full py-3 rounded-lg font-bold text-sm text-center transition-all"
                       style={{
                         backgroundColor: profile.buttonColor || '#000000',
                         color: profile.buttonTextColor || '#ffffff'
                       }}
                     >
                       Button Preview
                     </div>
                   </div>
                 </div>
              </div>
           </div>
        )}

      </div>

      {/* Stripe Modal Overlay */}
      {showStripeModal && (
        <div className="absolute inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-white text-slate-900 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-gray-200">
             <div className="bg-[#635BFF] p-6 text-white flex justify-between items-start">
                 <div>
                    <h3 className="font-bold text-xl mb-1">Connect Stripe</h3>
                    <p className="text-blue-100 text-sm">Start accepting payments in minutes.</p>
                 </div>
                 <button onClick={() => setShowStripeModal(false)} className="text-white/70 hover:text-white"><X size={24}/></button>
             </div>
             
             <form onSubmit={handleConnectStripe} className="p-6 space-y-4">
                 <div className="space-y-1">
                     <label className="text-xs font-bold uppercase text-slate-500">Email Address</label>
                     <input required type="email" placeholder="you@example.com" className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#635BFF]" />
                 </div>
                 <button 
                    type="submit" 
                    disabled={loadingAction === 'stripe'}
                    className="w-full py-3 bg-[#635BFF] hover:bg-[#5851E3] text-white rounded-lg font-bold shadow-lg mt-4 flex justify-center items-center gap-2"
                 >
                    {loadingAction === 'stripe' ? <Loader2 size={18} className="animate-spin" /> : "Connect Account"}
                 </button>
             </form>
          </div>
        </div>
      )}

      {/* Product Deep Edit Modal */}
      {editingProduct && (
        <div className="absolute inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-6 animate-fade-in">
           <ProductForm 
              initialProduct={editingProduct} 
              onSave={handleSaveProduct} 
              onCancel={() => setEditingProduct(null)} 
           />
        </div>
      )}

      {/* Publish Modal Overlay */}
      {showPublishModal && (
        <div className="absolute inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-6">
            <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-scale-in">
                <div className="p-6 text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Globe size={32} className="text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">You're Live!</h2>
                    <p className="text-slate-500 mb-6">Your bio page is now published and ready to share with the world.</p>
                    
                    <div className="bg-gray-100 rounded-lg p-3 flex items-center gap-3 mb-6 border border-gray-200">
                        <a 
                            href={getPublicUrl()} 
                            target="_blank" 
                            rel="noreferrer"
                            className="flex-1 truncate text-blue-600 font-mono text-sm text-left hover:underline"
                        >
                            {getPublicUrl()}
                        </a>
                        <button 
                            onClick={() => navigator.clipboard.writeText(getPublicUrl())}
                            className="p-2 hover:bg-gray-200 rounded text-slate-500 hover:text-slate-800"
                            title="Copy"
                        >
                            <Copy size={16}/>
                        </button>
                    </div>

                    <button 
                        onClick={() => setShowPublishModal(false)}
                        className="w-full py-3 bg-black hover:bg-slate-800 text-white rounded-xl font-bold"
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default Editor;