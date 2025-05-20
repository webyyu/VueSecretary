const axios = require('axios');

// 基础URL
const BASE_URL = 'http://localhost:3000';
// 用于存储token和userId
let token = '';
let userId = '';

// 格式化输出结果
const formatOutput = (status, endpoint, data) => {
  const statusIcon = status ? '✓ 成功' : '✗ 失败';
  console.log(`\n${statusIcon} - ${endpoint}`);
  console.log('返回内容:', JSON.stringify(data, null, 2));
  console.log('-'.repeat(50));
};

// 测试脚本主函数
async function runTests() {
  try {
    console.log('开始执行 CosyVoice 音频 API 测试...');
    console.log('='.repeat(50));

    // 1. 登录获取token
    console.log('\n1. 登录获取token');
    try {
      const loginResponse = await axios.post(`${BASE_URL}/api/v1/auth/login`, {
        email: '1945243031@qq.com',
        password: '123456'
      });
      
      // 检查返回数据结构，确保能正确解析 token 和 userId
      console.log('登录响应数据结构：', JSON.stringify(loginResponse.data, null, 2));
      
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
      
      formatOutput(true, '/api/v1/auth/login', loginResponse.data);
      console.log(`用户ID: ${userId}`);
      console.log(`Token: ${token.substring(0, 15)}...`);
    } catch (error) {
      formatOutput(false, '/api/v1/auth/login', error.response?.data || error.message);
      console.log('登录失败，终止测试');
      return;
    }

    // 设置后续请求的认证头
    const config = {
      headers: { Authorization: `Bearer ${token}` }
    };

    // 2. 获取最新的反馈ID
    console.log('\n2. 获取最新的反馈ID');
    let feedbackId;
    try {
      const feedbackResponse = await axios.get(
        `${BASE_URL}/api/v1/feedback/latest`, 
        config
      );
      
      // 检查返回数据结构
      console.log('反馈响应数据结构：', JSON.stringify(feedbackResponse.data, null, 2));
      
      // 尝试从不同的数据结构中获取 feedbackId
      if (feedbackResponse.data && feedbackResponse.data.success) {
        // 如果使用了包装响应
        feedbackId = feedbackResponse.data.data.id || feedbackResponse.data.data._id;
      } else {
        // 直接返回数据
        feedbackId = feedbackResponse.data.id || feedbackResponse.data._id;
      }
      
      formatOutput(true, '/api/v1/feedback/latest', feedbackResponse.data);
    } catch (error) {
      formatOutput(false, '/api/v1/feedback/latest', error.response?.data || error.message);
      console.log('使用模拟的反馈ID继续测试');
      feedbackId = '68232551729cfd49b0c7149d'; // 使用示例中提供的ID
    }

    // 3. 测试获取鼓励音频URL
    console.log('\n3. 测试获取鼓励音频URL');
    try {
      console.log(`使用的反馈ID: ${feedbackId}`);
      
      const audioResponse = await axios.get(
        `${BASE_URL}/api/v1/cosyvoice/feedback/${feedbackId}/audio?type=encourage`, 
        config
      );
      formatOutput(true, `/api/v1/cosyvoice/feedback/${feedbackId}/audio?type=encourage`, audioResponse.data);
    } catch (error) {
      formatOutput(false, `/api/v1/cosyvoice/feedback/${feedbackId}/audio?type=encourage`, error.response?.data || error.message);
    }

    // 4. 测试获取批评音频URL
    console.log('\n4. 测试获取批评音频URL');
    try {
      const criticizeResponse = await axios.get(
        `${BASE_URL}/api/v1/cosyvoice/feedback/${feedbackId}/audio?type=criticize`, 
        config
      );
      formatOutput(true, `/api/v1/cosyvoice/feedback/${feedbackId}/audio?type=criticize`, criticizeResponse.data);
    } catch (error) {
      formatOutput(false, `/api/v1/cosyvoice/feedback/${feedbackId}/audio?type=criticize`, error.response?.data || error.message);
    }

    console.log('\n测试完成！');
    console.log('='.repeat(50));

  } catch (error) {
    console.error('测试过程中发生错误:', error);
  }
}

// 执行测试
runTests();