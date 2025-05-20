<template>
  <div class="audio-upload-form">
    <h3 class="form-section-title">上传音频样本</h3>
    <p class="form-description">请上传10-20秒的语音样本，支持wav/mp3/m4a格式</p>
    
    <div 
      class="upload-area" 
      :class="{ 
        'has-file': audioFile,
        'drag-over': isDragging,
        'error': uploadError,
        'uploading': isUploading
      }"
      @click="triggerFileInput"
      @dragover.prevent="onDragOver"
      @dragleave.prevent="onDragLeave"
      @drop.prevent="onDrop"
    >
      <input 
        type="file" 
        ref="fileInput"
        class="file-input"
        accept=".wav,.mp3,.m4a,audio/*"
        @change="handleFileChange"
      />
      
      <div v-if="!audioFile && !isUploading" class="upload-placeholder">
        <font-awesome-icon icon="cloud-arrow-up" class="upload-icon" />
        <div class="upload-text">点击或拖拽上传音频文件</div>
        <div class="upload-formats">支持格式：WAV / MP3 / M4A</div>
      </div>

      <div v-else-if="isUploading" class="uploading-indicator">
        <div class="spinner"></div>
        <div class="uploading-text">正在上传音频文件...</div>
      </div>
      
      <div v-else class="file-info">
        <div class="file-icon">
          <font-awesome-icon icon="file-audio" />
        </div>
        <div class="file-details">
          <div class="file-name">{{ audioFile.name }}</div>
          <div class="file-meta">
            <span class="file-size">{{ formatFileSize(audioFile.size) }}</span>
            <span v-if="audioDuration" class="file-duration">{{ formatDuration(audioDuration) }}</span>
          </div>
        </div>
        <button class="remove-file-btn" @click.stop="removeFile">
          <font-awesome-icon icon="times" />
        </button>
      </div>
    </div>
    
    <div v-if="uploadError" class="error-message">
      <font-awesome-icon icon="exclamation-triangle" class="error-icon" />
      {{ uploadError }}
    </div>

    <div v-if="uploadSuccess" class="success-message">
      <font-awesome-icon icon="check-circle" class="success-icon" />
      音频文件上传成功！
    </div>
    
    <div v-if="audioFile && !uploadError && !isUploading" class="audio-player">
      <audio 
        ref="audioPlayer" 
        controls 
        class="audio-element"
      >
        <source :src="audioUrl" :type="audioFile.type">
        您的浏览器不支持音频播放器
      </audio>
    </div>
    
    <div class="form-actions">
      <button class="btn-back" @click="$emit('prev-step')">
        <font-awesome-icon icon="arrow-left" class="btn-icon" />
        上一步
      </button>
      
      <button 
        class="btn-upload" 
        v-if="audioFile && !uploadedFileId && !isUploading"
        @click="uploadAudio"
      >
        上传音频
        <font-awesome-icon icon="upload" class="btn-icon" />
      </button>
      
      <button 
        class="btn-next" 
        @click="nextStep"
        :disabled="!isFormValid"
      >
        下一步
        <font-awesome-icon icon="arrow-right" class="btn-icon" />
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onUnmounted } from 'vue';
import { uploadVoiceFile } from '@/api/cosyVoice';

