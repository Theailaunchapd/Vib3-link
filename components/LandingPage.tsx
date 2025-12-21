


import React, { useEffect, useState } from 'react';
import { 
  Sparkles, ArrowRight, CheckCircle2, Calendar, ShoppingBag, 
  Zap, Globe, CreditCard, Bot, GraduationCap, Play, 
  TrendingUp, ShieldCheck, Star, MousePointer2, Smartphone, Layout, X, Palette, MessageCircle, Mic, Layers, Wand2
} from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
  onLogin: () => void;
  onDemo: () => void;
  onAdmin?: () => void; // Added onAdmin prop
}

const PhoneMockup = () => (
  <div className="relative mx-auto border-gray-900 bg-gray-900 border-[12px] rounded-[2.5rem] h-[600px] w-[300px] shadow-2xl flex flex-col overflow-hidden ring-1 ring-white/10 transform rotate-[-2deg] hover:rotate-0 transition-transform duration-500">
    <div className="h-[32px] w-[3px] bg-gray-800 absolute -left-[15px] top-[72px] rounded-l-lg"></div>
    <div className="h-[46px] w-[3px] bg-gray-800 absolute -left-[15px] top-[124px] rounded-l-lg"></div>
    <div className="h-[46px] w-[3px] bg-gray-800 absolute -left-[15px] top-[178px] rounded-l-lg"></div>
    <div className="h-[64px] w-[3px] bg-gray-800 absolute -right-[15px] top-[142px] rounded-r-lg"></div>
    <div className="rounded-[2rem] overflow-hidden w-full h-full bg-white relative">
        {/* Screen Background */}
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?ixlib=rb-4.0.3&w=600&q=80')] bg-cover bg-center"></div>
        <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px]"></div>
        
        {/* Dynamic Island */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[24px] w-[90px] bg-black rounded-b-[16px] z-20"></div>

        <div className="relative z-10 p-4 pt-10 flex flex-col gap-3 h-full overflow-hidden">
            {/* Header */}
            <div className="flex flex-col items-center mb-2 animate-fade-in">
                <div className="w-20 h-20 rounded-full border-2 border-white/50 overflow-hidden mb-2 shadow-lg">
                    <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80" alt="User" />
                </div>
                <h3 className="text-white font-bold text-lg drop-shadow-md">Sarah Creator</h3>
                <p className="text-white/90 text-xs text-center max-w-[200px] drop-shadow">Digital Artist & Designer. Welcome to my world. ✨</p>
            </div>

            {/* Link Block */}
            <div className="bg-white/90 backdrop-blur rounded-xl p-3 flex items-center justify-between shadow-lg transform hover:scale-105 transition-transform cursor-pointer">
                <div className="font-bold text-sm text-slate-800 pl-2">My Portfolio</div>
                <div className="bg-black text-white p-1 rounded-full"><ArrowRight size={12}/></div>
            </div>

            {/* Product Block */}
            <div className="bg-white/90 backdrop-blur rounded-xl p-3 flex gap-3 shadow-lg transform hover:scale-105 transition-transform cursor-pointer relative overflow-hidden group">
                <div className="w-12 h-12 bg-slate-200 rounded-lg overflow-hidden shrink-0">
                    <img src="https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?auto=format&fit=crop&w=200&q=80" className="w-full h-full object-cover"/>
                </div>
                <div className="flex-1">
                    <div className="flex items-center gap-1 mb-0.5">
                        <span className="text-[9px] font-bold uppercase bg-green-100 text-green-700 px-1 rounded">Store</span>
                    </div>
                    <div className="font-bold text-slate-900 text-sm leading-tight">3D Texture Pack</div>
                    <div className="text-slate-600 text-xs">$24.00</div>
                </div>
                <div className="absolute right-3 bottom-3 bg-green-500 text-white text-[10px] font-bold px-2 py-1 rounded-full">BUY</div>
            </div>

            {/* Booking Block */}
            <div className="bg-[#fff7ed]/95 backdrop-blur border border-orange-100 rounded-xl p-3 flex gap-3 shadow-lg transform hover:scale-105 transition-transform cursor-pointer">
                <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center shrink-0">
                    <Calendar size={18}/>
                </div>
                <div>
                     <div className="font-bold text-slate-900 text-sm">1:1 Consultation</div>
                     <div className="text-xs text-slate-500">30 min • $100</div>
                </div>
            </div>

            {/* AI Notification (Simulated) */}
            <div className="mt-auto mb-4 bg-black/80 backdrop-blur text-white p-3 rounded-2xl text-[10px] flex items-start gap-2 animate-bounce shadow-2xl border border-white/10">
                <div className="bg-gradient-to-tr from-blue-500 to-purple-500 p-1 rounded-full shrink-0">
                   <Sparkles size={10} className="text-white"/>
                </div>
                <div>
                    <span className="font-bold text-purple-200">Gemini AI:</span> "I noticed this product is trending. I moved it to the top for better conversions!"
                </div>
            </div>
            
            {/* Home Bar */}
            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-32 h-1 bg-white/50 rounded-full"></div>
        </div>
    </div>
  </div>
);

