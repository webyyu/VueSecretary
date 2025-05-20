<template>
  <BaseLayout 
    title="任务" 
    :right-action="true" 
    :left-action="true"
    left-action-icon="cog"
    @right-action="openAddTaskModal"
    @left-action="openSettingsPanel"
  >
    <div class="view-switcher">
      <button 
        class="switch-btn" 
        :class="{ active: viewMode === 'list' }" 
        @click="viewMode = 'list'"
      >
        任务集
      </button>
      <button 
        class="switch-btn" 
        :class="{ active: viewMode === 'quadrant' }" 
        @click="viewMode = 'quadrant'"
      >
        四象限
      </button>
    </div>
    
    <div v-if="isLoading || tasksStore.isLoading" class="loading-indicator">
      <i class="el-icon-loading"></i>
      <span>加载中...</span>
    </div>
    
    <div v-else-if="error" class="error-message">
      <i class="el-icon-warning"></i>
      <span>{{ error }}</span>
      <button class="error-retry" @click="loadTasks">重试</button>
    </div>
    
    <template v-else>
      <TaskList 
        v-if="viewMode === 'list'" 
        :tasks="tasksStore.taskGroups" 
        @task-clicked="selectTask" 
        @edit-task="handleEditTask" 
        @view-pomodoro-history="viewPomodoroHistory"
        @group-deleted="handleGroupDeleted"
      />
      <TaskQuadrant v-else :tasks="tasksStore.flatTasks" @task-clicked="selectTask" />
      
      <!-- Empty state -->
      <div v-if="isEmpty" class="empty-state">
        <div class="empty-icon">
          <font-awesome-icon icon="tasks" />
        </div>
        <h3 class="empty-title">没有任务</h3>
        <p class="empty-text">点击右上角的加号按钮创建您的第一个任务</p>
        <button class="empty-action" @click="openAddTaskModal">
          <font-awesome-icon icon="plus" />
          创建任务
        </button>
      </div>
    </template>
    
    <!-- Add/Edit Task Modal -->
    <ModalContainer v-model="showAddTaskModal" :title="isEditingTask ? '编辑任务' : '新建任务'">
      <el-form :model="newTask" label-position="top">
        <el-form-item label="任务名称">
          <el-input v-model="newTask.name" placeholder="输入任务名称" />
        </el-form-item>
        
        <el-form-item label="所属任务集">
          <el-select v-model="newTask.groupId" placeholder="选择任务集" style="width: 100%">
            <el-option
              v-for="group in tasksStore.taskGroups"
              :key="group._id || group.id"
              :label="group.name"
              :value="group._id || group.id"
            />
            <el-option label="+ 新建任务集" value="new" />
          </el-select>
        </el-form-item>
        
        <el-form-item v-if="newTask.groupId === 'new'" label="任务集名称">
          <el-input v-model="newTask.newGroupName" placeholder="输入任务集名称" />
        </el-form-item>
        
        <el-form-item label="优先级">
          <el-select v-model="newTask.priority" placeholder="选择优先级" style="width: 100%">
            <el-option label="高优先级" value="high" />
            <el-option label="低优先级" value="low" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="截止日期">
          <el-date-picker
            v-model="newTask.dueDate"
            type="datetime"
            placeholder="选择日期和时间"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>
      
      <div v-if="addTaskError" class="form-error">
        {{ addTaskError }}
      </div>
      
      <template #footer>
        <button class="btn btn-secondary" @click="closeTaskModal">取消</button>
        <button class="btn btn-primary" @click="saveTask" :disabled="isAddingTask">
          <span v-if="isAddingTask">{{ isEditingTask ? '保存中...' : '创建中...' }}</span>
          <span v-else>{{ isEditingTask ? '保存' : '创建' }}</span>
        </button>
      </template>
    </ModalContainer>
    
    <!-- Pomodoro Modal -->
    <TaskPomodoro 
      v-if="selectedTask" 
      v-model="showPomodoroModal" 
      :task="selectedTask" 
      @pomodoro-result="handlePomodoroResult"
    />
    
    <!-- Pomodoro History Modal -->
    <ModalContainer 
      v-if="selectedPomodoroHistory" 
      v-model="showPomodoroHistoryModal" 
      :title="`${selectedPomodoroHistory.name} 的番茄钟记录`"
    >
      <TaskPomodoroHistory 
        :task="selectedPomodoroHistory"
        @close="closePomodoroHistory"
        @session-deleted="refreshTasks"
      />
    </ModalContainer>
    
    <!-- Settings Panel -->
    <div class="settings-panel-overlay" v-if="showSettingsPanel" @click="closeSettingsPanel"></div>
    <div class="settings-panel" :class="{ 'settings-panel-open': showSettingsPanel }">
      <div class="settings-header">
        <button class="back-button" @click="closeSettingsPanel">
          <font-awesome-icon icon="arrow-left" />
          <span>返回</span>
        </button>
        <div class="settings-title">设置</div>
        <button class="close-button" @click="closeSettingsPanel">
          <font-awesome-icon icon="times" />
        </button>
      </div>
      
      <div class="settings-content">
        <!-- API 状态 -->
        <div class="settings-section">
          <div class="settings-section-title">API 状态</div>
          <div class="api-status">
            <div class="api-status-indicator" :class="{ 'online': apiOnline, 'offline': !apiOnline }">
              <span v-if="apiOnline">在线</span>
              <span v-else>离线</span>
            </div>
            <button class="api-status-refresh" @click="checkApiStatus">
              <font-awesome-icon icon="sync" :class="{ 'refreshing': checkingApi }" />
            </button>
          </div>
        </div>
        <div class="divider"></div>
        
        <!-- 个性化语音合成 -->
        <div class="settings-item" @click="openVoiceSettingModal">
          <div class="settings-item-icon">
            <font-awesome-icon icon="microphone-alt" />
          </div>
          <div class="settings-item-text">专属于你的语音陪伴</div>
        </div>
        <div class="divider"></div>
        
        <!-- 退出登录 -->
        <div class="settings-item" @click="showLogoutConfirm = true">
          <div class="settings-item-icon">
            <font-awesome-icon icon="sign-out-alt" />
          </div>
          <div class="settings-item-text">退出登录</div>
        </div>
        <div class="divider"></div>
        
        <!-- 问题反馈 -->
        <div class="settings-item" @click="toggleFeedbackForm">
          <div class="settings-item-icon">
            <font-awesome-icon icon="comment" />
          </div>
          <div class="settings-item-text">问题反馈</div>
        </div>
        <div class="divider"></div>
        
        <!-- 反馈表单 -->
        <div class="feedback-form" v-if="showFeedbackForm">
          <textarea 
            class="feedback-input" 
            v-model="feedbackText" 
            placeholder="请在此输入您对产品的宝贵建议，我们会认真倾听并持续改进。"
          ></textarea>
          <button 
            class="feedback-submit" 
            :class="{ 'disabled': !feedbackText.trim() }" 
            :disabled="!feedbackText.trim()" 
            @click="submitFeedback"
          >
            提交反馈
          </button>
        </div>
      </div>
    </div>
    
    <!-- 退出登录确认框 -->
    <div class="logout-modal" v-if="showLogoutConfirm">
      <div class="logout-modal-content">
        <h3 class="logout-modal-title">确认退出？</h3>
        <p class="logout-modal-text">退出后需要重新登录才能继续使用</p>
        <div class="logout-modal-buttons">
          <button class="btn-cancel" @click="showLogoutConfirm = false">取消</button>
          <button class="btn-confirm" @click="logout">确认</button>
        </div>
      </div>
    </div>
    
    <!-- 反馈成功提示 -->
    <div class="feedback-success" v-if="showFeedbackSuccess">
      感谢您的反馈！我们已收到并会尽快处理。
    </div>
    
    <!-- Voice Setting Modal -->
    <VoiceSettingModal 
      v-if="showVoiceSettingModal" 
      @close="closeVoiceSettingModal" 
    />
  </BaseLayout>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useTasksStore } from '../stores/tasksStore';