const props = defineProps({
  formData: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['update:formData', 'next-step', 'prev-step']);

// File input reference
const fileInput = ref(null);
const audioPlayer = ref(null);

// Local state
const audioFile = ref(null);
const audioUrl = ref('');
const audioDuration = ref(null);
const uploadError = ref('');
const isDragging = ref(false);
const isUploading = ref(false);
const uploadSuccess = ref(false);
const uploadedFileId = ref(props.formData.uploadedFileId || null);
const uploadedFileUrl = ref(props.formData.uploadedFileUrl || null);

// Create object URL for audio preview
const createAudioUrl = () => {
  if (audioUrl.value) {
    URL.revokeObjectURL(audioUrl.value);
  }
  
  if (audioFile.value) {
    audioUrl.value = URL.createObjectURL(audioFile.value);
  }
};

// Initialize from props
watch(() => props.formData, (newData) => {
  if (newData.audioFile !== audioFile.value) {
    audioFile.value = newData.audioFile;
    
    if (audioFile.value) {
      createAudioUrl();
    }
  }
  
  // Also restore uploaded file details if available
  if (newData.uploadedFileId) {
    uploadedFileId.value = newData.uploadedFileId;
  }
  
  if (newData.uploadedFileUrl) {
    uploadedFileUrl.value = newData.uploadedFileUrl;
  }
}, { immediate: true, deep: true });

// Clean up URLs when component is destroyed
onUnmounted(() => {
  if (audioUrl.value) {
    URL.revokeObjectURL(audioUrl.value);
  }
});

// Trigger file input click
const triggerFileInput = () => {
  if (!audioFile.value && !isUploading.value) {
    fileInput.value.click();
  }
};

// Handle drag events
const onDragOver = () => {
  isDragging.value = true;
};

const onDragLeave = () => {
  isDragging.value = false;
};

const onDrop = (event) => {
  isDragging.value = false;
  
  const file = event.dataTransfer.files[0];
  if (file && isAudioFile(file)) {
    validateAndProcessFile(file);
  } else {
    uploadError.value = '请上传支持的音频格式：WAV、MP3 或 M4A';
  }
};

// Check if file is an audio file
const isAudioFile = (file) => {
  const validTypes = ['audio/wav', 'audio/mpeg', 'audio/mp3', 'audio/mp4', 'audio/m4a', 'audio/x-m4a'];
  return validTypes.includes(file.type) || 
         file.name.toLowerCase().endsWith('.wav') ||
         file.name.toLowerCase().endsWith('.mp3') ||
         file.name.toLowerCase().endsWith('.m4a');
};

// Handle file selection
const handleFileChange = (event) => {
  const file = event.target.files[0];
  if (file) {
    validateAndProcessFile(file);
  }
};

// Validate and process audio file
const validateAndProcessFile = (file) => {
  uploadError.value = '';
  uploadSuccess.value = false;
  uploadedFileId.value = null;
  uploadedFileUrl.value = null;
  
  if (!isAudioFile(file)) {
    uploadError.value = '请上传支持的音频格式：WAV、MP3 或 M4A';
    return;
  }
  
  // Check file size (max 15MB)
  if (file.size > 15 * 1024 * 1024) {
    uploadError.value = '文件大小不能超过15MB';
    return;
  }
  
  // Create audio element to check duration
  const audio = new Audio();
  audio.addEventListener('loadedmetadata', () => {
    const duration = audio.duration;
    
    if (duration < 10 || duration > 20) {
      uploadError.value = `音频时长需在10-20秒之间，当前时长: ${Math.round(duration)}秒`;
      audioDuration.value = duration;
    } else {
      audioDuration.value = duration;
      audioFile.value = file;
      createAudioUrl();
      updateParentData();
    }
  });
  
  audio.addEventListener('error', () => {
    uploadError.value = '无法解析音频文件，请尝试其他文件';
  });
  
  audio.src = URL.createObjectURL(file);
};

// Upload audio to the server
const uploadAudio = async () => {
  if (!audioFile.value || isUploading.value) return;
  try {
    isUploading.value = true;
    uploadError.value = '';
    uploadSuccess.value = false;
    // Use the uploadVoiceFile function directly with the feedback ID
    console.log('[AudioUploadForm] 上传音频时用的 feedbackId:', props.formData.feedbackId);
    const result = await uploadVoiceFile(audioFile.value, props.formData.feedbackId);
    console.log('[AudioUploadForm] /api/v1/cosyvoice/upload 返回:', result);
    if (result && result.data) {
      uploadedFileId.value = result.data.fileId;
      uploadedFileUrl.value = result.data.fileUrl;
      // 新增：如果 feedbackId 存在，写入 localStorage
      if (props.formData.feedbackId) {
        localStorage.setItem('savedVoiceData', JSON.stringify({ feedbackId: props.formData.feedbackId }));
      }
      // If there's a voice_id in the response, store it
      if (result.data.voice_id) {
        emit('update:formData', {
          ...props.formData,
          audioFile: audioFile.value,
          uploadedFileId: result.data.fileId,
          uploadedFileUrl: result.data.fileUrl,
          voiceId: result.data.voice_id
        });
      } else {
        updateParentData();
      }
      uploadSuccess.value = true;
      // Show success message briefly, then automatically proceed to next step
      setTimeout(() => {
        if (isFormValid.value) {
          emit('next-step');
        }
      }, 800); // Short delay to show success message
    } else {
      uploadError.value = '上传返回数据无效';
      console.error('Invalid upload response:', result);
    }
  } catch (error) {
    console.error('Upload error:', error);
    uploadError.value = error.response?.data?.message || '上传失败，请重试';
  } finally {
    isUploading.value = false;
  }
};

// Remove the file
const removeFile = () => {
  audioFile.value = null;
  audioDuration.value = null;
  uploadSuccess.value = false;
  // Keep the uploadedFileId for reference if it was already uploaded
  
  if (audioUrl.value) {
    URL.revokeObjectURL(audioUrl.value);
    audioUrl.value = '';
  }
  
  if (fileInput.value) {
    fileInput.value.value = '';
  }
  
  updateParentData();
};

// Update parent data
const updateParentData = () => {
  emit('update:formData', { 
    ...props.formData,
    audioFile: audioFile.value,
    uploadedFileId: uploadedFileId.value,
    uploadedFileUrl: uploadedFileUrl.value
  });
};

// Format file size
const formatFileSize = (bytes) => {
  if (bytes < 1024) {
    return bytes + ' B';
  } else if (bytes < 1024 * 1024) {
    return (bytes / 1024).toFixed(1) + ' KB';
  } else {
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }
};

// Format duration
const formatDuration = (seconds) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);
  
  return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
};

