<template>
  <div class="pomodoro-history-container">
    <div class="history-header">
      <h3>{{ task.name }} 的番茄钟记录</h3>
      <button class="close-button" @click="$emit('close')">
        <font-awesome-icon icon="times" />
      </button>
    </div>
    
    <div v-if="isLoading" class="history-loading">
      <font-awesome-icon icon="spinner" spin />
      <span>加载中...</span>
    </div>
    
    <div v-else-if="sessions.length === 0" class="history-empty">
      <div class="empty-icon"><font-awesome-icon icon="clock" /></div>
      <p>暂无番茄钟记录</p>
    </div>
    
    <div v-else class="history-list">
      <div 
        v-for="session in sessions" 
        :key="session._id"
        class="history-item"
      >
        <div class="history-item-header">
          <div class="history-item-date">{{ formatDate(session.startTime) }}</div>
          <div class="history-actions">
            <button class="action-btn delete-btn" @click="confirmDelete(session)">
              <font-awesome-icon icon="trash-alt" />
            </button>
          </div>
        </div>
        
        <div class="history-item-details">
          <div class="detail-item">
            <span class="detail-label">持续时间:</span>
            <span class="detail-value">{{ formatDuration(session.duration) }}</span>
          </div>
          
          <div class="detail-item" v-if="session.notes">
            <span class="detail-label">备注:</span>
            <span class="detail-value">{{ session.notes }}</span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 删除确认弹窗 -->
    <div class="confirm-delete-modal" v-if="showDeleteConfirm">
      <div class="modal-content">
        <h4>确认删除</h4>
        <p>您确定要删除这条番茄钟记录吗？此操作无法撤销。</p>
        <div class="modal-actions">
          <button class="btn-cancel" @click="showDeleteConfirm = false">取消</button>
          <button class="btn-delete" @click="deleteSession">删除</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { getTaskPomodoroSessions, deletePomodoroSession } from '../../api/pomodoro';

const props = defineProps({
  task: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['close', 'session-deleted']);

const sessions = ref([]);
const isLoading = ref(true);
const showDeleteConfirm = ref(false);
const sessionToDelete = ref(null);

// 加载任务的番茄钟历史记录
const loadSessions = async () => {
  if (!props.task || !props.task._id) return;
  
  try {
    isLoading.value = true;
    const taskId = props.task._id || props.task.id;
    const data = await getTaskPomodoroSessions(taskId);
    sessions.value = data;
  } catch (error) {
    console.error('加载番茄钟历史记录失败:', error);
  } finally {
    isLoading.value = false;
  }
};

// 格式化日期显示
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// 格式化持续时间
const formatDuration = (seconds) => {
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    const remainingMinutes = minutes % 60;
    return `${hours}小时${remainingMinutes > 0 ? ` ${remainingMinutes}分钟` : ''}`;
  }
  
  return `${minutes}分钟`;
};

// 确认删除
const confirmDelete = (session) => {
  sessionToDelete.value = session;
  showDeleteConfirm.value = true;
};

// 删除会话
const deleteSession = async () => {
  if (!sessionToDelete.value) return;
  
  try {
    const taskId = props.task._id || props.task.id;
    await deletePomodoroSession(taskId, sessionToDelete.value._id);
    
    // 从列表中移除已删除的会话
    sessions.value = sessions.value.filter(s => s._id !== sessionToDelete.value._id);
    
    // 通知父组件会话已被删除
    emit('session-deleted', sessionToDelete.value._id);
    
    // 关闭确认框
    showDeleteConfirm.value = false;
    sessionToDelete.value = null;
  } catch (error) {
    console.error('删除番茄钟会话失败:', error);
    alert('删除失败: ' + (error.message || '未知错误'));
  }
};

// 组件挂载时加载数据
onMounted(() => {
  loadSessions();
});
</script>

<style scoped>
.pomodoro-history-container {
  position: relative;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  padding: 20px;
  width: 100%;
  max-width: 500px;
  margin: 0 auto;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--app-border);
}

.history-header h3 {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
}

.close-button {
  background: none;
  border: none;
  color: var(--app-gray);
  font-size: 18px;
  cursor: pointer;
}

.history-loading {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  padding: 30px 0;
  color: var(--app-gray);
}

.history-empty {
  text-align: center;
  padding: 40px 0;
  color: var(--app-gray);
}

.empty-icon {
  font-size: 36px;
  margin-bottom: 12px;
  opacity: 0.5;
}

.history-list {
  max-height: 400px;
  overflow-y: auto;
}

.history-item {
  background-color: var(--app-light);
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 10px;
}

.history-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.history-item-date {
  font-weight: 500;
  font-size: 15px;
}

.history-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  background: none;
  border: none;
  padding: 4px;
  cursor: pointer;
  border-radius: 4px;
  font-size: 14px;
}

.delete-btn {
  color: #f44336;
}

.delete-btn:hover {
  background-color: rgba(244, 67, 54, 0.1);
}

.history-item-details {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.detail-item {
  display: flex;
  font-size: 14px;
}

.detail-label {
  color: var(--app-gray);
  margin-right: 8px;
  min-width: 70px;
}

.detail-value {
  color: var(--text-color);
}

/* 删除确认弹窗 */
.confirm-delete-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background-color: white;
  border-radius: 8px;
  padding: 20px;
  width: 300px;
  max-width: 90%;
}

.modal-content h4 {
  margin-top: 0;
  margin-bottom: 10px;
  font-size: 18px;
}

.modal-content p {
  margin-bottom: 20px;
  color: var(--app-gray);
  font-size: 14px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.btn-cancel {
  background-color: transparent;
  border: 1px solid var(--app-border);
  color: var(--text-color);
  padding: 6px 14px;
  border-radius: 4px;
  cursor: pointer;
}

.btn-delete {
  background-color: #f44336;
  border: none;
  color: white;
  padding: 6px 14px;
  border-radius: 4px;
  cursor: pointer;
}

/* Dark mode adjustments */
@media (prefers-color-scheme: dark) {
  .pomodoro-history-container {
    background-color: #2C2C2E;
    color: white;
  }
  
  .history-item {
    background-color: #3A3A3C;
  }
  
  .modal-content {
    background-color: #2C2C2E;
    color: white;
  }
  
  .btn-cancel {
    border-color: #4A4A4C;
    color: white;
  }
  
  .detail-value {
    color: #E5E5EA;
  }
}
</style> 