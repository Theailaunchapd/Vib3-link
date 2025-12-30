
import React, { useState, useEffect } from 'react';
import { auth_login, auth_signup, auth_vib3SkoolLogin } from '../services/auth';
import { db_getPromoCodeByCode } from '../services/storage';
import { Loader2, ArrowRight, GraduationCap, ChevronLeft, CreditCard, Lock, Check, AlertCircle } from 'lucide-react';

interface AuthFormsProps {
  onSuccess: () => void;
  defaultView?: 'login' | 'signup';
  onCancel: () => void;
}

const AuthForms: React.FC<AuthFormsProps> = ({ onSuccess, defaultView = 'signup', onCancel }) => {
  const [view, setView] = useState<'login' | 'signup' | 'skool_login'>(defaultView);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [promoCodeValid, setPromoCodeValid] = useState<boolean | null>(null);
  const [promoCodeError, setPromoCodeError] = useState<string>("");
  
  // Payment State (Mock)
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");

  // Validate promo code in real-time
  useEffect(() => {
    if (!promoCode || promoCode.trim().length === 0) {
      setPromoCodeValid(null);
      setPromoCodeError("");
      return;
    }

    // Debounce validation slightly
    const timer = setTimeout(() => {
      const code = db_getPromoCodeByCode(promoCode.trim());
      
      if (!code) {
        setPromoCodeValid(false);
        setPromoCodeError("Invalid promo code");
      } else if (!code.active) {
        setPromoCodeValid(false);
        setPromoCodeError("This promo code is no longer active");
      } else if (code.usageLimit !== undefined && code.usedCount >= code.usageLimit) {
        setPromoCodeValid(false);
        setPromoCodeError("This promo code has reached its usage limit");
      } else {
        setPromoCodeValid(true);
        setPromoCodeError("");
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [promoCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
        if (view === 'skool_login') {
            await auth_vib3SkoolLogin(email, password);
        } else if (view === 'signup') {
            // Extract card info if provided (not promo code signup)
            let cardInfo = undefined;
            const usePromoCode = promoCode && promoCodeValid;
            
            if (!usePromoCode && cardNumber) {
                // In a real app, we would tokenize the card here via Stripe
                // For now, just extract last 4 and detect brand
                const lastFour = cardNumber.slice(-4);
                const brand = cardNumber.startsWith('4') ? 'visa' : 
                             cardNumber.startsWith('5') ? 'mastercard' : 
                             cardNumber.startsWith('3') ? 'amex' : 'unknown';
                cardInfo = { lastFour, brand };
            }
            
            await auth_signup(username, email, password, usePromoCode ? promoCode : undefined, cardInfo);
        } else {
            await auth_login(email, password);
        }
        onSuccess();
    } catch (err: any) {
        setError(err.toString());
    } finally {
        setLoading(false);
    }
  };

  const getTitle = () => {
      if (view === 'skool_login') return 'Vib3 Skool Login';
      return view === 'signup' ? 'Start Free Trial' : 'Welcome back';
  };

  const getDescription = () => {
      if (view === 'skool_login') return 'Enter your Vib3 Idea Skool credentials for free access.';
      return view === 'signup' ? "14 days free, then $15/mo." : "Login to your Vib3 dashboard.";
  };

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col md:flex-row animate-fade-in">
        {/* Left Side: Brand */}
        <div className="hidden md:flex w-1/2 bg-black text-white flex-col justify-between p-12 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/40 to-black pointer-events-none"></div>
            <div className="relative z-10 font-extrabold text-2xl tracking-tighter flex items-center gap-2">
                <div className="w-8 h-8 bg-white text-black rounded-lg flex items-center justify-center text-sm">V3</div>
                Vib3 Idea Link
            </div>
            
            <div className="relative z-10">
                {view === 'skool_login' ? (
                     <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 bg-indigo-500/20 border border-indigo-500/30 px-3 py-1 rounded-full text-indigo-300 text-xs font-bold uppercase">
                            <GraduationCap size={14}/> Student Access
                        </div>
                        <h2 className="text-4xl font-bold">Learn. Build. Monetize.</h2>
                        <p className="text-white/60 text-lg">Your Vib3 Skool membership includes full access to the Vib3 Idea Link platform at no extra cost.</p>
                     </div>
                ) : (
                    <div className="space-y-4">
                        <h2 className="text-4xl font-bold">Build your empire.</h2>
                        <div className="space-y-3">
                            {["AI-Powered Bio", "0% Transaction Fees", "Custom Domain", "Advanced Analytics"].map(feat => (
                                <div key={feat} className="flex items-center gap-3 text-white/80">
                                    <div className="p-1 bg-green-500/20 rounded-full text-green-400"><Check size={14}/></div>
                                    {feat}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
            
            <div className="relative z-10 text-sm text-white/40">© 2024 Vib3 Idea Link Inc.</div>
        </div>

        {/* Right Side: Form */}
        <div className="w-full md:w-1/2 flex items-center justify-center p-8 relative overflow-y-auto bg-white">
            <button onClick={onCancel} className="absolute top-8 right-8 text-slate-400 hover:text-black font-bold text-sm">Cancel</button>
            
            <div className="w-full max-w-sm space-y-8">
                <div className="text-center md:text-left">
                    {view === 'skool_login' && (
                        <button 
                            onClick={() => { setView('login'); setError(null); }}
                            className="text-sm text-slate-500 hover:text-black flex items-center gap-1 mb-4"
                        >
                            <ChevronLeft size={14}/> Back to standard login
                        </button>
                    )}
                    <h2 className="text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">
                        {getTitle()}
                    </h2>
                    <p className="text-slate-500 font-medium">
                        {getDescription()}
                    </p>
                </div>

                {/* Vib3 Skool Integration Button (Hidden if already on skool login) */}
                {view !== 'skool_login' && (
                    <>
                        <button 
                            onClick={() => { setView('skool_login'); setError(null); }}
                            className="w-full py-4 bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-indigo-200 transition-all flex items-center justify-center gap-3 group"
                        >
                           <div className="bg-white/20 p-1.5 rounded-lg group-hover:bg-white/30 transition-colors"><GraduationCap size={18}/></div>
                           <div className="text-left leading-tight">
                               <div className="text-xs opacity-90 font-medium">Have a Skool account?</div>
                               <div className="text-sm">Log in with Vib3 Skool</div>
                           </div>
                        </button>

                        <div className="relative flex py-2 items-center">
                            <div className="flex-grow border-t border-gray-200"></div>
                            <span className="flex-shrink-0 mx-4 text-gray-400 text-xs font-bold uppercase tracking-wider">Or</span>
                            <div className="flex-grow border-t border-gray-200"></div>
                        </div>
                    </>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 flex items-start gap-2">
                            <div className="mt-0.5">⚠️</div>
                            {error}
                        </div>
                    )}

                    {view === 'signup' && (
                        <div>
                            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Username</label>
                            <input 
                                required
                                value={username}
                                onChange={e => setUsername(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black outline-none font-medium text-slate-900 placeholder:text-slate-400"
                                placeholder="vib3name"
                            />
                        </div>
                    )}
                    
                    <div>
                        <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                            {view === 'login' ? 'Email or Username' : 'Email'}
                        </label>
                        <input
                            required
                            type={view === 'login' ? 'text' : 'email'}
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black outline-none font-medium text-slate-900 placeholder:text-slate-400"
                            placeholder={view === 'login' ? 'you@example.com or username' : 'you@example.com'}
                        />
                    </div>
                    
                    <div>
                        <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Password</label>
                        <input 
                            required
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black outline-none font-medium text-slate-900 placeholder:text-slate-400"
                            placeholder="••••••••"
                        />
                    </div>

                    {view === 'signup' && (
                        <>
                            <div>
                                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                                    Promo Code <span className="text-slate-400 font-normal">(Optional)</span>
                                </label>
                                <input 
                                    value={promoCode}
                                    onChange={e => setPromoCode(e.target.value.toUpperCase())}
                                    className={`w-full px-4 py-3 bg-gray-50 border rounded-xl focus:ring-2 outline-none font-mono text-slate-900 placeholder:text-slate-400 uppercase ${
                                        promoCodeValid === true ? 'border-green-500 focus:ring-green-500' :
                                        promoCodeValid === false ? 'border-red-500 focus:ring-red-500' :
                                        'border-gray-200 focus:ring-indigo-500'
                                    }`}
                                    placeholder="ENTER CODE"
                                />
                                {promoCode && promoCodeValid === true && (
                                    <p className="text-xs text-green-600 mt-1 font-medium flex items-center gap-1">
                                        <Check size={14}/> Valid promo code - no payment required!
                                    </p>
                                )}
                                {promoCode && promoCodeValid === false && (
                                    <p className="text-xs text-red-600 mt-1 font-medium flex items-center gap-1">
                                        <AlertCircle size={14}/> {promoCodeError}
                                    </p>
                                )}
                                {promoCode && promoCodeValid === null && (
                                    <p className="text-xs text-slate-500 mt-1 font-medium">
                                        Validating...
                                    </p>
                                )}
                            </div>

                            {!promoCodeValid && (
                                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-4 animate-fade-in">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-xs font-bold uppercase text-slate-500 flex items-center gap-2">
                                            <CreditCard size={14}/> Billing Information
                                        </h3>
                                        <div className="flex items-center gap-1 text-[10px] text-green-600 font-bold bg-green-100 px-2 py-0.5 rounded-full">
                                            <Lock size={10}/> SECURE
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-3">
                                        <input 
                                            required={!promoCodeValid}
                                            placeholder="Card Number"
                                            value={cardNumber}
                                            onChange={e => setCardNumber(e.target.value)}
                                            className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
                                        />
                                        <div className="flex gap-3">
                                            <input 
                                                required={!promoCodeValid}
                                                placeholder="MM / YY"
                                                value={expiry}
                                                onChange={e => setExpiry(e.target.value)}
                                                className="w-1/2 bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
                                            />
                                            <input 
                                                required={!promoCodeValid}
                                                placeholder="CVC"
                                                value={cvc}
                                                onChange={e => setCvc(e.target.value)}
                                                className="w-1/2 bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-3 border-t border-slate-200">
                                        <div className="flex justify-between items-center text-sm mb-1">
                                            <span className="font-bold text-slate-700">Due today</span>
                                            <span className="font-bold text-slate-900">$0.00</span>
                                        </div>
                                        <div className="flex justify-between items-center text-xs text-slate-500">
                                            <span>Recurring (after 14 days)</span>
                                            <span>$15.00/mo</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {promoCodeValid === true && (
                                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border-2 border-green-200 animate-fade-in">
                                    <div className="flex items-start gap-3">
                                        <div className="text-2xl">🎉</div>
                                        <div>
                                            <h4 className="font-bold text-slate-900 mb-1">Promo Code Applied</h4>
                                            <p className="text-sm text-slate-600">
                                                No credit card required! Your promo code will grant you access without payment.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    <button 
                        type="submit"
                        disabled={loading}
                        className={`w-full py-4 mt-2 ${view === 'skool_login' ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200' : 'bg-black hover:bg-slate-800 shadow-slate-200'} text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg hover:scale-[1.02] active:scale-[0.98]`}
                    >
                        {loading ? <Loader2 className="animate-spin"/> : (
                             <>
                                {view === 'signup' ? 'Start Free Trial' : view === 'skool_login' ? 'Verify & Login' : 'Log In'} <ArrowRight size={18}/>
                             </>
                        )}
                    </button>
                </form>

                {view === 'signup' && (
                    <p className="text-[10px] text-slate-400 text-center leading-relaxed px-4">
                        By starting your trial, you agree to our Terms. You will be charged $15.00/mo after 14 days unless you cancel before the trial ends.
                    </p>
                )}

                {view !== 'skool_login' && (
                    <div className="text-center text-sm pt-2">
                        <span className="text-slate-500">
                            {view === 'signup' ? "Already have an account?" : "Don't have an account?"}
                        </span>
                        <button 
                            onClick={() => { setView(view === 'signup' ? 'login' : 'signup'); setError(null); }}
                            className="font-bold text-black ml-2 hover:underline"
                        >
                            {view === 'signup' ? "Log in" : "Sign up"}
                        </button>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};

export default AuthForms;