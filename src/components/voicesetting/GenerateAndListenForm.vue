<template>
  <div class="generate-listen-form">
    <h3 class="form-section-title">语音生成与试听</h3>
    <p class="form-description">生成个性化语音并试听效果</p>
    
    <div class="summary-section">
      <h4 class="summary-title">配置信息</h4>
      
      <div class="summary-item">
        <div class="summary-label">文本提示词</div>
        <div class="summary-value">{{ formData.textPrompt }}</div>
      </div>
      
      <div class="summary-item">
        <div class="summary-label">鼓励风格</div>
        <div class="summary-value">{{ getEncouragementLabel(formData.encouragementStyle) }}</div>
      </div>
      
      <div class="summary-item">
        <div class="summary-label">批评风格</div>
        <div class="summary-value">{{ getCriticismLabel(formData.criticismStyle) }}</div>
      </div>
      
      <div v-if="formData.audioFile && formData.audioFile.name" class="summary-item">
        <div class="summary-label">上传的音频</div>
        <div class="summary-value">{{ formData.audioFile.name }}</div>
      </div>
    </div>
    
    <div v-if="formData.error" class="error-message">
      <font-awesome-icon icon="exclamation-circle" class="error-icon" />
      <span>处理出错: {{ formData.error }}</span>
    </div>
    
    <div class="generate-section" v-if="!isVoiceReady">
      <div class="generate-info" v-if="formData.processingStatus === ''">
        <font-awesome-icon icon="info-circle" class="info-icon" />
        <span>语音处理将在上传后自动开始</span>
      </div>
      
      <div class="progress-indicator" v-else-if="isProcessing">
        <div class="progress-steps">
          <div 
            class="progress-step" 
            :class="{ 
              'active': progressStage >= 1,
              'completed': progressStage > 1
            }"
          >
            <div class="progress-icon">
              <font-awesome-icon v-if="progressStage > 1" icon="check" />
              <span v-else>1</span>
            </div>
            <div class="progress-label">音频上传</div>
          </div>
          
          <div class="progress-step-line"></div>
          
          <div 
            class="progress-step" 
            :class="{ 
              'active': progressStage >= 2,
              'completed': progressStage > 2
            }"
          >
            <div class="progress-icon">
              <font-awesome-icon v-if="progressStage > 2" icon="check" />
              <span v-else>2</span>
            </div>
            <div class="progress-label">音色克隆</div>
          </div>
          
          <div class="progress-step-line"></div>
          
          <div 
            class="progress-step" 
            :class="{ 
              'active': progressStage >= 3,
              'completed': progressStage > 3
            }"
          >
            <div class="progress-icon">
              <font-awesome-icon v-if="progressStage > 3" icon="check" />
              <span v-else>3</span>
            </div>
            <div class="progress-label">语音合成</div>
          </div>
        </div>
        
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: progressPercentage + '%' }"></div>
        </div>
        
        <div class="progress-status">{{ progressStatus }}</div>
        
        <div class="loading-animation" v-if="formData.processingStatus === 'synthesizing'">
          <div class="loading-dot"></div>
          <div class="loading-dot"></div>
          <div class="loading-dot"></div>
        </div>
      </div>
      
      <div v-if="formData.processingStatus === 'error'" class="retry-section">
      <button 
          class="retry-btn" 
          @click="$emit('prev-step')"
      >
          <font-awesome-icon icon="arrow-left" class="btn-icon" />
          返回重试
      </button>
      </div>
    </div>
    
    <div class="listen-section" v-else>
      <div class="generation-success">
        <font-awesome-icon icon="check-circle" class="success-icon" />
        <span>个性化语音生成成功！</span>
      </div>
      
      <div class="audio-player">
        <div class="player-row">
          <button class="play-btn" @click="togglePlayback">
            <font-awesome-icon :icon="isPlaying ? 'pause' : 'play'" />
          </button>
          
          <div class="player-timeline">
            <div class="timeline-progress" :style="{ width: playbackPercentage + '%' }"></div>
          </div>
          
          <div class="player-time">{{ formatTime(currentTime) }} / {{ formatTime(duration) }}</div>
        </div>
        
        <audio 
          ref="audioPlayer" 
          @timeupdate="updatePlaybackTime"
          @loadedmetadata="onAudioLoaded"
          @ended="onAudioEnded"
        >
          <source :src="formData.generatedAudio" type="audio/mpeg">
          您的浏览器不支持音频播放器
        </audio>
      </div>
      
      <div class="download-section">
        <button class="download-btn" @click="saveVoice">
          <font-awesome-icon icon="save" class="btn-icon" />
          保存音频
        </button>
      </div>
    </div>
    
    <div class="form-actions">
      <button 
        class="btn-back" 
        @click="$emit('prev-step')"
        v-if="!isProcessing || formData.processingStatus === 'error'"
      >
        <font-awesome-icon icon="arrow-left" class="btn-icon" />
        上一步
      </button>
      
      <button 
        class="btn-done" 
        @click="$emit('finish')"
        v-if="isVoiceReady"
      >
        完成
        <font-awesome-icon icon="check" class="btn-icon" />
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import { synthesizeVoice, getCosyVoiceByVoiceId, processFull } from '@/api/cosyVoice';
import { getCurrentUser } from '@/api/auth';

