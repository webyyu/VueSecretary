import axios from 'axios';
import { getToken } from './auth';

// API基础URL - 根据实际情况调整
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';

/**
 * 获取所有习惯
 * @returns {Promise} 返回所有习惯的Promise
 */
export async function getAllHabits() {
  const token = getToken();
  return axios.get(`${BASE_URL}/habits`, {
    headers: { Authorization: `Bearer ${token}` }
  });
}

/**
 * 获取习惯标签
 * @returns {Promise} 返回所有习惯标签的Promise
 */
export async function getHabitTags() {
  const token = getToken();
  return axios.get(`${BASE_URL}/habits/tags`, {
    headers: { Authorization: `Bearer ${token}` }
  });
}

/**
 * 创建习惯
 * @param {Object} habitData - 习惯数据
 * @returns {Promise} 返回创建结果的Promise
 */
export async function createHabit(habitData) {
  const token = getToken();
  return axios.post(`${BASE_URL}/habits`, habitData, {
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` 
    }
  });
}

/**
 * 获取特定习惯
 * @param {String} habitId - 习惯ID
 * @returns {Promise} 返回特定习惯的Promise
 */
export async function getHabitById(habitId) {
  const token = getToken();
  return axios.get(`${BASE_URL}/habits/${habitId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
}

/**
 * 更新习惯
 * @param {String} habitId - 习惯ID
 * @param {Object} habitData - 更新的习惯数据
 * @returns {Promise} 返回更新结果的Promise
 */
export async function updateHabit(habitId, habitData) {
  const token = getToken();
  return axios.put(`${BASE_URL}/habits/${habitId}`, habitData, {
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` 
    }
  });
}

/**
 * 完成习惯
 * @param {String} habitId - 习惯ID
 * @returns {Promise} 返回完成结果的Promise
 */
export async function completeHabit(habitId) {
  const token = getToken();
  return axios.post(`${BASE_URL}/habits/${habitId}/complete`, {}, {
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` 
    }
  });
}

/**
 * 取消完成习惯
 * @param {String} habitId - 习惯ID
 * @returns {Promise} 返回取消完成结果的Promise
 */
export async function uncompleteHabit(habitId) {
  const token = getToken();
  return axios.post(`${BASE_URL}/habits/${habitId}/uncomplete`, {}, {
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` 
    }
  });
}

/**
 * 删除习惯
 * @param {String} habitId - 习惯ID
 * @returns {Promise} 返回删除结果的Promise
 */
export async function deleteHabit(habitId) {
  const token = getToken();
  return axios.delete(`${BASE_URL}/habits/${habitId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
} 