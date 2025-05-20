/**
 * 自动化测试脚本 - 语音克隆与合成功能
 * 本脚本用于测试完整的语音克隆和合成流程
 */

const axios = require('axios');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

// MongoDB连接配置
const MONGODB_URI = 'mongodb://localhost:27017/supertimer';

// API基础URL
const EXPRESS_API_URL = 'http://localhost:3000/api/v1'; // Express后端API
const FLASK_API_URL = 'http://localhost:5000'; // Flask服务API

// 用户登录信息
const USER_EMAIL = 'abc1567849@gmail.com';
const USER_PASSWORD = '123456';

// 为了详细日志输出的彩色文本
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

// 记录执行步骤的函数
function logStep(step, message) {
  console.log(`${colors.bright}${colors.cyan}[步骤 ${step}]${colors.reset} ${message}`);
}

// 记录结果的函数
function logResult(success, message, data = null) {
  if (success) {
    console.log(`${colors.green}[成功]${colors.reset} ${message}`);
  } else {
    console.log(`${colors.red}[失败]${colors.reset} ${message}`);
  }
  
  if (data) {
    console.log(`${colors.yellow}[数据]${colors.reset}`, JSON.stringify(data, null, 2));
  }
}

// 记录错误的函数
function logError(error) {
  console.error(`${colors.red}[错误]${colors.reset} ${error.message}`);
  if (error.response) {
    console.error(`${colors.red}[响应数据]${colors.reset}`, error.response.data);
  }
}

