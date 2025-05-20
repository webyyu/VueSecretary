<template>
  <BaseLayout title="AI 秘书">
    <div class="ai-assistant-container">
      <!-- Chat messages area -->
      <div class="messages-container" ref="messagesContainer">
        <div 
          v-for="(message, index) in messages" 
          :key="index"
          :class="['message', message.type]"
        >
          <MessageItem 
            :message="message"
            @update:event="updateEvent"
            @update:task="updateTask"
            @update:habit="updateHabit"
          />
        </div>
      </div>
      
      <!-- Import success toast notification -->
      <div class="toast-notification" :class="{ 'visible': showToast }">
        <font-awesome-icon :icon="toastIcon" class="toast-icon" />
        <span>{{ toastMessage }}</span>
      </div>
      
      <!-- Input area -->
      <div class="input-container">
        <div class="input-area">
          <textarea 
            v-model="userInput" 
            class="message-input" 
            placeholder="发送消息..." 
            @keyup.enter="sendMessage" 
            ref="inputField"
            rows="1"
          ></textarea>
          
          <div class="input-actions">
            <button 
              class="voice-btn"
              :class="{ recording: isRecording }"
              @click="toggleVoiceInput"
            >
              <font-awesome-icon :icon="isRecording ? 'stop' : 'microphone'" />
            </button>
            
            <button 
              class="send-btn"
              :disabled="!userInput.trim() || isAnalyzing" 
              @click="sendMessage"
            >
              <font-awesome-icon icon="paper-plane" />
            </button>
          </div>
        </div>
        
        <div class="voice-assistant-info" v-if="hasCustomVoice">
          <font-awesome-icon icon="info-circle" class="voice-info-icon" />
          <span>个性化语音已启用</span>
        </div>
      </div>
    </div>
    
    <!-- Edit Event Modal -->
    <ModalContainer v-model="showEditEventModal" :title="isEditingEvent ? '编辑事件' : '新建事件'">
      <el-form :model="editingEvent" label-position="top">
        <el-form-item label="事件名称">
          <el-input v-model="editingEvent.title" placeholder="输入事件名称" />
        </el-form-item>
        
        <el-form-item label="开始时间">
          <el-date-picker
            v-model="editingEvent.startTime"
            type="datetime"
            placeholder="选择开始时间"
            style="width: 100%"
          />
        </el-form-item>
        
        <el-form-item label="结束时间">
          <el-date-picker
            v-model="editingEvent.endTime"
            type="datetime"
            placeholder="选择结束时间"
            style="width: 100%"
          />
        </el-form-item>
        
        <el-form-item label="地点">
          <el-input v-model="editingEvent.location" placeholder="输入地点" />
        </el-form-item>
        
        <el-form-item label="优先级">
          <el-select v-model="editingEvent.priority" placeholder="选择优先级" style="width: 100%">
            <el-option label="高优先级" value="high" />
            <el-option label="中优先级" value="medium" />
            <el-option label="低优先级" value="low" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="备注">
          <el-input 
            v-model="editingEvent.description" 
            type="textarea" 
            placeholder="输入事件备注"
            rows="3"
          />
        </el-form-item>
      </el-form>
      
      <div v-if="editEventError" class="form-error">
        {{ editEventError }}
      </div>
      
      <template #footer>
        <button class="btn btn-secondary" @click="closeEditEventModal">取消</button>
        <button class="btn btn-primary" @click="saveEditedEvent" :disabled="isEditingEventSaving">
          <span v-if="isEditingEventSaving">保存中...</span>
          <span v-else>保存</span>
        </button>
      </template>
    </ModalContainer>
    
    <!-- Time conflict confirmation modal -->
    <ModalContainer v-model="showConflictModal" title="时间冲突">
      <div class="conflict-modal-content">
        <p class="conflict-info">
          <font-awesome-icon icon="exclamation-triangle" class="conflict-icon" />
          发现以下时间冲突:
        </p>
        <div class="conflict-list">
          <div 
            v-for="(conflict, index) in conflictingTasks" 
            :key="index" 
            class="conflict-item"
          >
            <div class="conflict-task-name">{{ conflict.name }}</div>
            <div class="conflict-time">
              <font-awesome-icon icon="clock" class="conflict-time-icon" />
              {{ formatDate(conflict.time || conflict.dueDate) }}
            </div>
          </div>
        </div>
        <p class="conflict-question">是否仍要导入这些任务？</p>
      </div>
      
      <template #footer>
        <button class="btn btn-secondary" @click="closeConflictModal">取消</button>
        <button 
          class="btn btn-primary" 
          @click="forceImportTasks"
        >
          强制导入
        </button>
      </template>
    </ModalContainer>
  </BaseLayout>
</template>

<script setup>
import { ref, onMounted, nextTick, watch } from 'vue';
import BaseLayout from '../components/layout/BaseLayout.vue';
import ModalContainer from '../components/layout/ModalContainer.vue';
import MessageItem from '../components/AIAssistant/MessageItem.vue';
import { analyzeInput } from '../services/aiService';
import { useTasksStore } from '../stores/tasksStore';
import axios from 'axios';

