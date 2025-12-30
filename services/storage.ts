



import { UserProfile, AnalyticsData, ContentItem, User, PromoCode, StripePayment } from '../types';

// Storage Keys
const USERS_TABLE_KEY = 'vib3_users'; // Array of Users
const PROFILES_TABLE_KEY = 'vib3_profiles'; // Object: { [username]: UserProfile }
const ANALYTICS_TABLE_KEY = 'vib3_analytics'; // Object: { [username]: AnalyticsData }
const PROMO_CODES_KEY = 'vib3_promo_codes'; // Array of PromoCodes
const PAYMENTS_KEY = 'vib3_payments'; // Array of StripePayments

// Helpers
const getDB = (key: string) => {
    try {
        const data = localStorage.getItem(key);
        // Ensure we return an array for users table if empty or null
        if (key === USERS_TABLE_KEY && (!data || data === 'undefined')) return [];
        return data ? JSON.parse(data) : null;
    } catch (e) {
        console.error(`DB Read Error for ${key}:`, e);
        return key === USERS_TABLE_KEY ? [] : null;
    }
};

const saveDB = (key: string, data: any) => {
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
        console.error(`DB Write Error for ${key}:`, e);
    }
};

// --- Initial Template ---
export const createDefaultProfile = (user: User): UserProfile => ({
  userId: user.id,
  username: user.username,
  isPublished: false,
  name: user.username, // Default to username
  bio: "Welcome to my Vib3 Link page! I created this using AI.",
  avatarUrl: `https://ui-avatars.com/api/?name=${user.username}&background=random`,
  backgroundUrl: "",
  backgroundType: "color",
  backgroundColor: "#ffffff",
  theme: "modern",
  content: [
    { type: 'link', id: "1", title: "My First Link", url: "https://google.com", active: true },
  ],
  consultation: {
    enabled: false,
    title: "1:1 Consultation",
    description: "Book a 30-minute call.",
    price: "$50.00",
    duration: "30",
    calendarConnected: false,
    availability: ["Mon", "Tue", "Wed", "Thu", "Fri"],
    slots: ["09:00 AM", "10:00 AM", "02:00 PM"],
    cardColor: "#fff7ed"
  },
  stripeConnected: false,
});

export const createDemoProfile = (user: User): UserProfile => ({
  userId: user.id,
  username: user.username,
  isPublished: true,
  name: "Alex | Digital Artist",
  bio: "3D Artist & Designer based in Tokyo. 🎨✨ Helping creators build better brands. Check out my assets below!",
  avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
  backgroundUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?ixlib=rb-4.0.3&auto=format&fit=crop&w=1964&q=80",
  backgroundType: "image",
  backgroundColor: "#ffffff",
  theme: "modern",
  content: [
    { 
        type: 'consultation', 
        id: 'consultation', 
        active: true 
    },
    { 
        type: 'product', 
        id: 'prod_1', 
        title: "Ultimate 3D Texture Pack", 
        price: "$29.00", 
        description: "High-quality 4K textures for Blender & C4D. Includes 50+ materials.", 
        imageUrl: "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80", 
        images: ["https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"],
        variations: [],
        active: true,
        imageFit: 'cover'
    },
    { 
        type: 'link', 
        id: 'link_1', 
        title: "View My Portfolio", 
        url: "https://dribbble.com", 
        active: true 
    },
    { 
        type: 'product', 
        id: 'prod_2', 
        title: "Procreate Brush Set", 
        price: "$15.00", 
        description: "My personal collection of sketching and inking brushes.", 
        imageUrl: "https://images.unsplash.com/photo-1615184697985-c9bde1b07da7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80", 
        images: ["https://images.unsplash.com/photo-1615184697985-c9bde1b07da7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"],
        variations: [],
        active: true,
        imageFit: 'cover'
    }
  ],
  consultation: {
    enabled: true,
    title: "Portfolio Review",
    description: "30-min Zoom call to review your work and give career advice.",
    price: "$100.00",
    duration: "30",
    calendarConnected: true,
    availability: ["Mon", "Wed", "Fri"],
    slots: ["10:00 AM", "02:00 PM", "04:00 PM"],
    cardColor: "#f3f4f6"
  },
  stripeConnected: true,
});

