import axios from 'axios';
import { getAuthHeaders, getCurrentUser } from './auth';
import { API_BASE_URL, getApiUrl } from '@/env';

// 创建简单日志对象，避免依赖logger.js
const logger = {
  info: (message, data) => {
    console.log(`ℹ️ [CosyVoice] ${message}`, data || '');
  },
  success: (message, data) => {
    console.log(`✅ [CosyVoice] ${message}`, data || '');
  },
  error: (message, error) => {
    console.error(`❌ [CosyVoice] ${message}`, error || '');
  },
  warn: (message, data) => {
    console.warn(`⚠️ [CosyVoice] ${message}`, data || '');
  }
};

/**
 * Upload audio file and optionally trigger voice cloning
 * @param {File} audioFile - The audio file to upload
 * @param {string} feedbackId - Optional feedback message ID to trigger automatic cloning
 * @returns {Promise<Object>} - Upload response data
 */
export const uploadVoiceFile = async (audioFile, feedbackId = null) => {
  logger.info(`Starting voice file upload: ${audioFile.name}, with feedbackId: ${feedbackId || 'none'}`);
  
  try {
    const formData = new FormData();
    formData.append('audioFile', audioFile);
    
    if (feedbackId) {
      formData.append('feedback_id', feedbackId);
      logger.info('Automatic voice cloning will be triggered after upload');
    }
    
    const response = await axios.post(
      `${getApiUrl()}${API_BASE_URL}/voice/upload`,
      formData,
      {
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    
    logger.success('Voice file upload successful', response.data);
    return response.data;
  } catch (error) {
    logger.error('Voice file upload failed', error);
    throw error;
  }
};

/**
 * Trigger voice cloning process
 * @param {string} voiceId - ID of the uploaded voice file
 * @param {string} feedbackId - Feedback message ID
 * @returns {Promise<Object>} - Cloning process response
 */
export const cloneVoice = async (voiceId, feedbackId) => {
  logger.info(`Triggering voice cloning. voiceId: ${voiceId}, feedbackId: ${feedbackId}`);
  
  try {
    const response = await axios.post(
      `${getApiUrl()}${API_BASE_URL}/cosyvoice/clone`,
      { voiceId, feedbackId },
      { headers: getAuthHeaders() }
    );
    
    logger.success('Voice cloning request successful', response.data);
    return response.data;
  } catch (error) {
    logger.error('Voice cloning request failed', error);
    throw error;
  }
};

/**
 * Manually trigger voice synthesis
 * @param {string} voiceId - The cloned voice ID
 * @param {string} feedbackId - Feedback message ID
 * @returns {Promise<Object>} - Synthesis process response
 */
export const synthesizeVoice = async (voiceId, feedbackId) => {
  logger.info(`Triggering voice synthesis. voiceId: ${voiceId}, feedbackId: ${feedbackId}`);
  
  try {
    const response = await axios.post(
      `${getApiUrl()}${API_BASE_URL}/cosyvoice/synthesize`,
      { voiceId, feedbackId },
      { headers: getAuthHeaders() }
    );
    
    logger.success('Voice synthesis request successful', response.data);
    return response.data;
  } catch (error) {
    logger.error('Voice synthesis request failed', error);
    throw error;
  }
};

/**
 * Get voice by voice_id
 * @param {string} voiceId - The cloned voice ID
 * @returns {Promise<Object>} - CosyVoice details
 */
export const getCosyVoiceByVoiceId = async (voiceId) => {
  logger.info(`Fetching CosyVoice by voice_id: ${voiceId}`);
  
  try {
    const response = await axios.get(
      `${getApiUrl()}${API_BASE_URL}/cosyvoice/voice/${voiceId}`,
      { headers: getAuthHeaders() }
    );
    
    logger.success('CosyVoice retrieval successful', response.data);
    return response.data.data.cosyVoice;
  } catch (error) {
    logger.error('CosyVoice retrieval failed', error);
    throw error;
  }
};

/**
 * Get all CosyVoices by feedback ID
 * @param {string} feedbackId - Feedback message ID
 * @returns {Promise<Array>} - List of CosyVoice objects
 */
export const getCosyVoicesByFeedbackId = async (feedbackId) => {
  logger.info(`Fetching CosyVoices for feedback ID: ${feedbackId}`);
  
  try {
    const response = await axios.get(
      `${getApiUrl()}${API_BASE_URL}/cosyvoice/feedback/${feedbackId}`,
      { headers: getAuthHeaders() }
    );
    
    logger.success('CosyVoices retrieval successful', response.data);
    return response.data.data.cosyVoices;
  } catch (error) {
    logger.error('CosyVoices retrieval failed', error);
    throw error;
  }
};

/**
 * Monitor voice cloning and synthesis status
 * @param {string} voiceId - The cloned voice ID
 * @param {Function} statusCallback - Callback function that receives status updates
 * @param {number} intervalMs - Polling interval in milliseconds
 * @param {number} timeoutMs - Maximum time to wait in milliseconds
 * @returns {Promise<Object>} - Final status
 */
export const monitorVoiceProcessing = async (
  voiceId, 
  statusCallback, 
  intervalMs = 5000, 
  timeoutMs = 120000
) => {
  logger.info(`Starting voice processing monitor for voice_id: ${voiceId}`);
  
  const startTime = Date.now();
  let status = null;
  
  while (Date.now() - startTime < timeoutMs) {
    try {
      const cosyVoice = await getCosyVoiceByVoiceId(voiceId);
      status = cosyVoice.status;
      
      statusCallback(cosyVoice);
      
      if (status === 'synthesized' || status === 'error') {
        return cosyVoice;
      }
      
      // Wait for the next check
      await new Promise(resolve => setTimeout(resolve, intervalMs));
    } catch (error) {
      logger.error('Error while monitoring voice processing', error);
      throw error;
    }
  }
  
  throw new Error(`Voice processing monitoring timed out after ${timeoutMs/1000} seconds`);
};

/**
 * Get audio URL for a specific feedback ID and type
 * @param {string} feedbackId - The feedback ID
 * @param {string} type - The audio type ('encourage' or 'criticize')
 * @returns {Promise<string|null>} - Audio URL if available, null otherwise
 */
export const getAudioUrlByFeedbackId = async (feedbackId, type) => {
  try {
    if (!feedbackId) {
      logger.error('No feedback ID provided for audio retrieval');
      return null;
    }
    
    const validTypes = ['encourage', 'criticize'];
    if (!validTypes.includes(type)) {
      logger.error(`Invalid audio type: ${type}. Must be 'encourage' or 'criticize'`);
      return null;
    }
    
    logger.info(`正在获取反馈ID ${feedbackId} 的 ${type} 音频`);
    console.log(`[CosyVoice API] 正在获取反馈ID ${feedbackId} 的 ${type} 音频...`);
    
    // 添加重试机制
    let retries = 3;
    let lastError = null;
    
    while (retries > 0) {
      try {
        // 基于文档中的API格式
        // GET /api/v1/cosyvoice/feedback/:feedbackId/audio?type=encourage
        const response = await axios.get(
          `${getApiUrl()}${API_BASE_URL}/cosyvoice/feedback/${feedbackId}/audio`,
          { 
            headers: getAuthHeaders(),
            params: { type },
            timeout: 5000 // 添加超时设置
          }
        );
        
        console.log(`[CosyVoice API] 获取${type}音频响应:`, response.data);
        
        // 根据新的API文档和测试脚本响应格式进行处理
        if (response.data && response.data.success && response.data.data) {
          // 测试脚本中显示返回格式为： 
          // { data: { type: 'encourage', url: '...', status: 'synthesized' }, message: 'Success', success: true }
          const url = response.data.data.url;
          
          if (url) {
            logger.success(`成功获取${type}音频URL: ${url}`);
            console.log(`[CosyVoice API] 成功获取${type}音频URL: ${url}`);
            return url;
          }
        }
        
        logger.warn(`未找到反馈ID ${feedbackId} 的 ${type} 音频URL`, response.data);
        console.log(`[CosyVoice API] 未找到反馈ID ${feedbackId} 的 ${type} 音频URL`, response.data);
        return null;
      } catch (error) {
        lastError = error;
        const statusCode = error.response?.status || '未知';
        const errorMsg = error.response?.data?.message || error.message;
        
        logger.warn(`获取音频URL尝试 ${4 - retries} 失败: 状态码 ${statusCode}，错误信息: ${errorMsg}`);
        console.log(`[CosyVoice API] 获取${type}音频失败 (尝试 ${4 - retries}/3): 状态码 ${statusCode}，错误: ${errorMsg}`);
        
        // 如果是404错误，直接返回null，不需要重试
        if (error.response && error.response.status === 404) {
          logger.error(`反馈ID ${feedbackId} 的音频未找到`);
          console.log(`[CosyVoice API] 反馈ID ${feedbackId} 的音频未找到`);
          return null;
        }
        
        retries--;
        if (retries > 0) {
          const retryDelay = 1000;
          console.log(`[CosyVoice API] ${retryDelay/1000}秒后重试...`);
          await new Promise(resolve => setTimeout(resolve, retryDelay)); // 等待1秒后重试
        }
      }
    }
    
    logger.error(`获取${type}音频的所有尝试都失败:`, lastError);
    console.log(`[CosyVoice API] 获取${type}音频的所有尝试都失败，放弃重试`);
    return null;
  } catch (err) {
    logger.error(`获取${type}音频时出现异常:`, err);
    console.log(`[CosyVoice API] 获取${type}音频时出现异常:`, err.message);
    return null;
  }
};

/**
 * Play audio automatically in the background
 * @param {string} audioUrl - The URL of the audio to play
 * @param {number} volume - Volume level (0-1), default 0.7
 * @returns {Promise<HTMLAudioElement|null>} - The audio element if successful
 */
export const playAudioInBackground = (audioUrl, volume = 0.7) => {
  if (!audioUrl) {
    logger.error('Cannot play audio: No URL provided');
    return null;
  }
  
  logger.info(`Playing audio from URL: ${audioUrl}`);
  
  try {
    // Create an audio element
    const audioElement = new Audio();
    
    // Add event listeners for debugging
    audioElement.addEventListener('canplay', () => {
      logger.info('Audio is ready to play');
    });
    
    audioElement.addEventListener('play', () => {
      logger.info('Audio playback started');
    });
    
    audioElement.addEventListener('ended', () => {
      logger.info('Audio playback completed');
    });
    
    audioElement.addEventListener('error', (e) => {
      logger.error(`Audio error (${e.target.error ? e.target.error.code : 'unknown'}):`, e);
    });
    
    // Set properties
    audioElement.crossOrigin = "anonymous"; // Try to allow cross-origin playback
    audioElement.volume = volume;
    audioElement.src = audioUrl;
    audioElement.preload = "auto";
    
    // Ensure audio plays by handling promise rejection carefully
    audioElement.play()
      .then(() => {
        logger.info('Audio playback started successfully');
      })
      .catch(error => {
        logger.error('Error playing audio (likely autoplay restriction):', error);
        // Create user interaction to bypass autoplay restrictions
        try {
          // Create a button that will be clicked programmatically
          const button = document.createElement('button');
          button.innerHTML = 'Play Audio';
          button.style.cssText = 'position: fixed; z-index: 9999; bottom: 20px; right: 20px; background: #4CAF50; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer;';
          button.onclick = async () => {
            try {
              await audioElement.play();
              logger.info('Audio playback started through user interaction');
              document.body.removeChild(button);
            } catch (e) {
              logger.error('Audio playback failed even with user interaction:', e);
              document.body.removeChild(button);
            }
          };
          
          // Add the button to the DOM and simulate a click
          document.body.appendChild(button);
          setTimeout(() => button.click(), 100);
        } catch (btnError) {
          logger.error('Failed to create interactive playback button:', btnError);
        }
      });
    
    return audioElement;
  } catch (error) {
    logger.error('Error creating audio element:', error);
    return null;
  }
};

/**
 * Play a test sound to verify audio playback works
 * @param {number} frequency - Sound frequency in Hz (default: 440)
 * @param {number} duration - Sound duration in ms (default: 1000)
 * @param {number} volume - Sound volume from 0 to 1 (default: 0.5)
 * @returns {Promise<boolean>} - True if sound played successfully
 */
export const playTestSound = (frequency = 440, duration = 1000, volume = 0.5) => {
  try {
    logger.info('Playing test sound...');
    
    // Create audio context
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const audioCtx = new AudioContext();
    
    // Create oscillator
    const oscillator = audioCtx.createOscillator();
    oscillator.type = 'sine';
    oscillator.frequency.value = frequency;
    
    // Create gain node for volume control
    const gainNode = audioCtx.createGain();
    gainNode.gain.value = volume;
    
    // Connect nodes
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    // Start and stop oscillator
    oscillator.start();
    setTimeout(() => {
      oscillator.stop();
      logger.info('Test sound completed');
    }, duration);
    
    return true;
  } catch (error) {
    logger.error('Failed to play test sound:', error);
    return false;
  }
};

/**
 * Play task feedback audio directly using feedbackId without relying on localStorage
 * @param {string} feedbackId - The feedback ID to use for audio retrieval
 * @param {boolean} isSuccess - Whether the task was successfully completed (true for encourage, false for criticize)
 * @returns {Promise<HTMLAudioElement|null>} - The audio element if successful
 */
export const playDirectFeedbackAudio = async (feedbackId, isSuccess) => {
  try {
    if (!feedbackId) {
      logger.error('No feedback ID provided for direct audio playback');
      return null;
    }
    
    logger.info(`Attempting to play ${isSuccess ? 'encouraging' : 'criticism'} audio for feedback ID: ${feedbackId}`);
    
    // Get the appropriate audio URL based on success status
    const type = isSuccess ? 'encourage' : 'criticize';
    const audioUrl = await getAudioUrlByFeedbackId(feedbackId, type);
    
    if (!audioUrl) {
      logger.warn(`No ${type} audio URL found for feedback ID: ${feedbackId}`);
      return null;
    }
    
    logger.info(`Successfully retrieved ${type} audio URL: ${audioUrl}`);
    
    // Play the audio
    return playAudioInBackground(audioUrl);
  } catch (error) {
    logger.error('Error playing direct feedback audio:', error);
    return null;
  }
};

/**
 * Get a known valid feedback ID for testing
 * This is useful when no user-specific feedback ID is available
 * @returns {Promise<string>} A valid feedback ID from the database
 */
export const getDefaultFeedbackId = async () => {
  try {
    // 尝试从localStorage获取最近使用的反馈ID
    const savedVoiceData = localStorage.getItem('savedVoiceData');
    if (savedVoiceData) {
      try {
        const parsedData = JSON.parse(savedVoiceData);
        if (parsedData.feedbackId) {
          logger.info('使用localStorage中保存的反馈ID:', parsedData.feedbackId);
          console.log('[CosyVoice] 使用localStorage中保存的反馈ID:', parsedData.feedbackId);
          return parsedData.feedbackId;
        }
      } catch (parseError) {
        logger.error('解析保存的语音数据失败:', parseError);
      }
    }
    
    // 如果没有保存的ID，尝试从API获取一个有效的反馈ID
    logger.info('未找到保存的反馈ID，正在从API获取...');
    console.log('[CosyVoice] 未找到保存的反馈ID，正在从API获取最新反馈ID...');
    
    const response = await axios.get(
      `${getApiUrl()}${API_BASE_URL}/feedback/latest`,
      { headers: getAuthHeaders() }
    );
    
    console.log('[CosyVoice] 从API获取到的反馈响应:', response.data);
    
    // 根据API文档处理响应
    if (response.data && response.data.success && response.data.data) {
      // 从响应中获取feedbackId字段（具体字段名可能取决于API实现）
      // 根据测试结果，尝试几种可能的路径
      let feedbackId = null;
      
      // 尝试不同的字段路径
      if (response.data.data._id) {
        feedbackId = response.data.data._id;
      } else if (response.data.data.id) {
        feedbackId = response.data.data.id;
      } else if (response.data.data.feedbackId) {
        feedbackId = response.data.data.feedbackId;
      }
      
      if (feedbackId) {
        logger.info('成功从API获取反馈ID:', feedbackId);
        console.log('[CosyVoice] 成功从API获取反馈ID:', feedbackId);
        
        // 保存到localStorage
        localStorage.setItem('savedVoiceData', JSON.stringify({ feedbackId }));
        
        return feedbackId;
      }
    }
    
    // 如果API调用失败或无法提取ID，使用备用ID
    logger.warn('从API获取反馈ID失败，使用备用ID');
    console.log('[CosyVoice] 从API获取反馈ID失败，使用测试中的备用ID');
    
    // 使用测试脚本中显示的ID作为备用
    const fallbackId = "68232551729cfd49b0c7149d";
    console.log('[CosyVoice] 使用备用ID:', fallbackId);
    
    // 保存到localStorage以便下次使用
    localStorage.setItem('savedVoiceData', JSON.stringify({ feedbackId: fallbackId }));
    
    return fallbackId;
  } catch (error) {
    logger.error('获取默认反馈ID时发生错误:', error);
    console.log('[CosyVoice] 获取默认反馈ID时发生错误:', error);
    
    // 即使出错，也返回一个备用ID
    return "68232551729cfd49b0c7149d";
  }
};

/**
 * 一站式全流程处理（文本生成+音色克隆/更新+语音合成）
 * 自动判断用户是否有voice_id，选择合适的处理流程
 * @param {Object} params 请求参数
 * @param {string} params.audio_url - 公网可访问的音频URL
 * @param {string} params.text_prompt - 文本生成提示词
 * @param {string} params.user_id - 用户ID
 * @param {string} params.feedback_id - 反馈消息ID
 * @param {string} [params.voice_id] - 用户已有的voice_id（如果有）
 * @returns {Promise<Object>} - 处理结果
 */
export const processFull = async (params) => {
  logger.info('调用一站式全流程API, 参数:', params);
  
  try {
    const response = await axios.post(
      `${getApiUrl()}${API_BASE_URL}/process-full`,
      params,
      { headers: getAuthHeaders() }
    );
    
    logger.success('全流程处理成功', response.data);
    return response.data;
  } catch (error) {
    logger.error('全流程处理失败', error);
    throw error;
  }
};

/**
 * 获取用户现有voice_id
 * @param {string} userId - 用户ID
 * @returns {Promise<string|null>} - 用户的voice_id，如无则返回null
 */
export const getUserVoiceId = async (userId) => {
  logger.info(`获取用户voice_id, userId: ${userId}`);
  
  try {
    const response = await axios.get(
      `${getApiUrl()}${API_BASE_URL}/get-voice-id?user_id=${userId}`,
      { headers: getAuthHeaders() }
    );
    
    if (response.data && response.data.success) {
      logger.success('成功获取用户voice_id', response.data);
      return response.data.voice_id; // 如果用户无voice_id，此值为null
    }
    
    return null;
  } catch (error) {
    logger.error('获取用户voice_id失败', error);
    return null;
  }
};

/**
 * 通过 user_id 获取音频 url（新接口）
 * @param {string} userId - 用户ID
 * @param {string} type - 'encourage' 或 'criticize'
 * @returns {Promise<string|null>} - 音频URL
 */
export const getAudioUrlByUserId = async (userId, type) => {
  try {
    if (!userId) {
      logger.error('未提供 userId');
      return null;
    }
    const validTypes = ['encourage', 'criticize'];
    if (!validTypes.includes(type)) {
      logger.error(`无效的 type: ${type}`);
      return null;
    }
    logger.info(`通过 user_id 获取音频: userId=${userId}, type=${type}`);
    const response = await axios.get(
      `${getApiUrl()}${API_BASE_URL}/cosyvoice/user/${userId}/audio`,
      {
        headers: getAuthHeaders(),
        params: { type },
        timeout: 5000
      }
    );
    if (response.data && response.data.success && response.data.data) {
      const url = response.data.data.url;
      if (url) {
        logger.success(`成功获取 userId=${userId} 的音频URL: ${url}`);
        return url;
      }
    }
    logger.warn(`未找到 userId=${userId} 的 ${type} 音频`, response.data);
    return null;
  } catch (error) {
    logger.error('通过 user_id 获取音频 url 失败:', error);
    return null;
  }
}; 