/**
 * Authentication API Service
 * 
 * This module provides functions for authentication-related API calls:
 * - User login
 * - Get current user profile
 * - Log out user
 */

import { api, API_URL, type ApiRequestInit } from '../api';

// Types
export interface LoginCredentials {
  username: string;
  password: string;
}

export interface User {
  id: string;
  username: string; // Added username
  name: string;
  email?: string; // Email is now optional
  role: 'secretary' | 'department';
  departmentId?: string;
  department?: {
    id: string;
    name: string;
  };
  /**
   * Optional list of departments the user belongs to. Provided when a user
   * has access to multiple departments. For backwards-compatibility the
   * single `department` field is still returned when the user only has one.
   */
  departments?: {
    id: string;
    name: string;
  }[];
}

export interface LoginResponse {
  user: User;
  // Token is no longer sent in the response body with HttpOnly cookies
}

// Export all auth functions as a single object for backward compatibility
export const authApi = {
  /**
   * Log in a user with username and password
   */
  async login(credentials: LoginCredentials): Promise<User> {
    try {
      const response = await api.post<LoginResponse>(
        '/api/login', 
        credentials,
        { withCredentials: true } as ApiRequestInit
      );
      
      if (!response || !response.user) {
        throw new Error('Invalid response from server');
      }
      
      // Token is now handled by HttpOnly cookie, no need to set it here
      return response.user;
    } catch (error) {
      console.error('Login API error:', error);
      throw error;
    }
  },

  /**
   * Get the current authenticated user's profile
   */
  async getCurrentUser(): Promise<User> {
    try {
      // Get current user from API
      const response = await api.get<{user: User}>(
        '/api/me',
        { withCredentials: true } as ApiRequestInit
      );
      
      // User data retrieved
      
      if (!response || !response.user) {
        throw new Error('Invalid user response from server');
      }
      
      return response.user;
    } catch (error) {
      console.error('Error fetching current user:', error);
      throw error;
    }
  },

  /**
   * Log out the current user
   */
  async logout(): Promise<void> {
    try {
      // Call the server to clear the httpOnly cookie
      await api.post('/api/logout', {}, { withCredentials: true } as ApiRequestInit);
    } catch (error) {
      console.error('Logout API error:', error);
      // If logout API call fails, the cookie might still be on the browser.
      // Ideally, the user should be informed or redirected to login.
      // For now, we just log the error. The session will eventually expire.
      throw error; // Rethrow the error so UI can potentially handle it
    }
    // removeToken() is no longer needed as we are not storing token in localStorage
  },

  /**
   * Check if the user is authenticated (has a valid session)
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      // Attempt to get the current user. If successful, the user is authenticated.
      await this.getCurrentUser(); // `this` refers to authApi object
      return true;
    } catch (error) {
      // If getCurrentUser fails (e.g., 401), the user is not authenticated.
      // apiRequest in api.ts already logs errors, so no need to log here again unless specific context is needed.
      return false;
    }
  }
};

// Export individual functions for backward compatibility
export const login = authApi.login.bind(authApi);
export const getCurrentUser = authApi.getCurrentUser.bind(authApi);
export const logout = authApi.logout.bind(authApi);
export const isAuthenticated = authApi.isAuthenticated.bind(authApi);

// Export the User interface
export type { User as UserType };