// 主测试函数
async function runTest() {
  let authToken = null;
  let selectedVoice = null;
  let selectedFeedback = null;
  let cloneResult = null;
  
  try {
    // 步骤1: 连接MongoDB数据库
    logStep(1, '连接MongoDB数据库');
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    logResult(true, '成功连接到MongoDB数据库');
    
    // 步骤2: 从数据库获取测试数据
    logStep(2, '从数据库读取语音和反馈消息记录');
    
    // 获取一条语音记录
    const voiceCollection = mongoose.connection.collection('voices');
    const voices = await voiceCollection.find({}).limit(1).toArray();
    
    if (voices.length === 0) {
      throw new Error('未找到任何语音记录，请确保数据库中存在语音记录');
    }
    
    selectedVoice = voices[0];
    logResult(true, '成功获取语音记录', {
      voiceId: selectedVoice._id,
      fileUrl: selectedVoice.fileUrl
    });
    
    // 获取一条反馈消息记录
    const feedbackCollection = mongoose.connection.collection('feedbackmessages');
    const feedbackMessages = await feedbackCollection.find({}).limit(1).toArray();
    
    if (feedbackMessages.length === 0) {
      throw new Error('未找到任何反馈消息记录，请确保数据库中存在反馈消息记录');
    }
    
    selectedFeedback = feedbackMessages[0];
    logResult(true, '成功获取反馈消息记录', {
      feedbackId: selectedFeedback._id,
      encourageMessage: selectedFeedback.encourageMessage.substring(0, 50) + '...'
    });
    
    // 步骤3: 用户登录获取JWT令牌
    logStep(3, '用户登录获取授权令牌');
    const loginResponse = await axios.post(`${EXPRESS_API_URL}/auth/login`, {
      email: USER_EMAIL,
      password: USER_PASSWORD
    });
    
    authToken = loginResponse.data.data.token;
    logResult(true, '成功获取授权令牌', { token: authToken.substring(0, 20) + '...' });
    
    // 步骤4: 触发语音克隆流程
    logStep(4, '触发语音克隆流程');
    const cloneResponse = await axios.post(
      `${EXPRESS_API_URL}/cosyvoice/clone`,
      {
        voiceId: selectedVoice._id.toString(),
        feedbackId: selectedFeedback._id.toString()
      },
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    cloneResult = cloneResponse.data.data;
    logResult(true, '语音克隆请求成功', cloneResult);
    
    // 步骤5: 等待克隆完成并检查状态
    logStep(5, '等待语音克隆完成并检查状态');
    console.log(`${colors.yellow}[等待]${colors.reset} 等待10秒钟让语音克隆完成...`);
    await new Promise(resolve => setTimeout(resolve, 10000)); // 等待10秒
    
    // 检查克隆状态
    const voiceStatusResponse = await axios.get(
      `${EXPRESS_API_URL}/cosyvoice/voice/${cloneResult.voice_id}`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      }
    );
    
    const cosyVoice = voiceStatusResponse.data.data.cosyVoice;
    logResult(true, '获取语音克隆状态成功', cosyVoice);
    
    // 步骤6: 检查语音合成是否已自动触发
    logStep(6, '检查语音合成状态');
    if (cosyVoice.status === 'synthesized' && cosyVoice.synthesized_audio_url) {
      logResult(true, '语音合成已自动完成', {
        status: cosyVoice.status,
        synthesized_audio_url: cosyVoice.synthesized_audio_url
      });
    } else if (cosyVoice.status === 'cloned') {
      // 如果只是克隆完成但没有自动合成，则手动触发合成
      logStep('6.1', '语音克隆已完成但合成未自动触发，手动发起合成请求');
      
      const synthesizeResponse = await axios.post(
        `${EXPRESS_API_URL}/cosyvoice/synthesize`,
        {
          voiceId: cosyVoice.voice_id,
          feedbackId: cosyVoice.feedback_id.toString()
        },
        {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      const synthesizeResult = synthesizeResponse.data.data;
      logResult(true, '手动语音合成请求成功', synthesizeResult);
      
      // 等待合成完成
      console.log(`${colors.yellow}[等待]${colors.reset} 等待10秒钟让语音合成完成...`);
      await new Promise(resolve => setTimeout(resolve, 10000)); // 等待10秒
      
      // 再次检查状态
      const finalStatusResponse = await axios.get(
        `${EXPRESS_API_URL}/cosyvoice/voice/${cosyVoice.voice_id}`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        }
      );
      
      const finalStatus = finalStatusResponse.data.data.cosyVoice;
      logResult(finalStatus.status === 'synthesized', '语音合成最终状态', finalStatus);
    } else if (cosyVoice.status === 'error') {
      logResult(false, '语音处理过程出错', {
        status: cosyVoice.status,
        error: cosyVoice.error
      });
    } else {
      logResult(false, '语音处理状态未达到预期', {
        status: cosyVoice.status
      });
    }
    
    // 步骤7: 通过feedback_id查询所有相关的CosyVoice记录
    logStep(7, '通过feedback_id查询相关CosyVoice记录');
    const feedbackVoicesResponse = await axios.get(
      `${EXPRESS_API_URL}/cosyvoice/feedback/${selectedFeedback._id.toString()}`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      }
    );
    
    const feedbackVoices = feedbackVoicesResponse.data.data.cosyVoices;
    logResult(true, `成功获取${feedbackVoices.length}条相关的CosyVoice记录`);
    console.log(`${colors.yellow}[数据]${colors.reset} 展示前2条记录:`);
    feedbackVoices.slice(0, 2).forEach((voice, index) => {
      console.log(`  ${index + 1}. voice_id: ${voice.voice_id}, status: ${voice.status}`);
    });
    
    // 测试完成
    console.log(`\n${colors.bright}${colors.green}[测试完成]${colors.reset} 语音克隆与合成流程测试成功完成！`);
    
  } catch (error) {
    // 处理错误
    logError(error);
    console.log(`\n${colors.bright}${colors.red}[测试中断]${colors.reset} 由于上述错误，测试提前终止`);
  } finally {
    // 关闭数据库连接
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log(`${colors.blue}[清理]${colors.reset} MongoDB连接已关闭`);
    }
  }
}

// 执行测试
console.log(`${colors.bright}${colors.magenta}[开始测试]${colors.reset} 语音克隆与合成功能测试脚本启动\n`);
console.log(`${colors.yellow}[配置]${colors.reset} Express API: ${EXPRESS_API_URL}`);
console.log(`${colors.yellow}[配置]${colors.reset} Flask API: ${FLASK_API_URL}`);
console.log(`${colors.yellow}[配置]${colors.reset} MongoDB: ${MONGODB_URI}\n`);

runTest().catch(error => {
  console.error(`${colors.red}[致命错误]${colors.reset} 未捕获的异常:`, error);
  process.exit(1);
}); 