import { authApi } from '../api';
import { getCurrentUserFresh } from '../api/auth';
import { getAudioUrlByUserId } from '../api/cosyVoice';
import BaseLayout from '../components/layout/BaseLayout.vue';
import ModalContainer from '../components/layout/ModalContainer.vue';
import TaskList from '../components/tasks/TaskList.vue';
import TaskQuadrant from '../components/tasks/TaskQuadrant.vue';
import TaskPomodoro from '../components/tasks/TaskPomodoro.vue';
import TaskPomodoroHistory from '../components/tasks/TaskPomodoroHistory.vue';
import VoiceSettingModal from '../components/voicesetting/VoiceSettingModal.vue';

const router = useRouter();

// Initialize the tasks store
const tasksStore = useTasksStore();

// View mode switching
const viewMode = ref('list');

// Loading state
const isLoading = ref(true);
const error = ref(null);

// API status
const apiOnline = ref(false);
const checkingApi = ref(false);

// Add task state
const isAddingTask = ref(false);
const addTaskError = ref(null);
const isEditingTask = ref(false);

// Settings panel
const showSettingsPanel = ref(false);
const showLogoutConfirm = ref(false);
const showFeedbackForm = ref(false);
const feedbackText = ref('');
const showFeedbackSuccess = ref(false);

