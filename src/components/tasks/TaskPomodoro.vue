<template>
  <Teleport to="body">
    <Transition name="slide-up">
      <div v-if="modelValue" class="pomodoro-overlay">
        <div class="pomodoro-container">
          <div class="pomodoro-header">
            <div class="pomodoro-title">{{ task.name }}</div>
            <div class="pomodoro-subtitle" v-if="task.groupName">{{ task.groupName }}</div>
            <button class="close-button" @click="closePomodoro">
              <font-awesome-icon icon="times" />
            </button>
          </div>
          
          <div class="pomodoro-timer">
            <div class="timer-circle" :style="{ background: getCircleBackground }">
              <div class="timer-display">{{ formattedTime }}</div>
            </div>
          </div>
          
          <div class="pomodoro-controls">
            <div class="timer-options" v-if="!isActive">
              <button 
                v-for="option in timerOptions" 
                :key="option.value"
                class="time-option-btn"
                :class="{ active: timerDuration === option.value }"
                @click="setTimerDuration(option.value)"
              >
                {{ option.label }}
              </button>
            </div>
            
            <div class="timer-buttons">
              <button 
                v-if="!isActive" 
                class="btn btn-primary control-btn"
                @click="startTimer"
              >
                <font-awesome-icon icon="play" class="btn-icon" />
                开始专注
              </button>
              
              <template v-else>
                <button 
                  v-if="!isPaused" 
                  class="btn btn-secondary control-btn"
                  @click="pauseTimer"
                >
                  <font-awesome-icon icon="pause" class="btn-icon" />
                  暂停
                </button>
                
                <button 
                  v-else
                  class="btn btn-primary control-btn"
                  @click="resumeTimer"
                >
                  <font-awesome-icon icon="play" class="btn-icon" />
                  继续
                </button>
                
                <button 
                  class="btn btn-danger control-btn"
                  @click="stopTimer"
                >
                  <font-awesome-icon icon="stop" class="btn-icon" />
                  结束
                </button>
              </template>
            </div>
          </div>
          
          <!-- 番茄钟会话历史记录 -->
          <div class="pomodoro-history" v-if="showHistory && !isActive">
            <div class="history-header">
              <h3>历史记录</h3>
              <button class="history-toggle" @click="showHistory = false">
                <font-awesome-icon icon="chevron-up" />
              </button>
            </div>
            
            <div v-if="isLoadingHistory" class="history-loading">
              <font-awesome-icon icon="spinner" spin />
              加载中...
            </div>
            
            <div v-else-if="pomodoroHistory.length === 0" class="history-empty">
              暂无番茄钟记录
            </div>
            
            <div v-else class="history-list">
              <div 
                v-for="session in pomodoroHistory" 
                :key="session._id"
                class="history-item"
              >
                <div class="history-item-header">
                  <div class="history-item-date">{{ formatDate(session.startTime) }}</div>
                  <div class="history-item-duration">{{ formatDuration(session.duration) }}</div>
                </div>
                <div class="history-item-notes" v-if="session.notes">
                  {{ session.notes }}
                </div>
              </div>
            </div>
          </div>
          
          <button 
            v-if="!showHistory && !isActive && pomodoroHistory.length > 0" 
            class="history-toggle-btn"
            @click="showHistory = true"
          >
            <font-awesome-icon icon="history" />
            查看历史记录
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, onUnmounted, watch, onMounted } from 'vue';
import { createPomodoroSession, getTaskPomodoroSessions } from '../../api/pomodoro';
import eventBus, { EVENTS } from '../../utils/eventBus';

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true
  },
  task: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['update:modelValue', 'pomodoro-result']);

// Timer options
const timerOptions = [
  { label: '25 分钟', value: 25 * 60 },
  { label: '45 分钟', value: 45 * 60 },
  { label: '60 分钟', value: 60 * 60 }
];

// Timer state
const timerDuration = ref(25 * 60); // Default: 25 minutes
const timeRemaining = ref(timerDuration.value);
const isActive = ref(false);
const isPaused = ref(false);
let timerInterval = null;

// 番茄钟会话记录
const pomodoroHistory = ref([]);
const isLoadingHistory = ref(false);
const showHistory = ref(false);
const sessionStartTime = ref(null);

// Format time as MM:SS
const formattedTime = computed(() => {
  const minutes = Math.floor(timeRemaining.value / 60);
  const seconds = timeRemaining.value % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
});

// Circle progress background
const getCircleBackground = computed(() => {
  const progress = 1 - (timeRemaining.value / timerDuration.value);
  const angle = progress * 360;
  
  if (progress === 0) {
    return 'conic-gradient(#F2F2F7 0deg, #F2F2F7 360deg)';
  }
  
  return `conic-gradient(var(--app-primary) 0deg, var(--app-primary) ${angle}deg, #F2F2F7 ${angle}deg, #F2F2F7 360deg)`;
});

