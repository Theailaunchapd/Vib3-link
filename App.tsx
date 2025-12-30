



import React, { useState, useEffect } from 'react';
import { UserProfile, User } from './types';
import Editor from './components/Editor';
import Preview from './components/Preview';
import Dashboard from './components/Dashboard';
import LandingPage from './components/LandingPage';
import AuthForms from './components/AuthForms';
import SubscriptionGate from './components/SubscriptionGate';
import AdminDashboard from './components/AdminDashboard';
import AdminLogin from './components/AdminLogin';
import { db_saveProfile, db_getProfileByUsername, createDemoProfile } from './services/storage';
import { auth_getCurrentUser, auth_isAdmin, auth_adminLogout } from './services/auth';
import { Loader2, AlertTriangle } from 'lucide-react';

const App: React.FC = () => {
  // State for Application Routing
  const [view, setView] = useState<'landing' | 'auth_login' | 'auth_signup' | 'editor' | 'dashboard' | 'public_profile' | 'admin_login' | 'admin'>('landing');
  const [loading, setLoading] = useState(true);

  // User Data
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  
  // Public Profile Data (when viewing someone else's link)
  const [publicProfile, setPublicProfile] = useState<UserProfile | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    // 1. Check for Public Profile URL Param (?u=username)
    const params = new URLSearchParams(window.location.search);
    const usernameParam = params.get('u');

    if (usernameParam) {
        const fetchedProfile = db_getProfileByUsername(usernameParam);
        if (fetchedProfile) {
            setPublicProfile(fetchedProfile);
            setView('public_profile');
        } else {
            setNotFound(true);
        }
        setLoading(false);
        return; // Stop here if public view
    }

    // 2. Check for Logged In User
    const session = auth_getCurrentUser();
    if (session) {
        setCurrentUser(session.user);
        setProfile(session.profile);
        setView('editor');
    } else {
        setView('landing');
    }
    setLoading(false);

  }, []);

  // Auto-save when editing
  useEffect(() => {
    if (view === 'editor' && profile) {
       db_saveProfile(profile);
    }
  }, [profile, view]);

  // Handle Demo Mode
  const handleEnterDemo = () => {
      const demoUser: User = { 
          id: 'demo_user', 
          username: 'alex_creator', 
          email: 'alex@demo.com', 
          password: '',
          subscriptionStatus: 'active'
      };
      const demoProfile = createDemoProfile(demoUser);
      setCurrentUser(demoUser);
      setProfile(demoProfile);
      setView('editor');
  };

  const refreshSession = () => {
      const session = auth_getCurrentUser();
      if (session) {
          setCurrentUser(session.user);
          setProfile(session.profile);
      }
  };

  // Loading State
  if (loading) {
      return <div className="h-screen w-screen flex items-center justify-center bg-white"><Loader2 size={48} className="animate-spin text-slate-300"/></div>;
  }

  // 404 Public Profile Not Found
  if (notFound) {
      return (
          <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50 text-slate-900">
              <AlertTriangle size={64} className="text-amber-500 mb-4"/>
              <h1 className="text-3xl font-bold mb-2">Profile Not Found</h1>
              <p className="text-slate-500 mb-8">The user you are looking for does not exist.</p>
              <a href="/" className="px-6 py-3 bg-black text-white rounded-xl font-bold">Go Home</a>
          </div>
      );
  }

  // --- VIEWS ---

  // 1. Public Live Profile
  if (view === 'public_profile' && publicProfile) {
      return <Preview profile={publicProfile} isLive={true} />;
  }

  // 2. Landing Page
  if (view === 'landing') {
      return (
        <LandingPage
            onGetStarted={() => setView('auth_signup')}
            onLogin={() => setView('auth_login')}
            onDemo={handleEnterDemo}
            onAdmin={() => setView('admin_login')}
        />
      );
  }

  // 3. Admin Login
  if (view === 'admin_login') {
      return (
        <AdminLogin
          onSuccess={() => setView('admin')}
          onBack={() => setView('landing')}
        />
      );
  }

  // 4. Admin Dashboard (Protected)
  if (view === 'admin') {
      if (!auth_isAdmin()) {
          setView('admin_login');
          return null;
      }
      return <AdminDashboard onLogout={() => {
          auth_adminLogout();
          setView('landing');
      }} />;
  }

  // 5. Auth Screens
  if (view === 'auth_login' || view === 'auth_signup') {
      return (
          <AuthForms 
            defaultView={view === 'auth_login' ? 'login' : 'signup'}
            onCancel={() => setView('landing')}
            onSuccess={() => {
                // Reload state after success to trigger session check
                refreshSession();
                setView('editor');
            }}
          />
      );
  }

  // 6. Dashboard (Analytics & Inventory)
  if (view === 'dashboard' && profile) {
    if (currentUser && currentUser.subscriptionStatus === 'expired' && !currentUser.isVib3Skool) {
       return <SubscriptionGate user={currentUser} onSuccess={refreshSession} />;
    }
    return <Dashboard profile={profile} setProfile={setProfile as any} onBack={() => setView('editor')} />;
  }

  // 7. Editor (Protected)
  if (view === 'editor' && profile) {
    // Check Subscription
    if (currentUser && currentUser.subscriptionStatus === 'expired' && !currentUser.isVib3Skool) {
        return <SubscriptionGate user={currentUser} onSuccess={refreshSession} />;
    }

    return (
      <div className="flex h-screen w-screen overflow-hidden bg-white text-slate-900">
        {/* Editor Panel (Left) */}
        <div className="w-full md:w-[450px] lg:w-[500px] h-full flex-shrink-0 z-10 relative shadow-2xl bg-white">
          <Editor 
            profile={profile} 
            setProfile={setProfile as any} 
            onOpenDashboard={() => setView('dashboard')} 
          />
        </div>

        {/* Preview Area (Right) */}
        <div className="hidden md:flex flex-1 h-full bg-slate-50 relative overflow-hidden items-center justify-center p-4">
          {/* Decorative Background Grid */}
          <div className="absolute inset-0 opacity-10 pointer-events-none" 
               style={{ backgroundImage: 'radial-gradient(#94a3b8 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
          </div>
          
          <Preview profile={profile} isLive={false} />
        </div>
      </div>
    );
  }

  return <div>Unknown State</div>;
};

export default App;