// Initialize tasks store
const tasksStore = useTasksStore();

// Messages state
const messages = ref([]);
const userInput = ref('');
const messagesContainer = ref(null);
const isAnalyzing = ref(false);

// Toast notification state
const showToast = ref(false);
const toastMessage = ref('');
const toastIcon = ref('check-circle');
const toastTimer = ref(null);

// Edit Event Modal state
const showEditEventModal = ref(false);
const editingEvent = ref({
  id: '',
  title: '',
  startTime: null,
  endTime: null,
  location: '',
  priority: 'medium',
  description: ''
});
const isEditingEvent = ref(false);
const isEditingEventSaving = ref(false);
const editEventError = ref(null);

// Task conflict state
const showConflictModal = ref(false);
const conflictingTasks = ref([]);
const pendingTasksToImport = ref(null);
const forceImport = ref(false);

// Voice input state
const isRecording = ref(false);
const hasCustomVoice = ref(false);

// Welcome message
onMounted(() => {
  // Add welcome message with a small delay
  setTimeout(() => {
    addMessage({
      type: 'ai',
      content: '你好！我是你的AI秘书，可以帮助你管理日程、创建任务，以及设置提醒。你可以直接告诉我你需要什么帮助，或者点击右上角的设置来个性化我的语音。',
      timestamp: new Date()
    });
  }, 500);
  
  // Check if there's already a custom voice
  // In a real app, this would come from an API or local storage
  const hasVoice = localStorage.getItem('hasCustomVoice');
  if (hasVoice) {
    hasCustomVoice.value = true;
  }
  
  // 检查任务分析服务状态
  checkServiceStatus();
  
  // 预加载任务组和任务
  loadTasksData();
  
  // 在控制台显示formatDate函数信息
  setTimeout(() => {
    messageTime();
  }, 1000);
});

// Auto-scroll to bottom when messages change
watch(messages, () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
    }
  });
});

// Format date helper function
const formatDate = (dateInput) => {
  if (!dateInput) return null;
  
  try {
    // 如果是Date对象，转为ISO字符串
    if (dateInput instanceof Date) {
      return dateInput.toISOString();
    }
    
    // 如果是字符串但格式不正确，尝试转换
    if (typeof dateInput === 'string') {
      // 处理常见的日期描述，如"明天"、"周五"等
      if (dateInput.includes('明天')) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow.toISOString();
      } else if (dateInput.includes('后天')) {
        const dayAfterTomorrow = new Date();
        dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
        return dayAfterTomorrow.toISOString();
      } else if (/\d{4}-\d{2}-\d{2}/.test(dateInput)) {
        // 已经是类似 YYYY-MM-DD 的格式
        return new Date(dateInput).toISOString();
      } else {
        // 尝试作为普通字符串解析
        const date = new Date(dateInput);
        if (!isNaN(date.getTime())) {
          return date.toISOString();
        }
      }
    }
    
    // 无法解析，返回null
    console.warn('无法解析日期:', dateInput);
    return null;
  } catch (e) {
    console.error('日期格式化错误:', e);
    return null;
  }
};

// Show toast notification
const showToastNotification = (message, icon = 'check-circle', duration = 2000) => {
  // Clear any existing timer
  if (toastTimer.value) {
    clearTimeout(toastTimer.value);
  }
  
  // Set toast content
  toastMessage.value = message;
  toastIcon.value = icon;
  showToast.value = true;
  
  // Auto-hide after duration
  toastTimer.value = setTimeout(() => {
    showToast.value = false;
  }, duration);
};

// Handle event editing
const openEditEventModal = (event) => {
  // Reset error
  editEventError.value = null;
  
  // Set editing mode
  isEditingEvent.value = true;
  
  // Convert string dates to Date objects if needed
  const startTime = event.startTime ? new Date(event.startTime) : null;
  const endTime = event.endTime ? new Date(event.endTime) : null;
  
  // Populate the form with event data
  editingEvent.value = {
    id: event.id,
    title: event.title || '',
    startTime: startTime,
    endTime: endTime,
    location: event.location || '',
    priority: event.priority || 'medium',
    description: event.description || ''
  };
  
  // Show the modal
  showEditEventModal.value = true;
};

const closeEditEventModal = () => {
  showEditEventModal.value = false;
  editEventError.value = null;
  // Reset form after closing
  editingEvent.value = {
    id: '',
    title: '',
    startTime: null,
    endTime: null,
    location: '',
    priority: 'medium',
    description: ''
  };
  isEditingEvent.value = false;
};