// Empty state check
const isEmpty = computed(() => {
  return !tasksStore.flatTasks.length;
});

// Open settings panel
const openSettingsPanel = () => {
  showSettingsPanel.value = true;
  checkApiStatus();
};

// Check API status
const checkApiStatus = async () => {
  checkingApi.value = true;
  try {
    apiOnline.value = await authApi.checkConnection();
  } catch (err) {
    console.error('Error checking API status:', err);
    apiOnline.value = false;
  } finally {
    checkingApi.value = false;
  }
};

// Close settings panel
const closeSettingsPanel = (event) => {
  // If clicking on the overlay or explicitly closing
  if (!event || event.target === event.currentTarget || event.currentTarget.classList.contains('back-button') || event.currentTarget.classList.contains('close-button')) {
    showSettingsPanel.value = false;
    showFeedbackForm.value = false;
  }
};

// Toggle feedback form
const toggleFeedbackForm = () => {
  showFeedbackForm.value = !showFeedbackForm.value;
  feedbackText.value = '';
};

// Submit feedback
const submitFeedback = () => {
  if (!feedbackText.value.trim()) return;
  
  console.log('Submitting feedback:', feedbackText.value);
  // 这里可以使用API发送反馈，但目前仅记录到控制台
  
  // Show success message
  showFeedbackSuccess.value = true;
  showFeedbackForm.value = false;
  feedbackText.value = '';
  
  // Hide success message after 2 seconds
  setTimeout(() => {
    showFeedbackSuccess.value = false;
  }, 2000);
};

// Logout function
const logout = () => {
  // Call API logout method
  authApi.logout();
  // Redirect to login page
  router.push('/login');
};

// Load tasks
const loadTasks = async () => {
  isLoading.value = true;
  error.value = null;
  
  try {
    console.log('Loading tasks...');
    const result = await tasksStore.fetchTasks();
    
    if (!result.success) {
      error.value = result.error || '加载任务失败';
      console.error('Failed to load tasks:', error.value);
    }
  } catch (err) {
    console.error('Error loading tasks:', err);
    error.value = err.message || '加载任务时发生错误';
  } finally {
    isLoading.value = false;
  }
};

// Load tasks on component mount
onMounted(async () => {
  await loadTasks();
  
  // Check API status
  checkApiStatus();
});

// Task modals
const showAddTaskModal = ref(false);
const newTask = ref({
  name: '',
  groupId: '',
  newGroupName: '',
  priority: 'high',
  dueDate: null
});

const openAddTaskModal = () => {
  resetTaskForm();
  isEditingTask.value = false;
  showAddTaskModal.value = true;
};

const resetTaskForm = () => {
  // Reset task form
  addTaskError.value = null;
  
  newTask.value = {
    name: '',
    groupId: tasksStore.taskGroups.length > 0 ? tasksStore.taskGroups[0]._id || tasksStore.taskGroups[0].id : 'new',
    newGroupName: '',
    priority: 'high',
    dueDate: null
  };
};

const handleEditTask = (task) => {
  // Reset error
  addTaskError.value = null;
  
  // Set form to editing mode
  isEditingTask.value = true;
  
  // Populate the form with task data
  newTask.value = {
    _id: task._id,
    name: task.name,
    groupId: task.groupId,
    priority: task.priority || 'high',
    dueDate: task.dueDate ? new Date(task.dueDate) : null
  };
  
  // Show the modal
  showAddTaskModal.value = true;
};

