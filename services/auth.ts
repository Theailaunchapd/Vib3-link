

import { User, UserProfile } from '../types';
import { db_getUserByEmail, db_getUserByUsername, db_saveUser, db_updateUser, db_saveProfile, createDefaultProfile, db_getProfileByUsername, db_validateAndUsePromoCode } from './storage';

const SESSION_KEY = 'vib3_session'; // Stores userId

export const auth_getCurrentUser = (): { user: User, profile: UserProfile } | null => {
    const sessionUserId = localStorage.getItem(SESSION_KEY);
    if (!sessionUserId) return null;

    // We need to find the user in the DB. Since our simple DB doesn't index by ID efficiently, we just scan.
    const usersString = localStorage.getItem('vib3_users');
    if (!usersString) return null;
    const users: User[] = JSON.parse(usersString);
    let user = users.find(u => u.id === sessionUserId);

    if (user) {
        // Check for trial expiration
        if (user.subscriptionStatus === 'trial' && user.trialEndsAt) {
            const now = new Date();
            const trialEnd = new Date(user.trialEndsAt);
            if (now > trialEnd) {
                user.subscriptionStatus = 'expired';
                db_updateUser(user); // Persist expiration
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

export const auth_signup = (username: string, email: string, password: string, promoCode?: string): Promise<string> => {
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

            // Create User
            const newUser: User = {
                id: 'user_' + Date.now(),
                username: username.replace(/\s+/g, '').toLowerCase(), // sanitize handle
                email,
                password, // Mock storage - DO NOT DO THIS IN PRODUCTION
                subscriptionStatus,
                trialEndsAt,
                isVib3Skool: false,
                promoCodeUsed: usedPromoCode,
                createdAt: new Date().toISOString()
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

export const auth_login = (email: string, password: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const user = db_getUserByEmail(email);
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

export const auth_logout = () => {
    localStorage.removeItem(SESSION_KEY);
    window.location.reload(); // Hard reload to clear state
};