const saveEditedEvent = async () => {
  if (!editingEvent.value.title.trim()) {
    editEventError.value = '请输入事件名称';
    return;
  }
  
  if (!editingEvent.value.startTime) {
    editEventError.value = '请选择开始时间';
    return;
  }
  
  isEditingEventSaving.value = true;
  
  try {
    // In a real app, this would call an API to update the event
    console.log('Saving edited event:', editingEvent.value);
    
    // Update the event in the messages
    if (isEditingEvent.value && editingEvent.value.id) {
      // Find and update the event in the messages array
      updateEventInMessages(editingEvent.value);
    }
    
    // Show success notification
    showToastNotification('事件已更新', 'check-circle');
    closeEditEventModal();
    
    // Add a message to confirm the update
    addMessage({
      type: 'ai',
      content: `✓ 已更新事件「${editingEvent.value.title}」！`,
      timestamp: new Date()
    });
    
    isEditingEventSaving.value = false;
  } catch (error) {
    console.error('Error saving event:', error);
    editEventError.value = '保存事件失败，请重试';
    isEditingEventSaving.value = false;
  }
};

// Function to update event in messages array
const updateEventInMessages = (updatedEvent) => {
  messages.value.forEach(message => {
    if (message.cards && message.cards.events) {
      const eventIndex = message.cards.events.findIndex(event => 
        event.id === updatedEvent.id
      );
      
      if (eventIndex !== -1) {
        // Update the event with new data
        message.cards.events[eventIndex] = {
          ...message.cards.events[eventIndex],
          ...updatedEvent
        };
      }
    }
  });
};

// Handle time conflicts
const closeConflictModal = () => {
  showConflictModal.value = false;
  conflictingTasks.value = [];
  pendingTasksToImport.value = null;
};

const forceImportTasks = async () => {
  if (!pendingTasksToImport.value) return;
  
  forceImport.value = true;
  await importTasks(pendingTasksToImport.value);
  closeConflictModal();
};

// Helper function to add a message
const addMessage = (message) => {
  messages.value.push(message);
};

// Send a user message
const sendMessage = async () => {
  if (!userInput.value.trim() || isAnalyzing.value) return;
  
  // Add user message
  addMessage({
    type: 'user',
    content: userInput.value,
    timestamp: new Date()
  });
  
  // Clear input
  const input = userInput.value;
  userInput.value = '';
  
  // Set analyzing state
  isAnalyzing.value = true;
  
  // Add AI analyzing indicator
  addMessage({
    type: 'ai',
    isAnalyzing: true,
    timestamp: new Date()
  });
  
  try {
    // Call AI service to analyze input
    const analysisResult = await analyzeInput(input);
    
    // Remove analyzing message
    messages.value.pop();
    
    // Check if analysis was successful
    if (analysisResult.success) {
      // Create a structured message with the analysis results
      const aiMessage = {
        type: 'ai',
        content: '我已分析完成：',
        timestamp: new Date(),
        cards: {
          events: analysisResult.data.events || [],
          tasks: analysisResult.data.tasks || [],
          habits: analysisResult.data.habits || []
        }
      };
      
      // Customize message based on analysis
      if (analysisResult.data.events.length > 0 && analysisResult.data.tasks.length === 0 && analysisResult.data.habits.length === 0) {
        aiMessage.content = '我已整理出您的事件安排：';
      } else if (analysisResult.data.tasks.length > 0 && analysisResult.data.events.length === 0 && analysisResult.data.habits.length === 0) {
        aiMessage.content = '我已为您拆解任务：';
        
        // 添加任务建议（如果有）
        if (analysisResult.data.tasks[0] && analysisResult.data.tasks[0].suggestions) {
          aiMessage.suggestions = analysisResult.data.tasks[0].suggestions;
        }
      } else if (analysisResult.data.habits.length > 0 && analysisResult.data.events.length === 0 && analysisResult.data.tasks.length === 0) {
        aiMessage.content = '我已为您制定习惯养成计划：';
        
        // 添加习惯建议（如果有）
        if (analysisResult.data.habits[0] && analysisResult.data.habits[0].tips) {
          aiMessage.suggestions = analysisResult.data.habits[0].tips;
        }
      } else if (analysisResult.data.events.length === 0 && analysisResult.data.tasks.length === 0 && analysisResult.data.habits.length === 0) {
        aiMessage.content = '我没有识别出任何事件、任务或习惯。您可以尝试更具体地描述，例如："明天上午10点开会"或"我想开始每天健身"。';
        delete aiMessage.cards;
      }
      
      addMessage(aiMessage);
    } else {
      // 处理失败情况，提供更详细的错误信息
      let errorMessage = '抱歉，我在分析您的输入时遇到了问题。';
      
      if (analysisResult.error) {
        if (analysisResult.error.includes('服务不可用')) {
          errorMessage = '抱歉，AI服务暂时不可用，请稍后再试。';
        } else if (analysisResult.error.includes('格式错误')) {
          errorMessage = '抱歉，您的输入格式可能有误，请尝试更清晰地描述。';
        } else {
          errorMessage = `抱歉，分析失败：${analysisResult.error}。请您尝试重新描述。`;
        }
      }
      
      addMessage({
        type: 'ai',
        content: errorMessage,
        timestamp: new Date()
      });
      console.error('Analysis error:', analysisResult.error);
    }
  } catch (error) {
    // Handle API errors
    console.error('API error:', error);
    addMessage({
      type: 'ai',
      content: '抱歉，服务暂时不可用。请稍后再试。',
      timestamp: new Date()
    });
  } finally {
    // Reset analyzing state
    isAnalyzing.value = false;
  }
};

