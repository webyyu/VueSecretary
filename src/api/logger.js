/**
 * API Logger for debugging API requests and responses
 */
import axios from 'axios';

// Logger object for use in other modules
export const logger = {
  info: (message, data) => {
    console.log(`ℹ️ [INFO] ${message}`, data || '');
  },
  success: (message, data) => {
    console.log(`✅ [SUCCESS] ${message}`, data || '');
  },
  error: (message, error) => {
    console.error(`❌ [ERROR] ${message}`, error || '');
  },
  warn: (message, data) => {
    console.warn(`⚠️ [WARNING] ${message}`, data || '');
  }
};

// Configure axios interceptors for logging
export const setupApiLogger = () => {
  // Request interceptor
  axios.interceptors.request.use(
    (config) => {
      console.group(`🌐 API Request: ${config.method?.toUpperCase()} ${config.url}`);
      console.log('📤 Request Headers:', config.headers);
      
      // Log request body for non-GET requests, mask sensitive data
      if (config.data && config.method !== 'get') {
        // Create a copy of the data to avoid modifying the original
        const sanitizedData = { ...config.data };
        
        // Mask sensitive fields if present
        if (sanitizedData.password) sanitizedData.password = '***';
        if (sanitizedData.token) sanitizedData.token = '***';
        
        console.log('📦 Request Payload:', sanitizedData);
      }
      
      // For FormData, log the fields
      if (config.data instanceof FormData) {
        const formDataEntries = {};
        for (let [key, value] of config.data.entries()) {
          if (value instanceof File) {
            formDataEntries[key] = `File: ${value.name} (${value.size} bytes)`;
          } else {
            formDataEntries[key] = value;
          }
        }
        console.log('📦 FormData Payload:', formDataEntries);
      }
      
      console.log('⏱️ Request Time:', new Date().toISOString());
      console.groupEnd();
      
      return config;
    },
    (error) => {
      console.error('❌ Request Error:', error);
      return Promise.reject(error);
    }
  );

  // Response interceptor
  axios.interceptors.response.use(
    (response) => {
      console.group(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url}`);
      console.log('🔢 Status:', response.status);
      console.log('📥 Response Headers:', response.headers);
      console.log('📦 Response Data:', response.data);
      console.log('⏱️ Response Time:', new Date().toISOString());
      console.groupEnd();
      
      return response;
    },
    (error) => {
      console.group(`❌ API Error: ${error.config?.method?.toUpperCase()} ${error.config?.url}`);
      console.log('🔢 Status:', error.response?.status);
      console.log('📥 Response Headers:', error.response?.headers);
      console.log('📦 Error Data:', error.response?.data);
      console.log('📋 Error Message:', error.message);
      console.log('⏱️ Error Time:', new Date().toISOString());
      console.groupEnd();
      
      return Promise.reject(error);
    }
  );
  
  console.log('📝 API Logger initialized');
}; 