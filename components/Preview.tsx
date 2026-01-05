
import React, { useState, useEffect } from 'react';
import { UserProfile, Product, ContentItem, ProductVariationOption } from '../types';
import LiveAssistant from './LiveAssistant';
import { MessageCircle, Play, Pause, ExternalLink, ShoppingBag, ChevronLeft, CreditCard, Check, Calendar, Clock, ChevronRight, Battery, Wifi, Signal, Instagram, Linkedin, Mail, Music } from 'lucide-react';
import { sendChatMessage } from '../services/geminiService';
import { trackView, trackClick, trackRevenue } from '../services/storage';

interface PreviewProps {
  profile: UserProfile;
  isLive?: boolean;
}

const StoreCatalogView: React.FC<{
  products: Product[];
  onClose: () => void;
  onSelectProduct: (product: Product) => void;
  theme: string;
}> = ({ products, onClose, onSelectProduct, theme }) => {
  return (
    <div className="absolute inset-0 z-[100] bg-slate-50 flex flex-col animate-slide-up overflow-hidden text-slate-900">
      <div className="px-4 py-4 bg-white border-b flex items-center justify-between shrink-0">
        <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-full">
          <ChevronLeft size={24}/>
        </button>
        <span className="font-bold text-sm uppercase tracking-wide">Store Catalog</span>
        <div className="w-8"></div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-md mx-auto w-full space-y-4">
          {products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <ShoppingBag size={48} className="mb-4"/>
              <p className="text-sm">No products available</p>
            </div>
          ) : (
            products.map(product => {
              const imgClass = product.imageFit === 'contain' ? 'object-contain p-2' : 'object-cover';
              const basePrice = parseFloat(product.price.replace(/[^0-9.-]+/g,"")) || 0;

              return (
                <div
                  key={product.id}
                  onClick={() => onSelectProduct(product)}
                  className="w-full bg-white shadow-md border border-gray-200 rounded-xl overflow-hidden flex gap-4 p-4 cursor-pointer hover:shadow-lg transition-all hover:scale-[1.02]"
                >
                  <div className="w-24 h-24 bg-gray-100 shrink-0 rounded-lg overflow-hidden flex items-center justify-center">
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt={product.title} className={`w-full h-full ${imgClass}`}/>
                    ) : product.images[0] ? (
                      <img src={product.images[0]} alt={product.title} className={`w-full h-full ${imgClass}`}/>
                    ) : (
                      <ShoppingBag size={32} className="text-slate-300"/>
                    )}
                  </div>
                  <div className="flex-1 flex flex-col justify-center">
                    <h4 className="font-bold text-base mb-1 text-slate-900 line-clamp-2">
                      {product.title}
                    </h4>
                    <p className="text-xs text-slate-500 mb-2 line-clamp-2">
                      {product.description || "No description"}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-lg text-blue-600">{product.price}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectProduct(product);
                        }}
                        className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

const CheckoutView: React.FC<{ product: Product; onClose: () => void; theme: string; stripeConnected: boolean; username: string; onViewCatalog?: () => void }> = ({ product, onClose, theme, stripeConnected, username, onViewCatalog }) => {
  const [step, setStep] = useState<'details' | 'form' | 'processing' | 'success'>('details');
  const [selectedImage, setSelectedImage] = useState(product.imageUrl || product.images[0] || "");
  const [selectedOptions, setSelectedOptions] = useState<Record<string, ProductVariationOption>>({});

  // Auto-select first options
  useEffect(() => {
    const defaults: Record<string, ProductVariationOption> = {};
    product.variations.forEach(v => {
      if (v.options.length > 0) defaults[v.id] = v.options[0];
    });
    setSelectedOptions(defaults);
  }, [product]);

  // Calculate Price
  const basePrice = parseFloat(product.price.replace(/[^0-9.-]+/g,"")) || 0;
  const modifiers = (Object.values(selectedOptions) as ProductVariationOption[]).reduce((acc, opt) => acc + (opt.priceModifier || 0), 0);
  const finalPrice = (basePrice + modifiers).toFixed(2);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep('processing');
    setTimeout(() => {
      // Track Revenue
      if (!isNaN(parseFloat(finalPrice))) {
          trackRevenue(username, parseFloat(finalPrice));
      }
      setStep('success');
    }, 1500);
  };

  const imageClass = product.imageFit === 'contain' ? 'object-contain p-4' : 'object-cover';

  if (step === 'success') {
    return (
      <div className="fixed inset-0 z-[100] bg-white flex flex-col items-center justify-center p-8 text-slate-900 animate-fade-in">
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6 animate-bounce">
          <Check size={48} className="text-green-600" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Confirmed!</h2>
        <p className="text-center text-slate-500 mb-8">
          Transaction successful for<br/>
          <span className="font-semibold text-slate-900">{product.title}</span>
        </p>
        <button 
          onClick={onClose}
          className="w-full max-w-md py-4 bg-slate-900 text-white rounded-xl font-bold"
        >
          Done
        </button>
      </div>
    );
  }

  // --- STEP 1: PRODUCT DETAILS ---
  if (step === 'details') {
      return (
        <div className="absolute inset-0 z-[100] bg-slate-50 flex flex-col animate-slide-up overflow-hidden text-slate-900">
             <div className="px-4 py-4 bg-white border-b flex items-center justify-between shrink-0">
                <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-full"><ChevronLeft size={24}/></button>
                <span className="font-bold text-sm uppercase tracking-wide">Product Details</span>
                <div className="w-8"></div>
            </div>

            <div className="flex-1 overflow-y-auto p-0">
                {/* Gallery */}
                <div className="w-full aspect-square bg-white relative">
                   {selectedImage ? (
                       <img src={selectedImage} className={`w-full h-full ${imageClass}`} alt="product"/>
                   ) : (
                       <div className="w-full h-full flex items-center justify-center bg-gray-100 text-slate-300"><ShoppingBag size={48}/></div>
                   )}
                   {/* Thumbs */}
                   {product.images.length > 1 && (
                       <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 px-4 overflow-x-auto">
                           {product.images.map((img, idx) => (
                               <button 
                                key={idx} 
                                onClick={() => setSelectedImage(img)}
                                className={`w-12 h-12 rounded-lg border-2 overflow-hidden bg-white ${selectedImage === img ? 'border-blue-600' : 'border-white'}`}
                               >
                                   <img src={img} className="w-full h-full object-cover"/>
                               </button>
                           ))}
                       </div>
                   )}
                </div>

                <div className="p-6 space-y-6">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900">{product.title}</h2>
                        <h3 className="text-xl font-bold text-blue-600 mt-1">${finalPrice}</h3>
                    </div>

                    <p className="text-slate-600 text-sm leading-relaxed">{product.description}</p>

                    {/* Variations */}
                    {product.variations.map(v => (
                        <div key={v.id} className="space-y-2">
                            <label className="text-xs font-bold uppercase text-slate-500">{v.name}</label>
                            <div className="flex flex-wrap gap-2">
                                {v.options.map(opt => (
                                    <button
                                        key={opt.id}
                                        onClick={() => setSelectedOptions(prev => ({...prev, [v.id]: opt}))}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${selectedOptions[v.id]?.id === opt.id ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700 border-gray-200 hover:border-slate-400'}`}
                                    >
                                        {opt.name}
                                        {opt.priceModifier > 0 && <span className="text-xs opacity-70 ml-1">(+${opt.priceModifier})</span>}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="p-4 bg-white border-t shrink-0 pb-8 space-y-2">
                <button
                    onClick={() => setStep('form')}
                    className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold shadow-lg transition-all"
                >
                    Buy Now • ${finalPrice}
                </button>
                {onViewCatalog && (
                  <button
                    onClick={onViewCatalog}
                    className="w-full py-3 bg-white text-slate-900 border-2 border-slate-900 rounded-xl font-bold transition-all hover:bg-slate-50"
                  >
                    View Store Catalog
                  </button>
                )}
            </div>
        </div>
      );
  }

  // --- STEP 2: CHECKOUT FORM (Existing Logic) ---
  return (
    <div className="absolute inset-0 z-[100] bg-slate-50 flex flex-col animate-slide-up overflow-hidden text-slate-900">
      <div className="px-4 py-4 bg-white border-b flex items-center justify-between shrink-0">
        <button onClick={() => setStep('details')} className="p-1 hover:bg-slate-100 rounded-full"><ChevronLeft size={24}/></button>
        <span className="font-bold text-sm uppercase tracking-wide">Checkout</span>
        <div className="w-8"></div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-md mx-auto w-full">
            <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm mb-6 flex gap-4">
            <div className="w-20 h-20 bg-slate-100 rounded-lg overflow-hidden shrink-0 flex items-center justify-center">
                {selectedImage ? (
                    <img src={selectedImage} className="w-full h-full object-cover" alt={product.title}/>
                ) : (
                    <ShoppingBag size={24} className="text-slate-300"/>
                )}
            </div>
            <div className="flex flex-col justify-center">
                <h3 className="font-bold text-slate-900 leading-tight mb-1">{product.title}</h3>
                <div className="text-xs text-slate-500 mb-1">
                    {(Object.values(selectedOptions) as ProductVariationOption[]).map(o => o.name).join(', ')}
                </div>
                <span className="font-bold text-lg text-blue-600">${finalPrice}</span>
            </div>
            </div>

            <form id="checkout-form" onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase text-slate-400">Contact Information</h4>
                    <input required type="email" placeholder="Email Address" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"/>
                </div>

                <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase text-slate-400">Payment Method</h4>
                    {stripeConnected && (
                        <div className="bg-[#635BFF]/10 border border-[#635BFF]/30 p-2 rounded-lg flex items-center justify-center mb-2">
                            <span className="text-xs font-bold text-[#635BFF]">Powered by Stripe</span>
                        </div>
                    )}
                    <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4">
                        <div className="flex items-center gap-2 text-slate-900 font-medium border-b border-slate-100 pb-2 mb-2">
                            <CreditCard size={18} className="text-slate-400"/>
                            Credit Card
                        </div>
                        <input required placeholder="Card Number" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"/>
                        <div className="flex gap-3">
                            <input required placeholder="MM/YY" className="w-1/2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"/>
                            <input required placeholder="CVC" className="w-1/2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"/>
                        </div>
                    </div>
                </div>
            </form>
        </div>
      </div>

      <div className="p-4 bg-white border-t shrink-0">
          <button 
            type="submit" 
            form="checkout-form"
            disabled={step === 'processing'}
            className={`w-full max-w-md mx-auto py-4 ${stripeConnected ? 'bg-[#635BFF] hover:bg-[#5851E3]' : 'bg-slate-900 hover:bg-slate-800'} text-white rounded-xl font-bold shadow-lg transition-all flex items-center justify-center gap-2`}
          >
            {step === 'processing' ? 'Processing...' : `Pay $${finalPrice}`}
          </button>
      </div>
    </div>
  );
}

const BookingModal: React.FC<{ profile: UserProfile; onClose: () => void; onBook: (date: string, time: string) => void }> = ({ profile, onClose, onBook }) => {
    const [selectedDate, setSelectedDate] = useState<number | null>(null);
    const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
    
    const availableDates = Array.from({length: 14}, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() + i + 1);
        return { 
            dayName: d.toLocaleDateString('en-US', {weekday: 'short'}),
            date: d.getDate(),
            full: d
        };
    }).filter(d => profile.consultation.availability.includes(d.dayName)).slice(0, 5);

    const slots = profile.consultation.slots && profile.consultation.slots.length > 0 
        ? profile.consultation.slots 
        : ["09:00 AM", "10:00 AM", "01:00 PM", "03:00 PM"];

    const handleConfirm = () => {
        if(selectedDate !== null && selectedSlot) {
            onBook(availableDates[selectedDate].full.toLocaleDateString(), selectedSlot);
        }
    };

    return (
        <div className="absolute inset-0 z-[60] bg-white flex flex-col animate-slide-up text-slate-900">
             <div className="px-4 py-4 border-b flex items-center justify-between">
                <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-full"><ChevronLeft size={24}/></button>
                <span className="font-bold text-sm uppercase tracking-wide">Select Time</span>
                <div className="w-8"></div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                 <div>
                     <h3 className="text-lg font-bold mb-1">{profile.consultation.title}</h3>
                     <p className="text-slate-500 text-sm mb-4 flex items-center gap-2">
                         <Clock size={14}/> {profile.consultation.duration} min • {profile.consultation.price}
                     </p>
                     
                     <h4 className="font-semibold mb-3 text-sm">Select Date</h4>
                     {availableDates.length > 0 ? (
                        <div className="flex gap-2 overflow-x-auto pb-2">
                            {availableDates.map((d, i) => (
                                <button 
                                key={i}
                                onClick={() => { setSelectedDate(i); setSelectedSlot(null); }}
                                className={`flex flex-col items-center justify-center min-w-[60px] h-20 rounded-xl border transition-all ${selectedDate === i ? 'bg-slate-900 text-white border-slate-900' : 'bg-white border-gray-200 text-slate-600 hover:border-slate-400'}`}
                                >
                                    <span className="text-xs uppercase font-bold">{d.dayName}</span>
                                    <span className="text-xl font-bold">{d.date}</span>
                                </button>
                            ))}
                        </div>
                     ) : (
                         <div className="text-sm text-slate-500 italic">No available dates found in the next 2 weeks.</div>
                     )}
                 </div>

                 {selectedDate !== null && (
                     <div className="animate-fade-in">
                         <h4 className="font-semibold mb-3 text-sm">Available Slots</h4>
                         <div className="grid grid-cols-2 gap-3">
                             {slots.map((slot) => (
                                 <button
                                    key={slot}
                                    onClick={() => setSelectedSlot(slot)}
                                    className={`py-3 rounded-lg text-sm font-medium border transition-all ${selectedSlot === slot ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-gray-200 text-slate-700 hover:border-blue-300'}`}
                                 >
                                     {slot}
                                 </button>
                             ))}
                         </div>
                     </div>
                 )}
            </div>

            <div className="p-4 border-t">
                <button 
                    disabled={!selectedSlot}
                    onClick={handleConfirm}
                    className="w-full py-4 bg-slate-900 disabled:bg-slate-300 text-white rounded-xl font-bold shadow-lg transition-all"
                >
                    Continue to Payment
                </button>
            </div>
        </div>
    );
}

const Preview: React.FC<PreviewProps> = ({ profile, isLive }) => {
  const [showLive, setShowLive] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [isPlayingWelcome, setIsPlayingWelcome] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showCatalog, setShowCatalog] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState<{role: 'user' | 'model', text: string}[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [time, setTime] = useState("");

  // Get all active products from profile.content
  const allProducts = profile.content.filter(
    (item): item is Product & { type: 'product' } => item.type === 'product' && item.active
  );

  useEffect(() => {
    if (isLive) trackView(profile.username);
    
    // Update Clock
    const timer = setInterval(() => {
        const now = new Date();
        setTime(now.toLocaleTimeString('en-US', {hour: 'numeric', minute: '2-digit'}));
    }, 1000);
    return () => clearInterval(timer);
  }, [isLive, profile.username]);

  const handleLinkClick = (linkId: string) => {
    if (isLive) trackClick(profile.username, linkId);
  };

  const playWelcome = async () => {
    if (!profile.voiceWelcomeUrl) return;
    try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioContextClass();
        const binaryString = atob(profile.voiceWelcomeUrl);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i);
        const int16 = new Int16Array(bytes.buffer); 
        const buffer = ctx.createBuffer(1, int16.length, 24000);
        const channelData = buffer.getChannelData(0);
        for(let i=0; i<int16.length; i++) {
            channelData[i] = int16[i] / 32768.0;
        }
        
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        source.start(0);
        setIsPlayingWelcome(true);
        source.onended = () => setIsPlayingWelcome(false);
    } catch(e) {
        console.error("Audio play error", e);
    }
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    
    const newHistory = [...chatHistory, { role: 'user' as const, text: chatInput }];
    setChatHistory(newHistory);
    setChatInput("");
    setChatLoading(true);

    try {
      const historyForApi: any = newHistory.map(h => ({
          role: h.role,
          parts: [{ text: h.text }]
      }));
      
      const response = await sendChatMessage(historyForApi, chatInput);
      setChatHistory(prev => [...prev, { role: 'model', text: response || "I'm thinking..." }]);
    } catch (err) {
      setChatHistory(prev => [...prev, { role: 'model', text: "Sorry, I had trouble connecting." }]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleBooking = (date: string, time: string) => {
      setShowBookingModal(false);
      // Create a temporary "product" for checkout flow
      const bookingProduct: Product = {
          id: 'booking-' + Date.now(),
          title: profile.consultation.title,
          description: `${date} at ${time} • ${profile.consultation.duration} min call`,
          price: profile.consultation.price,
          imageUrl: '',
          images: [],
          variations: [],
          active: true
      };
      setSelectedProduct(bookingProduct);
  };

  const containerClasses = {
    modern: "bg-white text-slate-900",
    retro: "bg-[#f4e4bc] text-[#4a3b2a] font-serif border-4 border-[#4a3b2a]",
    glass: "bg-white/10 backdrop-blur-lg text-white border border-white/20",
    microsoft90s: "bg-[#c0c0c0] text-black border-2 border-[#808080]",
    apple90s: "bg-gradient-to-br from-[#5bcefa] to-[#f5a9b8] text-[#1d1d1f]",
    classic: "bg-gradient-to-b from-slate-50 to-white text-slate-900",
    card: "bg-slate-100 text-slate-900",
    minimal: "bg-white text-slate-900",
    bold: "bg-slate-900 text-white",
    professional: "bg-white text-slate-900 border-l-4 border-blue-600",
    creative: "bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 text-slate-900"
  };

  const buttonClasses = {
    modern: "bg-slate-900 text-white hover:bg-slate-800 rounded-xl",
    retro: "bg-[#ff6b6b] text-[#4a3b2a] border-2 border-[#4a3b2a] shadow-[4px_4px_0px_0px_#4a3b2a] hover:translate-y-1 hover:shadow-none transition-all rounded-none",
    glass: "bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/30 text-white rounded-2xl",
    microsoft90s: "bg-[#c0c0c0] text-black border-t-2 border-l-2 border-r-2 border-b-2 border-t-white border-l-white border-r-[#404040] border-b-[#404040] hover:border-t-[#e0e0e0] hover:border-l-[#e0e0e0] active:border-t-[#404040] active:border-l-[#404040] active:border-r-white active:border-b-white rounded-none",
    apple90s: "bg-gradient-to-r from-[#ff6b9d] via-[#c471ed] to-[#12c2e9] text-white hover:from-[#ff8db4] hover:via-[#d391f0] hover:to-[#4fd1f0] rounded-full shadow-lg hover:shadow-xl transition-all",
    classic: "bg-blue-600 text-white hover:bg-blue-700 rounded-lg shadow-md hover:shadow-lg transition-all",
    card: "bg-white text-slate-900 hover:bg-slate-50 rounded-2xl border-2 border-slate-200 shadow-sm hover:shadow-md transition-all",
    minimal: "bg-slate-900 text-white hover:bg-slate-800 rounded-full border border-slate-300",
    bold: "bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all font-semibold",
    professional: "bg-blue-600 text-white hover:bg-blue-700 rounded-md shadow-sm hover:shadow-md transition-all border-l-4 border-blue-800",
    creative: "bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 text-white hover:from-purple-700 hover:via-pink-700 hover:to-orange-600 rounded-3xl shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-1"
  };

  const getContrastYIQ = (hexcolor: string) => {
      if(!hexcolor) return 'text-slate-900';
      hexcolor = hexcolor.replace("#", "");
      var r = parseInt(hexcolor.substr(0,2),16);
      var g = parseInt(hexcolor.substr(2,2),16);
      var b = parseInt(hexcolor.substr(4,2),16);
      var yiq = ((r*299)+(g*587)+(b*114))/1000;
      return (yiq >= 128) ? 'text-slate-900' : 'text-white';
  };

  const Content = () => (
    <div className={`relative w-full h-full overflow-y-auto overflow-x-hidden ${containerClasses[profile.theme]} bg-opacity-95 ${isLive ? 'min-h-screen' : ''} scrollbar-hide pt-14 pb-10`}>
        {/* Header Image Section - Clean banner without overlays */}
        <div className="relative w-full shrink-0 group" style={{ height: `${profile.headerHeight || 300}px` }}>
            <img
                src={profile.avatarUrl}
                alt="profile header"
                className="w-full h-full"
                style={{
                  objectFit: profile.headerImageFit || 'cover',
                  objectPosition: profile.headerImagePosition || 'center'
                }}
            />

            {/* Voice Welcome Button */}
            {profile.voiceWelcomeUrl && (
                <button
                    onClick={(e) => { e.stopPropagation(); playWelcome(); }}
                    className="absolute bottom-6 right-6 p-4 bg-white/20 backdrop-blur-md border border-white/50 rounded-full text-white shadow-lg hover:bg-white/30 transition z-20"
                >
                    {isPlayingWelcome ? <Pause size={20} fill="currentColor"/> : <Play size={20} fill="currentColor"/>}
                </button>
            )}
        </div>

        {/* Social Media Icons - Below header */}
        {(profile.socialLinks?.instagram || profile.socialLinks?.tiktok || profile.socialLinks?.linkedin || profile.socialLinks?.email) && (
            <div className="w-full px-4 pt-6 pb-4 flex justify-center gap-3 max-w-md mx-auto">
                {profile.socialLinks.instagram && (
                    <a
                        href={profile.socialLinks.instagram}
                        target="_blank"
                        rel="noreferrer"
                        className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white hover:scale-110 transition-all shadow-lg"
                        title="Instagram"
                    >
                        <Instagram size={20} />
                    </a>
                )}
                {profile.socialLinks.tiktok && (
                    <a
                        href={profile.socialLinks.tiktok}
                        target="_blank"
                        rel="noreferrer"
                        className="w-12 h-12 bg-black rounded-full flex items-center justify-center text-white hover:scale-110 transition-all shadow-lg"
                        title="TikTok"
                    >
                        <Music size={20} />
                    </a>
                )}
                {profile.socialLinks.linkedin && (
                    <a
                        href={profile.socialLinks.linkedin}
                        target="_blank"
                        rel="noreferrer"
                        className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white hover:scale-110 transition-all shadow-lg"
                        title="LinkedIn"
                    >
                        <Linkedin size={20} />
                    </a>
                )}
                {profile.socialLinks.email && (
                    <a
                        href={`mailto:${profile.socialLinks.email}`}
                        className="w-12 h-12 bg-slate-700 rounded-full flex items-center justify-center text-white hover:scale-110 transition-all shadow-lg"
                        title="Email"
                    >
                        <Mail size={20} />
                    </a>
                )}
            </div>
        )}

        {/* Name and Bio Section - Below social icons */}
        <div className="w-full px-6 pb-6 max-w-md mx-auto text-center">
            <h1 className="text-3xl font-bold mb-2 leading-tight">{profile.name}</h1>
            <p className="text-sm opacity-80 leading-relaxed">{profile.bio}</p>
        </div>

        {/* Dynamic Content Stream */}
        <div className="w-full px-4 py-4 flex flex-col items-center gap-4 min-h-[300px] max-w-md mx-auto">
            {profile.content.map((block) => {
                if (!block.active) return null;

                // --- LINK ---
                if (block.type === 'link') {
                    const link = block as any;
                    // Check for block-specific colors first, then profile-level colors
                    const hasCustomColors = link.buttonColor || link.buttonTextColor || profile.buttonColor || profile.buttonTextColor;
                    const buttonBg = link.buttonColor || profile.buttonColor || '#000000';
                    const buttonText = link.buttonTextColor || profile.buttonTextColor || '#ffffff';
                    
                    return (
                        <a 
                            key={link.id}
                            href={link.url}
                            target="_blank"
                            rel="noreferrer"
                            onClick={() => handleLinkClick(link.id)}
                            className={`block w-full py-4 px-6 text-center font-medium transition-all flex items-center justify-between group ${hasCustomColors ? 'rounded-xl' : buttonClasses[profile.theme]}`}
                            style={hasCustomColors ? {
                                backgroundColor: buttonBg,
                                color: buttonText
                            } : undefined}
                        >
                            <span className="flex-1">{link.title}</span>
                            <ExternalLink size={14} className="opacity-0 group-hover:opacity-100 transition-opacity"/>
                        </a>
                    );
                }

                // --- PRODUCT ---
                if (block.type === 'product') {
                    const product = block as Product;
                    const imgClass = product.imageFit === 'contain' ? 'object-contain p-2' : 'object-cover';
                    
                    return (
                        <div key={product.id} className={`w-full ${profile.theme === 'glass' ? 'bg-white/10' : profile.theme === 'retro' ? 'bg-[#ffedcd] border-2 border-[#4a3b2a]' : profile.theme === 'microsoft90s' ? 'bg-[#d4d0c8] border-2 border-[#808080]' : profile.theme === 'apple90s' ? 'bg-gradient-to-br from-[#ffb3d9] to-[#b3f0ff] border-2 border-[#ff6b9d]' : 'bg-white shadow-sm border border-gray-100'} rounded-xl overflow-hidden flex gap-4 p-3`}>
                             <div className="w-20 h-20 bg-gray-200 shrink-0 rounded-lg overflow-hidden flex items-center justify-center">
                                {product.imageUrl ? <img src={product.imageUrl} alt={product.title} className={`w-full h-full ${imgClass}`}/> : product.images[0] ? <img src={product.images[0]} alt={product.title} className={`w-full h-full ${imgClass}`}/> : <ShoppingBag size={24} className="text-slate-300 mx-auto"/>}
                            </div>
                            <div className="flex-1 flex flex-col justify-center text-left">
                                <h4 className={`font-bold text-sm mb-0.5 line-clamp-1 ${profile.theme === 'modern' ? 'text-slate-800' : ''}`}>{product.title}</h4>
                                <p className={`text-[10px] opacity-70 mb-2 line-clamp-1 ${profile.theme === 'modern' ? 'text-slate-600' : ''}`}>{product.description || "No description"}</p>
                                <div className="flex items-center justify-between">
                                    <span className={`font-bold text-sm ${profile.theme === 'modern' ? 'text-slate-900' : ''}`}>{product.price}</span>
                                    <button 
                                        onClick={() => setSelectedProduct(product)}
                                        className="px-3 py-1 bg-green-500 rounded-lg text-white text-xs font-bold hover:scale-105 transition"
                                    >
                                        Buy
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                }

                // --- BOOKING ---
                if (block.type === 'consultation') {
                    const textColor = getContrastYIQ(profile.consultation.cardColor || '#fff7ed');
                    return (
                        <button 
                            key={block.id}
                            onClick={() => setShowBookingModal(true)}
                            style={{ backgroundColor: profile.consultation.cardColor || '#fff7ed' }}
                            className={`w-full p-4 rounded-xl flex items-center justify-between group transition-all shadow-sm hover:shadow-md border border-black/5`}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center bg-black/10`}>
                                    <Calendar size={20} className={textColor}/>
                                </div>
                                <div className={`text-left ${textColor}`}>
                                    <h3 className="font-bold text-sm">{profile.consultation.title}</h3>
                                    <p className="text-xs opacity-70">{profile.consultation.duration} min • {profile.consultation.price}</p>
                                </div>
                            </div>
                            <div className={`p-2 rounded-full bg-black/5`}>
                                <ChevronRight size={16} className={textColor}/>
                            </div>
                        </button>
                    );
                }

                return null;
            })}
        </div>
    </div>
  );

  const BackgroundLayer = () => (
     <div className="absolute inset-0 z-0">
        {profile.backgroundType === 'video' ? (
            <video src={profile.backgroundUrl} autoPlay loop muted playsInline className="w-full h-full object-cover" />
        ) : profile.backgroundType === 'image' ? (
            <img src={profile.backgroundUrl} alt="bg" className="w-full h-full object-cover" />
        ) : (
            <div className="w-full h-full" style={{ backgroundColor: profile.backgroundColor }}></div>
        )}
        {/* If using Modern theme, Content has its own bg, so we don't strictly need a dark overlay here unless theme is glass */}
        {profile.theme === 'glass' && <div className="absolute inset-0 bg-black/30"></div>}
    </div>
  );

  // Status Bar Component for the "Phone" feel
  const StatusBar = () => (
      <div className="absolute top-0 left-0 right-0 h-14 z-50 flex justify-between items-start px-8 py-3 text-white pointer-events-none mix-blend-difference">
          <div className="text-sm font-semibold">{time}</div>
          <div className="flex items-center gap-1.5">
              <Signal size={14}/>
              <Wifi size={14}/>
              <Battery size={14}/>
          </div>
      </div>
  );

  if (isLive) {
    return (
      <div className="relative min-h-screen w-full bg-black text-white font-sans">
         <BackgroundLayer />
         <div className="absolute inset-0 z-10">
            <Content />
         </div>
         {showCatalog && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                <div className="w-full max-w-md h-full max-h-[90vh] relative rounded-2xl overflow-hidden">
                    <StoreCatalogView
                        products={allProducts}
                        onClose={() => setShowCatalog(false)}
                        onSelectProduct={(product) => {
                          setShowCatalog(false);
                          setSelectedProduct(product);
                        }}
                        theme={profile.theme}
                    />
                </div>
            </div>
        )}
         {selectedProduct && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                <div className="w-full max-w-md h-full max-h-[90vh] relative rounded-2xl overflow-hidden">
                    <CheckoutView
                        product={selectedProduct}
                        onClose={() => setSelectedProduct(null)}
                        theme={profile.theme}
                        stripeConnected={profile.stripeConnected}
                        username={profile.username}
                        onViewCatalog={() => {
                          setSelectedProduct(null);
                          setShowCatalog(true);
                        }}
                    />
                </div>
            </div>
        )}
        {showBookingModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                 <div className="w-full max-w-md h-full max-h-[600px] relative rounded-2xl overflow-hidden">
                    <BookingModal profile={profile} onClose={() => setShowBookingModal(false)} onBook={handleBooking} />
                 </div>
            </div>
        )}
        <LiveAssistant isOpen={showLive} onClose={() => setShowLive(false)} />
      </div>
    );
  }

  // --- DEVICE FRAME PREVIEW ---
  return (
    <div className="relative h-full w-full flex justify-center items-center py-8">
      <div className={`relative w-[360px] h-[740px] rounded-[50px] border-[10px] border-slate-900 overflow-hidden shadow-2xl bg-black transition-all ring-1 ring-black/50`}>
        {/* Dynamic Island / Notch Area */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[30px] w-[110px] bg-black rounded-b-[20px] z-[60] flex items-center justify-center">
            {/* Camera lens simulation */}
            <div className="w-2 h-2 rounded-full bg-[#1a1a1a] absolute right-4"></div>
        </div>

        <StatusBar />

        <BackgroundLayer />
        
        <div className="absolute inset-0 z-10">
            <Content />
        </div>

        {/* Home Indicator */}
        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-32 h-1 bg-white/50 rounded-full z-50 mix-blend-difference"></div>

        {showCatalog && (
            <StoreCatalogView
                products={allProducts}
                onClose={() => setShowCatalog(false)}
                onSelectProduct={(product) => {
                  setShowCatalog(false);
                  setSelectedProduct(product);
                }}
                theme={profile.theme}
            />
        )}
        {selectedProduct && (
            <CheckoutView
                product={selectedProduct}
                onClose={() => setSelectedProduct(null)}
                theme={profile.theme}
                stripeConnected={profile.stripeConnected}
                username={profile.username}
                onViewCatalog={() => {
                  setSelectedProduct(null);
                  setShowCatalog(true);
                }}
            />
        )}
        {showBookingModal && (
            <BookingModal profile={profile} onClose={() => setShowBookingModal(false)} onBook={handleBooking} />
        )}
        {showChat && (
             <div className="absolute inset-x-0 bottom-0 h-2/3 bg-white rounded-t-2xl p-4 flex flex-col shadow-[0_-10px_40px_rgba(0,0,0,0.5)] z-20 animate-slide-up">
                <div className="flex justify-between items-center mb-4 border-b pb-2">
                    <h3 className="font-bold text-slate-800">Chat with {profile.name} AI</h3>
                    <button onClick={() => setShowChat(false)}><ExternalLink size={16}/></button>
                </div>
                <div className="flex-1 overflow-y-auto space-y-3 mb-4 text-sm">
                    {chatHistory.map((msg, idx) => (
                        <div key={idx} className={`${msg.role === 'user' ? 'ml-auto bg-blue-100 text-blue-900' : 'mr-auto bg-gray-100 text-gray-800'} p-3 rounded-lg max-w-[85%]`}>
                            {msg.text}
                        </div>
                    ))}
                    {chatLoading && <div className="text-gray-400 text-xs italic">Typing...</div>}
                </div>
                <form onSubmit={handleChatSubmit} className="flex gap-2">
                    <input 
                        value={chatInput}
                        onChange={e => setChatInput(e.target.value)}
                        className="flex-1 border rounded-lg px-3 py-2 text-sm"
                        placeholder="Ask me anything..."
                    />
                    <button type="submit" className="bg-blue-600 text-white p-2 rounded-lg">Send</button>
                </form>
             </div>
        )}
      </div>
      <LiveAssistant isOpen={showLive} onClose={() => setShowLive(false)} />
    </div>
  );
};

export default Preview;