// 加载任务的番茄钟历史记录
const loadPomodoroHistory = async () => {
  if (!props.task || !props.task._id) return;
  
  try {
    isLoadingHistory.value = true;
    const taskId = props.task._id || props.task.id;
    const sessions = await getTaskPomodoroSessions(taskId);
    pomodoroHistory.value = sessions;
  } catch (error) {
    console.error('加载番茄钟历史记录失败:', error);
  } finally {
    isLoadingHistory.value = false;
  }
};

// 格式化日期显示
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleString('zh-CN', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// 格式化持续时间
const formatDuration = (seconds) => {
  const minutes = Math.floor(seconds / 60);
  return `${minutes} 分钟`;
};

// Timer methods
const setTimerDuration = (duration) => {
  timerDuration.value = duration;
  timeRemaining.value = duration;
};

const startTimer = () => {
  isActive.value = true;
  isPaused.value = false;
  sessionStartTime.value = new Date();
  
  timerInterval = setInterval(() => {
    if (timeRemaining.value > 0) {
      timeRemaining.value -= 1;
    } else {
      timerComplete();
    }
  }, 1000);
};

const pauseTimer = () => {
  isPaused.value = true;
  clearInterval(timerInterval);
};

const resumeTimer = () => {
  isPaused.value = false;
  startTimer();
};

// 记录番茄钟会话到服务器
const recordPomodoroSession = async (isCompleted) => {
  if (!props.task || !sessionStartTime.value) return;
  
  try {
    const taskId = props.task._id || props.task.id;
    const endTime = new Date();
    const elapsedSeconds = isCompleted 
      ? timerDuration.value 
      : timerDuration.value - timeRemaining.value;
    
    const sessionData = {
      duration: elapsedSeconds,
      startTime: sessionStartTime.value.toISOString(),
      endTime: endTime.toISOString(),
      notes: isCompleted 
        ? "已完成番茄钟" 
        : `中断，完成了 ${Math.round((elapsedSeconds / timerDuration.value) * 100)}%`
    };
    
    console.log('记录番茄钟会话:', sessionData);
    const response = await createPomodoroSession(taskId, sessionData);
    
    // 触发番茄钟会话添加事件，更新统计数据
    console.log('番茄钟会话已记录，触发统计更新...');
    eventBus.emit(EVENTS.POMODORO_ADDED, { 
      taskId, 
      pomodoroData: { ...sessionData, duration: elapsedSeconds },
      isCompleted
    });
    
    // 重新加载历史记录
    if (!isActive.value) {
      await loadPomodoroHistory();
    }
  } catch (error) {
    console.error('记录番茄钟会话失败:', error);
  }
};

const stopTimer = () => {
  isActive.value = false;
  isPaused.value = false;
  clearInterval(timerInterval);
  
  // 计算完成百分比
  const percentComplete = 1 - (timeRemaining.value / timerDuration.value);
  const isSignificantProgress = percentComplete > 0.25; // More than 25% completed
  
  // 记录番茄钟会话
  if (percentComplete > 0) {
    recordPomodoroSession(false);
  }
  
  // Emit result with interrupted flag
  emit('pomodoro-result', {
    taskId: props.task._id || props.task.id,
    completed: false,
    interrupted: true,
    percentComplete: percentComplete,
    significantProgress: isSignificantProgress
  });
  
  // 重置状态和计时器
  timeRemaining.value = timerDuration.value;
  sessionStartTime.value = null;
  
  // Close the modal after a short delay
  setTimeout(() => {
    emit('update:modelValue', false);
  }, 500);
};

const timerComplete = () => {
  isActive.value = false;
  clearInterval(timerInterval);
  
  // 记录完成的番茄钟会话
  recordPomodoroSession(true);
  
  // 通知和声音提示
  playTimerCompleteSound();
  showNotification();
  
  // Emit result with completed flag
  emit('pomodoro-result', {
    taskId: props.task._id || props.task.id,
    completed: true,
    interrupted: false,
    percentComplete: 1,
    significantProgress: true
  });
  
  // 重置状态
  sessionStartTime.value = null;
  
  // Close the modal after a short delay
  setTimeout(() => {
    emit('update:modelValue', false);
  }, 1500);
};

const playTimerCompleteSound = () => {
  // 在真实应用中，会播放声音
  console.log('Timer complete! Playing sound...');
  
  // 尝试播放声音
  try {
    const audio = new Audio('/sounds/complete.mp3');
    audio.play().catch(err => console.log('无法播放声音', err));
  } catch (e) {
    console.log('声音播放功能不可用');
  }
};

const showNotification = () => {
  // 在真实应用中，会显示浏览器通知
  console.log('Showing notification');
  
  // 尝试显示浏览器通知
  if ('Notification' in window) {
    if (Notification.permission === 'granted') {
      new Notification('番茄钟完成', {
        body: `任务 "${props.task.name}" 的番茄钟时间已完成!`,
        icon: '/favicon.ico'
      });
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission();
    }
  }
};

// Clean up timer when component unmounts
onUnmounted(() => {
  if (timerInterval) {
    clearInterval(timerInterval);
  }
});

// Reset timer when modal is closed
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    // 当模态框打开时，加载历史记录
    loadPomodoroHistory();
  } else if (isActive.value) {
    // 当模态框关闭但计时器仍在运行时
    clearInterval(timerInterval);
    isActive.value = false;
    isPaused.value = false;
    timeRemaining.value = timerDuration.value;
    sessionStartTime.value = null;
  }
});