const props = defineProps({
  formData: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['update:formData', 'finish', 'prev-step']);

// Audio player references
const audioPlayer = ref(null);

// Playback state
const isPlaying = ref(false);
const currentTime = ref(0);
const duration = ref(0);
const playbackPercentage = computed(() => {
  if (duration.value === 0) return 0;
  return (currentTime.value / duration.value) * 100;
});

// Processing state tracking
const isProcessing = computed(() => {
  const status = props.formData.processingStatus;
  return status === 'uploading' || status === 'cloning' || status === 'cloned';
});

const isVoiceReady = computed(() => {
  return props.formData.processingStatus === 'synthesized' && props.formData.generatedAudio;
});

// Progress tracking
const progressStage = computed(() => {
  const status = props.formData.processingStatus;
  if (status === 'uploading') return 1;
  if (status === 'cloning') return 2;
  if (status === 'cloned') return 2;
  if (status === 'synthesized') return 3;
  return 0;
});

const progressStatus = computed(() => {
  const status = props.formData.processingStatus;
  if (status === 'uploading') return '正在上传音频...';
  if (status === 'cloning') return '正在克隆音色...';
  if (status === 'cloned') return '克隆完成，准备合成...';
  if (status === 'synthesized') return '语音合成完成';
  if (status === 'error') return '处理失败';
  return '准备中...';
});

const progressPercentage = computed(() => {
  const status = props.formData.processingStatus;
  if (status === 'uploading') return 33;
  if (status === 'cloning') return 66;
  if (status === 'cloned') return 66;
  if (status === 'synthesized') return 100;
  if (status === 'error') return 0;
  return 0;
});

// Watch for voice ID and processing status changes
watch(() => props.formData.voiceId, async (newVoiceId, oldVoiceId) => {
  if (newVoiceId && props.formData.processingStatus === 'cloned') {
    // If we have a voice ID and status is 'cloned', trigger synthesis
    try {
      emit('update:formData', { 
        ...props.formData,
        processingStatus: 'synthesizing' 
      });
      if (synthesizeVoice) {
        console.log('[GenerateAndListenForm] 合成语音时用的 feedbackId:', props.formData.feedbackId);
        const synthResult = await synthesizeVoice(newVoiceId, props.formData.feedbackId);
        console.log('[GenerateAndListenForm] /api/v1/cosyvoice/synthesize 返回:', synthResult);
        // Check status after triggering synthesis
        const cosyVoice = await getCosyVoiceByVoiceId(newVoiceId);
        console.log('[GenerateAndListenForm] /api/v1/cosyvoice/voice/:voiceId 返回:', cosyVoice);
        emit('update:formData', {
          ...props.formData,
          processingStatus: cosyVoice.status,
          generatedAudio: cosyVoice.synthesized_audio_url || null,
          error: cosyVoice.error || null
        });
      } else {
        console.error('synthesizeVoice function is not available');
        emit('update:formData', {
          ...props.formData,
          processingStatus: 'error',
          error: 'API functions not available'
        });
      }
    } catch (error) {
      console.error('Error during voice synthesis:', error);
      
      // Provide more detailed error messages based on error type
      let errorMessage = 'Failed to synthesize voice';
      
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        const status = error.response.status;
        
        if (status === 404) {
          errorMessage = 'Voice synthesis API endpoint not found. Please check server configuration.';
        } else if (status === 400) {
          errorMessage = 'Invalid voice synthesis request. Voice ID or feedback ID may be incorrect.';
        } else if (status === 401 || status === 403) {
          errorMessage = 'Authentication error during voice synthesis. Please log in again.';
        } else {
          errorMessage = `Server error during synthesis (${status}): ${error.response.data?.message || error.message}`;
        }
      } else if (error.request) {
        // The request was made but no response was received
        errorMessage = 'No response from server during synthesis. Please check your internet connection.';
      } else {
        // Something happened in setting up the request that triggered an Error
        errorMessage = error.message || errorMessage;
      }
      
      emit('update:formData', {
        ...props.formData,
        processingStatus: 'error',
        error: errorMessage
      });
    }
  }
});

