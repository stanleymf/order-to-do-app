import type { User, AuthState } from '../types';

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://order-to-do-production.up.railway.app' 
  : 'http://localhost:4321';

// Token storage keys
const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

export class AuthService {
  private static token: string | null = null;
  private static user: User | null = null;

  // Initialize auth state from localStorage
  static initialize(): AuthState {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const userStr = localStorage.getItem(USER_KEY);
      
      if (token && userStr) {
        this.token = token;
        this.user = JSON.parse(userStr);
        return { user: this.user, isAuthenticated: true };
      }
    } catch (error) {
      console.error('Error initializing auth state:', error);
      this.clearAuth();
    }
    
    return { user: null, isAuthenticated: false };
  }

  // Login with email and password
  static async login(email: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        this.token = data.token;
        this.user = data.user;
        
        // Store in localStorage
        localStorage.setItem(TOKEN_KEY, data.token);
        localStorage.setItem(USER_KEY, JSON.stringify(data.user));
        
        return { success: true, user: data.user };
      } else {
        return { success: false, error: data.error || 'Login failed' };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Network error. Please try again.' };
    }
  }

  // Register new user (admin only)
  static async register(userData: { name: string; email: string; role: 'admin' | 'florist'; password: string }): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`,
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, user: data.user };
      } else {
        return { success: false, error: data.error || 'Registration failed' };
      }
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: 'Network error. Please try again.' };
    }
  }

  // Logout
  static logout(): void {
    this.token = null;
    this.user = null;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  // Get current user
  static getCurrentUser(): User | null {
    return this.user;
  }

  // Get auth token
  static getToken(): string | null {
    return this.token;
  }

  // Check if user is authenticated
  static isAuthenticated(): boolean {
    return this.token !== null && this.user !== null;
  }

  // Get user profile from server
  static async getProfile(): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        this.user = data;
        localStorage.setItem(USER_KEY, JSON.stringify(data));
        return { success: true, user: data };
      } else {
        if (response.status === 401 || response.status === 403) {
          this.clearAuth();
        }
        return { success: false, error: data.error || 'Failed to fetch profile' };
      }
    } catch (error) {
      console.error('Profile fetch error:', error);
      return { success: false, error: 'Network error. Please try again.' };
    }
  }

  // Update user profile
  static async updateProfile(updates: { name?: string; email?: string; currentPassword?: string; newPassword?: string }): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`,
        },
        body: JSON.stringify(updates),
      });

      const data = await response.json();

      if (response.ok) {
        this.user = data.user;
        localStorage.setItem(USER_KEY, JSON.stringify(data.user));
        return { success: true, user: data.user };
      } else {
        return { success: false, error: data.error || 'Profile update failed' };
      }
    } catch (error) {
      console.error('Profile update error:', error);
      return { success: false, error: 'Network error. Please try again.' };
    }
  }

  // Get all users (admin only)
  static async getUsers(): Promise<{ success: boolean; users?: User[]; error?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/users`, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, users: data };
      } else {
        return { success: false, error: data.error || 'Failed to fetch users' };
      }
    } catch (error) {
      console.error('Users fetch error:', error);
      return { success: false, error: 'Network error. Please try again.' };
    }
  }

  // Deactivate user (admin only)
  static async deactivateUser(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/${userId}/deactivate`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true };
      } else {
        return { success: false, error: data.error || 'Failed to deactivate user' };
      }
    } catch (error) {
      console.error('User deactivation error:', error);
      return { success: false, error: 'Network error. Please try again.' };
    }
  }

  // Clear authentication state
  private static clearAuth(): void {
    this.token = null;
    this.user = null;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  // Make authenticated API request
  static async makeAuthenticatedRequest(url: string, options: RequestInit = {}): Promise<Response> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_BASE_URL}${url}`, {
      ...options,
      headers,
    });

    // If token is invalid, clear auth state
    if (response.status === 401 || response.status === 403) {
      this.clearAuth();
    }

    return response;
  }
}

// Server-side data persistence service
export class UserDataService {
  // Get user's data from server
  static async getUserData(): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const response = await AuthService.makeAuthenticatedRequest('/api/user/data');
      const data = await response.json();

      if (response.ok) {
        return { success: true, data };
      } else {
        return { success: false, error: data.error || 'Failed to fetch user data' };
      }
    } catch (error) {
      console.error('User data fetch error:', error);
      return { success: false, error: 'Network error. Please try again.' };
    }
  }

  // Save user's data to server
  static async saveUserData(userData: any): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await AuthService.makeAuthenticatedRequest('/api/user/data', {
        method: 'POST',
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true };
      } else {
        return { success: false, error: data.error || 'Failed to save user data' };
      }
    } catch (error) {
      console.error('User data save error:', error);
      return { success: false, error: 'Network error. Please try again.' };
    }
  }

  // Save specific section of user data
  static async saveUserDataSection(section: string, sectionData: any): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await AuthService.makeAuthenticatedRequest(`/api/user/data/${section}`, {
        method: 'POST',
        body: JSON.stringify(sectionData),
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true };
      } else {
        return { success: false, error: data.error || `Failed to save ${section} data` };
      }
    } catch (error) {
      console.error(`User ${section} data save error:`, error);
      return { success: false, error: 'Network error. Please try again.' };
    }
  }
} 