type ColorVariant = 'purple' | 'green' | 'orange';

// Static class map to avoid dynamic tailwind class issues
const colorMap: Record<ColorVariant, { bg: string, text: string, icon: string, glow: string }> = {
    purple: { bg: 'bg-purple-50', text: 'text-purple-600', icon: 'text-purple-500', glow: 'bg-purple-100/50' },
    green: { bg: 'bg-green-50', text: 'text-green-600', icon: 'text-green-500', glow: 'bg-green-100/50' },
    orange: { bg: 'bg-orange-50', text: 'text-orange-600', icon: 'text-orange-500', glow: 'bg-orange-100/50' },
};

const FeatureDeepDive: React.FC<{
    reversed?: boolean;
    title: string;
    description: string;
    features: string[];
    visual: React.ReactNode;
    color: ColorVariant;
}> = ({ reversed, title, description, features, visual, color }) => {
    const styles = colorMap[color];
    
    return (
        <div className="py-24 border-b border-slate-100 last:border-0">
            <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                <div className={`space-y-8 ${reversed ? 'lg:order-2' : ''}`}>
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${styles.bg} ${styles.text} shadow-sm`}>
                        <Sparkles size={32} />
                    </div>
                    <h2 className="text-4xl lg:text-5xl font-extrabold text-slate-900 leading-tight">
                        {title}
                    </h2>
                    <p className="text-xl text-slate-500 leading-relaxed">
                        {description}
                    </p>
                    <ul className="space-y-4">
                        {features.map((feat, i) => (
                            <li key={i} className="flex items-center gap-3 text-slate-700 font-medium">
                                <CheckCircle2 size={20} className={`${styles.icon} shrink-0`}/>
                                {feat}
                            </li>
                        ))}
                    </ul>
                </div>
                
                <div className={`${reversed ? 'lg:order-1' : ''}`}>
                    <div className="relative">
                        <div className={`absolute inset-0 ${styles.glow} rounded-full blur-3xl transform scale-75`}></div>
                        <div className="relative bg-white border border-slate-100 shadow-2xl rounded-3xl p-8 min-h-[400px] flex items-center justify-center overflow-hidden group">
                            {visual}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, onLogin, onDemo, onAdmin }) => {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-indigo-100 overflow-x-hidden">
      {/* Floating Navbar */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrollY > 20 ? 'bg-white/80 backdrop-blur-xl border-b border-slate-200/50 py-3' : 'bg-transparent py-6'}`}>
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
            <div className="flex items-center gap-2 font-extrabold text-xl tracking-tighter cursor-pointer" onClick={() => window.scrollTo(0,0)}>
                <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center text-white font-mono shadow-lg">V</div>
                Vib3 Idea Link
            </div>
            <div className="flex gap-4 items-center">
                <button onClick={onLogin} className="hidden md:block px-4 py-2 text-sm font-bold text-slate-600 hover:text-black transition-colors">
                    Log In
                </button>
                <button 
                  onClick={onGetStarted} 
                  className="px-5 py-2.5 text-sm font-bold bg-black text-white rounded-full hover:scale-105 hover:shadow-xl hover:shadow-slate-200 transition-all active:scale-95 flex items-center gap-2"
                >
                    Free Trial <ArrowRight size={14}/>
                </button>
            </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative pt-32 pb-20 md:pt-40 md:pb-32 overflow-hidden">
        {/* Animated Gradient Mesh */}
        <div className="absolute top-[-20%] right-[-10%] w-[80vw] h-[80vh] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-200/40 via-purple-100/30 to-transparent blur-3xl -z-10 opacity-60 pointer-events-none"></div>
        <div className="absolute top-[20%] left-[-10%] w-[60vw] h-[60vh] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-200/40 via-cyan-100/30 to-transparent blur-3xl -z-10 opacity-60 pointer-events-none"></div>
        
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Column: Copy */}
            <div className="flex flex-col items-center lg:items-start text-center lg:text-left z-10">
                <div className="inline-flex items-center gap-2 bg-slate-50 border border-slate-200 shadow-sm text-slate-900 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide mb-8 animate-fade-in hover:scale-105 transition-transform cursor-default">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                    Powered by Gemini 3.0 & Veo
                </div>
                
                <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter leading-[1] text-slate-900 mb-6">
                    Stop building links. <br/>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">Start building a business.</span>
                </h1>
                
                <p className="text-xl text-slate-500 max-w-lg leading-relaxed font-medium mb-10">
                    The only link-in-bio that lets you sell products, book appointments, and design with AI—all in one place.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
                    <button onClick={onGetStarted} className="px-8 py-4 bg-slate-900 text-white text-lg font-bold rounded-2xl hover:bg-black transition-all shadow-xl shadow-slate-300 flex items-center justify-center gap-2 group min-w-[200px]">
                        Start Free Trial <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform"/>
                    </button>
                    <button onClick={onDemo} className="px-8 py-4 bg-white border border-slate-200 text-slate-900 text-lg font-bold rounded-2xl hover:bg-slate-50 transition-colors flex items-center justify-center gap-2 min-w-[160px]">
                        <Play size={18} fill="currentColor" className="opacity-50"/> See Demo
                    </button>
                </div>

                <div className="mt-8">
                     <button onClick={onLogin} className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-indigo-600 transition-colors group">
                        <GraduationCap size={16} className="text-indigo-600"/> 
                        Member of Vib3 Idea Skool? <span className="underline decoration-2 decoration-indigo-300 group-hover:decoration-indigo-600">Login for Free</span>
                    </button>
                </div>
            </div>

            {/* Right Column: Visual */}
            <div className="relative z-10 lg:h-[700px] flex items-center justify-center">
                 <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 to-purple-500/10 rounded-full blur-3xl transform scale-75"></div>
                 <PhoneMockup />
                 
                 {/* Floating Badges */}
                 <div className="absolute top-20 right-0 lg:right-10 bg-white p-4 rounded-2xl shadow-xl border border-slate-100 flex items-center gap-3 animate-bounce hidden md:flex" style={{animationDuration: '3s'}}>
                     <div className="bg-green-100 p-2 rounded-lg text-green-600"><ShoppingBag size={20}/></div>
                     <div>
                         <div className="text-xs text-slate-400 font-bold uppercase">New Sale</div>
                         <div className="font-bold text-slate-900">+$24.00</div>
                     </div>
                 </div>

                 <div className="absolute bottom-40 left-0 lg:left-10 bg-white p-4 rounded-2xl shadow-xl border border-slate-100 flex items-center gap-3 animate-bounce hidden md:flex" style={{animationDuration: '4s'}}>
                     <div className="bg-orange-100 p-2 rounded-lg text-orange-600"><Calendar size={20}/></div>
                     <div>
                         <div className="text-xs text-slate-400 font-bold uppercase">New Booking</div>
                         <div className="font-bold text-slate-900">3:00 PM</div>
                     </div>
                 </div>
            </div>
        </div>
      </div>

      {/* Feature Deep Dives */}
      <div className="bg-slate-50/50">
          
          {/* 1. Design Studio */}
          <FeatureDeepDive 
              color="purple"
              title="Design at the speed of thought."
              description="Don't spend hours tweaking CSS. Just describe your dream aesthetic to Gemini 3.0, and watch your bio transform instantly. Use Google Veo to generate cinematic video backgrounds that capture attention."
              features={[
                  "Text-to-Theme Generation",
                  "Veo AI Video Backgrounds",
                  "Auto-Optimized Layouts",
                  "Dynamic Light/Dark Modes"
              ]}
              visual={
                  <div className="w-full max-w-sm flex flex-col gap-4">
                      <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-xl flex gap-3 items-center">
                          <Wand2 size={20} className="text-purple-400"/>
                          <div className="flex-1">
                              <div className="text-xs text-purple-300 font-bold uppercase mb-1">Your Prompt</div>
                              <div className="text-sm">"Cyberpunk coffee shop at midnight"</div>
                          </div>
                      </div>
                      <ArrowRight size={24} className="text-slate-300 mx-auto rotate-90"/>
                      <div className="bg-gradient-to-br from-indigo-900 via-purple-900 to-black p-6 rounded-2xl shadow-2xl border border-white/10 text-center">
                          <div className="inline-block px-3 py-1 bg-purple-500/20 text-purple-300 text-[10px] font-bold rounded-full mb-4 border border-purple-500/30">THEME GENERATED</div>
                          <div className="flex gap-2 justify-center mb-6">
                              <div className="w-12 h-12 rounded-full bg-[#0ff] shadow-[0_0_15px_#0ff] border-2 border-white"></div>
                              <div className="w-12 h-12 rounded-full bg-[#f0f] shadow-[0_0_15px_#f0f] border-2 border-white"></div>
                              <div className="w-12 h-12 rounded-full bg-[#121212] border-2 border-white"></div>
                          </div>
                          <div className="h-2 w-24 bg-white/20 rounded-full mx-auto"></div>
                      </div>
                  </div>
              }
          />

          {/* 2. Commerce */}
          <FeatureDeepDive 
              reversed
              color="green"
              title="Your bio is your storefront."
              description="Why send followers to a confusing external site? Sell digital downloads, merch, and coaching calls directly inside your bio link. We connect with Stripe to handle payments securely, and we charge 0% platform fees."
              features={[
                  "0% Transaction Fees",
                  "Sell Physical & Digital Goods",
                  "Inventory Management",
                  "Instant Payouts via Stripe"
              ]}
              visual={
                  <div className="w-full max-w-xs relative">
                      <div className="bg-white p-6 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-slate-100 relative z-10">
                          <div className="flex justify-between items-start mb-6">
                              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-green-600">
                                  <ShoppingBag size={24}/>
                              </div>
                              <div className="text-right">
                                  <div className="text-xs text-slate-400 font-bold uppercase">Amount</div>
                                  <div className="text-2xl font-extrabold text-slate-900">$45.00</div>
                              </div>
                          </div>
                          <div className="space-y-3 mb-6">
                              <div className="h-2 bg-slate-100 rounded w-full"></div>
                              <div className="h-2 bg-slate-100 rounded w-2/3"></div>
                          </div>
                          <div className="bg-black text-white py-3 rounded-xl font-bold text-center text-sm shadow-lg flex items-center justify-center gap-2">
                              <CheckCircle2 size={16}/> Payment Successful
                          </div>
                      </div>
                      
                      {/* Background Elements */}
                      <div className="absolute -top-4 -right-4 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg z-20">0% Fees</div>
                      <div className="absolute top-10 -left-10 bg-white p-3 rounded-xl shadow-lg border border-slate-100 flex items-center gap-2 z-20">
                          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                          <span className="text-xs font-bold text-slate-700">New Order</span>
                      </div>
                  </div>
              }
          />

          {/* 3. AI Assistant */}
          <FeatureDeepDive 
              color="orange"
              title="Clone yourself. Almost."
              description="Train a Gemini-powered voice assistant to welcome visitors, answer common questions, and guide them to your content. It's like having a 24/7 receptionist living in your link."
              features={[
                  "Live Audio Conversations",
                  "Text-to-Speech Welcome Message",
                  "Trained on Your Bio",
                  "Smart Content Recommendations"
              ]}
              visual={
                  <div className="w-full max-w-sm flex flex-col items-center gap-6">
                      <div className="flex items-center gap-1 h-12">
                          {[1,2,3,4,5,6,7,8,9,10,9,8,7,6,5,4,3,2,1].map((h, i) => (
                              <div 
                                key={i} 
                                className="w-1.5 bg-orange-500 rounded-full animate-[pulse_1s_ease-in-out_infinite]" 
                                style={{ height: `${h * 4}px`, animationDelay: `${i * 0.05}s` }}
                              ></div>
                          ))}
                      </div>
                      
                      <div className="bg-white p-4 rounded-2xl rounded-tr-none shadow-xl border border-slate-100 max-w-[280px] self-start relative">
                           <p className="text-sm text-slate-700 font-medium">"Hey! Thanks for visiting. Are you looking for my latest design course or just browsing?"</p>
                           <div className="absolute -bottom-2 -right-2 bg-orange-100 text-orange-600 p-1 rounded-full text-[10px] font-bold px-2 border border-orange-200">AI ASSISTANT</div>
                      </div>

                      <div className="bg-black text-white p-4 rounded-2xl rounded-tl-none shadow-xl max-w-[240px] self-end">
                           <p className="text-sm font-medium">"Show me the design course!"</p>
                      </div>
                  </div>
              }
          />
      </div>

      {/* The Kill Sheet (Comparison) */}
      <div className="bg-white py-24">
        <div className="max-w-4xl mx-auto px-6">
            <div className="text-center mb-16">
                <h2 className="text-3xl md:text-5xl font-extrabold mb-6 tracking-tight">The Math doesn't lie.</h2>
                <p className="text-slate-500 text-lg max-w-2xl mx-auto">
                    Stop paying "The Stack Tax". Replace multiple subscriptions with one powerful OS.
                </p>
            </div>

            <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden transform hover:scale-[1.01] transition-transform duration-500">
                <div className="grid grid-cols-3 bg-slate-900 text-white p-5 text-xs font-bold uppercase tracking-wider">
                    <div className="col-span-1 pl-4">Feature</div>
                    <div className="col-span-1 text-center opacity-70">Competitors</div>
                    <div className="col-span-1 text-center text-white">Vib3 Idea Link</div>
                </div>

                {/* Rows */}
                {[
                    { name: "Link-in-Bio Profile", comp: "$24/mo (Linktree)", vib3: "Included", icon: Layout },
                    { name: "E-Commerce Store", comp: "$39/mo (Shopify)", vib3: "Included", icon: ShoppingBag },
                    { name: "Calendar Bookings", comp: "$16/mo (Calendly)", vib3: "Included", icon: Calendar },
                    { name: "AI Video Studio", comp: "$30/mo (Synthesia)", vib3: "Included", icon: Play },
                    { name: "Transaction Fees", comp: "3% - 10%", vib3: "0%", icon: CreditCard },
                ].map((row, i) => (
                    <div key={i} className="grid grid-cols-3 border-b border-slate-100 p-6 items-center hover:bg-slate-50 transition-colors">
                        <div className="col-span-1 flex items-center gap-3 pl-2 font-bold text-slate-700">
                            <div className="p-2 bg-slate-100 rounded-lg hidden md:block"><row.icon size={16}/></div>
                            {row.name}
                        </div>
                        <div className="col-span-1 text-center text-red-500 font-medium text-sm flex flex-col items-center justify-center opacity-70">
                             <span>{row.comp}</span>
                             <X size={14} className="mt-1"/>
                        </div>
                        <div className="col-span-1 text-center text-green-600 font-bold text-lg flex flex-col items-center justify-center">
                             <span>{row.vib3}</span>
                             <CheckCircle2 size={18} className="mt-1"/>
                        </div>
                    </div>
                ))}
                
                {/* Total */}
                <div className="grid grid-cols-3 p-8 bg-gray-50 items-center border-t border-gray-200">
                    <div className="col-span-1 pl-4 font-bold text-xl text-slate-900">Total Monthly Cost</div>
                    <div className="col-span-1 text-center text-slate-400 line-through text-lg">$109.00+</div>
                    <div className="col-span-1 text-center font-extrabold text-3xl text-green-600">$15.00</div>
                </div>
            </div>
        </div>
      </div>

      {/* Skool Social Proof */}
      <div className="py-24 bg-slate-50 overflow-hidden border-t border-slate-200">
          <div className="max-w-7xl mx-auto px-6">
              <div className="flex flex-col md:flex-row justify-between items-end mb-12">
                  <div className="max-w-xl">
                       <div className="flex items-center gap-2 mb-4 text-indigo-600 font-bold bg-indigo-50 w-fit px-3 py-1 rounded-full text-xs uppercase border border-indigo-100">
                          <GraduationCap size={14}/> Vib3 Idea Skool Partnership
                       </div>
                       <h2 className="text-4xl font-extrabold mb-4 text-slate-900">Trusted by the community.</h2>
                       <p className="text-slate-500 text-lg">
                           Join thousands of entrepreneurs who are building their digital empire with Vib3.
                       </p>
                  </div>
                  <div className="flex items-center gap-2 mt-6 md:mt-0">
                      <div className="flex -space-x-3">
                          {[1,2,3,4].map(i => (
                              <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-gray-200">
                                  <img src={`https://i.pravatar.cc/100?img=${i + 10}`} className="w-full h-full rounded-full" alt="user"/>
                              </div>
                          ))}
                      </div>
                      <div className="text-sm font-bold ml-2 text-slate-700">5,000+ Members</div>
                  </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                   {[
                       { name: "Sarah J.", role: "Digital Artist", quote: "I canceled my Shopify and Linktree accounts the same day I switched. Vib3 saves me $60 a month." },
                       { name: "Marcus T.", role: "Fitness Coach", quote: "The AI bio writer is insane. It understood my brand voice perfectly. My booking conversions are up 40%." },
                       { name: "Elara V.", role: "Content Creator", quote: "Being a Skool member and getting this for free is the best perk ever. The Veo backgrounds look cinematic." }
                   ].map((t, i) => (
                       <div key={i} className="p-8 rounded-3xl bg-white border border-slate-200 hover:shadow-xl transition-all hover:-translate-y-1">
                           <div className="flex gap-1 mb-4">
                               {[1,2,3,4,5].map(s => <Star key={s} size={14} className="text-yellow-400 fill-yellow-400"/>)}
                           </div>
                           <p className="text-lg font-medium text-slate-800 mb-6 leading-relaxed">"{t.quote}"</p>
                           <div className="flex items-center gap-3">
                               <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
                                   <img src={`https://i.pravatar.cc/100?img=${i + 25}`} alt={t.name}/>
                               </div>
                               <div>
                                   <div className="font-bold text-slate-900">{t.name}</div>
                                   <div className="text-xs text-slate-500">{t.role}</div>
                               </div>
                           </div>
                       </div>
                   ))}
              </div>
          </div>
      </div>

      {/* Pricing Section */}
      <div className="py-24 bg-black text-white">
          <div className="max-w-5xl mx-auto px-6">
              <div className="text-center mb-16">
                  <h2 className="text-4xl font-extrabold mb-4">One Plan. Unlimited Potential.</h2>
                  <p className="text-slate-400 text-lg">No hidden fees. No tiered features. Just growth.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                  {/* Public Pricing */}
                  <div className="bg-white text-slate-900 border border-slate-200 rounded-3xl p-8 shadow-2xl relative z-10 hover:scale-[1.02] transition-transform duration-300">
                      <div className="absolute top-0 right-0 bg-blue-600 text-white text-xs font-bold px-4 py-1.5 rounded-bl-xl rounded-tr-2xl shadow-lg">MOST POPULAR</div>
                      <h3 className="text-xl font-bold mb-2">Creator Pro</h3>
                      <div className="flex items-baseline gap-1 mb-6">
                          <span className="text-6xl font-extrabold">$15</span>
                          <span className="text-slate-500 font-medium">/month</span>
                      </div>
                      <p className="text-slate-500 text-sm mb-8 border-b border-slate-100 pb-8">
                          Full access to the entire Vib3 platform. 
                      </p>
                      
                      <ul className="space-y-4 mb-8">
                          {[
                              "Unlimited Links & Products",
                              "Gemini 3.0 AI Studio",
                              "Veo Video Generation",
                              "0% Transaction Fees",
                              "Priority Support"
                          ].map((item, i) => (
                              <li key={i} className="flex items-center gap-3 text-sm font-bold text-slate-700">
                                  <div className="p-1 bg-green-100 rounded-full text-green-600"><CheckCircle2 size={12}/></div> {item}
                              </li>
                          ))}
                      </ul>

                      <button 
                        onClick={onGetStarted}
                        className="w-full py-4 bg-black text-white font-bold rounded-xl hover:bg-slate-800 transition-colors shadow-lg flex items-center justify-center gap-2 group"
                      >
                          Start 14-Day Free Trial <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform"/>
                      </button>
                      <p className="text-center text-xs text-slate-400 mt-4">14 days free, then $15/mo. Cancel via dashboard.</p>
                  </div>

                  {/* Skool Pricing */}
                  <div className="bg-gradient-to-br from-indigo-900 to-slate-900 border border-indigo-500/30 rounded-3xl p-8 shadow-inner relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500 rounded-full blur-[60px] opacity-20"></div>
                      <div className="flex items-center gap-2 mb-4 relative z-10">
                           <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400 border border-indigo-500/30"><GraduationCap size={20}/></div>
                           <span className="text-xs font-bold uppercase text-indigo-400 tracking-wider">Skool Members</span>
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2 relative z-10">Vib3 Idea Skool</h3>
                      <div className="flex items-baseline gap-1 mb-6 relative z-10">
                          <span className="text-6xl font-extrabold text-white">$0</span>
                          <span className="text-indigo-300 font-medium">/forever</span>
                      </div>
                      <p className="text-slate-400 text-sm mb-8 border-b border-white/10 pb-8 relative z-10">
                          Already a member of our Skool community? Your subscription is fully covered.
                      </p>
                      
                      <button 
                        onClick={onLogin}
                        className="w-full py-4 bg-indigo-600 border border-indigo-500 text-white font-bold rounded-xl hover:bg-indigo-500 transition-colors relative z-10 shadow-lg shadow-indigo-900/50"
                      >
                          Login with Skool Credentials
                      </button>
                  </div>
              </div>
          </div>
      </div>

      {/* Footer */}
      <footer className="bg-black text-white py-12 border-t border-white/10">
          <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6 opacity-60 hover:opacity-100 transition-opacity">
              <div className="flex items-center gap-2 font-bold">
                  <div className="w-6 h-6 bg-white rounded flex items-center justify-center text-black text-xs">V</div>
                  Vib3 Idea Link
              </div>
              <div className="text-sm">
                  © 2024 Vib3 Idea Link Inc. All rights reserved.
              </div>
              <div className="flex gap-6 text-sm font-bold">
                  <a href="#" className="hover:text-white text-slate-400">Privacy</a>
                  <a href="#" className="hover:text-white text-slate-400">Terms</a>
                  <button onClick={onAdmin} className="hover:text-white text-slate-400">Admin</button>
              </div>
          </div>
      </footer>
    </div>
  );
};

export default LandingPage;