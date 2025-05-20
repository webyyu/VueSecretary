<template>
  <div class="voice-selection-form">
    <h3 class="form-section-title">选择音色</h3>
    <p class="form-description">选择使用当前上传的音频创建新音色，或选择先前保存的音色</p>
    
    <div class="selection-tabs">
      <button 
        class="tab-btn" 
        :class="{ 'active': selectionMode === 'new' }"
        @click="selectionMode = 'new'"
      >
        <font-awesome-icon icon="plus-circle" class="tab-icon" />
        创建新音色
      </button>
      <button 
        class="tab-btn" 
        :class="{ 'active': selectionMode === 'existing', 'disabled': savedVoices.length === 0 }"
        @click="savedVoices.length > 0 && (selectionMode = 'existing')"
      >
        <font-awesome-icon icon="history" class="tab-icon" />
        使用已有音色
      </button>
    </div>
    
    <div v-if="selectionMode === 'new'" class="new-voice-section">
      <div class="form-group">
        <label class="form-label">音色名称</label>
        <input 
          type="text" 
          class="form-input" 
          v-model="newVoiceName" 
          placeholder="给您的音色起个名字，例如：我的专属音色"
        />
      </div>
      
      <div v-if="props.formData.audioFile" class="audio-preview">
        <div class="audio-file-info">
          <font-awesome-icon icon="file-audio" class="audio-icon" />
          <span class="audio-name">{{ props.formData.audioFile.name }}</span>
        </div>
      </div>
      
      <div v-else class="missing-audio-warning">
        <font-awesome-icon icon="exclamation-triangle" class="warning-icon" />
        <span>还未上传音频，请返回上一步上传音频样本</span>
      </div>
    </div>
    
    <div v-else class="existing-voice-section">
      <div v-if="savedVoices.length === 0" class="no-voices">
        <font-awesome-icon icon="info-circle" class="info-icon" />
        <span>暂无保存的音色，请创建新音色</span>
      </div>
      
      <div v-else class="voices-list">
        <div 
          v-for="voice in savedVoices" 
          :key="voice.id"
          class="voice-item"
          :class="{ 'selected': selectedVoiceId === voice.id }"
          @click="selectVoice(voice.id)"
        >
          <div class="voice-select-indicator">
            <font-awesome-icon v-if="selectedVoiceId === voice.id" icon="check-circle" />
            <div v-else class="voice-select-circle"></div>
          </div>
          <div class="voice-info">
            <div class="voice-name">{{ voice.name }}</div>
            <div class="voice-date">{{ formatDate(voice.createdAt) }}</div>
          </div>
          <button class="voice-play-btn" @click.stop="playVoiceSample(voice.id)">
            <font-awesome-icon :icon="isPlaying === voice.id ? 'pause' : 'play'" />
          </button>
        </div>
      </div>
    </div>
    
    <div class="form-actions">
      <button class="btn-back" @click="$emit('prev-step')">
        <font-awesome-icon icon="arrow-left" class="btn-icon" />
        上一步
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
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';

