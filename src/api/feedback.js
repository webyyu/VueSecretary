/**
 * Feedback API Module
 * 
 * Handles interaction with the feedback API endpoints for generating
 * encouragement and criticism sentences based on user input.
 */

import axios from 'axios';
import { FEEDBACK_ENDPOINT, BACKEND_DEV_SERVER, isDevelopment } from '@/env';
import * as mockApi from './mockFeedback';

// 是否使用模拟API
let useMockApi = false;

/**
 * Check if the backend server is running
 * 
 * @returns {Promise<boolean>} - Promise that resolves to true if the server is running
 */
export const checkServerStatus = async () => {
  try {
    await axios.get(`${BACKEND_DEV_SERVER}/api/v1/health`, { timeout: 3000 });
    useMockApi = false;
    return true;
  } catch (error) {
    console.warn('Backend server may not be running:', error.message);
    useMockApi = isDevelopment; // 只在开发环境使用模拟数据
    return false;
  }
};

/**
 * Generate feedback (encouragement and criticism) based on user input and selected styles
 * 
 * @param {Object} params - Request parameters
 * @param {string} params.userInput - The user's input text
 * @param {string} params.encourageStyle - The encouragement style
 * @param {string} params.criticizeStyle - The criticism style
 * @returns {Promise} - Promise that resolves to the generated feedback
 */
export const generateFeedback = async (params) => {
  try {
    // 检查服务器状态
    const isServerRunning = await checkServerStatus();
    
    // 如果服务器未运行，使用模拟API
    if (!isServerRunning) {
      if (useMockApi) {
        console.log('使用模拟API');
        return await mockApi.generateFeedback(params);
      } else {
        throw new Error('后端服务器未运行，请启动服务器后重试');
      }
    }
    
    console.log('使用真实API');
    console.log('发送请求生成反馈:', params);
    console.log('API端点:', FEEDBACK_ENDPOINT);
    
    const response = await axios.post(FEEDBACK_ENDPOINT, {
      userInput: params.userInput,
      encourageStyle: params.encourageStyle,
      criticizeStyle: params.criticizeStyle
    });
    
    console.log('收到响应:', response.data);
    return response.data;
  } catch (error) {
    console.error('生成反馈时出错:', error);
    throw error;
  }
};

/**
 * Get all feedback records with pagination
 * 
 * @param {Object} params - Request parameters
 * @param {number} params.page - Page number (default: 1)
 * @param {number} params.limit - Items per page (default: 10)
 * @returns {Promise} - Promise that resolves to the paginated feedback records
 */
export const getAllFeedback = async (params = { page: 1, limit: 10 }) => {
  try {
    // 如果使用模拟API
    if (useMockApi) {
      return await mockApi.getAllFeedback(params);
    }
    
    const response = await axios.get(FEEDBACK_ENDPOINT, { params });
    return response.data;
  } catch (error) {
    console.error('获取反馈记录时出错:', error);
    
    // 如果在开发环境中且出错，尝试使用模拟API
    if (isDevelopment) {
      console.log('尝试使用模拟API');
      useMockApi = true;
      return await mockApi.getAllFeedback(params);
    }
    
    throw error;
  }
};

/**
 * Get a specific feedback record by ID
 * 
 * @param {string} id - The feedback record ID
 * @returns {Promise} - Promise that resolves to the feedback record
 */
export const getFeedbackById = async (id) => {
  try {
    // 如果使用模拟API
    if (useMockApi) {
      return await mockApi.getFeedbackById(id);
    }
    
    const response = await axios.get(`${FEEDBACK_ENDPOINT}/${id}`);
    return response.data;
  } catch (error) {
    console.error(`获取ID为${id}的反馈时出错:`, error);
    
    // 如果在开发环境中且出错，尝试使用模拟API
    if (isDevelopment) {
      console.log('尝试使用模拟API');
      useMockApi = true;
      return await mockApi.getFeedbackById(id);
    }
    
    throw error;
  }
}; 