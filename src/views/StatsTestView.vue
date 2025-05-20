<template>
  <BaseLayout title="统计功能测试">
    <div class="test-container">
      <h1>统计模块测试</h1>
      
      <div class="test-section">
        <h2>当前统计数据</h2>
        <div v-if="isLoading" class="loading">
          <font-awesome-icon icon="spinner" spin />
          加载中...
        </div>
        <div v-else class="stats-display">
          <div class="stat-box">
            <div class="stat-label">完成任务数</div>
            <div class="stat-value">{{ stats.completedTasks }}</div>
          </div>
          <div class="stat-box">
            <div class="stat-label">习惯打卡数</div>
            <div class="stat-value">{{ stats.habitCheckins }}</div>
          </div>
          <div class="stat-box">
            <div class="stat-label">专注时间(小时)</div>
            <div class="stat-value">{{ stats.focusTime }}</div>
          </div>
        </div>
        <button @click="refreshStats" class="action-button">
          <font-awesome-icon icon="sync" :spin="isLoading" />
          刷新统计数据
        </button>
      </div>
      
      <div class="test-section">
        <h2>模拟更新事件</h2>
        <div class="actions">
          <button @click="simulateTaskCompletion" class="action-button">
            <font-awesome-icon icon="check" />
            模拟任务完成
          </button>
          <button @click="simulatePomodoroAdded" class="action-button">
            <font-awesome-icon icon="clock" />
            模拟番茄钟会话
          </button>
        </div>
      </div>
      
      <div class="test-section">
        <h2>调试日志</h2>
        <div class="log-container">
          <div v-for="(log, index) in logs" :key="index" class="log-entry">
            <pre :class="{ 'error': log.type === 'error' }">{{ log.message }}</pre>
          </div>
        </div>
      </div>
    </div>
  </BaseLayout>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import BaseLayout from '../components/layout/BaseLayout.vue';
import { statsApi } from '../api';
import eventBus, { EVENTS } from '../utils/eventBus';

// State
const isLoading = ref(false);
const stats = ref({
  completedTasks: 0,
  habitCheckins: 0,
  focusTime: 0
});
const logs = ref([]);

// Add a log entry
const addLog = (message, type = 'info') => {
  logs.value.unshift({
    type,
    message: `[${new Date().toLocaleTimeString()}] ${message}`
  });
  
  // Keep only the latest 50 logs
  if (logs.value.length > 50) {
    logs.value = logs.value.slice(0, 50);
  }
};

// Event handlers
const handleTaskCompleted = (data) => {
  addLog(`收到任务完成事件: 任务ID ${data.taskId}`, 'event');
  refreshStats();
};

const handlePomodoroAdded = (data) => {
  addLog(`收到番茄钟会话事件: 任务ID ${data.taskId}, 时长 ${data.pomodoroData.duration}秒`, 'event');
  refreshStats();
};

// Fetch stats
const refreshStats = async () => {
  isLoading.value = true;
  
  try {
    addLog('获取统计数据...');
    const data = await statsApi.getTodaySummary();
    stats.value = data;
    addLog(`统计数据更新成功: 任务=${data.completedTasks}, 习惯=${data.habitCheckins}, 专注=${data.focusTime}h`);
    
    // 添加更详细的日志
    console.log('===== 统计测试详细调试信息 =====');
    console.log('统计API响应数据:', JSON.stringify(data, null, 2));
    console.log('当前日期:', new Date().toISOString().split('T')[0]);
    console.log('============================');
  } catch (error) {
    addLog(`获取统计数据失败: ${error.message}`, 'error');
    console.error('统计数据获取错误:', error);
  } finally {
    isLoading.value = false;
  }
};

// Simulate events
const simulateTaskCompletion = () => {
  const mockTaskId = '680e83932f138ea792da9b5e'; // 示例任务ID
  const mockTask = {
    _id: mockTaskId,
    name: '示例任务',
    completed: true
  };
  
  addLog(`模拟触发任务完成事件: ${mockTaskId}`);
  eventBus.emit(EVENTS.TASK_COMPLETED, { taskId: mockTaskId, task: mockTask });
};

const simulatePomodoroAdded = () => {
  const mockTaskId = '680e83932f138ea792da9b5e'; // 示例任务ID
  const now = new Date();
  const startTime = new Date(now.getTime() - 25 * 60 * 1000); // 25分钟前
  
  const mockPomodoroData = {
    duration: 25 * 60, // 25分钟
    startTime: startTime.toISOString(),
    endTime: now.toISOString(),
    notes: '已完成番茄钟'
  };
  
  addLog(`模拟触发番茄钟会话事件: ${mockTaskId}, 时长 ${mockPomodoroData.duration}秒`);
  eventBus.emit(EVENTS.POMODORO_ADDED, { 
    taskId: mockTaskId, 
    pomodoroData: mockPomodoroData,
    isCompleted: true
  });
};

// Setup event listeners
onMounted(() => {
  // Register event listeners
  eventBus.on(EVENTS.TASK_COMPLETED, handleTaskCompleted);
  eventBus.on(EVENTS.POMODORO_ADDED, handlePomodoroAdded);
  
  // Initial data fetch
  refreshStats();
  addLog('统计测试视图已加载');
});

// Clean up event listeners
onUnmounted(() => {
  eventBus.off(EVENTS.TASK_COMPLETED, handleTaskCompleted);
  eventBus.off(EVENTS.POMODORO_ADDED, handlePomodoroAdded);
});
</script>

<style scoped>
.test-container {
  padding: 20px;
}

h1 {
  font-size: 24px;
  margin-bottom: 20px;
}

h2 {
  font-size: 18px;
  margin-bottom: 16px;
}

.test-section {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.loading {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 20px 0;
  color: #666;
}

.stats-display {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
}

.stat-box {
  flex: 1;
  background: #f5f7fa;
  padding: 16px;
  border-radius: 8px;
  text-align: center;
}

.stat-label {
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #333;
}

.actions {
  display: flex;
  gap: 12px;
}

.action-button {
  background: #3483FA;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 10px 16px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: background-color 0.2s;
}

.action-button:hover {
  background: #2872e0;
}

.log-container {
  background: #1e1e1e;
  border-radius: 8px;
  padding: 16px;
  height: 300px;
  overflow-y: auto;
  font-family: monospace;
  font-size: 14px;
}

.log-entry {
  margin-bottom: 8px;
}

pre {
  margin: 0;
  color: #ddd;
  white-space: pre-wrap;
}

pre.error {
  color: #ff6b6b;
}

.event {
  color: #4cd964;
}

/* Dark mode adjustments */
@media (prefers-color-scheme: dark) {
  .test-section {
    background-color: #2C2C2E;
  }
  
  .stat-box {
    background: #3A3A3C;
  }
  
  .stat-value {
    color: white;
  }
  
  .stat-label {
    color: #aaa;
  }
}
</style> 