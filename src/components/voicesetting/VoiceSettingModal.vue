<template>
  <div class="voice-setting-modal-overlay" @click="closeModal"></div>
  <div class="voice-setting-modal">
    <div class="voice-setting-header">
      <h2 class="voice-setting-title">个性化语音合成</h2>
      <div class="test-buttons">
        <button class="test-audio-btn" @click="testAudio" title="测试音频">
          <font-awesome-icon icon="volume-up" />
        </button>
        <button class="test-audio-btn test-encourage" @click="testEncourageAudio" title="测试鼓励音频">
          <font-awesome-icon icon="thumbs-up" />
        </button>
        <button class="test-audio-btn test-criticize" @click="testCriticizeAudio" title="测试批评音频">
          <font-awesome-icon icon="thumbs-down" />
        </button>
      </div>
      <button class="close-button" @click="$emit('close')">
        <font-awesome-icon icon="times" />
      </button>
    </div>
    
    <StepIndicator :currentStep="currentStep" :steps="steps" />
    
    <div class="voice-setting-content">
      <!-- Step 1: Information Form -->
      <InfoStepForm 
        v-if="currentStep === 1" 
        :formData="formData" 
        @update:formData="updateFormData" 
        @next-step="nextStep" 
      />
      
      <!-- Step 2: Audio Upload -->
      <AudioUploadForm 
        v-if="currentStep === 2" 
        :formData="formData" 
        @update:formData="updateFormData" 
        @next-step="processAudioUpload" 
        @prev-step="prevStep" 
      />
      
      <!-- Step 3: Generate and Listen -->
      <GenerateAndListenForm 
        v-if="currentStep === 3" 
        :formData="formData" 
        @update:formData="updateFormData" 
        @prev-step="prevStep" 
        @finish="finishProcess" 
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import StepIndicator from './StepIndicator.vue';
import InfoStepForm from './InfoStepForm.vue';
import AudioUploadForm from './AudioUploadForm.vue';
import GenerateAndListenForm from './GenerateAndListenForm.vue';
import { uploadVoiceFile, monitorVoiceProcessing, getCosyVoicesByFeedbackId, cloneVoice, playTestSound, playDirectFeedbackAudio, getDefaultFeedbackId } from '@/api/cosyVoice';
import { getCurrentUser, getCurrentUserFresh } from '@/api/auth';