// Validate form
const isFormValid = computed(() => {
  return audioFile.value && !uploadError.value && uploadedFileId.value;
});

// Next step handler
const nextStep = () => {
  if (isFormValid.value) {
    emit('next-step');
  }
};
</script>

<style scoped>
.audio-upload-form {
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
  color: #757575;
  margin: 0 0 10px;
}

.upload-area {
  border: 2px dashed #e0e0e0;
  border-radius: 12px;
  padding: 30px 20px;
  text-align: center;
  transition: all 0.3s;
  cursor: pointer;
  position: relative;
}

.upload-area:hover {
  border-color: var(--app-primary, #0A84FF);
  background-color: rgba(10, 132, 255, 0.05);
}

.upload-area.drag-over {
  border-color: var(--app-primary, #0A84FF);
  background-color: rgba(10, 132, 255, 0.1);
}

.upload-area.has-file {
  border-style: solid;
  border-color: #4CAF50;
  background-color: rgba(76, 175, 80, 0.05);
}

.upload-area.error {
  border-color: #f44336;
  background-color: rgba(244, 67, 54, 0.05);
}

.upload-area.uploading {
  border-color: #FF9800;
  background-color: rgba(255, 152, 0, 0.05);
  cursor: wait;
}

.file-input {
  display: none;
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.upload-icon {
  font-size: 36px;
  color: #BDBDBD;
}

.upload-text {
  font-size: 16px;
  font-weight: 500;
}

.upload-formats {
  font-size: 12px;
  color: #757575;
}

.uploading-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
}

.spinner {
  width: 30px;
  height: 30px;
  border: 3px solid rgba(255, 152, 0, 0.2);
  border-top: 3px solid #FF9800;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.uploading-text {
  font-size: 14px;
  color: #FF9800;
  font-weight: 500;
}

.file-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.file-icon {
  font-size: 30px;
  color: #4CAF50;
}

.file-details {
  text-align: left;
  flex: 1;
}

.file-name {
  font-weight: 500;
  margin-bottom: 4px;
  word-break: break-all;
}

.file-meta {
  display: flex;
  font-size: 12px;
  color: #757575;
  gap: 10px;
}

.remove-file-btn {
  background: none;
  border: none;
  color: #f44336;
  font-size: 16px;
  cursor: pointer;
  padding: 5px;
}

.error-message {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #f44336;
  font-size: 14px;
  padding: 10px;
  background-color: rgba(244, 67, 54, 0.1);
  border-radius: 8px;
}

.error-icon {
  font-size: 16px;
}

.success-message {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #4CAF50;
  font-size: 14px;
  padding: 10px;
  background-color: rgba(76, 175, 80, 0.1);
  border-radius: 8px;
}

.success-icon {
  font-size: 16px;
}

.audio-player {
  margin-top: 10px;
}

.audio-element {
  width: 100%;
  border-radius: 8px;
}

.form-actions {
  display: flex;
  justify-content: space-between;
  margin-top: 10px;
}

.btn-back, .btn-next, .btn-upload {
  display: flex;
  align-items: center;
  gap: 8px;
  border: none;
  border-radius: 20px;
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-back {
  background-color: #f5f5f5;
  color: #616161;
}

.btn-back:hover {
  background-color: #e0e0e0;
}

.btn-upload {
  background-color: #FF9800;
  color: white;
}

.btn-upload:hover {
  background-color: rgba(255, 152, 0, 0.8);
}

.btn-next {
  background-color: var(--app-primary, #0A84FF);
  color: white;
}

.btn-next:hover {
  background-color: rgba(10, 132, 255, 0.8);
}

.btn-next:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.btn-icon {
  font-size: 12px;
}

/* Dark mode adaptations */
@media (prefers-color-scheme: dark) {
  .form-description {
    color: #AAAAAA;
  }
  
  .upload-area {
    border-color: #3A3A3C;
  }
  
  .upload-area:hover {
    background-color: rgba(255, 255, 255, 0.05);
  }
  
  .upload-area.drag-over {
    background-color: rgba(255, 255, 255, 0.1);
  }
  
  .upload-area.has-file {
    background-color: rgba(76, 175, 80, 0.1);
  }
  
  .upload-formats {
    color: #AAAAAA;
  }
  
  .file-meta {
    color: #AAAAAA;
  }
  
  .btn-back {
    background-color: #3A3A3C;
    color: #CCCCCC;
  }
  
  .btn-back:hover {
    background-color: #4A4A4C;
  }
}
</style> 