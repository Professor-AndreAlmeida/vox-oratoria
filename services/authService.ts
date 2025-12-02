import { User } from '../types';

const COACH_STYLE_KEY = 'vox_coach_style';
const USER_NAME_KEY = 'vox_user_name';
const LOGGED_IN_KEY = 'vox_logged_in';

/**
 * Retrieves the local user info.
 */
export const getCurrentUser = async (): Promise<User | null> => {
    if (localStorage.getItem(LOGGED_IN_KEY) !== 'true') {
        return Promise.resolve(null);
    }
    
    const savedName = localStorage.getItem(USER_NAME_KEY) || 'Visitante';
    const savedStyle = localStorage.getItem(COACH_STYLE_KEY) as User['coachStyle'];
    
    return Promise.resolve({
        id: 'local-user',
        name: savedName,
        email: 'local@device', // Placeholder interno
        styleProfile: 'Comunicador em desenvolvimento.',
        coachStyle: savedStyle || 'encouraging',
    });
};

/**
 * Simulates a login by setting local storage flags.
 * Now accepts a name to personalize the experience.
 */
export const loginAsGuest = (name: string): void => {
    localStorage.setItem(LOGGED_IN_KEY, 'true');
    localStorage.setItem(USER_NAME_KEY, name || 'Visitante');
};


/**
 * Updates the user object and persists settings.
 */
export const updateUser = async (user: User): Promise<User> => {
    if (user.coachStyle) {
        localStorage.setItem(COACH_STYLE_KEY, user.coachStyle);
    }
    if (user.name) {
        localStorage.setItem(USER_NAME_KEY, user.name);
    }
    return Promise.resolve(user);
};


/**
 * Clears authentication-related flags from localStorage.
 */
export const logoutUser = async (): Promise<void> => {
    localStorage.removeItem(LOGGED_IN_KEY);
    // Note: We might want to keep the name for convenience on next login, 
    // but clearing it ensures a fresh start if requested.
    // localStorage.removeItem(USER_NAME_KEY); 
    console.log("Logout triggered. Local session cleared.");
    return Promise.resolve();
};

/**
 * Mock implementation for onAuthStateChange. Does nothing.
 * @param callback 
 * @returns An object with an unsubscribe function.
 */
export const onAuthStateChange = (callback: (event: string, session: any | null) => void) => {
    return {
        data: {
            subscription: {
                unsubscribe: () => {},
            },
        },
    };
};