const closeTaskModal = () => {
  showAddTaskModal.value = false;
  resetTaskForm();
};

const saveTask = async () => {
  if (!newTask.value.name.trim()) {
    addTaskError.value = '请输入任务名称';
    return;
  }
  
  // Set adding/editing state
  isAddingTask.value = true;
  addTaskError.value = null;
  
  try {
    if (isEditingTask.value) {
      // Update existing task
      const taskData = {
        name: newTask.value.name,
        priority: newTask.value.priority,
        dueDate: newTask.value.dueDate
      };
      
      console.log('Updating task:', newTask.value._id, taskData);
      const result = await tasksStore.updateTask(newTask.value._id, taskData);
      
      if (result.success) {
        console.log('Task updated successfully');
        showAddTaskModal.value = false;
      } else {
        addTaskError.value = result.error || '更新任务失败';
        console.error('Failed to update task:', addTaskError.value);
      }
    } else {
      // Create new task
      console.log('Creating new task:', newTask.value);
      const result = await tasksStore.addTask(newTask.value);
      
      if (result.success) {
        console.log('Task created successfully');
        showAddTaskModal.value = false;
      } else {
        addTaskError.value = result.error || '创建任务失败';
        console.error('Failed to add task:', addTaskError.value);
      }
    }
  } catch (error) {
    console.error('Error saving task:', error);
    addTaskError.value = error.message || '保存任务时发生错误';
  } finally {
    isAddingTask.value = false;
  }
};

// Pomodoro handling
const selectedTask = ref(null);
const showPomodoroModal = ref(false);
const selectedPomodoroHistory = ref(null);
const showPomodoroHistoryModal = ref(false);

const selectTask = (task) => {
  console.log('Task selected for pomodoro:', task);
  selectedTask.value = task;
  showPomodoroModal.value = true;
};

// 打开任务的番茄钟历史记录
const viewPomodoroHistory = (task) => {
  console.log('Opening pomodoro history for task:', task);
  selectedPomodoroHistory.value = task;
  showPomodoroHistoryModal.value = true;
};

// 关闭番茄钟历史记录
const closePomodoroHistory = () => {
  selectedPomodoroHistory.value = null;
  showPomodoroHistoryModal.value = false;
};

// 刷新任务列表
const refreshTasks = async () => {
  try {
    await tasksStore.fetchTasks();
  } catch (error) {
    console.error('刷新任务列表失败:', error);
  }
};

// Handle pomodoro completion or interruption
const handlePomodoroResult = async (result) => {
  console.log('番茄钟结果:', result);
  try {
    const user = await getCurrentUserFresh();
    const userId = user && (user._id || user.id);
    if (!userId) {
      console.warn('未获取到 user_id，无法播放个性化音频');
      return;
    }
    if (result.completed) {
      // 播放鼓励音频
      console.log('番茄钟完成，准备播放鼓励音频');
      const url = await getAudioUrlByUserId(userId, 'encourage');
      if (url) {
        const audioElement = new Audio(url);
        audioElement.volume = 0.9;
        audioElement.preload = 'auto';
        audioElement.play();
        // 添加视觉通知
        setTimeout(() => {
          const notification = document.createElement('div');
          notification.textContent = '🎉 任务完成!';
          notification.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background-color: #4CAF50;
            color: white;
            padding: 12px 20px;
            border-radius: 4px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            z-index: 9999;
            font-weight: bold;
          `;
          document.body.appendChild(notification);
          setTimeout(() => {
            document.body.removeChild(notification);
          }, 3000);
        }, 300);
      } else {
        console.warn('鼓励音频播放失败，未获取到URL');
      }
    } else if (result.interrupted) {
      // 播放批评音频
      console.log('番茄钟被中断，准备播放批评音频');
      const url = await getAudioUrlByUserId(userId, 'criticize');
      if (url) {
        const audioElement = new Audio(url);
        audioElement.volume = 0.9;
        audioElement.preload = 'auto';
        audioElement.play();
        // 添加视觉通知
        setTimeout(() => {
          const notification = document.createElement('div');
          notification.textContent = '⚠️ 番茄钟未完成';
          notification.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background-color: #f44336;
            color: white;
            padding: 12px 20px;
            border-radius: 4px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            z-index: 9999;
            font-weight: bold;
          `;
          document.body.appendChild(notification);
          setTimeout(() => {
            document.body.removeChild(notification);
          }, 3000);
        }, 300);
      } else {
        console.warn('批评音频播放失败，未获取到URL');
      }
    }
    // 刷新任务数据（如果番茄钟影响了任务状态）
    if (result.completed || (result.interrupted && result.significantProgress)) {
      console.log('番茄钟状态改变，刷新任务数据');
      await tasksStore.fetchTasks();
    }
  } catch (error) {
    console.error('处理番茄钟结果时发生错误:', error);
  }
};

