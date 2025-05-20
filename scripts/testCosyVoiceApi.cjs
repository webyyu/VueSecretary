#!/usr/bin/env node
const axios = require('axios');
const chalk = require('chalk');
const ora = require('ora');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// 基础URL
const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

// 日志格式化
const log = {
  info: (message) => console.log(chalk.blue(`ℹ️ ${message}`)),
  success: (message) => console.log(chalk.green(`✅ ${message}`)),
  error: (message) => console.log(chalk.red(`❌ ${message}`)),
  warn: (message) => console.log(chalk.yellow(`⚠️ ${message}`)),
  title: (message) => console.log(chalk.magenta(`\n📋 ${message}\n${'-'.repeat(50)}`))
};

// 格式化输出结果
const formatOutput = (status, endpoint, data) => {
  const statusIcon = status ? chalk.green('✓ 成功') : chalk.red('✗ 失败');
  console.log(`\n${statusIcon} - ${endpoint}`);
  console.log(chalk.cyan('返回内容:'), JSON.stringify(data, null, 2));
  console.log('-'.repeat(50));
};

// 保存结果到文件
const saveResults = (data, filename) => {
  const resultsDir = path.resolve(__dirname, '../test-results');
  
  // 确保目录存在
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }
  
  const filePath = path.join(resultsDir, filename);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  
  log.success(`测试结果已保存到: ${filePath}`);
};

