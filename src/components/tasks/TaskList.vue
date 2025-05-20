<template>
  <div class="task-list">
    <div 
      v-for="group in tasks" 
      :key="group.id" 
      class="task-group-card"
    >
      <div class="task-group-header">
        <div class="group-name" @click="toggleGroup(group.id)">{{ group.name }}</div>
        <div class="group-actions">
          <span class="task-count">{{ getCompletedCount(group) }}/{{ group.tasks.length }}</span>
          <el-dropdown trigger="click" @command="handleGroupAction($event, group._id || group.id)">
            <font-awesome-icon icon="ellipsis-vertical" class="more-icon" role="button" focusable="true" aria-label="任务集操作" />
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="delete" class="danger-item">删除任务集</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <font-awesome-icon
            :icon="expandedGroups.includes(group.id) ? 'chevron-up' : 'chevron-down'"
            class="toggle-icon"
            @click="toggleGroup(group.id)"
          />
        </div>
      </div>
      
      <div v-if="expandedGroups.includes(group.id)" class="task-items">
        <div 
          v-for="task in group.tasks" 
          :key="task.id" 
          class="task-item"
          :class="{ completed: task.completed }"
        >
          <el-checkbox 
            v-model="task.completed" 
            @change="updateTaskStatus(task)"
            class="task-checkbox"
          />
          <div class="task-info" @click="$emit('task-clicked', { ...task, groupId: group.id, groupName: group.name })">
            <div class="task-name">{{ task.name }}</div>
            <div class="task-details">
              <div class="task-due-date" v-if="task.dueDate">
                <font-awesome-icon icon="clock" class="detail-icon" />
                {{ formatDate(task.dueDate) }}
              </div>
              <div :class="`task-priority priority-${task.priority}`">
                <div class="priority-dot"></div>
                {{ getPriorityText(task.priority) }}
              </div>
            </div>
          </div>
          <div class="task-actions">
            <button class="action-btn pomodoro-history-btn" @click.stop="viewTaskPomodoroHistory(task, group)">
              <font-awesome-icon icon="history" class="action-icon" />
            </button>
            <el-dropdown trigger="click" @command="handleTaskAction($event, group.id, task.id)">
              <font-awesome-icon icon="ellipsis-vertical" class="more-icon" role="button" focusable="true" aria-label="任务操作" />
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="edit">编辑</el-dropdown-item>
                  <el-dropdown-item command="pomodoro-history">查看番茄钟记录</el-dropdown-item>
                  <el-dropdown-item command="delete" class="danger-item">删除</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>
        
        <div v-if="group.tasks.length === 0" class="no-tasks">
          暂无任务
        </div>
      </div>
    </div>
  </div>
  
  <!-- Edit Task Modal (would be implemented in a real app) -->
</template>

<script setup>
import { ref } from 'vue';
import { useTasksStore } from '../../stores/tasksStore';
import { statsApi } from '../../api';
import eventBus, { EVENTS } from '../../utils/eventBus';
import { ElMessageBox, ElMessage } from 'element-plus';
import { getCurrentUserFresh } from '../../api/auth';
import { getAudioUrlByUserId } from '../../api/cosyVoice';

const props = defineProps({
  tasks: {
    type: Array,
    required: true
  }
});

const emit = defineEmits(['task-clicked', 'edit-task', 'view-pomodoro-history', 'group-deleted']);

const tasksStore = useTasksStore();

// Group expansion handling
const expandedGroups = ref([1]); // Initially expand the first group

const toggleGroup = (groupId) => {
  const index = expandedGroups.value.indexOf(groupId);
  if (index > -1) {
    expandedGroups.value.splice(index, 1);
  } else {
    expandedGroups.value.push(groupId);
  }
};

// Helper functions
const getCompletedCount = (group) => {
  return group.tasks.filter(task => task.completed).length;
};

