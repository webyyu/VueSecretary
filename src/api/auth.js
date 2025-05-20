/**
 * Authentication API service
 * Handles user registration, login, and token management
 */
import axios from 'axios';

// Base API URL for authentication endpoints
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1/auth';

// Max timeout for API requests in milliseconds
const API_TIMEOUT = 5000;

// Log API initialization
console.log('Auth API initialized with base URL:', API_BASE_URL);

/**
 * Check if the API server is available
 * @returns {Promise<boolean>} True if the server is available
 */
async function isServerAvailable() {
  try {
    await axios.get(`${API_BASE_URL.split('/auth')[0]}/health`, { 
      timeout: 2000 
    });
    console.log('API server is available');
    return true;
  } catch (error) {
    console.warn('API server is not available:', error.message);
    return false;
  }
}

/**
 * Register a new user
 * 
 * @param {Object} userData - User registration data
 * @param {string} userData.name - User's name (optional)
 * @param {string} userData.email - User's email
 * @param {string} userData.password - User's password
 * @returns {Promise<Object>} - Response data with user info and token
 */
export async function register(userData) {
  console.log('Registering user with data:', { ...userData, password: '***' });
  
  // Check if server is available first
  const serverAvailable = await isServerAvailable();
  if (!serverAvailable) {
    console.log('Using mock registration because server is unavailable');
    return createMockRegistration(userData);
  }
  
  try {
    console.log('Sending axios POST request to:', `${API_BASE_URL}/register`);
    const response = await axios.post(`${API_BASE_URL}/register`, userData, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: API_TIMEOUT
    });

    console.log('Register response status:', response.status);
    console.log('Register response data:', response.data);
    
    // Save token to localStorage if registration is successful
    if (response.data.data?.token) {
      localStorage.setItem('token', response.data.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.data.user));
      console.log('User data and token saved to localStorage');
    }
    
    return {
      success: true,
      ...response.data
    };
  } catch (error) {
    console.error('Registration error:', error);
    
    // Extract error message from axios error object
    const errorResponse = error.response?.data;
    const errorMessage = errorResponse?.error?.message || 'Registration failed';
    const errorStatus = error.response?.status;
    console.log('Error details:', { errorMessage, errorStatus });
    
    // For demo purposes - create a mock successful response if server is unavailable
    if (!error.response || error.code === 'ECONNREFUSED' || error.message.includes('Network Error')) {
      console.log('API server connection failed, creating mock response');
      return createMockRegistration(userData);
    }
    
    // Rethrow with enhanced error object
    const enhancedError = new Error(errorMessage);
    enhancedError.code = errorResponse?.error?.code;
    enhancedError.details = errorResponse?.error?.details;
    enhancedError.status = errorStatus;
    throw enhancedError;
  }
}

/**
 * Create a mock registration response for development/testing
 * @param {Object} userData User data
 * @returns {Object} Mock response
 */
function createMockRegistration(userData) {
  const mockUser = {
    id: 'mock-' + Date.now(),
    email: userData.email,
    name: userData.name || userData.email.split('@')[0]
  };
  
  const mockToken = 'mock-token-' + Date.now();
  localStorage.setItem('token', mockToken);
  localStorage.setItem('user', JSON.stringify(mockUser));
  
  return {
    success: true,
    data: {
      token: mockToken,
      user: mockUser
    },
    message: 'Mock registration successful!'
  };
}

/**
 * Create a mock login response for development/testing
 * @param {Object} credentials User credentials
 * @returns {Object} Mock response
 */
function createMockLogin(credentials) {
  const mockUser = {
    id: 'mock-' + Date.now(),
    email: credentials.email,
    name: credentials.email.split('@')[0]
  };
  
  const mockToken = 'mock-token-' + Date.now();
  localStorage.setItem('token', mockToken);
  localStorage.setItem('user', JSON.stringify(mockUser));
  
  return {
    success: true,
    data: {
      token: mockToken,
      user: mockUser
    },
    message: 'Mock login successful!'
  };
}

