import axios from 'axios';
import { getAuthHeaders } from './auth';

/**
 * 创建新的番茄钟会话
 * @param {string} taskId - 任务ID
 * @param {Object} sessionData - 番茄钟会话数据
 * @param {number} sessionData.duration - 持续时间(秒)
 * @param {string} sessionData.startTime - 开始时间(ISO 8601)
 * @param {string} sessionData.endTime - 结束时间(ISO 8601)
 * @param {string} [sessionData.notes] - 备注(可选)
 * @returns {Promise<Object>} 创建的番茄钟会话
 */
export const createPomodoroSession = async (taskId, sessionData) => {
  try {
    console.log('API请求: 创建番茄钟会话', { taskId, sessionData });
    const response = await axios.post(
      `/api/v1/tasks/${taskId}/pomodoro`,
      sessionData,
      { headers: getAuthHeaders() }
    );
    console.log('API响应:', response.data);
    return response.data.data;
  } catch (error) {
    console.error('创建番茄钟会话失败:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * 获取任务的所有番茄钟会话
 * @param {string} taskId - 任务ID
 * @returns {Promise<Array>} 番茄钟会话列表
 */
export const getTaskPomodoroSessions = async (taskId) => {
  try {
    console.log('API请求: 获取任务番茄钟会话', { taskId });
    const response = await axios.get(
      `/api/v1/tasks/${taskId}/pomodoro`,
      { headers: getAuthHeaders() }
    );
    console.log('API响应:', response.data);
    return response.data.data || [];
  } catch (error) {
    console.error('获取番茄钟会话失败:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * 获取特定番茄钟会话详情
 * @param {string} taskId - 任务ID
 * @param {string} sessionId - 番茄钟会话ID
 * @returns {Promise<Object>} 番茄钟会话详情
 */
export const getPomodoroSessionDetail = async (taskId, sessionId) => {
  try {
    console.log('API请求: 获取番茄钟会话详情', { taskId, sessionId });
    const response = await axios.get(
      `/api/v1/tasks/${taskId}/pomodoro/${sessionId}`,
      { headers: getAuthHeaders() }
    );
    console.log('API响应:', response.data);
    return response.data.data;
  } catch (error) {
    console.error('获取番茄钟会话详情失败:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * 更新番茄钟会话
 * @param {string} taskId - 任务ID
 * @param {string} sessionId - 番茄钟会话ID
 * @param {Object} updateData - 更新数据
 * @returns {Promise<Object>} 更新后的番茄钟会话
 */
export const updatePomodoroSession = async (taskId, sessionId, updateData) => {
  try {
    console.log('API请求: 更新番茄钟会话', { taskId, sessionId, updateData });
    const response = await axios.put(
      `/api/v1/tasks/${taskId}/pomodoro/${sessionId}`,
      updateData,
      { headers: getAuthHeaders() }
    );
    console.log('API响应:', response.data);
    return response.data.data;
  } catch (error) {
    console.error('更新番茄钟会话失败:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * 删除番茄钟会话
 * @param {string} taskId - 任务ID
 * @param {string} sessionId - 番茄钟会话ID
 * @returns {Promise<Object>} 响应结果
 */
export const deletePomodoroSession = async (taskId, sessionId) => {
  try {
    console.log('API请求: 删除番茄钟会话', { taskId, sessionId });
    const response = await axios.delete(
      `/api/v1/tasks/${taskId}/pomodoro/${sessionId}`,
      { headers: getAuthHeaders() }
    );
    console.log('API响应:', response.data || '成功删除(无返回数据)');
    return response.data || { success: true, message: '番茄钟会话已删除' };
  } catch (error) {
    console.error('删除番茄钟会话失败:', error.response?.data || error.message);
    throw error;
  }
}; 