// Task import function
const importTasks = async (tasks) => {
  try {
    // 检查tasksStore是否已加载
    console.log('导入任务前的状态检查:');
    console.log('现有任务组数量:', tasksStore.taskGroups.length);
    if (tasksStore.taskGroups.length > 0) {
      console.log('第一个任务组:', tasksStore.taskGroups[0]);
    }
    
    // Prepare API endpoint and request config
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';
    const config = {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      }
    };
    
    // Track success and failures
    let successCount = 0;
    let failureCount = 0;
    
    // Process tasks - identify parent tasks and subtasks
    for (const task of tasks) {
      try {
        // Check if this task has subtasks - if so, create a task group for it
        if (task.subtasks && task.subtasks.length > 0) {
          console.log('Creating task group for task with subtasks:', task.title);
          
          // 1. Create a new task group with the main task name
          const groupResponse = await axios.post(`${API_BASE_URL}/task-groups`, {
            name: task.title || task.name,
            description: task.description || ''
          }, config);
          
          console.log('任务组创建响应:', groupResponse.data);
          
          if (groupResponse.data.success) {
            const groupId = groupResponse.data.data._id;
            console.log('成功获取任务组ID:', groupId);
            // 任务组创建成功，但这里不增加successCount，因为我们只关心创建了多少个实际任务
            
            // 记录成功创建的子任务数量
            let createdSubtasks = 0;
            
            // 2. Create individual subtasks within this group
            for (const subtask of task.subtasks) {
              try {
                // Convert subtask to API format
                const subtaskData = {
                  name: subtask.title || subtask.content || '未命名子任务',
                  groupId: groupId,
                  priority: task.priority || "medium",
                  dueDate: formatDate(subtask.scheduledTime || task.dueDate || task.deadline),
                  description: subtask.description || '',
                  estimatedTime: typeof subtask.estimatedDuration === 'string' ? 
                    parseEstimatedTime(subtask.estimatedDuration) : 1,
                  isImportant: task.priority === 'high',
                  isUrgent: Boolean(subtask.scheduledTime || task.dueDate)
                };
                
                // 验证必要参数
                if (!subtaskData.name) {
                  console.error('子任务名称为空，跳过创建');
                  failureCount++;
                  continue;
                }
                
                if (!subtaskData.groupId) {
                  console.error('子任务缺少groupId，跳过创建');
                  failureCount++;
                  continue;
                }
                
                // Add the forceImport flag if we're retrying after conflict
                if (forceImport.value) {
                  subtaskData.forceImport = true;
                }
                
                console.log('正在创建子任务:', subtaskData);
                console.log('完整API URL:', `${API_BASE_URL}/tasks`);
                console.log('请求头:', config);
                // Send request to create subtask
                const response = await axios.post(`${API_BASE_URL}/tasks`, subtaskData, config);
                console.log('子任务创建响应:', response.data);
                // 每个成功创建的子任务增加1
                createdSubtasks++;
              } catch (err) {
                failureCount++;
                console.error('Error creating subtask:', err);
                // 详细记录错误信息
                if (err.response) {
                  console.error('子任务创建失败 - 状态:', err.response.status);
                  console.error('子任务创建失败 - 详情:', err.response.data);
                }
              }
            }
            
            // 所有子任务创建完成后，增加成功计数
            successCount += createdSubtasks + 1; // +1 表示任务组
          } else {
            failureCount++;
          }
        } else {
          // Regular task without subtasks - use default group if needed
          let defaultGroupId = null;
          if (tasksStore.taskGroups.length === 0) {
            console.log('无现有任务组，正在创建新的默认任务组');
            const groupResponse = await axios.post(`${API_BASE_URL}/task-groups`, {
              name: "AI秘书导入"
            }, config);
            
            console.log('创建默认任务组响应:', groupResponse.data);
            
            if (groupResponse.data.success) {
              defaultGroupId = groupResponse.data.data._id;
              console.log('成功创建默认任务组，ID:', defaultGroupId);
            } else {
              console.error('创建默认任务组失败:', groupResponse.data);
            }
          } else {
            defaultGroupId = tasksStore.taskGroups[0]._id;
            console.log('使用现有默认任务组，ID:', defaultGroupId);
          }
          
          // Map AI task format to API format
          const taskData = {
            name: task.title || task.name || '未命名任务',
            groupId: defaultGroupId,
            priority: task.priority || "medium",
            dueDate: formatDate(task.dueDate || task.startTime || task.deadline),
            description: task.description || '',
            ...(task.duration && { estimatedTime: parseEstimatedTime(task.duration) }),
            isImportant: task.priority === 'high',
            isUrgent: Boolean(task.dueDate || task.startTime)
          };
          
          // 验证必要参数
          if (!taskData.name) {
            console.error('任务名称为空，跳过创建');
            failureCount++;
            continue;
          }
          
          if (!taskData.groupId) {
            console.error('任务缺少groupId，跳过创建');
            failureCount++;
            continue;
          }
          
          // Add the forceImport flag if we're retrying after conflict
          if (forceImport.value) {
            taskData.forceImport = true;
          }
          
          // Send request to create task
          console.log('正在创建常规任务:', taskData);
          console.log('完整API URL:', `${API_BASE_URL}/tasks`);
          console.log('请求头:', config);
          try {
            const response = await axios.post(`${API_BASE_URL}/tasks`, taskData, config);
            console.log('常规任务创建响应:', response.data);
            successCount++;
          } catch (error) {
            failureCount++;
            console.error('Error creating regular task:', error);
            // 详细记录错误信息
            if (error.response) {
              console.error('常规任务创建失败 - 状态:', error.response.status);
              console.error('常规任务创建失败 - 详情:', error.response.data);
            }
          }
        }
      } catch (err) {
        failureCount++;
        console.error('Error creating task:', err);
      }
    }
    
    // Reset force import flag
    forceImport.value = false;
    
    // Show success/failure toast
    if (successCount > 0) {
      // Determine if we imported any task groups with subtasks
      const subtaskCount = tasks.reduce((count, task) => {
        return count + (task.subtasks?.length || 0);
      }, 0);
      
      // Show appropriate success message
      if (subtaskCount > 0) {
        showToastNotification(`成功导入 ${successCount} 个任务（包含子任务）`, 'check-circle');
        
        // Add success message for task with subtasks
        addMessage({
          type: 'ai',
          content: `✓ 已成功导入任务组及子任务！成功创建了 ${successCount} 个任务项，其中包括任务组与子任务。您现在可以在任务视图中查看和管理这些任务。${failureCount > 0 ? `（有 ${failureCount} 个任务创建失败，请检查控制台日志）` : ''}`,
          timestamp: new Date()
        });
      } else {
        showToastNotification(`成功导入 ${successCount} 个任务`, 'check-circle');
        
        // 添加一条消息显示成功/失败数量
        if (failureCount > 0) {
          addMessage({
            type: 'ai',
            content: `✓ 已导入任务！成功创建了 ${successCount} 个任务，但有 ${failureCount} 个任务创建失败。请检查控制台查看详细错误信息。`,
            timestamp: new Date()
          });
        }
      }
      
      // 确保等待一小段时间后再刷新，让后端有时间处理新创建的任务
      setTimeout(async () => {
        // Refresh the tasks list
        await tasksStore.fetchTasks();
      }, 500);
      
      return { success: true, imported: successCount };
    } else {
      showToastNotification('导入失败，请稍后重试', 'times-circle');
      return { success: false };
    }
  } catch (error) {
    console.error('Bulk import error:', error);
    
    // Handle 409 Conflict specifically
    if (error.response && error.response.status === 409) {
      // Show conflict modal
      conflictingTasks.value = error.response.data.conflicts || [];
      showConflictModal.value = true;
      pendingTasksToImport.value = tasks;
      return { success: false, conflict: true };
    }
    
    showToastNotification('导入失败，请稍后重试', 'times-circle');
    return { success: false, error: error.message };
  }
};