// Audio helpers and utility functions
const getEncouragementLabel = (style) => {
  const styles = {
    gentle: '温和鼓励',
    energetic: '激励积极',
    mindful: '正念平和',
    professional: '专业指导'
  };
  return styles[style] || style;
};

const getCriticismLabel = (style) => {
  const styles = {
    constructive: '建设性批评',
    direct: '直接诚恳',
    supportive: '支持性批评',
    analytical: '分析性批评'
  };
  return styles[style] || style;
};

// Audio playback functions
const togglePlayback = () => {
  if (!audioPlayer.value) return;
  
  if (isPlaying.value) {
    audioPlayer.value.pause();
    isPlaying.value = false;
  } else {
    audioPlayer.value.play()
      .then(() => {
        isPlaying.value = true;
      })
      .catch(err => {
        console.error('Error playing audio:', err);
      });
  }
};

const updatePlaybackTime = () => {
  if (audioPlayer.value) {
    currentTime.value = audioPlayer.value.currentTime;
  }
};

const onAudioLoaded = () => {
  if (audioPlayer.value) {
    duration.value = audioPlayer.value.duration;
  }
};

const onAudioEnded = () => {
  isPlaying.value = false;
  currentTime.value = 0;
  
  if (audioPlayer.value) {
    audioPlayer.value.currentTime = 0;
  }
};

