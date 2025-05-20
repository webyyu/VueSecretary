/**
 * Tasks API service
 * Handles task groups, tasks, and pomodoro functionality
 */
import axios from 'axios';
import { getToken } from './auth';

// Base API URL for task endpoints (removing '/auth' from the auth base URL)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';

// Max timeout for API requests in milliseconds
const API_TIMEOUT = 5000;

// Log API initialization
console.log('Tasks API initialized with base URL:', API_BASE_URL);

/**
 * Get axios request config with auth token
 * @returns {Object} Axios request config
 */
function getRequestConfig() {
  const token = getToken();
  return {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    timeout: API_TIMEOUT
  };
}

/* Task Group Endpoints */

/**
 * Get all task groups
 * @returns {Promise<Object>} Task groups data
 */
export async function getTaskGroups() {
  console.log('Fetching all task groups');
  try {
    const response = await axios.get(`${API_BASE_URL}/task-groups`, getRequestConfig());
    console.log('Task groups fetched:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching task groups:', error);
    throw handleApiError(error, 'Failed to fetch task groups');
  }
}

/**
 * Create a new task group
 * @param {Object} groupData Group data
 * @param {string} groupData.name Group name
 * @returns {Promise<Object>} Created task group
 */
export async function createTaskGroup(groupData) {
  console.log('Creating task group:', groupData);
  try {
    const response = await axios.post(`${API_BASE_URL}/task-groups`, groupData, getRequestConfig());
    console.log('Task group created:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error creating task group:', error);
    throw handleApiError(error, 'Failed to create task group');
  }
}

/**
 * Update a task group
 * @param {string} groupId Task group ID
 * @param {Object} groupData Updated group data
 * @returns {Promise<Object>} Updated task group
 */
export async function updateTaskGroup(groupId, groupData) {
  console.log(`Updating task group ${groupId}:`, groupData);
  try {
    const response = await axios.put(`${API_BASE_URL}/task-groups/${groupId}`, groupData, getRequestConfig());
    console.log('Task group updated:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error updating task group:', error);
    throw handleApiError(error, 'Failed to update task group');
  }
}

/**
 * Delete a task group
 * @param {string} groupId Task group ID
 * @param {boolean} deleteRelatedTasks 是否同时删除相关的任务
 * @returns {Promise<void>}
 */
export async function deleteTaskGroup(groupId, deleteRelatedTasks = true) {
  console.log(`Deleting task group ${groupId}, deleteRelatedTasks: ${deleteRelatedTasks}`);
  try {
    // 在URL中添加查询参数指示是否删除关联任务
    await axios.delete(`${API_BASE_URL}/task-groups/${groupId}?deleteRelatedTasks=${deleteRelatedTasks}`, getRequestConfig());
    console.log('Task group deleted successfully');
    return { success: true };
  } catch (error) {
    console.error('Error deleting task group:', error);
    throw handleApiError(error, 'Failed to delete task group');
  }
}

/* Task Endpoints */

/**
 * Get all tasks
 * @returns {Promise<Object>} Tasks data
 */
export async function getTasks() {
  console.log('Fetching all tasks');
  try {
    const response = await axios.get(`${API_BASE_URL}/tasks`, getRequestConfig());
    console.log('Tasks fetched:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching tasks:', error);
    throw handleApiError(error, 'Failed to fetch tasks');
  }
}

/**
 * Get tasks by quadrants (important/urgent matrix)
 * @returns {Promise<Object>} Tasks organized by quadrants
 */
export async function getTasksByQuadrants() {
  console.log('Fetching tasks by quadrants');
  try {
    const response = await axios.get(`${API_BASE_URL}/tasks/quadrants`, getRequestConfig());
    console.log('Tasks by quadrants fetched:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching tasks by quadrants:', error);
    throw handleApiError(error, 'Failed to fetch tasks by quadrants');
  }
}

/**
 * Get a single task by ID
 * @param {string} taskId Task ID
 * @returns {Promise<Object>} Task data
 */
export async function getTaskById(taskId) {
  console.log(`Fetching task ${taskId}`);
  try {
    const response = await axios.get(`${API_BASE_URL}/tasks/${taskId}`, getRequestConfig());
    console.log('Task fetched:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching task:', error);
    throw handleApiError(error, 'Failed to fetch task');
  }
}

/**
 * Create a new task
 * @param {Object} taskData Task data
 * @param {string} taskData.name Task name
 * @param {string} taskData.groupId Group ID
 * @param {string} [taskData.priority] Task priority (high, medium, low)
 * @param {Date} [taskData.dueDate] Task due date
 * @param {boolean} [taskData.isImportant] Whether the task is important
 * @param {boolean} [taskData.isUrgent] Whether the task is urgent
 * @param {string} [taskData.description] Task description
 * @param {number} [taskData.estimatedTime] Estimated time to complete (hours)
 * @param {Date} [taskData.suggestedStartTime] Suggested start time
 * @returns {Promise<Object>} Created task
 */
