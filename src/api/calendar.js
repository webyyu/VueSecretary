import axios from 'axios';
import { getAuthHeaders } from './auth';

const BASE_URL = '/api/v1/calendar';

/**
 * 获取日期或日期范围内的任务
 * @param {Object} params - 请求参数
 * @param {string} params.date - 指定日期，格式为YYYY-MM-DD
 * @param {string} params.startDate - 开始日期，格式为YYYY-MM-DD
 * @param {string} params.endDate - 结束日期，格式为YYYY-MM-DD
 * @returns {Promise<Array>} 任务列表
 */
export const getCalendarTasks = async (params = {}) => {
  try {
    console.log('API请求: 获取日历任务', params);
    const response = await axios.get(`${BASE_URL}/tasks`, {
      params,
      headers: getAuthHeaders()
    });
    console.log('API响应:', response.data);
    return response.data.data || [];
  } catch (error) {
    console.error('获取日历任务失败:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * 创建新任务
 * @param {Object} taskData - 任务数据
 * @param {string} taskData.name - 任务名称
 * @param {string} taskData.groupId - 任务分组ID
 * @param {string} taskData.priority - 优先级，可选值为"low", "medium", "high"
 * @param {string} taskData.dueDate - 到期日期，格式为ISO日期字符串
 * @param {boolean} taskData.isImportant - 是否重要
 * @param {boolean} taskData.isUrgent - 是否紧急
 * @returns {Promise<Object>} 创建的任务
 */
export const createCalendarTask = async (taskData) => {
  try {
    console.log('API请求: 创建日历任务', taskData);
    const response = await axios.post(`${BASE_URL}/tasks`, taskData, {
      headers: getAuthHeaders()
    });
    console.log('API响应:', response.data);
    return response.data.data;
  } catch (error) {
    console.error('创建日历任务失败:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * 获取任务详情
 * @param {string} taskId - 任务ID
 * @returns {Promise<Object>} 任务详情
 */
export const getCalendarTaskDetail = async (taskId) => {
  try {
    console.log('API请求: 获取任务详情', taskId);
    const response = await axios.get(`${BASE_URL}/tasks/${taskId}`, {
      headers: getAuthHeaders()
    });
    console.log('API响应:', response.data);
    return response.data.data;
  } catch (error) {
    console.error('获取任务详情失败:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * 更新任务
 * @param {string} taskId - 任务ID
 * @param {Object} updateData - 更新数据
 * @returns {Promise<Object>} 更新后的任务
 */
export const updateCalendarTask = async (taskId, updateData) => {
  try {
    console.log('API请求: 更新任务', taskId, updateData);
    const response = await axios.put(`${BASE_URL}/tasks/${taskId}`, updateData, {
      headers: getAuthHeaders()
    });
    console.log('API响应:', response.data);
    return response.data.data;
  } catch (error) {
    console.error('更新任务失败:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * 删除任务
 * @param {string} taskId - 任务ID
 * @returns {Promise<Object>} 响应数据
 */
export const deleteCalendarTask = async (taskId) => {
  try {
    console.log('API请求: 删除任务', taskId);
    const response = await axios.delete(`${BASE_URL}/tasks/${taskId}`, {
      headers: getAuthHeaders()
    });
    console.log('API响应:', response.data);
    return response.data;
  } catch (error) {
    console.error('删除任务失败:', error.response?.data || error.message);
    throw error;
  }
}; 