// Format time for the audio player (mm:ss)
const formatTime = (timeInSeconds) => {
  if (isNaN(timeInSeconds)) return '00:00';
  
  const minutes = Math.floor(timeInSeconds / 60);
  const seconds = Math.floor(timeInSeconds % 60);
  
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

// Replace downloadAudio with saveVoice
const saveVoice = () => {
  if (!props.formData.generatedAudio) return;
  console.log('Saving voice ID:', props.formData.voiceId);
  // Store the voice ID in localStorage for future reference
  if (props.formData.voiceId && props.formData.feedbackId) {
    const voiceData = {
      voiceId: props.formData.voiceId,
      feedbackId: props.formData.feedbackId,
      timestamp: Date.now()
    };
    localStorage.setItem('savedVoiceData', JSON.stringify(voiceData));
    // 新增：每次保存语音时，确保 feedbackId 也被单独写入
    localStorage.setItem('savedVoiceData', JSON.stringify({ feedbackId: props.formData.feedbackId }));
    // Show a success notification
    alert('音频已保存，将用于任务提醒');
    // Close the modal
    emit('finish');
  } else {
    console.error('Missing voiceId or feedbackId:', props.formData);
    alert('保存失败，缺少必要的语音信息');
  }
};

// Clean up on component destruction
onBeforeUnmount(() => {
  if (audioPlayer.value) {
    audioPlayer.value.pause();
    audioPlayer.value.src = '';
  }
});

// When the component is mounted, preload the audio if available
onMounted(() => {
  const user = getCurrentUser();
  if (user && (user.voice_verify === true || user.voice_verify === 'true')) {
    handleProcessFull();
  }
  if (props.formData.generatedAudio && audioPlayer.value) {
    audioPlayer.value.load();
  }
});

// 删除 processFullRequest，改为如下用法：
async function handleProcessFull() {
  // 这里假设 formData 结构和参数一致
  const res = await processFull({
    text_prompt: props.formData.textPrompt,
    audio_url: props.formData.uploadedFileUrl || props.formData.audioUrl,
    feedback_id: props.formData.feedbackId
  });
  // 你可以根据需要处理 res，例如：
  // emit('update:formData', { ...props.formData, ...res.data });
}
</script>

<style scoped>
.generate-listen-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-section-title {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 5px;
  color: var(--app-primary, #0A84FF);
}

.form-description {
  font-size: 14px;
  color: var(--app-text-secondary, #8E8E93);
  margin: 0 0 10px;
}

.summary-section {
  background-color: var(--app-background-secondary, #F2F2F7);
  border-radius: 8px;
  padding: 15px;
}

.summary-title {
  font-size: 14px;
  font-weight: 600;
  margin: 0 0 10px;
  color: var(--app-text-primary, #1C1C1E);
}

.summary-item {
  display: flex;
  flex-direction: column;
  margin-bottom: 10px;
}

.summary-label {
  font-size: 12px;
  color: var(--app-text-secondary, #8E8E93);
  margin-bottom: 2px;
}

.summary-value {
  font-size: 14px;
  color: var(--app-text-primary, #1C1C1E);
}

.error-message {
  display: flex;
  align-items: center;
  background-color: rgba(255, 59, 48, 0.1);
  color: #FF3B30;
  padding: 10px 15px;
  border-radius: 6px;
  font-size: 14px;
}

.error-icon {
  margin-right: 8px;
}

.generate-section, .listen-section {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.generate-info {
  display: flex;
  align-items: center;
  background-color: rgba(10, 132, 255, 0.1);
  color: #0A84FF;
  padding: 10px 15px;
  border-radius: 6px;
  font-size: 14px;
}

.info-icon {
  margin-right: 8px;
}

.progress-indicator {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.progress-steps {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.progress-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  color: var(--app-text-secondary, #8E8E93);
  width: 60px;
}

.progress-step.active {
  color: #0A84FF;
}

.progress-step.completed {
  color: #34C759;
}

.progress-icon {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background-color: var(--app-background-tertiary, #E5E5EA);
  color: var(--app-text-secondary, #8E8E93);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
}

.progress-step.active .progress-icon {
  background-color: #0A84FF;
  color: white;
}

.progress-step.completed .progress-icon {
  background-color: #34C759;
  color: white;
}

.progress-step-line {
  flex: 1;
  height: 2px;
  background-color: var(--app-background-tertiary, #E5E5EA);
  margin: 0 5px;
}

.progress-label {
  font-size: 12px;
  text-align: center;
}

.progress-bar {
  height: 6px;
  background-color: var(--app-background-tertiary, #E5E5EA);
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background-color: #0A84FF;
  border-radius: 3px;
  transition: width 0.3s ease;
}

.progress-status {
  text-align: center;
  font-size: 14px;
  color: var(--app-text-primary, #1C1C1E);
}

.retry-section {
  display: flex;
  justify-content: center;
  margin-top: 10px;
}

.retry-btn {
  background-color: var(--app-background-secondary, #F2F2F7);
  color: var(--app-text-primary, #1C1C1E);
  border: none;
  border-radius: 6px;
  padding: 8px 16px;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
}

.generation-success {
  display: flex;
  align-items: center;
  background-color: rgba(52, 199, 89, 0.1);
  color: #34C759;
  padding: 10px 15px;
  border-radius: 6px;
  font-size: 14px;
}

.success-icon {
  margin-right: 8px;
}

.audio-player {
  background-color: var(--app-background-secondary, #F2F2F7);
  border-radius: 8px;
  padding: 15px;
}

.player-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.play-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: #0A84FF;
  color: white;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.player-timeline {
  flex: 1;
  height: 4px;
  background-color: var(--app-background-tertiary, #E5E5EA);
  border-radius: 2px;
  position: relative;
  overflow: hidden;
}

.timeline-progress {
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  background-color: #0A84FF;
  transition: width 0.1s linear;
}

.player-time {
  font-size: 12px;
  color: var(--app-text-secondary, #8E8E93);
  min-width: 80px;
  text-align: right;
}

.download-section {
  display: flex;
  justify-content: center;
}

.download-btn {
  background-color: #0A84FF;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 8px 16px;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
}

.form-actions {
  display: flex;
  justify-content: space-between;
  margin-top: 10px;
}

.btn-back, .btn-done {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  border: none;
}

.btn-back {
  background-color: var(--app-background-secondary, #F2F2F7);
  color: var(--app-text-primary, #1C1C1E);
}

.btn-done {
  background-color: #34C759;
  color: white;
}

.btn-icon {
  font-size: 12px;
}

/* Dark mode adaptations */
@media (prefers-color-scheme: dark) {
  .summary-section {
    background-color: #1C1C1E;
  }
  
  .summary-title {
    color: white;
  }
  
  .summary-value {
    color: white;
  }
  
  .progress-icon {
    background-color: #2C2C2E;
  }
  
  .progress-step-line {
    background-color: #2C2C2E;
  }
  
  .progress-bar {
    background-color: #2C2C2E;
  }
  
  .progress-status {
    color: white;
  }
  
  .retry-btn {
    background-color: #2C2C2E;
    color: white;
  }
  
  .audio-player {
    background-color: #1C1C1E;
  }
  
  .player-timeline {
    background-color: #2C2C2E;
  }
  
  .btn-back {
    background-color: #2C2C2E;
    color: white;
  }
}

.loading-animation {
  display: flex;
  justify-content: center;
  margin-top: 16px;
}

.loading-dot {
  width: 8px;
  height: 8px;
  margin: 0 4px;
  border-radius: 50%;
  background-color: #0A84FF;
  opacity: 0.6;
  animation: dot-flashing 1s infinite alternate;
}

.loading-dot:nth-child(2) {
  animation-delay: 0.2s;
}

.loading-dot:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes dot-flashing {
  0% { opacity: 0.2; transform: scale(1); }
  100% { opacity: 1; transform: scale(1.2); }
}
</style> 