export async function createTask(taskData) {
  console.log('Creating task:', taskData);
  try {
    const response = await axios.post(`${API_BASE_URL}/tasks`, taskData, getRequestConfig());
    console.log('Task created:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error creating task:', error);
    throw handleApiError(error, 'Failed to create task');
  }
}

/**
 * Update a task
 * @param {string} taskId Task ID
 * @param {Object} taskData Updated task data
 * @returns {Promise<Object>} Updated task
 */
export async function updateTask(taskId, taskData) {
  console.log(`Updating task ${taskId}:`, taskData);
  try {
    const response = await axios.put(`${API_BASE_URL}/tasks/${taskId}`, taskData, getRequestConfig());
    console.log('Task updated:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error updating task:', error);
    throw handleApiError(error, 'Failed to update task');
  }
}

/**
 * Update a task's status (completed)
 * @param {string} taskId Task ID
 * @param {boolean} completed Whether the task is completed
 * @returns {Promise<Object>} Updated task status
 */
export async function updateTaskStatus(taskId, completed) {
  console.log(`Updating task ${taskId} status:`, { completed });
  try {
    const response = await axios.patch(
      `${API_BASE_URL}/tasks/${taskId}/status`, 
      { completed }, 
      getRequestConfig()
    );
    console.log('Task status updated:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error updating task status:', error);
    throw handleApiError(error, 'Failed to update task status');
  }
}

/**
 * Delete a task
 * @param {string} taskId Task ID
 * @returns {Promise<void>}
 */
export async function deleteTask(taskId) {
  console.log(`Deleting task ${taskId}`);
  try {
    await axios.delete(`${API_BASE_URL}/tasks/${taskId}`, getRequestConfig());
    console.log('Task deleted successfully');
    return { success: true };
  } catch (error) {
    console.error('Error deleting task:', error);
    throw handleApiError(error, 'Failed to delete task');
  }
}

/* Pomodoro Endpoints */

/**
 * Log a pomodoro session for a task
 * @param {string} taskId Task ID
 * @param {Object} pomodoroData Pomodoro session data
 * @returns {Promise<Object>} Created pomodoro session
 */
export async function logPomodoro(taskId, pomodoroData) {
  console.log(`Logging pomodoro for task ${taskId}:`, pomodoroData);
  try {
    const response = await axios.post(
      `${API_BASE_URL}/tasks/${taskId}/pomodoro`, 
      pomodoroData, 
      getRequestConfig()
    );
    console.log('Pomodoro session logged:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error logging pomodoro session:', error);
    throw handleApiError(error, 'Failed to log pomodoro session');
  }
}

/**
 * Get all pomodoro sessions for a task
 * @param {string} taskId Task ID
 * @returns {Promise<Object>} Pomodoro sessions
 */
export async function getTaskPomodoros(taskId) {
  console.log(`Fetching pomodoro sessions for task ${taskId}`);
  try {
    const response = await axios.get(
      `${API_BASE_URL}/tasks/${taskId}/pomodoro`, 
      getRequestConfig()
    );
    console.log('Pomodoro sessions fetched:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching pomodoro sessions:', error);
    throw handleApiError(error, 'Failed to fetch pomodoro sessions');
  }
}

/**
 * Bulk import multiple tasks at once
 * @param {Array} tasksData Array of task data to import
 * @param {boolean} forceImport Whether to force import even if conflicts are detected
 * @returns {Promise<Object>} Result of bulk import
 */
export async function bulkImportTasks(tasksData, forceImport = false) {
  console.log(`Bulk importing ${tasksData.length} tasks. Force import: ${forceImport}`);
  try {
    const response = await axios.post(
      `${API_BASE_URL}/tasks/bulk-import`, 
      { tasks: tasksData, forceImport }, 
      getRequestConfig()
    );
    console.log('Bulk import response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error bulk importing tasks:', error);
    throw handleApiError(error, 'Failed to bulk import tasks');
  }
}

/**
 * Helper function to handle API errors
 * @param {Error} error Axios error
 * @param {string} defaultMessage Default error message
 * @returns {Error} Enhanced error object
 */
function handleApiError(error, defaultMessage) {
  const errorResponse = error.response?.data;
  const errorMessage = errorResponse?.error?.message || defaultMessage;
  const errorStatus = error.response?.status;
  
  console.log('API Error details:', { errorMessage, errorStatus });
  
  const enhancedError = new Error(errorMessage);
  enhancedError.code = errorResponse?.error?.code;
  enhancedError.details = errorResponse?.error?.details;
  enhancedError.status = errorStatus;
  
  return enhancedError;
} 
// Fixed API call
