import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { tasksApi } from '../api';

export const useTasksStore = defineStore('tasks', () => {
  // State
  const taskGroups = ref([]);
  const isLoading = ref(false);
  const error = ref(null);
  
  // Computed properties
  const flatTasks = computed(() => {
    const tasks = [];
    taskGroups.value.forEach(group => {
      if (group.tasks) {
        group.tasks.forEach(task => {
          tasks.push({
            ...task,
            groupId: group._id || group.id,
            groupName: group.name
          });
        });
      }
    });
    return tasks;
  });
  
  // Actions
  async function fetchTaskGroups() {
    isLoading.value = true;
    error.value = null;
    
    try {
      console.log('Fetching task groups from API');
      const response = await tasksApi.getTaskGroups();
      console.log('API response:', response);
      
      if (response.success) {
        taskGroups.value = response.data;
        return { success: true, data: response.data };
      } else {
        error.value = 'Failed to fetch task groups';
        return { success: false, error: error.value };
      }
    } catch (err) {
      console.error('Error fetching task groups:', err);
      error.value = err.message || 'Failed to fetch task groups';
      return { success: false, error: error.value };
    } finally {
      isLoading.value = false;
    }
  }
  
  async function fetchTasks() {
    isLoading.value = true;
    error.value = null;
    
    try {
      console.log('Fetching tasks from API');
      // First get all task groups
      const groupsResponse = await tasksApi.getTaskGroups();
      
      if (groupsResponse.success) {
        taskGroups.value = groupsResponse.data;
        
        // Then get all tasks and organize them
        const tasksResponse = await tasksApi.getTasks();
        
        if (tasksResponse.success) {
          // Create a map of task groups by ID for faster lookup
          const groupsMap = {};
          taskGroups.value.forEach(group => {
            groupsMap[group._id] = group;
            // Initialize tasks array if not exists (清空任务数组，避免重复)
            group.tasks = [];
          });
          
          // Assign tasks to their respective groups
          tasksResponse.data.forEach(task => {
            const groupId = task.groupId._id || task.groupId;
            if (groupsMap[groupId]) {
              // 确保任务没有重复添加
              const taskAlreadyExists = groupsMap[groupId].tasks.some(
                existingTask => existingTask._id === task._id
              );
              
              if (!taskAlreadyExists) {
                groupsMap[groupId].tasks.push(task);
              } else {
                console.warn(`Task ${task._id} already exists in group ${groupId}, skipping duplicate`);
              }
            }
          });
          
          return { success: true };
        }
      }
      
      error.value = 'Failed to fetch tasks';
      return { success: false, error: error.value };
    } catch (err) {
      console.error('Error fetching tasks:', err);
      error.value = err.message || 'Failed to fetch tasks';
      return { success: false, error: error.value };
    } finally {
      isLoading.value = false;
    }
  }
  
  async function addGroup(groupName) {
    if (!groupName.trim()) {
      return { success: false, error: 'Group name cannot be empty' };
    }
    
    isLoading.value = true;
    error.value = null;
    
    try {
      const response = await tasksApi.createTaskGroup({ name: groupName });
      
      if (response.success) {
        // Add new group to state
        const newGroup = response.data;
        newGroup.tasks = [];
        taskGroups.value.push(newGroup);
        
        return { success: true, groupId: newGroup._id };
      } else {
        error.value = 'Failed to create group';
        return { success: false, error: error.value };
      }
    } catch (err) {
      console.error('Error creating group:', err);
      error.value = err.message || 'Failed to create group';
      return { success: false, error: error.value };
    } finally {
      isLoading.value = false;
    }
  }
  
  async function updateGroup(groupId, updatedData) {
    isLoading.value = true;
    error.value = null;
    
    try {
      const response = await tasksApi.updateTaskGroup(groupId, updatedData);
      
      if (response.success) {
        // Update group in state
        const groupIndex = taskGroups.value.findIndex(g => g._id === groupId);
        if (groupIndex !== -1) {
          taskGroups.value[groupIndex] = { 
            ...taskGroups.value[groupIndex], 
            ...response.data 
          };
        }
        
        return { success: true };
      } else {
        error.value = 'Failed to update group';
        return { success: false, error: error.value };
      }
    } catch (err) {
      console.error('Error updating group:', err);
      error.value = err.message || 'Failed to update group';
      return { success: false, error: error.value };
    } finally {
      isLoading.value = false;
    }
  }
  
  async function deleteGroup(groupId, deleteRelatedTasks = true) {
    isLoading.value = true;
    error.value = null;
    
    try {
      // 如果需要删除关联任务，先查找该任务集下的所有任务并删除
      if (deleteRelatedTasks) {
        // 查找该任务集
        const group = taskGroups.value.find(g => g._id === groupId);
        if (group && group.tasks && group.tasks.length > 0) {
          console.log(`Deleting ${group.tasks.length} tasks in group ${groupId}`);
          
          // 创建一个包含所有删除任务操作的Promise数组
          const deletePromises = group.tasks.map(task => 
            tasksApi.deleteTask(task._id || task.id)
              .catch(error => {
                console.error(`Failed to delete task ${task._id || task.id}:`, error);
                // 即使个别任务删除失败，继续处理其他任务
                return null;
              })
          );
          
          // 等待所有任务删除完成
          await Promise.all(deletePromises);
          console.log(`All tasks in group ${groupId} deleted`);
        }
      }
      
      // 然后删除任务集
      const response = await tasksApi.deleteTaskGroup(groupId);
      
      if (response.success) {
        // Remove group from state
        taskGroups.value = taskGroups.value.filter(g => g._id !== groupId);
        
        return { success: true };
      } else {
        error.value = 'Failed to delete group';
        return { success: false, error: error.value };
      }
    } catch (err) {
      console.error('Error deleting group:', err);
      error.value = err.message || 'Failed to delete group';
      return { success: false, error: error.value };
    } finally {
      isLoading.value = false;
    }
  }
  
  async function addTask(taskData) {
    if (!taskData.name.trim()) {
      return { success: false, error: 'Task name cannot be empty' };
    }
    
    isLoading.value = true;
    error.value = null;
    
    try {
      let groupId = taskData.groupId;
      
      // Create new group if needed
      if (groupId === 'new') {
        if (!taskData.newGroupName.trim()) {
          isLoading.value = false;
          return { success: false, error: 'Group name cannot be empty' };
        }
        
        const newGroupResult = await addGroup(taskData.newGroupName);
        if (!newGroupResult.success) {
          isLoading.value = false;
          return newGroupResult;
        }
        
        groupId = newGroupResult.groupId;
      }
      
      // Prepare task data for API
      const apiTaskData = {
        name: taskData.name,
        groupId: groupId,
        priority: taskData.priority || 'medium',
        dueDate: taskData.dueDate,
        isImportant: taskData.isImportant || false,
        isUrgent: taskData.isUrgent || false
      };
      
      // Create task
      const response = await tasksApi.createTask(apiTaskData);
      
      if (response.success) {
        // Add task to its group in state
        const newTask = response.data;
        const groupIndex = taskGroups.value.findIndex(g => g._id === groupId);
        
        if (groupIndex !== -1) {
          if (!taskGroups.value[groupIndex].tasks) {
            taskGroups.value[groupIndex].tasks = [];
          }
          taskGroups.value[groupIndex].tasks.push(newTask);
        }
        
        return { success: true, taskId: newTask._id };
      } else {
        error.value = 'Failed to create task';
        return { success: false, error: error.value };
      }
    } catch (err) {
      console.error('Error creating task:', err);
      error.value = err.message || 'Failed to create task';
      return { success: false, error: error.value };
    } finally {
      isLoading.value = false;
    }
  }
  
  async function updateTask(taskId, updatedData) {
    isLoading.value = true;
    error.value = null;
    
    try {
      const response = await tasksApi.updateTask(taskId, updatedData);
      
      if (response.success) {
        // Update task in state
        for (const group of taskGroups.value) {
          if (!group.tasks) continue;
          
          const taskIndex = group.tasks.findIndex(t => t._id === taskId);
          if (taskIndex !== -1) {
            group.tasks[taskIndex] = { ...group.tasks[taskIndex], ...response.data };
            break;
          }
        }
        
        return { success: true };
      } else {
        error.value = 'Failed to update task';
        return { success: false, error: error.value };
      }
    } catch (err) {
      console.error('Error updating task:', err);
      error.value = err.message || 'Failed to update task';
      return { success: false, error: error.value };
    } finally {
      isLoading.value = false;
    }
  }
  
  async function updateTaskStatus(taskId, completed) {
    isLoading.value = true;
    error.value = null;
    
    try {
      const response = await tasksApi.updateTaskStatus(taskId, completed);
      
      if (response.success) {
        // Update task status in state
        for (const group of taskGroups.value) {
          if (!group.tasks) continue;
          
          const taskIndex = group.tasks.findIndex(t => t._id === taskId);
          if (taskIndex !== -1) {
            group.tasks[taskIndex].completed = completed;
            break;
          }
        }
        
        return { success: true };
      } else {
        error.value = 'Failed to update task status';
        return { success: false, error: error.value };
      }
    } catch (err) {
      console.error('Error updating task status:', err);
      error.value = err.message || 'Failed to update task status';
      return { success: false, error: error.value };
    } finally {
      isLoading.value = false;
    }
  }
  
  async function deleteTask(taskId) {
    isLoading.value = true;
    error.value = null;
    
    try {
      const response = await tasksApi.deleteTask(taskId);
      
      if (response.success) {
        // Remove task from state
        for (const group of taskGroups.value) {
          if (!group.tasks) continue;
          
          const taskIndex = group.tasks.findIndex(t => t._id === taskId);
          if (taskIndex !== -1) {
            group.tasks.splice(taskIndex, 1);
            break;
          }
        }
        
        return { success: true };
      } else {
        error.value = 'Failed to delete task';
        return { success: false, error: error.value };
      }
    } catch (err) {
      console.error('Error deleting task:', err);
      error.value = err.message || 'Failed to delete task';
      return { success: false, error: error.value };
    } finally {
      isLoading.value = false;
    }
  }
  
  async function logPomodoro(taskId, pomodoroData) {
    isLoading.value = true;
    error.value = null;
    
    try {
      const response = await tasksApi.logPomodoro(taskId, pomodoroData);
      
      if (response.success) {
        return { success: true, data: response.data };
      } else {
        error.value = 'Failed to log pomodoro session';
        return { success: false, error: error.value };
      }
    } catch (err) {
      console.error('Error logging pomodoro session:', err);
      error.value = err.message || 'Failed to log pomodoro session';
      return { success: false, error: error.value };
    } finally {
      isLoading.value = false;
    }
  }
  
  async function bulkImportTasks(tasksData, forceImport = false) {
    isLoading.value = true;
    error.value = null;
    
    try {
      // Call the API to bulk import tasks
      const response = await tasksApi.bulkImportTasks(tasksData, forceImport);
      
      if (response.success) {
        // Refresh tasks after successful import
        await fetchTasks();
        return { success: true, imported: response.data.imported || 0 };
      } else {
        error.value = 'Failed to bulk import tasks';
        return { success: false, error: error.value };
      }
    } catch (err) {
      console.error('Error bulk importing tasks:', err);
      
      // Handle conflict error specifically
      if (err.status === 409) {
        return { 
          success: false, 
          conflict: true, 
          conflicts: err.details?.conflicts || [] 
        };
      }
      
      error.value = err.message || 'Failed to bulk import tasks';
      return { success: false, error: error.value };
    } finally {
      isLoading.value = false;
    }
  }
  
  return {
    // State
    taskGroups,
    isLoading,
    error,
    
    // Getters
    flatTasks,
    
    // Actions
    fetchTaskGroups,
    fetchTasks,
    addGroup,
    updateGroup,
    deleteGroup,
    addTask,
    updateTask,
    updateTaskStatus,
    deleteTask,
    logPomodoro,
    bulkImportTasks,
    
    // Legacy API methods (for backward compatibility)
    saveTask: addTask
  };
});
