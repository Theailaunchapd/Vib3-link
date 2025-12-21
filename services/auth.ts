

import { User, UserProfile } from '../types';
import { db_getUserByEmail, db_getUserByUsername, db_saveUser, db_updateUser, db_saveProfile, createDefaultProfile, db_getProfileByUsername } from './storage';

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

        const profile = db_getProfileByUsername(user.username);
        if (profile) return { user, profile };
    }

    // Session invalid
    localStorage.removeItem(SESSION_KEY);
    return null;
};

export const auth_signup = (username: string, email: string, password: string): Promise<string> => {
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

            // Calculate Trial End (14 days)
            const trialEnd = new Date();
            trialEnd.setDate(trialEnd.getDate() + 14);

            // Create User
            const newUser: User = {
                id: 'user_' + Date.now(),
                username: username.replace(/\s+/g, '').toLowerCase(), // sanitize handle
                email,
                password, // Mock storage - DO NOT DO THIS IN PRODUCTION
                subscriptionStatus: 'trial',
                trialEndsAt: trialEnd.toISOString(),
                isVib3Skool: false,
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

export const auth_logout = () => {
    localStorage.removeItem(SESSION_KEY);
    window.location.reload(); // Hard reload to clear state
};