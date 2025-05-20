#!/usr/bin/env node

/**
 * 语音克隆与合成API测试脚本
 * 用于测试CosyVoice API的功能
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

// API基础URL
const API_BASE_URL = 'http://localhost:3000/api/v1'; // Express后端API

// 用户登录信息 - 请替换为实际测试账户
const TEST_USER = {
  email: 'testuser@example.com',
  password: 'password123'
};

// 彩色日志辅助函数
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// 日志函数
const log = {
  step: (step, message) => console.log(`${colors.bright}${colors.cyan}[步骤 ${step}]${colors.reset} ${message}`),
  success: (message, data = null) => {
    console.log(`${colors.green}[成功]${colors.reset} ${message}`);
    if (data) console.log(`${colors.yellow}[数据]${colors.reset}`, JSON.stringify(data, null, 2));
  },
  error: (message, error = null) => {
    console.error(`${colors.red}[错误]${colors.reset} ${message}`);
    if (error?.response?.data) console.error(`${colors.red}[响应]${colors.reset}`, error.response.data);
    else if (error) console.error(error);
  },
  info: (message) => console.log(`${colors.blue}[信息]${colors.reset} ${message}`),
  waiting: (message) => console.log(`${colors.yellow}[等待]${colors.reset} ${message}`)
};

// 等待函数
const wait = async (ms) => {
  log.waiting(`等待${ms/1000}秒...`);
  return new Promise(resolve => setTimeout(resolve, ms));
};

// 测试音频文件路径 - 替换为实际测试文件路径
const TEST_AUDIO_PATH = path.join(__dirname, '../voice_python/uploads/test_audio.wav');

// 授权令牌
let authToken = null;

// 检查API连接
async function checkApiConnection() {
  try {
    const response = await axios.get(`${API_BASE_URL}/health`, { timeout: 3000 });
    return response.status === 200;
  } catch (error) {
    return false;
  }
}

// 用户登录获取令牌
async function login() {
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: TEST_USER.email,
      password: TEST_USER.password
    });
    
    authToken = response.data.data.token;
    return response.data.data.user;
  } catch (error) {
    throw error;
  }
}

// 准备测试音频文件
async function prepareTestAudioFile() {
  if (fs.existsSync(TEST_AUDIO_PATH)) {
    return TEST_AUDIO_PATH;
  }
  
  // 如果测试文件不存在，尝试找一个替代文件
  const uploadsDir = path.dirname(TEST_AUDIO_PATH);
  if (fs.existsSync(uploadsDir)) {
    const files = fs.readdirSync(uploadsDir);
    const audioFile = files.find(file => file.endsWith('.wav') || file.endsWith('.mp3'));
    
    if (audioFile) {
      return path.join(uploadsDir, audioFile);
    }
  }
  
  // 创建测试目录
  fs.mkdirSync(path.dirname(TEST_AUDIO_PATH), { recursive: true });
  
  // 无法找到音频文件
  throw new Error('未找到可用的测试音频文件');
}

// 上传音频文件
async function uploadVoiceFile(audioFilePath, feedbackId = null) {
  try {
    const formData = new FormData();
    formData.append('audioFile', fs.createReadStream(audioFilePath));
    
    if (feedbackId) {
      formData.append('feedback_id', feedbackId);
    }
    
    const response = await axios.post(
      `${API_BASE_URL}/voice`,
      formData,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          ...formData.getHeaders()
        }
      }
    );
    
    return response.data;
  } catch (error) {
    throw error;
  }
}

// 触发语音克隆
async function cloneVoice(voiceId, feedbackId) {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/cosyvoice/clone`,
      { voiceId, feedbackId },
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    return response.data;
  } catch (error) {
    throw error;
  }
}

// 触发语音合成
async function synthesizeVoice(voiceId, feedbackId) {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/cosyvoice/synthesize`,
      { voiceId, feedbackId },
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    return response.data;
  } catch (error) {
    throw error;
  }
}

// 获取语音状态
async function getCosyVoiceStatus(voiceId) {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/cosyvoice/voice/${voiceId}`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      }
    );
    
    return response.data.data.cosyVoice;
  } catch (error) {
    throw error;
  }
}

// 获取与反馈相关的所有语音
async function getCosyVoicesByFeedback(feedbackId) {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/cosyvoice/feedback/${feedbackId}`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      }
    );
    
    return response.data.data.cosyVoices;
  } catch (error) {
    throw error;
  }
}

// 监控语音处理状态
async function monitorVoiceProcessing(voiceId, intervalMs = 3000, timeoutMs = 60000) {
  const startTime = Date.now();
  let status = null;
  
  while (Date.now() - startTime < timeoutMs) {
    try {
      const cosyVoice = await getCosyVoiceStatus(voiceId);
      status = cosyVoice.status;
      
      log.info(`处理状态: ${status}`);
      
      if (status === 'synthesized' || status === 'error') {
        return cosyVoice;
      }
      
      // 等待下次检查
      await wait(intervalMs);
    } catch (error) {
      log.error('监控状态时出错', error);
      throw error;
    }
  }
  
  throw new Error(`语音处理监控超时，已等待${timeoutMs/1000}秒`);
}

// 主测试函数
async function runTests() {
  console.log(`${colors.bright}${colors.magenta}[启动]${colors.reset} CosyVoice API 测试脚本`);
  console.log(`${colors.yellow}[配置]${colors.reset} API地址: ${API_BASE_URL}`);
  
  try {
    // 步骤1: 检查API连接
    log.step(1, '检查API连接');
    const isConnected = await checkApiConnection();
    
    if (!isConnected) {
      throw new Error('无法连接到API服务器，请确保后端服务正在运行');
    }
    
    log.success('成功连接到API服务器');
    
    // 步骤2: 用户登录
    log.step(2, '用户登录');
    const user = await login();
    log.success('用户登录成功', { userId: user?._id, email: user?.email });
    
    // 步骤3: 准备测试文件
    log.step(3, '准备测试音频文件');
    const audioFilePath = await prepareTestAudioFile();
    
    const fileStats = fs.statSync(audioFilePath);
    log.success('测试音频文件准备完成', { 
      path: audioFilePath, 
      size: `${(fileStats.size / 1024).toFixed(2)} KB`
    });
    
    // 步骤4: 上传音频文件
    log.step(4, '上传音频文件');
    const feedbackId = '60f7e5d3a2d8b32f4c123456'; // 使用测试反馈ID
    
    const uploadResponse = await uploadVoiceFile(audioFilePath, feedbackId);
    log.success('音频文件上传成功', uploadResponse.data);
    
    const uploadedFileId = uploadResponse.data.fileId;
    const responseVoiceId = uploadResponse.data.voice_id;
    
    // 如果响应中没有voice_id，则手动触发克隆
    if (!responseVoiceId) {
      log.step(5, '手动触发语音克隆');
      const cloneResponse = await cloneVoice(uploadedFileId, feedbackId);
      log.success('语音克隆请求成功', cloneResponse.data);
      
      const voiceId = cloneResponse.data.voice_id;
      
      // 步骤6: 监控语音处理状态
      log.step(6, '监控语音处理状态');
      
      try {
        const cosyVoice = await monitorVoiceProcessing(voiceId);
        log.success('语音处理完成', cosyVoice);
      } catch (monitorError) {
        log.error('语音处理监控超时', monitorError);
        
        // 尝试手动触发合成
        log.step('6.1', '手动触发语音合成');
        try {
          const synthesizeResponse = await synthesizeVoice(voiceId, feedbackId);
          log.success('语音合成请求成功', synthesizeResponse.data);
          
          // 等待10秒后检查合成状态
          await wait(10000);
          
          const finalStatus = await getCosyVoiceStatus(voiceId);
          log.success('最终语音合成状态', finalStatus);
        } catch (synthesizeError) {
          log.error('手动语音合成失败', synthesizeError);
        }
      }
    } else {
      // 自动克隆过程已启动，直接监控状态
      const voiceId = responseVoiceId;
      log.step(5, '监控自动语音处理状态');
      
      try {
        const cosyVoice = await monitorVoiceProcessing(voiceId);
        log.success('语音处理完成', cosyVoice);
      } catch (monitorError) {
        log.error('语音处理监控超时', monitorError);
      }
    }
    
    // 步骤7: 获取与反馈相关的所有语音记录
    log.step(7, '获取与反馈相关的所有语音记录');
    const cosyVoices = await getCosyVoicesByFeedback(feedbackId);
    
    log.success(`成功获取${cosyVoices.length}条相关的CosyVoice记录`);
    
    // 展示前2条记录
    cosyVoices.slice(0, 2).forEach((voice, index) => {
      log.info(`记录 ${index + 1}: voice_id: ${voice.voice_id}, status: ${voice.status}`);
    });
    
    console.log(`\n${colors.bright}${colors.green}[完成]${colors.reset} CosyVoice API测试成功完成！`);
    
  } catch (error) {
    log.error('测试过程中发生错误', error);
    console.log(`\n${colors.bright}${colors.red}[失败]${colors.reset} 测试过程中断`);
    process.exit(1);
  }
}

// 执行测试
runTests().catch(error => {
  console.error('未捕获的异常:', error);
  process.exit(1);
}); 