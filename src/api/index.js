/**
 * API module index
 * Exports all API services for easy import
 */

import * as authRaw from './auth';
import * as tasksRaw from './tasks';
import * as cosyVoiceRaw from './cosyVoice';
import * as statsRaw from './stats';
import { debugApiCall } from './debug';

// Wrap all auth API methods with debug logging
const authApi = {
  register: debugApiCall(authRaw.register, 'register'),
  login: debugApiCall(authRaw.login, 'login'),
  logout: debugApiCall(authRaw.logout, 'logout'),
  isAuthenticated: debugApiCall(authRaw.isAuthenticated, 'isAuthenticated'),
  getCurrentUser: debugApiCall(authRaw.getCurrentUser, 'getCurrentUser'),
  getToken: debugApiCall(authRaw.getToken, 'getToken'),
  getProfile: debugApiCall(authRaw.getProfile, 'getProfile'),
  
  // Helper function to check API connection
  checkConnection: async () => {
    try {
      console.log('Checking API connection...');
      const response = await fetch('http://localhost:3000/api/v1/health', { 
        method: 'GET',
        timeout: 3000 
      });
      const isConnected = response.ok;
      console.log('API connection status:', isConnected ? 'Connected' : 'Failed');
      return isConnected;
    } catch (error) {
      console.error('API connection error:', error);
      return false;
    }
  }
};

// Wrap all tasks API methods with debug logging
const tasksApi = {
  // Task Groups
  getTaskGroups: debugApiCall(tasksRaw.getTaskGroups, 'getTaskGroups'),
  createTaskGroup: debugApiCall(tasksRaw.createTaskGroup, 'createTaskGroup'),
  updateTaskGroup: debugApiCall(tasksRaw.updateTaskGroup, 'updateTaskGroup'),
  deleteTaskGroup: debugApiCall(tasksRaw.deleteTaskGroup, 'deleteTaskGroup'),
  
  // Tasks
  getTasks: debugApiCall(tasksRaw.getTasks, 'getTasks'),
  getTasksByQuadrants: debugApiCall(tasksRaw.getTasksByQuadrants, 'getTasksByQuadrants'),
  getTaskById: debugApiCall(tasksRaw.getTaskById, 'getTaskById'),
  createTask: debugApiCall(tasksRaw.createTask, 'createTask'),
  updateTask: debugApiCall(tasksRaw.updateTask, 'updateTask'),
  updateTaskStatus: debugApiCall(tasksRaw.updateTaskStatus, 'updateTaskStatus'),
  deleteTask: debugApiCall(tasksRaw.deleteTask, 'deleteTask'),
  bulkImportTasks: debugApiCall(tasksRaw.bulkImportTasks, 'bulkImportTasks'),
  
  // Pomodoro
  logPomodoro: debugApiCall(tasksRaw.logPomodoro, 'logPomodoro'),
  getTaskPomodoros: debugApiCall(tasksRaw.getTaskPomodoros, 'getTaskPomodoros')
};

// Wrap all cosyVoice API methods with debug logging
const cosyVoiceApi = {
  uploadVoiceFile: debugApiCall(cosyVoiceRaw.uploadVoiceFile, 'uploadVoiceFile'),
  cloneVoice: debugApiCall(cosyVoiceRaw.cloneVoice, 'cloneVoice'),
  synthesizeVoice: debugApiCall(cosyVoiceRaw.synthesizeVoice, 'synthesizeVoice'),
  getCosyVoiceByVoiceId: debugApiCall(cosyVoiceRaw.getCosyVoiceByVoiceId, 'getCosyVoiceByVoiceId'),
  getCosyVoicesByFeedbackId: debugApiCall(cosyVoiceRaw.getCosyVoicesByFeedbackId, 'getCosyVoicesByFeedbackId'),
  monitorVoiceProcessing: debugApiCall(cosyVoiceRaw.monitorVoiceProcessing, 'monitorVoiceProcessing'),
};

// Wrap all stats API methods with debug logging
const statsApi = {
  getTodaySummary: debugApiCall(statsRaw.getTodaySummary, 'getTodaySummary'),
  getTrends: debugApiCall(statsRaw.getTrends, 'getTrends'),
  getMonthlySummary: debugApiCall(statsRaw.getMonthlySummary, 'getMonthlySummary'),
  exportReport: debugApiCall(statsRaw.exportReport, 'exportReport'),
  getCompletedTasks: debugApiCall(statsRaw.getCompletedTasks, 'getCompletedTasks'),
  getHabitCheckins: debugApiCall(statsRaw.getHabitCheckins, 'getHabitCheckins'),
  getFocusSessions: debugApiCall(statsRaw.getFocusSessions, 'getFocusSessions'),
};

console.log('API services initialized with debug wrappers');

// Export all API services
export { authApi, tasksApi, cosyVoiceApi, statsApi }; 