<template>
  <div class="feedback-display">
    <div v-if="loading" class="loading-container">
      <div class="spinner"></div>
      <p class="loading-text">正在生成反馈，请稍候...</p>
    </div>

    <div v-else-if="error" class="error-container">
      <font-awesome-icon icon="exclamation-circle" class="error-icon" />
      <p class="error-message">{{ error }}</p>
      <button class="btn-retry" @click="$emit('retry')">
        重试
        <font-awesome-icon icon="redo" class="btn-icon" />
      </button>
    </div>

    <div v-else-if="feedback" class="feedback-content">
      <div class="feedback-header">
        <h3 class="feedback-title">生成的反馈内容</h3>
        <div v-if="mockMode" class="mock-badge" title="本地模拟数据">模拟</div>
      </div>
      
      <div class="feedback-section encourage">
        <div class="section-header">
          <font-awesome-icon icon="thumbs-up" class="section-icon" />
          <h4 class="section-title">鼓励语句</h4>
        </div>
        <p class="feedback-text">{{ feedback.encourage }}</p>
      </div>
      
      <div class="feedback-section criticize">
        <div class="section-header">
          <font-awesome-icon icon="comment" class="section-icon" />
          <h4 class="section-title">批评语句</h4>
        </div>
        <p class="feedback-text">{{ feedback.criticize }}</p>
      </div>

      <div class="feedback-meta" v-if="meta">
        <div class="meta-item">
          <span class="meta-label">处理时间：</span>
          <span class="meta-value">{{ meta.processingTime }}ms</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">总token用量：</span>
          <span class="meta-value">{{ meta.tokenUsage?.total_tokens || 0 }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue';

defineProps({
  loading: {
    type: Boolean,
    default: false
  },
  error: {
    type: String,
    default: ''
  },
  feedback: {
    type: Object,
    default: null
  },
  meta: {
    type: Object,
    default: null
  },
  mockMode: {
    type: Boolean,
    default: false
  }
});

defineEmits(['retry']);
</script>

<style scoped>
.feedback-display {
  padding: 16px;
  border-radius: 8px;
  background-color: #f9f9f9;
  min-height: 200px;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(10, 132, 255, 0.2);
  border-radius: 50%;
  border-top-color: var(--app-primary, #0A84FF);
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-text {
  margin-top: 16px;
  color: #666;
}

.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: #d9534f;
}

.error-icon {
  font-size: 32px;
  margin-bottom: 16px;
}

.error-message {
  text-align: center;
  margin-bottom: 16px;
}

.btn-retry {
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: #f8f9fa;
  border: 1px solid #d9534f;
  color: #d9534f;
  border-radius: 20px;
  padding: 8px 16px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-retry:hover {
  background-color: #d9534f;
  color: white;
}

.feedback-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.feedback-title {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
  color: var(--app-primary, #0A84FF);
}

.mock-badge {
  background-color: #ffc107;
  color: #212529;
  font-size: 12px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 10px;
  cursor: help;
}

.feedback-section {
  margin-bottom: 20px;
  padding: 16px;
  border-radius: 8px;
}

.encourage {
  background-color: rgba(40, 167, 69, 0.1);
  border-left: 4px solid #28a745;
}

.criticize {
  background-color: rgba(255, 193, 7, 0.1);
  border-left: 4px solid #ffc107;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.section-icon {
  color: #666;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  margin: 0;
}

.feedback-text {
  margin: 0;
  line-height: 1.5;
  font-size: 14px;
}

.feedback-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  font-size: 12px;
  color: #888;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #eee;
}

.meta-item {
  display: flex;
  align-items: center;
}

.meta-label {
  font-weight: 600;
  margin-right: 4px;
}

/* Dark mode adaptations */
@media (prefers-color-scheme: dark) {
  .feedback-display {
    background-color: #2C2C2E;
    color: white;
  }
  
  .loading-text {
    color: #AAAAAA;
  }
  
  .encourage {
    background-color: rgba(40, 167, 69, 0.2);
  }
  
  .criticize {
    background-color: rgba(255, 193, 7, 0.2);
  }
  
  .btn-retry {
    background-color: #3A3A3C;
    border-color: #d9534f;
  }
  
  .mock-badge {
    background-color: #6c4a03;
    color: #ffc107;
  }
  
  .feedback-meta {
    border-top-color: #3A3A3C;
    color: #AAAAAA;
  }
}
</style> 