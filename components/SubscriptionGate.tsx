

import React, { useState } from 'react';
import { User } from '../types';
import { auth_subscribeUser, auth_logout } from '../services/auth';
import { Loader2, CheckCircle2, Lock, Star } from 'lucide-react';

interface SubscriptionGateProps {
  user: User;
  onSuccess: () => void;
}

const SubscriptionGate: React.FC<SubscriptionGateProps> = ({ user, onSuccess }) => {
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    setLoading(true);
    try {
        await auth_subscribeUser(user.id);
        onSuccess();
    } catch (e) {
        console.error("Subscription failed", e);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-white text-slate-900 flex flex-col md:flex-row animate-fade-in">
        <div className="hidden md:flex w-1/2 bg-black text-white p-12 flex-col justify-between">
            <div className="font-extrabold text-2xl tracking-tighter">Vib3 Idea Link</div>
            <div className="space-y-6">
                <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-6">
                    <Star size={32} className="text-yellow-400"/>
                </div>
                <h1 className="text-5xl font-extrabold leading-tight">Your trial has ended.</h1>
                <p className="text-xl text-white/60">
                    Don't stop now. Continue building your brand and monetizing your audience with Vib3.
                </p>
                <div className="pt-6">
                    <div className="flex items-center gap-3 mb-2">
                        <CheckCircle2 className="text-green-500" size={20}/>
                        <span className="font-medium">Unlimited Products</span>
                    </div>
                    <div className="flex items-center gap-3 mb-2">
                        <CheckCircle2 className="text-green-500" size={20}/>
                        <span className="font-medium">0% Transaction Fees</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <CheckCircle2 className="text-green-500" size={20}/>
                        <span className="font-medium">Gemini 3.0 AI Studio</span>
                    </div>
                </div>
            </div>
            <div className="text-sm text-white/40">Need help? support@vib3link.ai</div>
        </div>

        <div className="w-full md:w-1/2 flex items-center justify-center p-8 bg-slate-50">
            <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-xl border border-gray-100 text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Lock size={32} className="text-red-500"/>
                </div>
                <h2 className="text-2xl font-bold mb-2">Unlock Full Access</h2>
                <p className="text-slate-500 mb-8">
                    Your 14-day free trial has expired. Subscribe to restore access to your editor and keep your profile live.
                </p>

                <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 mb-8">
                    <div className="text-sm font-bold text-slate-500 uppercase mb-2">Monthly Plan</div>
                    <div className="flex items-baseline justify-center gap-1 mb-2">
                        <span className="text-4xl font-extrabold text-slate-900">$15</span>
                        <span className="text-slate-500">/month</span>
                    </div>
                    <p className="text-xs text-slate-400">Cancel anytime.</p>
                </div>

                <button 
                    onClick={handleSubscribe}
                    disabled={loading}
                    className="w-full py-4 bg-black text-white font-bold rounded-xl hover:bg-slate-800 transition-all shadow-lg flex items-center justify-center gap-2 mb-4"
                >
                    {loading ? <Loader2 className="animate-spin"/> : "Subscribe Now"}
                </button>

                <button onClick={auth_logout} className="text-sm font-bold text-slate-500 hover:text-slate-800">
                    Log Out
                </button>
            </div>
        </div>
    </div>
  );
};

export default SubscriptionGate;