const defaultAnalytics: AnalyticsData = {
  totalViews: 0,
  totalRevenue: 0,
  linkClicks: {},
  history: []
};

// --- User Management (Database Layer) ---

export const db_getAllUsers = (): User[] => {
    return getDB(USERS_TABLE_KEY) || [];
};

export const db_saveUser = (user: User) => {
    let users = getDB(USERS_TABLE_KEY);
    if (!Array.isArray(users)) users = [];
    users.push(user);
    saveDB(USERS_TABLE_KEY, users);
};

export const db_updateUser = (user: User) => {
    let users = getDB(USERS_TABLE_KEY);
    if (!Array.isArray(users)) users = [];
    
    const index = users.findIndex((u: User) => u.id === user.id);
    if (index !== -1) {
        users[index] = user;
        saveDB(USERS_TABLE_KEY, users);
    }
};

export const db_deleteUser = (userId: string) => {
    let users = getDB(USERS_TABLE_KEY) || [];
    const user = users.find((u: User) => u.id === userId);
    
    // Remove from user table
    users = users.filter((u: User) => u.id !== userId);
    saveDB(USERS_TABLE_KEY, users);
    
    // Cleanup profiles/analytics
    if (user) {
        const profiles = getDB(PROFILES_TABLE_KEY) || {};
        delete profiles[user.username.toLowerCase()];
        saveDB(PROFILES_TABLE_KEY, profiles);
        
        const analytics = getDB(ANALYTICS_TABLE_KEY) || {};
        delete analytics[user.username.toLowerCase()];
        saveDB(ANALYTICS_TABLE_KEY, analytics);
    }
};

export const db_getUserByEmail = (email: string): User | undefined => {
    const users = getDB(USERS_TABLE_KEY) || [];
    if (!Array.isArray(users)) return undefined;
    return users.find((u: User) => u.email.toLowerCase() === email.toLowerCase());
};

export const db_getUserByUsername = (username: string): User | undefined => {
    const users = getDB(USERS_TABLE_KEY) || [];
    if (!Array.isArray(users)) return undefined;
    return users.find((u: User) => u.username.toLowerCase() === username.toLowerCase());
};

// --- Seed Test Data (For Admin Demo) ---
export const db_seedTestUsers = () => {
    const existing = db_getAllUsers();
    if (existing.length > 5) return; // Don't overfill if data exists

    const dummyUsers: User[] = [
        { 
            id: 'u1', 
            username: 'sarah_design', 
            email: 'sarah@example.com', 
            password: '123', 
            subscriptionStatus: 'active', 
            isVib3Skool: false, 
            createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
            paymentMethodSaved: true,
            lastFourDigits: '4242',
            cardBrand: 'visa',
            stripeCustomerId: 'cus_sarah123'
        },
        { 
            id: 'u2', 
            username: 'mike_codes', 
            email: 'mike@example.com', 
            password: '123', 
            subscriptionStatus: 'trial', 
            trialEndsAt: new Date(Date.now() + 86400000 * 5).toISOString(), 
            isVib3Skool: false, 
            createdAt: new Date().toISOString(),
            paymentMethodSaved: true,
            lastFourDigits: '5555',
            cardBrand: 'mastercard',
            stripeCustomerId: 'cus_mike456'
        },
        { 
            id: 'u3', 
            username: 'jess_fitness', 
            email: 'jess@vib3skool.com', 
            password: '123', 
            subscriptionStatus: 'skool_member', 
            isVib3Skool: true, 
            createdAt: new Date(Date.now() - 86400000 * 10).toISOString() 
        },
        { 
            id: 'u4', 
            username: 'expired_tom', 
            email: 'tom@example.com', 
            password: '123', 
            subscriptionStatus: 'expired', 
            isVib3Skool: false, 
            createdAt: new Date(Date.now() - 86400000 * 20).toISOString(),
            paymentMethodSaved: false
        },
        { 
            id: 'u5', 
            username: 'new_trial_user', 
            email: 'trial@example.com', 
            password: '123', 
            subscriptionStatus: 'trial', 
            trialEndsAt: new Date(Date.now() + 86400000 * 13).toISOString(), 
            isVib3Skool: false, 
            createdAt: new Date().toISOString(),
            paymentMethodSaved: true,
            lastFourDigits: '1234',
            cardBrand: 'visa',
            stripeCustomerId: 'cus_trial789'
        },
    ];

    dummyUsers.forEach(u => {
        if (!db_getUserByEmail(u.email)) {
            db_saveUser(u);
            const p = createDefaultProfile(u);
            p.name = u.username;
            db_saveProfile(p);
        }
    });
};