const props = defineProps({
  formData: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['update:formData', 'next-step', 'prev-step']);

// Local state
const selectionMode = ref('new');
const newVoiceName = ref('');
const selectedVoiceId = ref(null);
const isPlaying = ref(null);
const audioPlayer = ref(null);

// Mock saved voices (would be fetched from API in a real app)
const savedVoices = ref([
  { 
    id: '1', 
    name: '默认音色', 
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    sampleUrl: 'https://example.com/voice-sample1.mp3'
  },
  { 
    id: '2', 
    name: '商务音色', 
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    sampleUrl: 'https://example.com/voice-sample2.mp3'
  },
  { 
    id: '3', 
    name: '亲切音色', 
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    sampleUrl: 'https://example.com/voice-sample3.mp3'
  }
]);

// Create audio player
onMounted(() => {
  audioPlayer.value = new Audio();
  
  // When audio finishes playing
  audioPlayer.value.addEventListener('ended', () => {
    isPlaying.value = null;
  });
});

// Clean up
onBeforeUnmount(() => {
  if (audioPlayer.value) {
    audioPlayer.value.pause();
    audioPlayer.value.src = '';
  }
});

// Format date
const formatDate = (date) => {
  return new Date(date).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// Select a voice
const selectVoice = (id) => {
  selectedVoiceId.value = id;
  updateSelectedVoice();
};

// Play voice sample
const playVoiceSample = (id) => {
  // If already playing this sample
  if (isPlaying.value === id) {
    audioPlayer.value.pause();
    isPlaying.value = null;
    return;
  }
  
  // If playing a different sample
  if (isPlaying.value) {
    audioPlayer.value.pause();
  }
  
  // Play the selected sample
  const voice = savedVoices.value.find(v => v.id === id);
  if (voice && voice.sampleUrl) {
    audioPlayer.value.src = voice.sampleUrl;
    audioPlayer.value.play()
      .then(() => {
        isPlaying.value = id;
      })
      .catch(err => {
        console.error('Error playing audio:', err);
        isPlaying.value = null;
      });
  }
};

// Update selected voice in parent
const updateSelectedVoice = () => {
  let selectedVoice = null;
  
  if (selectionMode.value === 'existing' && selectedVoiceId.value) {
    selectedVoice = savedVoices.value.find(v => v.id === selectedVoiceId.value);
  } else if (selectionMode.value === 'new' && newVoiceName.value.trim()) {
    selectedVoice = {
      isNew: true,
      name: newVoiceName.value.trim(),
      audioFile: props.formData.audioFile
    };
  }
  
  emit('update:formData', {
    ...props.formData,
    selectedVoice
  });
};

// Form validation
const isFormValid = computed(() => {
  if (selectionMode.value === 'new') {
    return newVoiceName.value.trim() !== '' && props.formData.audioFile;
  } else {
    return selectedVoiceId.value !== null;
  }
});

// Update data when input changes
const nextStep = () => {
  updateSelectedVoice();
  
  if (isFormValid.value) {
    emit('next-step');
  }
};
</script>

<style scoped>
.voice-selection-form {
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

.selection-tabs {
  display: flex;
  background-color: #f5f5f5;
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 10px;
}

.tab-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  border: none;
  background: none;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
}

.tab-btn.active {
  background-color: white;
  color: var(--app-primary, #0A84FF);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.tab-btn.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.tab-icon {
  font-size: 16px;
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

.form-input {
  padding: 12px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  font-family: inherit;
  transition: border-color 0.3s;
}

.form-input:focus {
  outline: none;
  border-color: var(--app-primary, #0A84FF);
}

.audio-preview {
  background-color: rgba(76, 175, 80, 0.1);
  border: 1px solid #4CAF50;
  border-radius: 8px;
  padding: 12px;
  margin-top: 10px;
}

.audio-file-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.audio-icon {
  color: #4CAF50;
  font-size: 18px;
}

.audio-name {
  font-size: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.missing-audio-warning {
  background-color: rgba(255, 152, 0, 0.1);
  border: 1px solid #FF9800;
  border-radius: 8px;
  padding: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 10px;
}

.warning-icon {
  color: #FF9800;
  font-size: 18px;
}

.no-voices {
  background-color: rgba(0, 0, 0, 0.05);
  border-radius: 8px;
  padding: 16px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.info-icon {
  font-size: 24px;
  color: #757575;
}

.voices-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 300px;
  overflow-y: auto;
}

.voice-item {
  display: flex;
  align-items: center;
  padding: 12px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
}

.voice-item:hover {
  border-color: var(--app-primary, #0A84FF);
  background-color: rgba(10, 132, 255, 0.05);
}

.voice-item.selected {
  border-color: var(--app-primary, #0A84FF);
  background-color: rgba(10, 132, 255, 0.1);
}

.voice-select-indicator {
  margin-right: 12px;
  color: var(--app-primary, #0A84FF);
  font-size: 18px;
}

.voice-select-circle {
  width: 18px;
  height: 18px;
  border: 2px solid #e0e0e0;
  border-radius: 50%;
}

.voice-info {
  flex: 1;
}

.voice-name {
  font-weight: 500;
  margin-bottom: 4px;
}

.voice-date {
  font-size: 12px;
  color: #757575;
}

.voice-play-btn {
  background: none;
  border: none;
  color: #616161;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.voice-play-btn:hover {
  background-color: rgba(0, 0, 0, 0.05);
  color: var(--app-primary, #0A84FF);
}

.form-actions {
  display: flex;
  justify-content: space-between;
  margin-top: 10px;
}

.btn-back, .btn-next {
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
  
  .selection-tabs {
    background-color: #3A3A3C;
  }
  
  .tab-btn.active {
    background-color: #2C2C2E;
  }
  
  .form-input {
    background-color: #2C2C2E;
    border-color: #3A3A3C;
    color: white;
  }
  
  .audio-preview {
    background-color: rgba(76, 175, 80, 0.1);
  }
  
  .missing-audio-warning {
    background-color: rgba(255, 152, 0, 0.1);
  }
  
  .no-voices {
    background-color: rgba(255, 255, 255, 0.05);
  }
  
  .voice-select-circle {
    border-color: #3A3A3C;
  }
  
  .voice-date {
    color: #AAAAAA;
  }
  
  .voice-item {
    border-color: #3A3A3C;
  }
  
  .voice-item:hover {
    background-color: rgba(255, 255, 255, 0.05);
  }
  
  .voice-item.selected {
    background-color: rgba(10, 132, 255, 0.2);
  }
  
  .voice-play-btn:hover {
    background-color: rgba(255, 255, 255, 0.1);
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