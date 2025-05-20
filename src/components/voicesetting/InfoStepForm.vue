<template>
  <div class="info-step-form">
    <h3 class="form-section-title">填写语音合成信息</h3>
    
    <div class="form-group">
      <label class="form-label">文本提示词</label>
      <textarea 
        class="form-textarea" 
        v-model="localData.textPrompt" 
        placeholder="请输入您希望模仿的说话风格，如'模仿周杰伦说话'"
        @input="updateData"
        rows="3"
      ></textarea>
    </div>
    
    <div class="form-group">
      <label class="form-label">鼓励风格</label>
      <div class="style-options">
        <div 
          v-for="style in encouragementStyles" 
          :key="style.value"
          class="style-option"
          :class="{ 'selected': localData.encouragementStyle === style.value }"
          @click="selectEncouragementStyle(style.value)"
        >
          <div class="style-name">{{ style.label }}</div>
          <div class="style-example">{{ style.example }}</div>
        </div>
      </div>
    </div>
    
    <div class="form-group">
      <label class="form-label">批评风格</label>
      <div class="style-options">
        <div 
          v-for="style in criticismStyles" 
          :key="style.value"
          class="style-option"
          :class="{ 'selected': localData.criticismStyle === style.value }"
          @click="selectCriticismStyle(style.value)"
        >
          <div class="style-name">{{ style.label }}</div>
          <div class="style-example">{{ style.example }}</div>
        </div>
      </div>
    </div>
    
    <div class="form-actions">
      <button 
        class="btn-generate" 
        @click="generateFeedback"
        :disabled="!isFormValid || isLoading"
      >
        <span v-if="isLoading">
          <font-awesome-icon icon="spinner" spin class="btn-icon" />
          生成中...
        </span>
        <span v-else>
          生成反馈
          <font-awesome-icon icon="magic" class="btn-icon" />
        </span>
      </button>
      
      <button 
        class="btn-next" 
        @click="nextStep"
        :disabled="!isFormValid || !feedbackData"
      >
        下一步
        <font-awesome-icon icon="arrow-right" class="btn-icon" />
      </button>
    </div>
    
    <!-- 反馈显示区域 -->
    <feedback-display
      v-if="showFeedback"
      :loading="isLoading"
      :error="error"
      :feedback="feedbackData"
      :meta="feedbackMeta"
      :mock-mode="mockMode"
      @retry="generateFeedback"
    />

    <!-- Add mock mode notification after the feedback display -->
    <div v-if="mockMode && !isLoading && !error" class="mock-mode-alert">
      <font-awesome-icon icon="info-circle" class="info-icon" />
      <p>后端服务器未检测到，当前使用的是本地模拟数据，而非真实API响应。</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { generateFeedback as callGenerateFeedback, checkServerStatus } from '@/api/feedback';
import { isDevelopment } from '@/env';
import FeedbackDisplay from './FeedbackDisplay.vue';