// --- Profile Management ---

export const db_saveProfile = (profile: UserProfile) => {
  const profiles = getDB(PROFILES_TABLE_KEY) || {};
  profiles[profile.username.toLowerCase()] = profile;
  saveDB(PROFILES_TABLE_KEY, profiles);
};

export const db_getProfileByUsername = (username: string): UserProfile | null => {
  const profiles = getDB(PROFILES_TABLE_KEY) || {};
  let profile = profiles[username.toLowerCase()];
  
  if (profile) {
    // MIGRATION LOGIC (Run on read to ensure data integrity)
    // 1. Unified Content Block Migration
    if (!profile.content) {
      const newContent: ContentItem[] = [];
      if ((profile as any).links) (profile as any).links.forEach((l: any) => newContent.push({ ...l, type: 'link' }));
      if ((profile as any).products) (profile as any).products.forEach((p: any) => newContent.push({ ...p, type: 'product', active: true }));
      if (profile.consultation && profile.consultation.enabled) newContent.push({ type: 'consultation', id: 'consultation', active: true });
      profile.content = newContent;
    }
    
    // 2. Product Fields Migration
    profile.content = profile.content.map((item: ContentItem) => {
        if (item.type === 'product') {
            return {
                ...item,
                images: (item as any).images || (item as any).imageUrl ? [(item as any).imageUrl] : [],
                variations: (item as any).variations || [],
                imageFit: (item as any).imageFit || 'cover'
            };
        }
        return item;
    });

    return profile;
  }
  return null;
};

// --- Analytics Management ---

export const db_getAnalytics = (username: string): AnalyticsData => {
  const allAnalytics = getDB(ANALYTICS_TABLE_KEY) || {};
  const userAnalytics = allAnalytics[username.toLowerCase()];
  
  if (!userAnalytics) return { ...defaultAnalytics };
  
  // Migration for older data
  if (userAnalytics.totalRevenue === undefined) userAnalytics.totalRevenue = 0;
  
  return userAnalytics;
};

export const db_saveAnalytics = (username: string, data: AnalyticsData) => {
    const allAnalytics = getDB(ANALYTICS_TABLE_KEY) || {};
    allAnalytics[username.toLowerCase()] = data;
    saveDB(ANALYTICS_TABLE_KEY, allAnalytics);
};

// --- Tracking Functions (Public) ---

export const trackView = (username: string) => {
  const data = db_getAnalytics(username);
  const today = new Date().toISOString().split('T')[0];
  
  data.totalViews += 1;
  const historyEntry = data.history.find(h => h.date === today);
  if (historyEntry) {
    historyEntry.views += 1;
  } else {
    data.history.push({ date: today, views: 1 });
  }
  if (data.history.length > 30) data.history.shift();
  
  db_saveAnalytics(username, data);
};

export const trackClick = (username: string, linkId: string) => {
  const data = db_getAnalytics(username);
  data.linkClicks[linkId] = (data.linkClicks[linkId] || 0) + 1;
  db_saveAnalytics(username, data);
};

export const trackRevenue = (username: string, amount: number) => {
  const data = db_getAnalytics(username);
  data.totalRevenue = (data.totalRevenue || 0) + amount;
  db_saveAnalytics(username, data);
};

// --- Promo Code Management ---

export const db_getAllPromoCodes = (): PromoCode[] => {
  return getDB(PROMO_CODES_KEY) || [];
};