// 测试脚本主函数
async function testCosyVoiceAPI() {
  try {
    log.title('CosyVoice API 测试');
    log.info('开始执行测试...');
    
    // 存储测试结果
    const testResults = {
      timestamp: new Date().toISOString(),
      tests: {}
    };

    // 1. 登录获取token
    log.info('1. 登录获取token');
    let token = '';
    let userId = '';
    
    const loginSpinner = ora('正在登录...').start();
    try {
      const loginResponse = await axios.post(`${BASE_URL}/api/v1/auth/login`, {
        email: '1945243031@qq.com',
        password: '123456'
      });
      
      if (loginResponse.data && loginResponse.data.success) {
        // 成功响应的数据在 data 字段中
        token = loginResponse.data.data.token;
        userId = loginResponse.data.data.user._id || loginResponse.data.data.user.id;
      } else if (loginResponse.data && loginResponse.data.token) {
        // 直接返回 token 的情况
        token = loginResponse.data.token;
        userId = loginResponse.data.user._id || loginResponse.data.user.id;
      } else {
        throw new Error('登录响应中未找到 token 或 userId');
      }
      
      loginSpinner.succeed('登录成功');
      formatOutput(true, '/api/v1/auth/login', loginResponse.data);
      
      log.info(`用户ID: ${userId}`);
      log.info(`Token: ${token.substring(0, 15)}...`);
      
      testResults.tests.login = {
        success: true,
        userId,
        tokenStart: token.substring(0, 15)
      };
    } catch (error) {
      loginSpinner.fail('登录失败');
      formatOutput(false, '/api/v1/auth/login', error.response?.data || error.message);
      
      testResults.tests.login = {
        success: false,
        error: error.message
      };
      
      log.error('登录失败，终止测试');
      saveResults(testResults, 'cosyvoice-api-test.json');
      return;
    }

    // 设置后续请求的认证头
    const config = {
      headers: { Authorization: `Bearer ${token}` }
    };

    // 2. 获取最新的反馈ID
    log.info('2. 获取最新的反馈ID');
    let feedbackId;
    const feedbackSpinner = ora('获取反馈ID...').start();
    
    try {
      const feedbackResponse = await axios.get(
        `${BASE_URL}/api/v1/feedback/latest`, 
        config
      );
      
      // 尝试从不同的数据结构中获取 feedbackId
      if (feedbackResponse.data && feedbackResponse.data.success) {
        // 如果使用了包装响应
        feedbackId = feedbackResponse.data.data.id || feedbackResponse.data.data._id;
      } else {
        // 直接返回数据
        feedbackId = feedbackResponse.data.id || feedbackResponse.data._id;
      }
      
      feedbackSpinner.succeed('获取反馈ID成功');
      formatOutput(true, '/api/v1/feedback/latest', feedbackResponse.data);
      
      testResults.tests.getFeedback = {
        success: true,
        feedbackId
      };
    } catch (error) {
      feedbackSpinner.fail('获取反馈ID失败');
      formatOutput(false, '/api/v1/feedback/latest', error.response?.data || error.message);
      
      log.warn('使用模拟的反馈ID继续测试');
      feedbackId = '68232551729cfd49b0c7149d'; // 使用示例中提供的ID
      
      testResults.tests.getFeedback = {
        success: false,
        error: error.message,
        fallbackId: feedbackId
      };
    }

    // 3. 获取所有与反馈ID相关的CosyVoices
    log.info('3. 获取所有与反馈ID相关的CosyVoices');
    const cosyVoicesSpinner = ora('获取CosyVoices...').start();
    
    try {
      const cosyVoicesResponse = await axios.get(
        `${BASE_URL}/api/v1/cosyvoice/feedback/${feedbackId}`,
        config
      );
      
      cosyVoicesSpinner.succeed('获取CosyVoices成功');
      formatOutput(true, `/api/v1/cosyvoice/feedback/${feedbackId}`, cosyVoicesResponse.data);
      
      testResults.tests.getCosyVoices = {
        success: true,
        data: cosyVoicesResponse.data
      };
    } catch (error) {
      cosyVoicesSpinner.fail('获取CosyVoices失败');
      formatOutput(false, `/api/v1/cosyvoice/feedback/${feedbackId}`, error.response?.data || error.message);
      
      testResults.tests.getCosyVoices = {
        success: false,
        error: error.message
      };
    }

    // 4. 测试获取鼓励音频URL
    log.info('4. 测试获取鼓励音频URL');
    log.info(`使用的反馈ID: ${feedbackId}`);
    
    const encourageSpinner = ora('获取鼓励音频...').start();
    try {
      const audioResponse = await axios.get(
        `${BASE_URL}/api/v1/cosyvoice/feedback/${feedbackId}/audio?type=encourage`, 
        config
      );
      
      encourageSpinner.succeed('获取鼓励音频成功');
      formatOutput(true, `/api/v1/cosyvoice/feedback/${feedbackId}/audio?type=encourage`, audioResponse.data);
      
      // 验证URL是否可访问
      let audioUrl = '';
      if (audioResponse.data && audioResponse.data.data && audioResponse.data.data.url) {
        audioUrl = audioResponse.data.data.url;
        log.info(`验证鼓励音频URL是否可访问: ${audioUrl}`);
        
        const urlCheckSpinner = ora('验证URL可访问性...').start();
        try {
          const audioCheck = await axios.head(audioUrl);
          urlCheckSpinner.succeed(`音频URL可访问，状态码: ${audioCheck.status}`);
        } catch (err) {
          urlCheckSpinner.fail(`音频URL无法访问: ${err.message}`);
        }
      }
      
      testResults.tests.getEncourageAudio = {
        success: true,
        data: audioResponse.data,
        url: audioUrl
      };
    } catch (error) {
      encourageSpinner.fail('获取鼓励音频失败');
      formatOutput(false, `/api/v1/cosyvoice/feedback/${feedbackId}/audio?type=encourage`, error.response?.data || error.message);
      
      testResults.tests.getEncourageAudio = {
        success: false,
        error: error.message
      };
    }

    // 5. 测试获取批评音频URL
    log.info('5. 测试获取批评音频URL');
    const criticizeSpinner = ora('获取批评音频...').start();
    
    try {
      const criticizeResponse = await axios.get(
        `${BASE_URL}/api/v1/cosyvoice/feedback/${feedbackId}/audio?type=criticize`, 
        config
      );
      
      criticizeSpinner.succeed('获取批评音频成功');
      formatOutput(true, `/api/v1/cosyvoice/feedback/${feedbackId}/audio?type=criticize`, criticizeResponse.data);
      
      // 验证URL是否可访问
      let audioUrl = '';
      if (criticizeResponse.data && criticizeResponse.data.data && criticizeResponse.data.data.url) {
        audioUrl = criticizeResponse.data.data.url;
        log.info(`验证批评音频URL是否可访问: ${audioUrl}`);
        
        const urlCheckSpinner = ora('验证URL可访问性...').start();
        try {
          const audioCheck = await axios.head(audioUrl);
          urlCheckSpinner.succeed(`音频URL可访问，状态码: ${audioCheck.status}`);
        } catch (err) {
          urlCheckSpinner.fail(`音频URL无法访问: ${err.message}`);
        }
      }
      
      testResults.tests.getCriticizeAudio = {
        success: true,
        data: criticizeResponse.data,
        url: audioUrl
      };
    } catch (error) {
      criticizeSpinner.fail('获取批评音频失败');
      formatOutput(false, `/api/v1/cosyvoice/feedback/${feedbackId}/audio?type=criticize`, error.response?.data || error.message);
      
      testResults.tests.getCriticizeAudio = {
        success: false,
        error: error.message
      };
    }

    // 新增：process-full 测试调用
    log.info('6. 测试 process-full 新建/更新音色');
    try {
      const processFullResponse = await axios.post(
        `${BASE_URL.replace(/\/$/, '')}/process-full`,
        {
          audio_url: 'https://example.com/audio/test.wav', // 替换为实际音频URL
          user_id: userId,
          feedback_id: feedbackId,
          text_prompt: '测试文本' // 可根据实际需求填写
          // voice_id: '已有voiceId' // 如需更新音色时传递
        },
        config
      );
      formatOutput(true, '/process-full', processFullResponse.data);
      testResults.tests.processFull = {
        success: true,
        data: processFullResponse.data
      };
    } catch (error) {
      formatOutput(false, '/process-full', error.response?.data || error.message);
      testResults.tests.processFull = {
        success: false,
        error: error.message
      };
    }

    // 保存测试结果
    saveResults(testResults, 'cosyvoice-api-test.json');

    // 测试总结
    log.title('测试总结');
    const succeeded = Object.values(testResults.tests).filter(test => test.success).length;
    const failed = Object.values(testResults.tests).filter(test => !test.success).length;
    
    log.info(`总测试数: ${Object.keys(testResults.tests).length}`);
    log.success(`成功测试: ${succeeded}`);
    
    if (failed > 0) {
      log.error(`失败测试: ${failed}`);
    } else {
      log.success('所有测试通过！');
    }
    
    log.info('CosyVoice API 测试完成');

  } catch (error) {
    log.error('测试过程中发生错误:');
    console.error(error);
    process.exit(1);
  }
}

// 执行测试
testCosyVoiceAPI().catch(error => {
  console.error('未捕获的错误:', error);
  process.exit(1);
}); 