const props = defineProps({
  formData: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['update:formData', 'next-step']);

// Create a local copy of the form data
const localData = ref({
  textPrompt: props.formData.textPrompt || '',
  encouragementStyle: props.formData.encouragementStyle || '',
  criticismStyle: props.formData.criticismStyle || '',
  feedbackData: props.formData.feedbackData || null,
  feedbackId: props.formData.feedbackId || null
});

// Feedback state
const isLoading = ref(false);
const error = ref('');
const feedbackData = ref(null);
const feedbackMeta = ref(null);
const showFeedback = ref(false);

// Add mock mode state
const mockMode = ref(false);

// Sync with props
watch(() => props.formData, (newData) => {
  localData.value = {
    textPrompt: newData.textPrompt || '',
    encouragementStyle: newData.encouragementStyle || '',
    criticismStyle: newData.criticismStyle || '',
    feedbackData: newData.feedbackData || null,
    feedbackId: newData.feedbackId || localData.value.feedbackId || null
  };
  
  // Update the feedback data if it exists in the form data
  if (newData.feedbackData) {
    feedbackData.value = newData.feedbackData;
    showFeedback.value = true;
  }
}, { deep: true });

// Add onMounted hook to check server status
onMounted(async () => {
  if (isDevelopment) {
    const isServerRunning = await checkServerStatus();
    mockMode.value = !isServerRunning;
  }
});

// Encouragement styles - Map to API format
const encouragementStyles = [
  { 
    value: '温和鼓励', 
    label: '温和鼓励', 
    example: '例如：你做得很好，继续加油！' 
  },
  { 
    value: '热情鼓励', 
    label: '热情鼓励', 
    example: '例如：太棒了！你的进步令人惊叹！' 
  },
  { 
    value: '专业鼓励', 
    label: '专业鼓励', 
    example: '例如：你的表现符合专业标准，请保持。' 
  },
  { 
    value: '幽默鼓励', 
    label: '幽默鼓励', 
    example: '例如：哇！简直比超人还厉害！' 
  }
];

// Criticism styles - Map to API format
const criticismStyles = [
  { 
    value: '建设性批评', 
    label: '建设性批评', 
    example: '例如：这个地方可以改进，试试这样做...' 
  },
  { 
    value: '直接批评', 
    label: '直接批评', 
    example: '例如：这里做得不够好，需要重新调整。' 
  },
  { 
    value: '委婉批评', 
    label: '委婉批评', 
    example: '例如：或许我们可以尝试另一种方式？' 
  },
  { 
    value: '教练式批评', 
    label: '教练式批评', 
    example: '例如：思考一下，这样做的结果会怎样？' 
  }
];

// Select encouragement style
const selectEncouragementStyle = (value) => {
  localData.value.encouragementStyle = value;
  updateData();
};

// Select criticism style
const selectCriticismStyle = (value) => {
  localData.value.criticismStyle = value;
  updateData();
};

// Update parent form data
const updateData = () => {
  emit('update:formData', { 
    ...localData.value,
    feedbackData: feedbackData.value 
  });
};

// Form validation
const isFormValid = computed(() => {
  return (
    localData.value.textPrompt.trim() !== '' && 
    localData.value.encouragementStyle !== '' && 
    localData.value.criticismStyle !== ''
  );
});

// Update the generateFeedback function
const generateFeedback = async () => {
  if (!isFormValid.value) return;
  
  isLoading.value = true;
  error.value = '';
  showFeedback.value = true;
  
  try {
    // Check server status, may switch to mock mode
    if (isDevelopment) {
      const isServerRunning = await checkServerStatus();
      mockMode.value = !isServerRunning;
    }
    
    const result = await callGenerateFeedback({
      userInput: localData.value.textPrompt,
      encourageStyle: localData.value.encouragementStyle,
      criticizeStyle: localData.value.criticismStyle
    });
    
    console.log('[InfoStepForm] /api/v1/feedback 返回:', result);
    
    if (result.success) {
      feedbackData.value = result.data;
      feedbackMeta.value = result.meta;
      localData.value.feedbackData = result.data;
      
      // Extract and store the feedback ID from the response
      if (result.data && result.data.id) {
        localData.value.feedbackId = result.data.id;
        console.log('[InfoStepForm] 新 feedbackId:', result.data.id);
        localStorage.setItem('savedVoiceData', JSON.stringify({ feedbackId: result.data.id }));
      } else {
        console.warn('No feedback ID found in the response:', result);
      }
      
      updateData();
      
      // Scroll to the bottom to show the feedback
      setTimeout(() => {
        window.scrollTo({
          top: document.body.scrollHeight,
          behavior: 'smooth'
        });
      }, 100);
    } else {
      error.value = result.message || '生成反馈失败，请重试';
    }
  } catch (err) {
    console.error('Error generating feedback:', err);
    
    // 处理常见错误类型
    if (err.message && err.message.includes('后端服务器未运行')) {
      error.value = '后端服务器未启动，请启动服务器后重试';
    } else if (err.code === 'ECONNABORTED') {
      error.value = '请求超时，请检查网络连接';
    } else if (err.message && err.message.includes('Network Error')) {
      error.value = '网络错误，请检查后端服务器是否正在运行';
    } else {
      error.value = err.response?.data?.message || '网络错误，请检查连接后重试';
    }
  } finally {
    isLoading.value = false;
  }
};

// Next step handler
const nextStep = () => {
  if (isFormValid.value && feedbackData.value) {
    emit('next-step');
  }
};
</script>

<style scoped>
.info-step-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-section-title {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 10px;
  color: var(--app-primary, #0A84FF);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  font-size: 14px;
  font-weight: 500;
}

.form-textarea {
  padding: 12px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  resize: none;
  font-family: inherit;
  transition: border-color 0.3s;
}

.form-textarea:focus {
  outline: none;
  border-color: var(--app-primary, #0A84FF);
}

.style-options {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.style-option {
  padding: 12px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
}

.style-option:hover {
  border-color: var(--app-primary, #0A84FF);
  background-color: rgba(10, 132, 255, 0.05);
}

.style-option.selected {
  border-color: var(--app-primary, #0A84FF);
  background-color: rgba(10, 132, 255, 0.1);
}

.style-name {
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 4px;
}

.style-example {
  font-size: 12px;
  color: #757575;
}

.form-actions {
  display: flex;
  justify-content: space-between;
  margin-top: 10px;
}

.btn-generate, .btn-next {
  display: flex;
  align-items: center;
  gap: 8px;
  border-radius: 20px;
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-generate {
  background-color: #28a745;
  color: white;
  border: none;
}

.btn-generate:hover {
  background-color: rgba(40, 167, 69, 0.8);
}

.btn-next {
  background-color: var(--app-primary, #0A84FF);
  color: white;
  border: none;
}

.btn-next:hover {
  background-color: rgba(10, 132, 255, 0.8);
}

.btn-generate:disabled, .btn-next:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.btn-icon {
  font-size: 12px;
}

/* Dark mode adaptations */
@media (prefers-color-scheme: dark) {
  .form-textarea {
    background-color: #2C2C2E;
    border-color: #3A3A3C;
    color: white;
  }
  
  .style-option {
    background-color: #2C2C2E;
    border-color: #3A3A3C;
    color: white;
  }
  
  .style-example {
    color: #AAAAAA;
  }
  
  .style-option:hover {
    background-color: rgba(255, 255, 255, 0.05);
  }
  
  .style-option.selected {
    background-color: rgba(10, 132, 255, 0.2);
  }
}

/* Add styles for the mock mode alert */
.mock-mode-alert {
  margin-top: 16px;
  padding: 12px;
  background-color: #fff3cd;
  border: 1px solid #ffeeba;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.mock-mode-alert .info-icon {
  color: #856404;
  font-size: 18px;
  flex-shrink: 0;
}

.mock-mode-alert p {
  margin: 0;
  color: #856404;
  font-size: 14px;
}

/* Dark mode adaptations */
@media (prefers-color-scheme: dark) {
  .mock-mode-alert {
    background-color: rgba(255, 243, 205, 0.1);
    border-color: #856404;
  }
  
  .mock-mode-alert p, 
  .mock-mode-alert .info-icon {
    color: #ffc107;
  }
}
</style> 