const formatDate = (date) => {
  const now = new Date();
  const taskDate = new Date(date);
  
  // Same day formatting
  if (taskDate.toDateString() === now.toDateString()) {
    return `今天 ${taskDate.getHours().toString().padStart(2, '0')}:${taskDate.getMinutes().toString().padStart(2, '0')}`;
  }
  
  // Tomorrow formatting
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (taskDate.toDateString() === tomorrow.toDateString()) {
    return `明天 ${taskDate.getHours().toString().padStart(2, '0')}:${taskDate.getMinutes().toString().padStart(2, '0')}`;
  }
  
  // Other dates
  return `${taskDate.getMonth() + 1}月${taskDate.getDate()}日 ${taskDate.getHours().toString().padStart(2, '0')}:${taskDate.getMinutes().toString().padStart(2, '0')}`;
};

const getPriorityText = (priority) => {
  const map = {
    high: '高',
    medium: '中',
    low: '低'
  };
  return map[priority] || '';
};

// Task operations
const updateTaskStatus = async (task) => {
  // Log task status change
  console.log(`任务 ${task._id || task.id} ${task.completed ? '已完成' : '未完成'}`);
  
  try {
    // Call the API to update task status in the backend
    const taskId = task._id || task.id;
    const response = await tasksStore.updateTaskStatus(taskId, task.completed);
    
    if (!response.success) {
      console.error('任务状态更新失败:', response.error);
      // Revert the UI if the API call fails
      task.completed = !task.completed;
      return;
    }
    
    console.log('任务状态已成功更新');
    
    // If task was completed, refresh statistics and emit event
    if (task.completed) {
      console.log('任务已标记为完成，触发统计更新和音频反馈...');
      
      // 确保在任务状态更新成功后再触发事件
      setTimeout(() => {
        eventBus.emit(EVENTS.TASK_COMPLETED, { 
          taskId, 
          task,
          completedAt: new Date().toISOString() // 添加完成时间
        });
      }, 100);
      
      // Play audio feedback when task is completed
      console.log('正在为直接完成任务播放鼓励音频...');
      const user = await getCurrentUserFresh();
      const userId = user && (user._id || user.id);
      if (userId) {
        const url = await getAudioUrlByUserId(userId, 'encourage');
        if (url) {
          const audioElement = new Audio(url);
          audioElement.volume = 0.9;
          audioElement.preload = 'auto';
          audioElement.play();
        }
      }
    }
  } catch (error) {
    console.error('更新任务状态时发生错误:', error);
    // Revert the UI if the API call fails
    task.completed = !task.completed;
  }
};

