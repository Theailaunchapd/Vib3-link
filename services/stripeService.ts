import { loadStripe, Stripe } from '@stripe/stripe-js';

let stripePromise: Promise<Stripe | null> | null = null;

const getStripePublicKey = (): string => {
  const key = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
  if (!key) {
    console.warn('Stripe public key not configured');
    return '';
  }
  return key;
};

export const getStripe = (): Promise<Stripe | null> => {
  const publicKey = getStripePublicKey();
  if (!publicKey) {
    return Promise.resolve(null);
  }
  
  if (!stripePromise) {
    stripePromise = loadStripe(publicKey);
  }
  return stripePromise;
};

export interface CreateCheckoutSessionParams {
  priceId?: string;
  productName: string;
  amount: number;
  currency?: string;
  successUrl: string;
  cancelUrl: string;
  customerEmail?: string;
  metadata?: Record<string, string>;
}

export interface StripeCheckoutResult {
  success: boolean;
  sessionId?: string;
  url?: string;
  error?: string;
}

export const createCheckoutSession = async (
  params: CreateCheckoutSessionParams
): Promise<StripeCheckoutResult> => {
  try {
    const response = await fetch('/api/stripe/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        productName: params.productName,
        amount: Math.round(params.amount * 100),
        currency: params.currency || 'usd',
        successUrl: params.successUrl,
        cancelUrl: params.cancelUrl,
        customerEmail: params.customerEmail,
        metadata: params.metadata,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create checkout session');
    }

    const data = await response.json();
    return {
      success: true,
      sessionId: data.sessionId,
      url: data.url,
    };
  } catch (error: any) {
    console.error('Stripe checkout error:', error);
    return {
      success: false,
      error: error.message || 'Failed to create checkout session',
    };
  }
};

export const redirectToCheckout = async (url: string): Promise<void> => {
  window.location.href = url;
};

export const createSubscriptionCheckout = async (
  email: string,
  successUrl: string,
  cancelUrl: string
): Promise<StripeCheckoutResult> => {
  return createCheckoutSession({
    productName: 'Vib3 Idea Link Pro Subscription',
    amount: 15,
    currency: 'usd',
    successUrl,
    cancelUrl,
    customerEmail: email,
    metadata: {
      type: 'subscription',
      plan: 'pro',
    },
  });
};

export const createProductCheckout = async (
  productId: string,
  productName: string,
  price: number,
  sellerUsername: string,
  buyerEmail?: string
): Promise<StripeCheckoutResult> => {
  const baseUrl = window.location.origin;
  
  return createCheckoutSession({
    productName,
    amount: price,
    successUrl: `${baseUrl}/${sellerUsername}?purchase=success&product=${productId}`,
    cancelUrl: `${baseUrl}/${sellerUsername}?purchase=cancelled`,
    customerEmail: buyerEmail,
    metadata: {
      type: 'product',
      productId,
      sellerUsername,
    },
  });
};

export const isStripeConfigured = (): boolean => {
  return !!getStripePublicKey();
};
