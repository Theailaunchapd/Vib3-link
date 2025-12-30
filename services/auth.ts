

import { User, UserProfile, StripePayment } from '../types';
import { db_getUserByEmail, db_getUserByUsername, db_saveUser, db_updateUser, db_saveProfile, createDefaultProfile, db_getProfileByUsername, db_validateAndUsePromoCode, db_savePayment } from './storage';

const SESSION_KEY = 'vib3_session'; // Stores userId
const ADMIN_SESSION_KEY = 'vib3_admin_session'; // Admin session
const ADMIN_CREDENTIALS = {
  username: 'admin',
  password: 'vib3admin2025' // Change this in production!
};

export const auth_getCurrentUser = (): { user: User, profile: UserProfile } | null => {
    const sessionUserId = localStorage.getItem(SESSION_KEY);
    if (!sessionUserId) return null;

    // We need to find the user in the DB. Since our simple DB doesn't index by ID efficiently, we just scan.
    const usersString = localStorage.getItem('vib3_users');
    if (!usersString) return null;
    const users: User[] = JSON.parse(usersString);
    let user = users.find(u => u.id === sessionUserId);

    if (user) {
        // Check for trial expiration and attempt auto-charge
        if (user.subscriptionStatus === 'trial' && user.trialEndsAt) {
            const now = new Date();
            const trialEnd = new Date(user.trialEndsAt);
            if (now > trialEnd) {
                // Attempt to automatically charge and convert to paid subscription
                auth_processTrialExpiration(user);
            }
        }
        
        // Check for promo_access expiration (if it has an end date)
        if (user.subscriptionStatus === 'promo_access' && user.trialEndsAt) {
            const now = new Date();
            const accessEnd = new Date(user.trialEndsAt);
            if (now > accessEnd) {
                user.subscriptionStatus = 'expired';
                db_updateUser(user); // Persist expiration
            }
        }

        const profile = db_getProfileByUsername(user.username);
        if (profile) return { user, profile };
    }

    // Session invalid
    localStorage.removeItem(SESSION_KEY);
    return null;
};

export const auth_signup = (username: string, email: string, password: string, promoCode?: string, cardInfo?: { lastFour: string, brand: string }): Promise<string> => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            // Validation
            if (db_getUserByEmail(email)) {
                reject("Email already exists.");
                return;
            }
            if (db_getUserByUsername(username)) {
                reject("Username already taken.");
                return;
            }

            let subscriptionStatus: User['subscriptionStatus'] = 'trial';
            let trialEndsAt: string | undefined;
            let usedPromoCode: string | undefined;

            // Check if promo code was provided
            if (promoCode && promoCode.trim()) {
                const promoResult = db_validateAndUsePromoCode(promoCode.trim());
                if (!promoResult.valid) {
                    reject(promoResult.error || "Invalid promo code");
                    return;
                }
                
                // Apply promo code benefits
                if (promoResult.promoCode) {
                    usedPromoCode = promoResult.promoCode.code;
                    
                    if (promoResult.promoCode.type === 'lifetime') {
                        subscriptionStatus = 'promo_access';
                        trialEndsAt = undefined; // No expiration
                    } else if (promoResult.promoCode.type === 'trial_extension') {
                        subscriptionStatus = 'trial';
                        const trialEnd = new Date();
                        trialEnd.setDate(trialEnd.getDate() + 30); // 30 days instead of 14
                        trialEndsAt = trialEnd.toISOString();
                    } else if (promoResult.promoCode.type === 'free_month') {
                        subscriptionStatus = 'promo_access';
                        const accessEnd = new Date();
                        accessEnd.setDate(accessEnd.getDate() + 30);
                        trialEndsAt = accessEnd.toISOString();
                    }
                }
            } else {
                // Standard trial (14 days)
                const trialEnd = new Date();
                trialEnd.setDate(trialEnd.getDate() + 14);
                trialEndsAt = trialEnd.toISOString();
            }

            // Create User with payment info
            const newUser: User = {
                id: 'user_' + Date.now(),
                username: username.replace(/\s+/g, '').toLowerCase(), // sanitize handle
                email,
                password, // Mock storage - DO NOT DO THIS IN PRODUCTION
                subscriptionStatus,
                trialEndsAt,
                isVib3Skool: false,
                promoCodeUsed: usedPromoCode,
                createdAt: new Date().toISOString(),
                // Save payment method info (if card was provided)
                paymentMethodSaved: cardInfo ? true : false,
                lastFourDigits: cardInfo?.lastFour,
                cardBrand: cardInfo?.brand,
                stripeCustomerId: cardInfo ? 'cus_' + Math.random().toString(36).substr(2, 14) : undefined
            };
            db_saveUser(newUser);

            // Create Initial Profile
            const newProfile = createDefaultProfile(newUser);
            db_saveProfile(newProfile);

            // Set Session
            localStorage.setItem(SESSION_KEY, newUser.id);
            resolve("Success");
        }, 1500); // Simulate network/stripe delay
    });
};