// Define props and emits
const props = defineProps({
  show: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:show', 'close', 'finish']);

// Steps configuration
const steps = [
  { id: 1, name: '填写信息' },
  { id: 2, name: '音频上传' },
  { id: 3, name: '生成与试听' }
];

// Current step state
const currentStep = ref(1);

// Form data state
const formData = ref({
  textPrompt: '',
  encouragementStyle: '',
  criticismStyle: '',
  audioFile: null,
  selectedVoice: null,
  generatedAudio: null,
  feedbackId: null,
  voiceId: null,
  voiceFileId: null,
  uploadedFileId: null,
  uploadedFileUrl: null,
  processingStatus: '',
  error: null,
  feedbackData: null
});

// Methods
const closeModal = (event) => {
  // Close only if clicking directly on the overlay
  if (event.target === event.currentTarget) {
    emit('close');
    emit('update:show', false);
  }
};

const nextStep = () => {
  if (currentStep.value < steps.length) {
    currentStep.value++;
  }
};

const prevStep = () => {
  if (currentStep.value > 1) {
    currentStep.value--;
  }
};

const updateFormData = (newData) => {
  formData.value = { ...formData.value, ...newData };
};

// Process audio upload and immediately proceed to voice cloning
const processAudioUpload = async () => {
  const user = getCurrentUser();
  if (user && (user.voice_verify === true || user.voice_verify === 'true')) {
    // 已通过验证，直接跳过克隆流程，进入下一步
    nextStep();
    return;
  }
  try {
    // Update processing status
    updateFormData({ processingStatus: 'uploading' });
    
    // If we don't have a feedbackId, log a warning
    if (!formData.value.feedbackId) {
      console.warn('No feedback ID found in formData. Voice cloning may fail.', formData.value);
    } else {
      console.log('Using feedback ID for voice upload:', formData.value.feedbackId);
    }
    
    // Upload the audio file with feedback ID - may already be done in AudioUploadForm
    // Only proceed if formData.voiceId is not already set
    if (!formData.value.voiceId) {
      // The audio upload should have already been done in AudioUploadForm
      // If we have an audioFile and uploadedFileId but no voiceId, we may need to trigger cloning
      if (formData.value.audioFile && formData.value.uploadedFileId) {
        updateFormData({ processingStatus: 'cloning' });
        
        // 原：如果没有 voice_id，调用 cloneVoice 进行语音克隆
        // await cloneVoice(formData.value.uploadedFileId, formData.value.feedbackId);
        // 新：统一调用 processFull 进行音色新建/更新
        // await processFull({
        //   text_prompt: formData.value.textPrompt,
        //   audio_url: formData.value.uploadedFileUrl,
        //   user_id: getCurrentUser().id || getCurrentUser()._id,
        //   feedback_id: formData.value.feedbackId
        // });
        
        // Wait a moment for the cloning to be registered
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Now query to get the cosyVoice record with the voice_id
        const cosyVoices = await getCosyVoicesByFeedbackId(formData.value.feedbackId);
        
        if (cosyVoices && cosyVoices.length > 0) {
          // Use the most recent voice record
          const latestVoice = cosyVoices[0];
          updateFormData({ 
            voiceId: latestVoice.voice_id,
            processingStatus: latestVoice.status || 'cloning' 
          });
        }
      }
    }
    
    // If we have a voice_id now, start monitoring the process
    if (formData.value.voiceId) {
      // Monitor the voice processing status
      await monitorVoiceProcessing(
        formData.value.voiceId,
        (status) => {
          const processingStatus = status.status;
          updateFormData({ 
            processingStatus, 
            generatedAudio: status.synthesized_audio_url || null,
            error: status.error || null
          });
        }
      );
    } else {
      throw new Error('无法获取语音ID，请检查上传是否成功');
    }
    
    // Proceed to the next step
    nextStep();
  } catch (error) {
    console.error('Error processing audio:', error);
    
    // Provide more detailed error messages based on error type
    let errorMessage = 'An unknown error occurred during audio processing.';
    
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      const status = error.response.status;
      
      if (status === 404) {
        errorMessage = 'API endpoint not found. Please check server configuration or contact support.';
      } else if (status === 413) {
        errorMessage = 'File is too large. Please upload a smaller audio file.';
      } else if (status === 415) {
        errorMessage = 'Unsupported file format. Please use MP3 or WAV files.';
      } else if (status === 401 || status === 403) {
        errorMessage = 'Authentication error. Please log in again.';
      } else {
        errorMessage = `Server error (${status}): ${error.response.data?.message || error.message}`;
      }
    } else if (error.request) {
      // The request was made but no response was received
      errorMessage = 'No response from server. Please check your internet connection.';
    } else {
      // Something happened in setting up the request that triggered an Error
      errorMessage = error.message || errorMessage;
    }
    
    updateFormData({ 
      processingStatus: 'error',
      error: errorMessage
    });
    
    // Still proceed to next step to show error message
    nextStep();
  }
};

const finishProcess = () => {
  // Reset the form and close the modal
  currentStep.value = 1;
  formData.value = {
    textPrompt: '',
    encouragementStyle: '',
    criticismStyle: '',
    audioFile: null,
    selectedVoice: null,
    generatedAudio: null,
    feedbackId: null,
    voiceId: null,
    voiceFileId: null,
    uploadedFileId: null,
    uploadedFileUrl: null,
    processingStatus: '',
    error: null,
    feedbackData: null
  };
  
  // Emit events
  emit('close');
  emit('update:show', false);
  emit('finish');
};

// Test audio playback
const testAudio = () => {
  console.log('Testing audio playback...');
  const success = playTestSound(440, 500, 0.3);
  
  if (success) {
    console.log('Audio test successful');
  } else {
    console.warn('Audio test failed');
    alert('Audio playback test failed. Please check your browser settings.');
  }
};

// Test encourage audio
const testEncourageAudio = async () => {
  console.log('Testing encourage audio...');
  const defaultFeedbackId = getDefaultFeedbackId();
  console.log(`Using default feedback ID: ${defaultFeedbackId}`);
  
  const audioElement = await playDirectFeedbackAudio(defaultFeedbackId, true);
  
  if (audioElement) {
    console.log('Encourage audio test successful');
  } else {
    console.warn('Encourage audio test failed');
    alert('Encourage audio test failed. Server response might be missing audio URL.');
  }
};

// Test criticize audio
const testCriticizeAudio = async () => {
  console.log('Testing criticize audio...');
  const defaultFeedbackId = getDefaultFeedbackId();
  console.log(`Using default feedback ID: ${defaultFeedbackId}`);
  
  const audioElement = await playDirectFeedbackAudio(defaultFeedbackId, false);
  
  if (audioElement) {
    console.log('Criticize audio test successful');
  } else {
    console.warn('Criticize audio test failed');
    alert('Criticize audio test failed. Server response might be missing audio URL.');
  }
};

onMounted(async () => {
  const user = await getCurrentUserFresh();
  if (user && (user.voice_verify === true || user.voice_verify === 'true')) {
    console.log('voice_verify is TRUE!', user);
  }
});
</script>

<style scoped>
.voice-setting-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  justify-content: center;
  align-items: center;
}

.voice-setting-modal {
  width: 90%;
  max-width: 500px;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.2);
  overflow: hidden;
  z-index: 1001;
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  max-height: 80vh;
  display: flex;
  flex-direction: column;
}

.voice-setting-header {
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.voice-setting-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  flex: 1;
}

.test-buttons {
  display: flex;
  gap: 5px;
  margin-right: 10px;
}

.test-audio-btn {
  background: none;
  border: none;
  font-size: 16px;
  color: #0A84FF;
  cursor: pointer;
  padding: 5px;
  border-radius: 50%;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.test-audio-btn.test-encourage {
  color: #4CAF50;
}

.test-audio-btn.test-criticize {
  color: #FF5252;
}

.test-audio-btn:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.close-button {
  background: none;
  border: none;
  font-size: 18px;
  color: #999;
  cursor: pointer;
  padding: 5px;
}

.close-button:hover {
  color: #333;
}

.voice-setting-content {
  padding: 20px;
  overflow-y: auto;
  flex: 1;
}

/* Dark mode adaptations */
@media (prefers-color-scheme: dark) {
  .voice-setting-modal {
    background-color: #2C2C2E;
    color: white;
  }
  
  .voice-setting-header {
    border-bottom-color: #3A3A3C;
  }
  
  .close-button {
    color: #CCCCCC;
  }
  
  .close-button:hover {
    color: white;
  }
}
</style> 