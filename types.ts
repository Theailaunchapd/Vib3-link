

export interface LinkItem {
  id: string;
  title: string;
  url: string;
  active: boolean;
  buttonColor?: string; // Custom button background color
  buttonTextColor?: string; // Custom button text color
}

export interface ProductVariationOption {
  id: string;
  name: string;
  priceModifier: number; // Amount to add to base price
}

export interface ProductVariation {
  id: string;
  name: string; // e.g. "Size", "Color"
  options: ProductVariationOption[];
}

export interface Product {
  id: string;
  title: string;
  price: string;
  imageUrl: string; // Keep for backward compatibility/thumbnail
  images: string[]; // Gallery
  description: string;
  active: boolean;
  variations: ProductVariation[];
  imageFit?: 'cover' | 'contain';
}

// Unified Block Type
export type ContentItem = 
  | ({ type: 'link' } & LinkItem)
  | ({ type: 'product' } & Product)
  | { type: 'consultation'; id: 'consultation'; active: boolean };

export interface ConsultationConfig {
  enabled: boolean; // Kept for logic, but presence in content array determines visibility
  title: string;
  description: string;
  price: string;
  duration: string; // e.g. "30 min"
  calendarConnected: boolean; // Simulates Google Calendar connection
  calendarId?: string; // Google Calendar ID
  availability: string[]; // e.g., ["Mon", "Wed", "Fri"]
  slots: string[]; // e.g., ["09:00 AM", "10:00 AM"]
  cardColor: string; // Hex color for the booking card
  buttonColor?: string; // Custom button background color
  buttonTextColor?: string; // Custom button text color
}

export interface PromoCode {
  id: string;
  code: string; // The actual code users enter
  description: string; // What the code is for
  type: 'lifetime' | 'trial_extension' | 'free_month'; // Type of access granted
  usageLimit?: number; // Max uses (undefined = unlimited)
  usedCount: number; // Times used
  createdAt: string;
  createdBy: string; // Admin who created it
  active: boolean;
}

export interface User {
  id: string;
  email: string;
  password: string; // In a real app, this would be hashed!
  username: string;
  
  // Subscription Fields
  subscriptionStatus: 'trial' | 'active' | 'expired' | 'skool_member' | 'promo_access';
  trialEndsAt?: string; // ISO Date
  isVib3Skool?: boolean;
  promoCodeUsed?: string; // The promo code they used
  createdAt?: string; // Signup timestamp
  
  // Payment Info (simulated - in production this would be tokenized)
  paymentMethodSaved?: boolean;
  lastFourDigits?: string; // Last 4 digits of card
  cardBrand?: string; // visa, mastercard, etc
  stripeCustomerId?: string; // Stripe customer ID
}

export interface StripeConfig {
  storeName: string;
  publishableKey: string;
  secretKey: string;
  connectedAt?: string; // ISO Date
}

export interface StripePayment {
  id: string;
  username: string;
  email: string;
  paymentType: 'subscription' | 'product' | 'consultation';
  productName?: string;
  amount: number;
  status: 'success' | 'pending' | 'failed' | 'refunded';
  stripePaymentId?: string;
  errorMessage?: string;
  createdAt: string;
}

export interface UserProfile {
  userId: string; // Link to User
  username: string; // Unique handle for the URL
  isPublished: boolean; // Whether the site is live
  name: string;
  bio: string;
  avatarUrl: string;
  backgroundUrl: string; // Can be image or video
  backgroundType: 'color' | 'image' | 'video';
  backgroundColor: string;
  theme: 'modern' | 'retro' | 'glass' | 'microsoft90s' | 'apple90s';

  // Profile Header Image Settings
  headerHeight?: number; // Height in pixels (default: 300)
  headerImagePosition?: string; // CSS object-position (default: 'center')
  headerImageFit?: 'cover' | 'contain'; // CSS object-fit (default: 'cover')

  // Button Styling
  buttonColor?: string; // Primary button color (default: '#000000')
  buttonTextColor?: string; // Button text color (default: '#ffffff')

  // Unified Content List
  content: ContentItem[];

  // Settings that apply globally to the feature, not just the block
  consultation: ConsultationConfig;

  voiceWelcomeUrl?: string; // URL for TTS generated welcome
  stripeConnected: boolean;
  stripeConfig?: StripeConfig; // Stripe integration settings
  layoutOrder?: string[]; // Deprecated but kept for type safety during migration
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  sources?: { uri: string; title: string }[];
}

// Gemini specific types for internal use
export enum AIModel {
  Thinking = 'gemini-3-pro-preview',
  Fast = 'gemini-2.5-flash',
  FlashLite = 'gemini-2.5-flash-lite', // Fast responses
  ImageGen = 'gemini-3-pro-image-preview',
  ImageEdit = 'gemini-2.5-flash-image',
  VideoGen = 'veo-3.1-fast-generate-preview', // Fast video
  TTS = 'gemini-2.5-flash-preview-tts',
  LiveAudio = 'gemini-2.5-flash-native-audio-preview-09-2025'
}

export interface AnalyticsData {
  totalViews: number;
  totalRevenue: number; // Added revenue tracking
  linkClicks: Record<string, number>; // linkId -> count
  history: { date: string; views: number }[];
}