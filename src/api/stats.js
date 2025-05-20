import axios from 'axios';
import { getAuthHeaders } from './auth';

/**
 * 获取今日概览统计数据
 * @param {string} [date] - 可选日期参数，格式为YYYY-MM-DD
 * @returns {Promise<Object>} 统计数据对象
 */
export const getTodaySummary = async (date) => {
  try {
    console.log('API请求: 获取今日概览', { date });
    let url = '/api/v1/stats/today-summary';
    
    // 如果提供了日期，添加到查询参数
    if (date) {
      url += `?date=${date}`;
    }
    
    const response = await axios.get(
      url,
      { headers: getAuthHeaders() }
    );
    
    console.log('API响应:', response.data);
    return response.data.data;
  } catch (error) {
    console.error('获取今日概览失败:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * 获取趋势数据
 * @param {string} timeRange - 时间范围, 可选值为 "week", "month", "year"
 * @param {string} [endDate] - 可选的结束日期，格式为YYYY-MM-DD
 * @returns {Promise<Object>} 趋势数据对象
 */
export const getTrends = async (timeRange, endDate) => {
  try {
    console.log('API请求: 获取趋势数据', { timeRange, endDate });
    let url = `/api/v1/stats/trends?timeRange=${timeRange}`;
    
    // 如果提供了结束日期，添加到查询参数
    if (endDate) {
      url += `&endDate=${endDate}`;
    }
    
    const response = await axios.get(
      url,
      { headers: getAuthHeaders() }
    );
    
    console.log('API响应:', response.data);
    return response.data.data;
  } catch (error) {
    console.error('获取趋势数据失败:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * 获取月度汇总数据
 * @param {string} month - 月份，格式为YYYY-MM
 * @returns {Promise<Object>} 月度汇总数据对象
 */
export const getMonthlySummary = async (month) => {
  try {
    console.log('API请求: 获取月度汇总', { month });
    const response = await axios.get(
      `/api/v1/stats/monthly-summary?month=${month}`,
      { headers: getAuthHeaders() }
    );
    
    console.log('API响应:', response.data);
    return response.data.data;
  } catch (error) {
    console.error('获取月度汇总失败:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * 导出统计报告
 * @param {string} [reportType="pdf"] - 报告类型，可选值为 "pdf" 或 "csv"
 * @param {string} [timeRange="last_month"] - 时间范围，可选值为 "last_week", "last_month", "last_year"
 * @returns {Promise<Object>} 导出结果对象
 */
export const exportReport = async (reportType = 'pdf', timeRange = 'last_month') => {
  try {
    console.log('API请求: 导出统计报告', { reportType, timeRange });
    const response = await axios.get(
      `/api/v1/stats/export?reportType=${reportType}&timeRange=${timeRange}`,
      { headers: getAuthHeaders() }
    );
    
    console.log('API响应:', response.data);
    return response.data;
  } catch (error) {
    console.error('导出统计报告失败:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * 获取指定日期已完成的任务详情
 * @param {string} date - 日期，格式为YYYY-MM-DD
 * @returns {Promise<Array>} 已完成任务列表
 */
export const getCompletedTasks = async (date) => {
  try {
    console.log('API请求: 获取已完成任务详情', { date });
    const response = await axios.get(
      `/api/v1/stats/completed-tasks?date=${date}`,
      { headers: getAuthHeaders() }
    );
    
    console.log('API响应:', response.data);
    return response.data.data;
  } catch (error) {
    console.error('获取已完成任务详情失败:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * 获取指定日期的习惯打卡记录
 * @param {string} date - 日期，格式为YYYY-MM-DD
 * @returns {Promise<Array>} 习惯打卡记录列表
 */
export const getHabitCheckins = async (date) => {
  try {
    console.log('API请求: 获取习惯打卡记录', { date });
    const response = await axios.get(
      `/api/v1/stats/habit-checkins?date=${date}`,
      { headers: getAuthHeaders() }
    );
    
    console.log('API响应:', response.data);
    return response.data.data;
  } catch (error) {
    console.error('获取习惯打卡记录失败:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * 获取指定日期的专注时间会话
 * @param {string} date - 日期，格式为YYYY-MM-DD
 * @returns {Promise<Array>} 专注时间会话列表
 */
export const getFocusSessions = async (date) => {
  try {
    console.log('API请求: 获取专注时间会话', { date });
    const response = await axios.get(
      `/api/v1/stats/focus-sessions?date=${date}`,
      { headers: getAuthHeaders() }
    );
    
    console.log('API响应:', response.data);
    return response.data.data;
  } catch (error) {
    console.error('获取专注时间会话失败:', error.response?.data || error.message);
    throw error;
  }
}; 