// Voice setting modal
const showVoiceSettingModal = ref(false);

const openVoiceSettingModal = async () => {
  const user = await getCurrentUserFresh();
  if (user && (user.voice_verify === true || user.voice_verify === 'true')) {
    console.log('voice_verify is TRUE!', user);
  } else {
    console.log('voice_verify is NOT true', user);
  }
  showVoiceSettingModal.value = true;
  closeSettingsPanel();
};

const closeVoiceSettingModal = () => {
  showVoiceSettingModal.value = false;
};

// Group deleted event handler
const handleGroupDeleted = async (groupId) => {
  console.log('Group deleted:', groupId);
  try {
    await tasksStore.fetchTasks();
  } catch (error) {
    console.error('刷新任务列表失败:', error);
  }
};
</script>

<style scoped>
.view-switcher {
  display: flex;
  background-color: var(--app-light);
  border-radius: 8px;
  margin-bottom: 16px;
  overflow: hidden;
}

.switch-btn {
  flex: 1;
  border: none;
  background: none;
  padding: 8px 0;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.switch-btn.active {
  background-color: white;
  font-weight: 600;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.loading-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px 0;
  color: var(--text-secondary);
  gap: 8px;
}

.error-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px 16px;
  color: #d32f2f;
  gap: 12px;
  text-align: center;
}

.error-retry {
  background-color: #f5f5f5;
  border: none;
  border-radius: 4px;
  padding: 8px 16px;
  margin-top: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

.error-retry:hover {
  background-color: #e0e0e0;
}

/* Empty state */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 16px;
  color: var(--text-secondary);
  text-align: center;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
  color: #e0e0e0;
}

.empty-title {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 8px;
  color: var(--text-primary);
}

.empty-text {
  font-size: 14px;
  margin-bottom: 24px;
  max-width: 280px;
}

.empty-action {
  background-color: #3483FA;
  color: white;
  border: none;
  border-radius: 20px;
  padding: 8px 20px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: background-color 0.2s;
}

.empty-action:hover {
  background-color: #2872e0;
}

/* Form error */
.form-error {
  color: #d32f2f;
  font-size: 14px;
  margin-top: 8px;
  margin-bottom: 8px;
}

/* API Status */
.settings-section {
  padding: 16px;
}

.settings-section-title {
  font-size: 14px;
  color: #666;
  margin-bottom: 12px;
}