// Add the closePomodoro method
const closePomodoro = () => {
  if (isActive.value) {
    // If timer is active, consider it as interrupted
    const percentComplete = 1 - (timeRemaining.value / timerDuration.value);
    
    // 如果有显著进度，记录番茄钟会话
    if (percentComplete > 0.05) { // 至少完成了5%
      recordPomodoroSession(false);
    }
    
    emit('pomodoro-result', {
      taskId: props.task._id || props.task.id,
      completed: false,
      interrupted: true,
      percentComplete: percentComplete,
      significantProgress: percentComplete > 0.25
    });
  }
  
  // Clear timer and close modal
  if (timerInterval) {
    clearInterval(timerInterval);
  }
  isActive.value = false;
  timeRemaining.value = timerDuration.value;
  sessionStartTime.value = null;
  emit('update:modelValue', false);
};

// 组件加载时请求通知权限
onMounted(() => {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
});
</script>

<style scoped>
.pomodoro-overlay {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: white;
  border-radius: 24px 24px 0 0;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.1);
  padding: 24px;
  z-index: 100;
  max-width: 430px;
  margin: 0 auto;
}

.pomodoro-header {
  position: relative;
  text-align: center;
  margin-bottom: 24px;
}

.pomodoro-title {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 4px;
}

.pomodoro-subtitle {
  font-size: 14px;
  color: var(--app-gray);
}

.close-button {
  position: absolute;
  top: 0;
  right: 0;
  background: none;
  border: none;
  color: var(--app-gray);
  font-size: 20px;
  cursor: pointer;
}

.pomodoro-timer {
  display: flex;
  justify-content: center;
  margin: 32px 0;
}

.timer-circle {
  width: 200px;
  height: 200px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.timer-circle::after {
  content: '';
  position: absolute;
  width: 90%;
  height: 90%;
  border-radius: 50%;
  background-color: white;
}

.timer-display {
  font-size: 40px;
  font-weight: 700;
  z-index: 1;
}

.pomodoro-controls {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.timer-options {
  display: flex;
  justify-content: center;
  gap: 12px;
}

.time-option-btn {
  padding: 8px 16px;
  border-radius: 20px;
  border: 1px solid var(--app-border);
  background: none;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.time-option-btn.active {
  background-color: var(--app-primary);
  color: white;
  border-color: var(--app-primary);
}

.timer-buttons {
  display: flex;
  justify-content: center;
  gap: 16px;
}

.control-btn {
  min-width: 120px;
}

/* 历史记录样式 */
.pomodoro-history {
  margin-top: 30px;
  border-top: 1px solid var(--app-border);
  padding-top: 16px;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.history-header h3 {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
}

.history-toggle {
  background: none;
  border: none;
  color: var(--app-gray);
  cursor: pointer;
  font-size: 14px;
}

.history-loading,
.history-empty {
  text-align: center;
  color: var(--app-gray);
  padding: 16px 0;
  font-size: 14px;
}

.history-loading {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
}

.history-list {
  max-height: 200px;
  overflow-y: auto;
}

.history-item {
  padding: 12px 0;
  border-bottom: 1px solid var(--app-border);
}

.history-item:last-child {
  border-bottom: none;
}

.history-item-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
}

.history-item-date {
  font-size: 14px;
  font-weight: 500;
}

.history-item-duration {
  font-size: 13px;
  color: var(--app-gray);
}

.history-item-notes {
  font-size: 13px;
  color: var(--app-gray);
  margin-top: 4px;
}

.history-toggle-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  margin-top: 24px;
  padding: 8px;
  background: none;
  border: 1px solid var(--app-border);
  border-radius: 8px;
  color: var(--app-gray);
  font-size: 14px;
  cursor: pointer;
}

/* Dark mode adjustments */
@media (prefers-color-scheme: dark) {
  .pomodoro-overlay {
    background-color: #2C2C2E;
    color: white;
  }
  
  .timer-circle::after {
    background-color: #2C2C2E;
  }
  
  .time-option-btn {
    color: white;
    border-color: #3A3A3C;
  }
  
  .pomodoro-history {
    border-color: #3A3A3C;
  }
  
  .history-item {
    border-color: #3A3A3C;
  }
  
  .history-toggle-btn {
    border-color: #3A3A3C;
    color: #A9A9A9;
  }
}

/* Desktop adjustments */
@media (min-width: 768px) {
  .pomodoro-overlay {
    position: fixed;
    bottom: auto;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    border-radius: 24px;
    width: 450px;
    max-width: 90vw;
  }
}
</style> 