export const auth_login = (emailOrUsername: string, password: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            // Try to find user by email first, then by username
            let user = db_getUserByEmail(emailOrUsername);
            if (!user) {
                user = db_getUserByUsername(emailOrUsername);
            }

            if (!user || user.password !== password) {
                reject("Invalid credentials.");
                return;
            }
            localStorage.setItem(SESSION_KEY, user.id);
            resolve("Success");
        }, 800);
    });
};

// Log in via Vib3 Skool credentials
export const auth_vib3SkoolLogin = (email: string, password: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            if (!email || !password) {
                reject("Please enter your Vib3 Idea Skool credentials.");
                return;
            }

            // SIMULATION: In a real app, this verifies credentials against Vib3 Skool's API.
            // Here we assume if they use this form, they are validating their membership.
            
            let user = db_getUserByEmail(email);

            if (user) {
                // User exists. Verify password.
                if (user.password !== password) {
                    reject("Invalid credentials.");
                    return;
                }
                
                // If they logged in successfully here, we ensure their status reflects their membership
                // This allows existing trial users to "upgrade" by logging in via Skool portal
                if (!user.isVib3Skool) {
                    user.isVib3Skool = true;
                    user.subscriptionStatus = 'skool_member';
                    db_updateUser(user);
                }
            } else {
                // New User coming from Skool
                const username = email.split('@')[0];
                user = {
                    id: 'skool_' + Date.now(),
                    username: username.replace(/\s+/g, '').toLowerCase(),
                    email: email,
                    password: password, 
                    subscriptionStatus: 'skool_member', // Free for life
                    isVib3Skool: true,
                    createdAt: new Date().toISOString()
                };
                db_saveUser(user);
                
                const newProfile = createDefaultProfile(user);
                newProfile.name = username;
                newProfile.bio = "Member of the Vib3 Idea Skool 🎓";
                db_saveProfile(newProfile);
            }

            localStorage.setItem(SESSION_KEY, user.id);
            resolve("Success");
        }, 1200);
    });
};

export const auth_subscribeUser = (userId: string): Promise<void> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            const usersString = localStorage.getItem('vib3_users');
            if (usersString) {
                const users: User[] = JSON.parse(usersString);
                const user = users.find(u => u.id === userId);
                if (user) {
                    user.subscriptionStatus = 'active';
                    user.trialEndsAt = undefined; // No longer on trial
                    db_updateUser(user);
                }
            }
            resolve();
        }, 1000);
    });
};