// Helper function to parse estimated duration strings like "2小时" to numeric hours
const parseEstimatedTime = (durationString) => {
  if (!durationString) return 1; // Default 1 hour
  
  // Handle simple numeric values
  if (typeof durationString === 'number') return durationString;
  
  try {
    // Extract numeric value from strings like "2小时", "0.5小时", "30分钟"
    const numericValue = parseFloat(durationString.match(/\d+(\.\d+)?/)[0]);
    
    // Convert to hours
    if (durationString.includes('分钟')) {
      return numericValue / 60;
    } else if (durationString.includes('小时')) {
      return numericValue;
    } else {
      return numericValue; // Default to hours if unit not specified
    }
  } catch (e) {
    console.warn('Could not parse duration:', durationString);
    return 1; // Default 1 hour
  }
};

// Event and task update handlers
const updateEvent = (eventData) => {
  console.log('Event update:', eventData);
  
  if (eventData.action === 'delete') {
    // Show confirmation message
    addMessage({
      type: 'ai',
      content: `已删除事件「${eventData.title}」`,
      timestamp: new Date()
    });
    showToastNotification(`已删除事件`, 'trash');
  } else if (eventData.action === 'edit') {
    // Open edit event modal
    console.log('Editing event:', eventData);
    openEditEventModal(eventData);
  } else if (eventData.action === 'import') {
    // Import single event
    importTasks([eventData]);
  } else if (eventData.action === 'bulk-import') {
    // Bulk import all events
    const allEvents = findEventsInMessages();
    if (allEvents.length > 0) {
      importTasks(allEvents);
    }
  } else {
    // Import event
    addMessage({
      type: 'ai',
      content: `✓ 已将事件「${eventData.title}」添加到您的日程安排！`,
      timestamp: new Date()
    });
  }
};