const handleTaskAction = async (action, groupId, taskId) => {
  if (action === 'edit') {
    // Find the task and emit edit event with the task data
    const groupIndex = props.tasks.findIndex(g => g._id === groupId || g.id === groupId);
    if (groupIndex !== -1) {
      const taskIndex = props.tasks[groupIndex].tasks.findIndex(t => t._id === taskId || t.id === taskId);
      if (taskIndex !== -1) {
        const task = props.tasks[groupIndex].tasks[taskIndex];
        console.log(`Edit task ${taskId} in group ${groupId}`);
        emit('edit-task', { 
          ...task, 
          groupId: props.tasks[groupIndex]._id || props.tasks[groupIndex].id,
          groupName: props.tasks[groupIndex].name
        });
      }
    }
  } else if (action === 'pomodoro-history') {
    // 查看番茄钟历史记录
    const groupIndex = props.tasks.findIndex(g => g._id === groupId || g.id === groupId);
    if (groupIndex !== -1) {
      const taskIndex = props.tasks[groupIndex].tasks.findIndex(t => t._id === taskId || t.id === taskId);
      if (taskIndex !== -1) {
        const task = props.tasks[groupIndex].tasks[taskIndex];
        console.log(`View pomodoro history for task ${taskId} in group ${groupId}`);
        emit('view-pomodoro-history', { 
          ...task, 
          groupId: props.tasks[groupIndex]._id || props.tasks[groupIndex].id,
          groupName: props.tasks[groupIndex].name
        });
      }
    }
  } else if (action === 'delete') {
    // Call the API to delete the task
    try {
      console.log(`Deleting task ${taskId}`);
      const response = await tasksStore.deleteTask(taskId);
      
      if (!response.success) {
        console.error('Failed to delete task:', response.error);
      }
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  }
};

const handleGroupAction = async (action, groupId) => {
  if (action === 'delete') {
    // 使用Element UI的确认对话框
    ElMessageBox.confirm(
      '确认删除此任务集吗？其中的所有任务也将被删除。',
      '警告',
      {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
      .then(async () => {
        try {
          console.log(`Deleting group ${groupId}`);
          // 显式传入deleteRelatedTasks=true确保删除关联任务
          const response = await tasksStore.deleteGroup(groupId, true);
          
          if (response.success) {
            ElMessage({
              type: 'success',
              message: '任务集已删除'
            });
            // 通知父组件任务集已删除
            emit('group-deleted', { groupId });
          } else {
            console.error('Failed to delete group:', response.error);
            ElMessage({
              type: 'error',
              message: '删除任务集失败: ' + response.error
            });
          }
        } catch (error) {
          console.error('Error deleting group:', error);
          ElMessage({
            type: 'error',
            message: '删除任务集失败: ' + error.message
          });
        }
      })
      .catch(() => {
        // 用户取消删除
        ElMessage({
          type: 'info',
          message: '已取消删除'
        });
      });
  }
};

// 查看任务的番茄钟历史记录
const viewTaskPomodoroHistory = (task, group) => {
  emit('view-pomodoro-history', { 
    ...task, 
    groupId: group.id, 
    groupName: group.name 
  });
};
</script>

<style scoped>
.task-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.task-group-card {
  background-color: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: var(--app-shadow);
  animation: fadeIn 0.3s ease forwards;
}

.task-group-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.task-group-header:hover {
  background-color: rgba(0, 0, 0, 0.02);
}

.group-name {
  font-weight: 600;
  font-size: 17px;
}

.group-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.task-count {
  color: var(--app-gray);
  font-size: 14px;
}

.toggle-icon {
  color: var(--app-gray);
  transition: transform 0.3s ease;
}

.task-items {
  border-top: 1px solid var(--app-border);
}

.task-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid var(--app-border);
  animation: fadeIn 0.3s ease forwards;
  transition: background-color 0.2s ease;
}

.task-item:last-child {
  border-bottom: none;
}

.task-item:hover {
  background-color: rgba(0, 0, 0, 0.02);
}

.task-item.completed .task-name {
  text-decoration: line-through;
  color: var(--app-gray);
}

.task-checkbox {
  margin-right: 12px;
}

.task-info {
  flex: 1;
  cursor: pointer;
}

.task-name {
  font-size: 16px;
  margin-bottom: 4px;
}

.task-details {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 12px;
  color: var(--app-gray);
}

.detail-icon {
  margin-right: 4px;
}

.task-due-date {
  display: flex;
  align-items: center;
}

.task-priority {
  display: flex;
  align-items: center;
}

.priority-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 4px;
}

.priority-high .priority-dot {
  background-color: var(--app-danger);
}

.priority-medium .priority-dot {
  background-color: var(--app-warning);
}

.priority-low .priority-dot {
  background-color: var(--app-success);
}

.task-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.action-btn {
  background: none;
  border: none;
  color: var(--app-gray);
  cursor: pointer;
  font-size: 15px;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.action-btn:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.pomodoro-history-btn {
  color: var(--app-primary);
}

.pomodoro-history-btn:hover {
  background-color: rgba(var(--app-primary-rgb), 0.1);
}

.more-icon {
  color: var(--app-gray);
  padding: 4px;
  cursor: pointer;
  margin-right: 8px;
  transition: color 0.2s ease;
}

.more-icon:hover {
  color: var(--app-primary);
}

.danger-item {
  color: #ff4757 !important;
}

.no-tasks {
  padding: 16px;
  text-align: center;
  color: var(--app-gray);
  font-style: italic;
}

/* Dark mode adjustments */
@media (prefers-color-scheme: dark) {
  .task-group-card {
    background-color: #2C2C2E;
  }
  
  .task-group-header:hover,
  .task-item:hover {
    background-color: rgba(255, 255, 255, 0.05);
  }
  
  .task-items,
  .task-item {
    border-color: var(--app-border);
  }
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style> 