export const db_savePromoCode = (promoCode: PromoCode) => {
  let codes = db_getAllPromoCodes();
  codes.push(promoCode);
  saveDB(PROMO_CODES_KEY, codes);
};

export const db_updatePromoCode = (promoCode: PromoCode) => {
  let codes = db_getAllPromoCodes();
  const index = codes.findIndex((c: PromoCode) => c.id === promoCode.id);
  if (index !== -1) {
    codes[index] = promoCode;
    saveDB(PROMO_CODES_KEY, codes);
  }
};

export const db_deletePromoCode = (codeId: string) => {
  let codes = db_getAllPromoCodes();
  codes = codes.filter((c: PromoCode) => c.id !== codeId);
  saveDB(PROMO_CODES_KEY, codes);
};

export const db_getPromoCodeByCode = (code: string): PromoCode | undefined => {
  const codes = db_getAllPromoCodes();
  return codes.find((c: PromoCode) => c.code.toLowerCase() === code.toLowerCase());
};

export const db_validateAndUsePromoCode = (code: string): { valid: boolean; promoCode?: PromoCode; error?: string } => {
  const promoCode = db_getPromoCodeByCode(code);
  
  if (!promoCode) {
    return { valid: false, error: 'Invalid promo code' };
  }
  
  if (!promoCode.active) {
    return { valid: false, error: 'This promo code is no longer active' };
  }
  
  if (promoCode.usageLimit !== undefined && promoCode.usedCount >= promoCode.usageLimit) {
    return { valid: false, error: 'This promo code has reached its usage limit' };
  }
  
  // Increment usage count
  promoCode.usedCount += 1;
  db_updatePromoCode(promoCode);
  
  return { valid: true, promoCode };
};

// --- Payment Management ---

export const db_getAllPayments = (): StripePayment[] => {
  return getDB(PAYMENTS_KEY) || [];
};

export const db_savePayment = (payment: StripePayment) => {
  let payments = db_getAllPayments();
  payments.push(payment);
  saveDB(PAYMENTS_KEY, payments);
};

export const db_seedTestPayments = () => {
  const existing = db_getAllPayments();
  if (existing.length > 5) return;

  const testPayments: StripePayment[] = [
    {
      id: 'pay_1',
      username: 'sarah_design',
      email: 'sarah@example.com',
      paymentType: 'subscription',
      productName: 'Monthly Subscription',
      amount: 15,
      status: 'success',
      stripePaymentId: 'pi_abc123456',
      createdAt: new Date(Date.now() - 86400000 * 5).toISOString()
    },
    {
      id: 'pay_2',
      username: 'mike_codes',
      email: 'mike@example.com',
      paymentType: 'product',
      productName: 'Ultimate 3D Texture Pack',
      amount: 29,
      status: 'success',
      stripePaymentId: 'pi_def789012',
      createdAt: new Date(Date.now() - 86400000 * 3).toISOString()
    },
    {
      id: 'pay_3',
      username: 'jess_fitness',
      email: 'jess@vib3skool.com',
      paymentType: 'consultation',
      productName: 'Portfolio Review',
      amount: 100,
      status: 'success',
      stripePaymentId: 'pi_ghi345678',
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
    },
    {
      id: 'pay_4',
      username: 'expired_tom',
      email: 'tom@example.com',
      paymentType: 'subscription',
      productName: 'Monthly Subscription',
      amount: 15,
      status: 'failed',
      errorMessage: 'Card declined',
      createdAt: new Date(Date.now() - 86400000 * 1).toISOString()
    },
    {
      id: 'pay_5',
      username: 'new_trial_user',
      email: 'trial@example.com',
      paymentType: 'product',
      productName: 'Procreate Brush Set',
      amount: 15,
      status: 'pending',
      stripePaymentId: 'pi_jkl901234',
      createdAt: new Date().toISOString()
    }
  ];

  testPayments.forEach(p => {
    if (!db_getAllPayments().find(existing => existing.id === p.id)) {
      db_savePayment(p);
    }
  });
};