const updateTask = (taskData) => {
  console.log('Task update:', taskData);
  
  if (taskData.action === 'delete') {
    // Show confirmation message
    addMessage({
      type: 'ai',
      content: `已删除任务「${taskData.title}」`,
      timestamp: new Date()
    });
    showToastNotification(`已删除任务`, 'trash');
  } else if (taskData.action === 'edit') {
    // In a real app, this would open an edit form or redirect to task edit page
    console.log('Editing task:', taskData);
  } else if (taskData.action === 'complete') {
    // Mark task as complete
    addMessage({
      type: 'ai',
      content: `✓ 已将任务「${taskData.title}」标记为完成！`,
      timestamp: new Date()
    });
    showToastNotification(`任务已完成`, 'check-circle');
  } else if (taskData.action === 'import') {
    // Import single task
    importTasks([taskData]);
  } else if (taskData.action === 'bulk-import') {
    // Bulk import all tasks
    if (taskData.tasks && Array.isArray(taskData.tasks)) {
      // If tasks array is provided directly from ResultCards
      importTasks(taskData.tasks);
    } else {
      // Legacy fallback - find all tasks in messages
      const allTasks = findTasksInMessages();
      if (allTasks.length > 0) {
        importTasks(allTasks);
      }
    }
  } else {
    // Import task
    addMessage({
      type: 'ai',
      content: `✓ 已将任务「${taskData.title}」添加到您的待办事项！`,
      timestamp: new Date()
    });
  }
};

const updateHabit = (habitData) => {
  console.log('Habit update:', habitData);
  
  if (habitData.action === 'delete') {
    // Show confirmation message
    addMessage({
      type: 'ai',
      content: `已删除习惯「${habitData.title}」`,
      timestamp: new Date()
    });
    showToastNotification(`已删除习惯`, 'trash');
  } else if (habitData.action === 'edit') {
    // In a real app, this would open an edit form or redirect to habit edit page
    console.log('Editing habit:', habitData);
  } else if (habitData.action === 'import') {
    // 导入单个习惯
    importHabits([habitData]);
  } else if (habitData.action === 'bulk-import') {
    // 批量导入所有习惯
    const allHabits = findHabitsInMessages();
    if (allHabits.length > 0) {
      importHabits(allHabits);
    }
  } else {
    // Import habit
    addMessage({
      type: 'ai',
      content: `✓ 已将习惯「${habitData.title}」添加到您的习惯追踪！从今天开始，我会帮您记录这个习惯的养成进度。`,
      timestamp: new Date()
    });
  }
};

// Helper to find all tasks in messages
const findTasksInMessages = () => {
  const tasks = [];
  messages.value.forEach(message => {
    if (message.cards && message.cards.tasks) {
      tasks.push(...message.cards.tasks);
    }
  });
  return tasks;
};

// Helper to find all events in messages
const findEventsInMessages = () => {
  const events = [];
  messages.value.forEach(message => {
    if (message.cards && message.cards.events) {
      events.push(...message.cards.events);
    }
  });
  return events;
};

// Voice input toggling
const toggleVoiceInput = () => {
  isRecording.value = !isRecording.value;
  
  if (isRecording.value) {
    // Start recording
    // In a real app, this would use the Web Audio API
    console.log('Started recording');
    
    // For demo, automatically stop after 3 seconds
    setTimeout(() => {
      isRecording.value = false;
      
      // Simulate voice input
      userInput.value = '提醒我明天下午三点参加项目会议';
    }, 3000);
  } else {
    // Stop recording
    console.log('Stopped recording');
  }
};

// 检查后端服务状态
const checkServiceStatus = async () => {
  try {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';
    const response = await fetch(`${API_BASE_URL}/task-analysis/status`);
    
    if (!response.ok) {
      console.warn('任务分析服务状态检查失败');
      return;
    }
    
    const status = await response.json();
    
    if (!status.available) {
      addMessage({
        type: 'ai',
        content: '注意：AI分析服务当前可能不稳定，如果分析失败，请稍后再试。',
        timestamp: new Date()
      });
    }
  } catch (error) {
    console.warn('无法检查服务状态:', error);
  }
};

// 预加载任务和任务组数据
const loadTasksData = async () => {
  try {
    console.log('正在预加载任务数据...');
    await tasksStore.fetchTaskGroups();
    await tasksStore.fetchTasks();
    console.log('任务数据加载完成，任务组数量:', tasksStore.taskGroups.length);
  } catch (error) {
    console.error('加载任务数据失败:', error);
  }
};

const messageTime = () => {
  // 显示当前需要使用formatDate函数的代码
  console.log("使用formatDate函数处理日期格式化");
  
  // 示例：格式化一个日期
  const sampleDate = new Date();
  const formatted = formatDate(sampleDate);
  console.log("日期格式化示例:", formatted);
};

