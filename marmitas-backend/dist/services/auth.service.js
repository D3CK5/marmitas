import { supabase } from '../config/supabase.js';
/**
 * AuthService - Service for handling authentication operations
 */
export class AuthService {
    /**
     * Register a new user
     * @param userData User registration data
     * @returns User object and session token
     */
    async register(userData) {
        // Register the user with Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: userData.email,
            password: userData.password
        });
        if (authError) {
            throw new Error(`Authentication error: ${authError.message}`);
        }
        if (!authData.user) {
            throw new Error('Failed to create user');
        }
        // Create user profile in the users table
        const { data: profileData, error: profileError } = await supabase
            .from('users')
            .insert([{
                id: authData.user.id,
                email: userData.email,
                name: userData.name,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }])
            .select()
            .single();
        if (profileError) {
            // Attempt to clean up the auth user if profile creation fails
            await supabase.auth.admin.deleteUser(authData.user.id);
            throw new Error(`Profile creation error: ${profileError.message}`);
        }
        return {
            user: {
                id: profileData.id,
                email: profileData.email,
                name: profileData.name,
                createdAt: profileData.created_at,
                updatedAt: profileData.updated_at
            },
            token: authData.session?.access_token || ''
        };
    }
    /**
     * Login a user
     * @param credentials User login credentials
     * @returns User object and session token
     */
    async login(credentials) {
        // Authenticate with Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: credentials.email,
            password: credentials.password
        });
        if (authError) {
            throw new Error(`Authentication error: ${authError.message}`);
        }
        if (!authData.user) {
            throw new Error('Authentication failed');
        }
        // Get user profile from users table
        const { data: profileData, error: profileError } = await supabase
            .from('users')
            .select('*')
            .eq('id', authData.user.id)
            .single();
        if (profileError) {
            throw new Error(`Profile retrieval error: ${profileError.message}`);
        }
        return {
            user: {
                id: profileData.id,
                email: profileData.email,
                name: profileData.name,
                createdAt: profileData.created_at,
                updatedAt: profileData.updated_at
            },
            token: authData.session?.access_token || ''
        };
    }
    /**
     * Logout a user
     * @param token The session token to invalidate
     * @returns Success indicator
     */
    async logout(token) {
        const { error } = await supabase.auth.admin.signOut(token);
        if (error) {
            throw new Error(`Logout error: ${error.message}`);
        }
        return true;
    }
    /**
     * Get current user profile
     * @param userId User ID
     * @returns User profile
     */
    async getProfile(userId) {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();
        if (error) {
            throw new Error(`Profile retrieval error: ${error.message}`);
        }
        return {
            id: data.id,
            email: data.email,
            name: data.name,
            createdAt: data.created_at,
            updatedAt: data.updated_at
        };
    }
    /**
     * Update user profile
     * @param userId User ID
     * @param userData User data to update
     * @returns Updated user profile
     */
    async updateProfile(userId, userData) {
        const updates = {
            ...(userData.name && { name: userData.name }),
            ...(userData.email && { email: userData.email }),
            updated_at: new Date().toISOString()
        };
        const { data, error } = await supabase
            .from('users')
            .update(updates)
            .eq('id', userId)
            .select()
            .single();
        if (error) {
            throw new Error(`Profile update error: ${error.message}`);
        }
        // Update auth email if email was changed
        if (userData.email) {
            const { error: authError } = await supabase.auth.admin.updateUserById(userId, { email: userData.email });
            if (authError) {
                // This should not block the operation, but we should log it
                console.error(`Auth email update error: ${authError.message}`);
            }
        }
        return {
            id: data.id,
            email: data.email,
            name: data.name,
            createdAt: data.created_at,
            updatedAt: data.updated_at
        };
    }
}
// Export a singleton instance
export const authService = new AuthService();
export default authService;
//# sourceMappingURL=auth.service.js.map