.api-status {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.api-status-indicator {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
}

.api-status-indicator.online {
  background-color: #a5d6a7;
  color: #1b5e20;
}

.api-status-indicator.offline {
  background-color: #ef9a9a;
  color: #b71c1c;
}

.api-status-refresh {
  background: none;
  border: none;
  font-size: 16px;
  color: #666;
  cursor: pointer;
  padding: 4px;
}

.refreshing {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Settings Panel */
.settings-panel-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 90;
}

.settings-panel {
  position: fixed;
  top: 0;
  left: -300px;
  bottom: 0;
  width: 300px;
  background-color: #FFFFFF;
  box-shadow: 0px 0px 8px rgba(0, 0, 0, 0.1);
  border-radius: 0 8px 8px 0;
  z-index: 100;
  transition: left 300ms cubic-bezier(0.23, 1, 0.32, 1);
  display: flex;
  flex-direction: column;
}

.settings-panel-open {
  left: 0;
}

.settings-header {
  display: flex;
  align-items: center;
  padding: 24px 16px;
  border-bottom: 1px solid #F0F0F0;
  position: relative;
}

.settings-title {
  font-size: 18px;
  font-weight: 600;
  flex: 1;
  text-align: center;
}

.back-button {
  display: flex;
  align-items: center;
  background: none;
  border: none;
  padding: 0;
  font-size: 16px;
  cursor: pointer;
  color: #333333;
}

.back-button svg {
  margin-right: 4px;
  width: 20px;
  height: 20px;
}

.close-button {
  background: none;
  border: none;
  font-size: 16px;
  cursor: pointer;
  color: #999999;
  width: 20px;
  height: 20px;
}

.settings-content {
  flex: 1;
  overflow-y: auto;
  padding: 0;
}

.settings-item {
  display: flex;
  align-items: center;
  padding: 0 16px;
  height: 56px;
  cursor: pointer;
}

.settings-item:hover {
  background-color: rgba(0, 0, 0, 0.02);
}

.settings-item-icon {
  width: 20px;
  height: 20px;
  margin-right: 12px;
  color: #333333;
}

.settings-item-text {
  font-size: 16px;
  color: #333333;
}

.divider {
  height: 1px;
  background-color: #F0F0F0;
  margin: 0 16px;
}

/* Feedback Form */
.feedback-form {
  padding: 16px;
  background-color: #FAFAFA;
}

.feedback-input {
  width: 100%;
  height: 120px;
  padding: 12px;
  border: 1px solid #E0E0E0;
  border-radius: 4px;
  background-color: #FFFFFF;
  resize: vertical;
  font-size: 14px;
  margin-bottom: 12px;
}

.feedback-submit {
  background-color: #3483FA;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 16px;
  font-size: 14px;
  cursor: pointer;
  min-width: 96px;
}

.feedback-submit.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Logout Confirmation Modal */
.logout-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 110;
}

.logout-modal-content {
  background-color: white;
  border-radius: 8px;
  padding: 24px;
  width: 85%;
  max-width: 320px;
  text-align: center;
}

.logout-modal-title {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 12px;
}

.logout-modal-text {
  font-size: 14px;
  color: #666666;
  margin-bottom: 20px;
}

.logout-modal-buttons {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.btn-cancel {
  flex: 1;
  padding: 10px;
  border: none;
  border-radius: 4px;
  background-color: #F2F2F7;
  color: #888888;
  font-size: 14px;
  cursor: pointer;
}

.btn-confirm {
  flex: 1;
  padding: 10px;
  border: none;
  border-radius: 4px;
  background-color: #3483FA;
  color: white;
  font-size: 14px;
  cursor: pointer;
}

/* Feedback Success Message */
.feedback-success {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background-color: rgba(76, 175, 80, 0.9);
  color: white;
  padding: 10px 20px;
  border-radius: 4px;
  font-size: 14px;
  z-index: 120;
}

/* Dark mode styles */
@media (prefers-color-scheme: dark) {
  .switch-btn.active {
    background-color: #3A3A3C;
  }
  
  .settings-panel {
    background-color: #2C2C2E;
  }
  
  .settings-header {
    border-bottom-color: #3A3A3C;
  }
  
  .back-button,
  .settings-title,
  .settings-item-text {
    color: #FFFFFF;
  }
  
  .divider {
    background-color: #3A3A3C;
  }
  
  .settings-item:hover {
    background-color: rgba(255, 255, 255, 0.05);
  }
  
  .feedback-form {
    background-color: #1C1C1E;
  }
  
  .feedback-input {
    background-color: #2C2C2E;
    border-color: #3A3A3C;
    color: white;
  }
  
  .logout-modal-content {
    background-color: #2C2C2E;
  }
  
  .logout-modal-title {
    color: white;
  }
  
  .logout-modal-text {
    color: #AAAAAA;
  }
  
  .btn-cancel {
    background-color: #3A3A3C;
    color: #CCCCCC;
  }
  
  .error-retry {
    background-color: #3A3A3C;
    color: #FFFFFF;
  }
  
  .error-retry:hover {
    background-color: #4A4A4C;
  }
  
  .empty-icon {
    color: #4A4A4C;
  }
}
</style> 