// 实现习惯导入功能
const importHabits = async (habits) => {
  try {
    // Prepare API endpoint and request config
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';
    const config = {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      }
    };
    
    // Track success and failures
    let successCount = 0;
    let failureCount = 0;
    
    // Process each habit
    for (const habit of habits) {
      try {
        // 将AI分析的习惯数据转换为API需要的格式
        const habitData = {
          name: habit.title || '未命名习惯',
          description: habit.description || '',
          frequency: habit.frequency || 'daily',
          // 根据频率描述设置数字频率
          frequencyCount: habit.frequency?.includes('每周') ? 7 : 
                          habit.frequency?.includes('每月') ? 30 : 1,
          timeOfDay: habit.timeOfDay || habit.schedule || '任意时间',
          icon: getHabitIcon(habit),
          color: getHabitColor(habit),
          // 将习惯计划步骤转换为标签
          tags: habit.plan?.steps.map(step => step.substring(0, 20)) || []
        };
        
        console.log('正在创建习惯:', habitData);
        
        // 发送创建习惯的请求
        const response = await axios.post(`${API_BASE_URL}/habits`, habitData, config);
        console.log('习惯创建响应:', response.data);
        
        if (response.data.success) {
          successCount++;
        } else {
          failureCount++;
          console.error('习惯创建失败:', response.data);
        }
      } catch (err) {
        failureCount++;
        console.error('习惯创建错误:', err);
        
        // 详细记录错误信息
        if (err.response) {
          console.error('习惯创建失败 - 状态:', err.response.status);
          console.error('习惯创建失败 - 详情:', err.response.data);
        }
      }
    }
    
    // 显示成功/失败的提示信息
    if (successCount > 0) {
      showToastNotification(`成功导入 ${successCount} 个习惯`, 'check-circle');
      
      // 添加成功消息
      if (habits.length > 1) {
        addMessage({
          type: 'ai',
          content: `✓ 已成功导入习惯！成功创建了 ${successCount} 个习惯${failureCount > 0 ? `，但有 ${failureCount} 个习惯创建失败` : ''}。您现在可以在习惯视图中查看和管理这些习惯。`,
          timestamp: new Date()
        });
      } else {
        addMessage({
          type: 'ai',
          content: `✓ 已将习惯「${habits[0].title}」添加到您的习惯追踪！您可以在习惯视图中查看和管理。`,
          timestamp: new Date()
        });
      }
      
      return { success: true, imported: successCount };
    } else {
      showToastNotification('导入失败，请稍后重试', 'times-circle');
      
      // 添加失败消息
      addMessage({
        type: 'ai',
        content: `导入习惯失败，请稍后再试。`,
        timestamp: new Date()
      });
      
      return { success: false };
    }
  } catch (error) {
    console.error('习惯批量导入错误:', error);
    showToastNotification('导入失败，请稍后重试', 'times-circle');
    return { success: false, error: error.message };
  }
};

// 为习惯选择合适的图标
const getHabitIcon = (habit) => {
  if (!habit) return 'star';
  
  const title = (habit.title || '').toLowerCase();
  const description = (habit.description || '').toLowerCase();
  
  if (title.includes('阅读') || description.includes('阅读') || title.includes('读书')) 
    return 'book';
  if (title.includes('锻炼') || title.includes('健身') || title.includes('运动'))
    return 'dumbbell';
  if (title.includes('冥想') || title.includes('放松'))
    return 'spa';
  if (title.includes('学习') || title.includes('教育') || title.includes('课程'))
    return 'graduation-cap';
  if (title.includes('写作') || title.includes('日记'))
    return 'pen';
  if (title.includes('喝水'))
    return 'tint';
  if (title.includes('吃') || title.includes('饮食'))
    return 'utensils';
  if (title.includes('睡觉') || title.includes('睡眠'))
    return 'bed';
    
  // 默认图标
  return 'star';
};

// 为习惯选择合适的颜色
const getHabitColor = (habit) => {
  if (!habit) return '#4a69bd';
  
  const title = (habit.title || '').toLowerCase();
  
  if (title.includes('阅读') || title.includes('读书'))
    return '#8e44ad'; // 紫色
  if (title.includes('锻炼') || title.includes('健身') || title.includes('运动'))
    return '#e74c3c'; // 红色
  if (title.includes('冥想') || title.includes('放松'))
    return '#3498db'; // 蓝色
  if (title.includes('学习') || title.includes('教育'))
    return '#f39c12'; // 橙色
  if (title.includes('写作') || title.includes('日记'))
    return '#1abc9c'; // 绿松石色
    
  // 默认颜色
  return '#4a69bd'; // 蓝色
};

// Helper to find all habits in messages
const findHabitsInMessages = () => {
  const habits = [];
  messages.value.forEach(message => {
    if (message.cards && message.cards.habits) {
      habits.push(...message.cards.habits);
    }
  });
  return habits;
};
</script>

<style scoped>
.ai-assistant-container {
  display: flex;
  flex-direction: column;
  height: calc(100vh - var(--header-height) - var(--nav-height));
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 0 12px 16px;
  scroll-behavior: smooth;
}