export const auth_applyPromoCode = (userId: string, promoCode: string): Promise<{ success: boolean; message: string }> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            const promoResult = db_validateAndUsePromoCode(promoCode.trim());
            
            if (!promoResult.valid) {
                resolve({ success: false, message: promoResult.error || "Invalid promo code" });
                return;
            }
            
            const usersString = localStorage.getItem('vib3_users');
            if (usersString && promoResult.promoCode) {
                const users: User[] = JSON.parse(usersString);
                const user = users.find(u => u.id === userId);
                
                if (user) {
                    user.promoCodeUsed = promoResult.promoCode.code;
                    
                    if (promoResult.promoCode.type === 'lifetime') {
                        user.subscriptionStatus = 'promo_access';
                        user.trialEndsAt = undefined;
                        resolve({ success: true, message: "Lifetime access granted! 🎉" });
                    } else if (promoResult.promoCode.type === 'trial_extension') {
                        user.subscriptionStatus = 'trial';
                        const trialEnd = new Date();
                        trialEnd.setDate(trialEnd.getDate() + 30);
                        user.trialEndsAt = trialEnd.toISOString();
                        resolve({ success: true, message: "Trial extended by 30 days! 🎉" });
                    } else if (promoResult.promoCode.type === 'free_month') {
                        user.subscriptionStatus = 'promo_access';
                        const accessEnd = new Date();
                        accessEnd.setDate(accessEnd.getDate() + 30);
                        user.trialEndsAt = accessEnd.toISOString();
                        resolve({ success: true, message: "Free month access granted! 🎉" });
                    }
                    
                    db_updateUser(user);
                    return;
                }
            }
            
            resolve({ success: false, message: "Failed to apply promo code" });
        }, 800);
    });
};

// Process trial expiration - attempt to charge saved payment method
const auth_processTrialExpiration = (user: User): void => {
    // Check if user has a saved payment method
    if (user.paymentMethodSaved && user.stripeCustomerId) {
        // Simulate payment processing
        // In production, this would call Stripe API to charge the saved card
        const paymentSuccessful = simulatePaymentCharge(user);
        
        if (paymentSuccessful) {
            // Payment successful - convert to active subscription
            user.subscriptionStatus = 'active';
            user.trialEndsAt = undefined;
            db_updateUser(user);
            
            // Record successful payment
            const payment: StripePayment = {
                id: 'pay_auto_' + Date.now(),
                userId: user.id,
                username: user.username,
                email: user.email,
                amount: 15,
                status: 'success',
                paymentType: 'subscription',
                productName: 'Monthly Subscription (Auto-charged)',
                stripePaymentId: 'pi_auto_' + Math.random().toString(36).substr(2, 9),
                createdAt: new Date().toISOString()
            };
            db_savePayment(payment);
            
            console.log(`✅ Auto-charged ${user.email} $15 for subscription`);
        } else {
            // Payment failed - mark as expired
            user.subscriptionStatus = 'expired';
            db_updateUser(user);
            
            // Record failed payment
            const payment: StripePayment = {
                id: 'pay_auto_failed_' + Date.now(),
                userId: user.id,
                username: user.username,
                email: user.email,
                amount: 15,
                status: 'failed',
                paymentType: 'subscription',
                productName: 'Monthly Subscription (Auto-charge failed)',
                errorMessage: 'Card declined - insufficient funds',
                createdAt: new Date().toISOString()
            };
            db_savePayment(payment);
            
            console.log(`❌ Auto-charge failed for ${user.email}`);
        }
    } else {
        // No payment method saved - just expire the trial
        user.subscriptionStatus = 'expired';
        db_updateUser(user);
        console.log(`⚠️ Trial expired for ${user.email} - no payment method on file`);
    }
};

// Simulate payment charge (85% success rate)
// In production, this would be replaced with actual Stripe API call
const simulatePaymentCharge = (user: User): boolean => {
    // Simulate 85% success rate for payments
    return Math.random() > 0.15;
};

export const auth_logout = () => {
    localStorage.removeItem(SESSION_KEY);
    window.location.reload(); // Hard reload to clear state
};

// --- Admin Authentication ---

export const auth_isAdmin = (): boolean => {
    return localStorage.getItem(ADMIN_SESSION_KEY) === 'true';
};

export const auth_adminLogin = (username: string, password: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
                localStorage.setItem(ADMIN_SESSION_KEY, 'true');
                resolve("Admin login successful");
            } else {
                reject("Invalid admin credentials");
            }
        }, 500);
    });
};

export const auth_adminLogout = () => {
    localStorage.removeItem(ADMIN_SESSION_KEY);
};