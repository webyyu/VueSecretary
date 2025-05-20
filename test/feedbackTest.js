import axios from 'axios';

// 配置
const API_BASE_URL = 'http://localhost:3000/api/v1'; // 修改为你的实际API地址
const FEEDBACK_ENDPOINT = `${API_BASE_URL}/feedback`;

/**
 * 测试生成反馈信息
 */
async function testGenerateFeedback() {
  console.log('\n=== 测试生成反馈信息 ===');
  
  try {
    const payload = {
      userInput: '我今天完成了项目报告，但是有一些小错误',
      encourageStyle: '热情鼓励',
      criticizeStyle: '委婉批评'
    };
    
    console.log(`发送请求：POST ${FEEDBACK_ENDPOINT}`);
    console.log(`请求数据: ${JSON.stringify(payload, null, 2)}`);
    
    const startTime = Date.now();
    
    // 设置CORS请求头
    const response = await axios.post(FEEDBACK_ENDPOINT, payload, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    const endTime = Date.now();
    
    console.log(`请求成功！耗时: ${endTime - startTime}ms`);
    console.log('响应数据:');
    console.log(JSON.stringify(response.data, null, 2));
    
    return response.data;
  } catch (error) {
    console.error(`请求失败: ${error.message}`);
    if (error.response) {
      console.error(`状态码: ${error.response.status}`);
      console.error(`错误详情: ${JSON.stringify(error.response.data, null, 2)}`);
    }
  }
}

// 执行测试
testGenerateFeedback(); 