.message {
  display: flex;
  margin-bottom: 16px;
  animation: fadeIn 0.3s ease forwards;
}

.message.user {
  flex-direction: row-reverse;
}

.message-avatar {
  width: 36px;
  height: 36px;
  border-radius: 18px;
  margin: 0 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.ai-avatar {
  background-color: var(--app-primary);
  color: white;
  width: 36px;
  height: 36px;
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.user-avatar {
  background-color: var(--app-secondary);
  color: white;
  width: 36px;
  height: 36px;
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.message-content {
  max-width: 80%;
}

.ai .message-content {
  background-color: white;
  border-radius: 18px 18px 18px 4px;
  padding: 12px 16px;
  box-shadow: var(--app-shadow);
}

.user .message-content {
  background-color: var(--app-primary);
  color: white;
  border-radius: 18px 18px 4px 18px;
  padding: 12px 16px;
  margin-right: 8px;
}

.message-text {
  font-size: 15px;
  line-height: 1.4;
}

.message-time {
  text-align: right;
  font-size: 12px;
  color: var(--app-gray);
  margin-top: 4px;
}

/* Toast notification */
.toast-notification {
  position: fixed;
  bottom: 80px;
  left: 50%;
  transform: translateX(-50%) translateY(20px);
  background-color: rgba(0, 0, 0, 0.75);
  color: white;
  padding: 10px 16px;
  border-radius: 6px;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
  opacity: 0;
  visibility: hidden;
  transition: all 0.3s ease;
  z-index: 999;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  max-width: 80%;
  text-align: center;
}

.toast-notification.visible {
  opacity: 1;
  visibility: visible;
  transform: translateX(-50%) translateY(0);
}

.toast-icon {
  color: #4caf50;
}

.toast-icon.times-circle {
  color: #f44336;
}

.toast-icon.trash {
  color: #ff9800;
}

/* Form Error */
.form-error {
  color: #f44336;
  font-size: 14px;
  margin-top: 8px;
  margin-bottom: 8px;
  text-align: center;
}

/* Typing indicator */
.typing-indicator {
  display: flex;
  align-items: center;
  padding: 8px 4px;
}

.typing-indicator span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: var(--app-gray);
  margin: 0 2px;
  animation: bounce 1s infinite;
}

.typing-indicator span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-indicator span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes bounce {
  0%, 60%, 100% {
    transform: translateY(0);
  }
  30% {
    transform: translateY(-5px);
  }
}

/* Conflict modal */
.conflict-modal-content {
  display: flex;
  flex-direction: column;
  padding: 0 8px;
}

.conflict-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  margin-bottom: 12px;
}

.conflict-icon {
  color: #ff9800;
}

.conflict-list {
  background-color: rgba(0, 0, 0, 0.03);
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 16px;
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.conflict-item {
  padding: 8px 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.conflict-item:last-child {
  border-bottom: none;
}

.conflict-task-name {
  font-weight: 600;
  margin-bottom: 4px;
}

.conflict-time {
  font-size: 13px;
  color: var(--app-gray);
  display: flex;
  align-items: center;
  gap: 6px;
}

.conflict-time-icon {
  font-size: 12px;
}

.conflict-question {
  text-align: center;
  font-weight: 500;
  margin-bottom: 0;
}

/* Input area */
.input-container {
  padding: 12px;
  background-color: var(--app-light);
  border-top: 1px solid var(--app-border);
}

.input-area {
  display: flex;
  background-color: white;
  border-radius: 24px;
  padding: 8px 14px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
}

.message-input {
  flex: 1;
  border: none;
  outline: none;
  padding: 8px 0;
  resize: none;
  max-height: 120px;
  font-size: 16px;
  font-family: inherit;
}

.input-actions {
  display: flex;
  align-items: center;
}

.voice-btn, .send-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  color: var(--app-gray);
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.voice-btn:hover, .send-btn:hover {
  background-color: var(--app-light);
}

.voice-btn.recording {
  color: var(--app-danger);
  animation: pulse 1s infinite;
}

.send-btn {
  color: var(--app-primary);
}

.send-btn:disabled {
  opacity: 0.5;
  cursor: default;
}

@keyframes pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
  }
}

.voice-assistant-info {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: var(--app-gray);
  margin-top: 8px;
}

.voice-info-icon {
  margin-right: 4px;
}

/* Edit Event Form Styles */
:deep(.el-form-item) {
  margin-bottom: 16px;
}

:deep(.el-form-item__label) {
  font-weight: 500;
  padding: 0 0 8px;
  line-height: 1;
  font-size: 14px;
}

:deep(.el-input__inner) {
  font-size: 15px;
}

:deep(.el-textarea__inner) {
  font-size: 15px;
}

:deep(.el-select .el-input .el-select__caret) {
  color: var(--app-gray);
}

:deep(.el-date-editor.el-input) {
  width: 100%;
}

:deep(.el-select-dropdown__item) {
  font-size: 14px;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style> 