/**
 * Login an existing user
 * 
 * @param {Object} credentials - User login credentials
 * @param {string} credentials.email - User's email
 * @param {string} credentials.password - User's password
 * @returns {Promise<Object>} - Response data with user info and token
 */
export async function login(credentials) {
  console.log('Logging in user with email:', credentials.email);
  
  // Check if server is available first
  const serverAvailable = await isServerAvailable();
  if (!serverAvailable) {
    console.log('Using mock login because server is unavailable');
    return createMockLogin(credentials);
  }
  
  try {
    console.log('Sending axios POST request to:', `${API_BASE_URL}/login`);
    const response = await axios.post(`${API_BASE_URL}/login`, credentials, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: API_TIMEOUT
    });

    console.log('Login response status:', response.status);
    console.log('Login response data:', response.data);
    
    // Save token and user data to localStorage if login is successful
    if (response.data.data?.token) {
      localStorage.setItem('token', response.data.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.data.user));
      console.log('User data and token saved to localStorage after login');
    }
    
    return {
      success: true,
      ...response.data
    };
  } catch (error) {
    console.error('Login error:', error);
    
    // Extract error message from axios error object
    const errorResponse = error.response?.data;
    const errorMessage = errorResponse?.error?.message || 'Login failed';
    const errorStatus = error.response?.status;
    console.log('Error details:', { errorMessage, errorStatus });
    
    // For demo purposes - create a mock successful response if server is unavailable
    if (!error.response || error.code === 'ECONNREFUSED' || error.message.includes('Network Error')) {
      console.log('API server connection failed, creating mock login response');
      return createMockLogin(credentials);
    }
    
    // Rethrow with enhanced error object
    const enhancedError = new Error(errorMessage);
    enhancedError.code = errorResponse?.error?.code;
    enhancedError.status = errorStatus;
    throw enhancedError;
  }
}

/**
 * Get the current user's profile information
 * Uses the stored token for authentication
 * 
 * @returns {Promise<Object>} - User profile data
 */
export async function getProfile() {
  console.log('Fetching user profile');
  const token = localStorage.getItem('token');
  
  if (!token) {
    console.error('No token found, user is not authenticated');
    throw new Error('Not authenticated');
  }
  
  try {
    console.log('Sending GET request to:', `${API_BASE_URL}/me`);
    const response = await axios.get(`${API_BASE_URL}/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('Profile response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch user profile:', error);
    throw error;
  }
}

/**
 * Logout the current user
 * Clears the token and user data from localStorage
 */
export function logout() {
  console.log('Logging out user');
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

/**
 * Check if a user is currently authenticated
 * 
 * @returns {boolean} - True if user is authenticated, false otherwise
 */
export function isAuthenticated() {
  const hasToken = localStorage.getItem('token') !== null;
  console.log('Auth check - Token exists:', hasToken);
  return hasToken;
}

/**
 * Get the current user data from localStorage
 * 
 * @returns {Object|null} - User data object or null if not authenticated
 */
export function getCurrentUser() {
  const userData = localStorage.getItem('user');
  const parsedData = userData ? JSON.parse(userData) : null;
  console.log('Retrieved current user:', parsedData);
  return parsedData;
}

/**
 * Get the authentication token from localStorage
 * 
 * @returns {string|null} - Auth token or null if not authenticated
 */
export function getToken() {
  return localStorage.getItem('token');
}

/**
 * Get the authorization headers for authenticated requests
 * @returns {Object} Headers object with Authorization token
 */
export function getAuthHeaders() {
  const token = getToken();
  return {
    'Authorization': token ? `Bearer ${token}` : ''
  };
} 

/**
 * 获取最新的用户信息（从后端拉取并同步本地缓存）
 * @returns {Promise<Object|null>} 最新用户数据
 */
export async function getCurrentUserFresh() {
  try {
    const profileResp = await getProfile();
    // 兼容 data.user 和 data 两种结构
    const user = profileResp?.data?.user || profileResp?.data;
    if (user && typeof user === 'object') {
      localStorage.setItem('user', JSON.stringify(user));
      return user;
    }
    return null;
  } catch (e) {
    console.error('获取最新用户信息失败:', e);
    return null;
  }
} 