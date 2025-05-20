/**
 * 语句生成API测试脚本
 * 
 * 使用 axios 测试语句生成API的功能
 */

const axios = require('axios');
const chalk = require('chalk');

// 配置
const API_BASE_URL = 'http://localhost:3000/api/v1'; // 修改为你的实际API地址
const SENTENCES_ENDPOINT = `${API_BASE_URL}/sentences`;

/**
 * 打印彩色日志
 */
const log = {
  info: (message) => console.log(chalk.blue(`[INFO] ${message}`)),
  success: (message) => console.log(chalk.green(`[SUCCESS] ${message}`)),
  error: (message) => console.log(chalk.red(`[ERROR] ${message}`)),
  warn: (message) => console.log(chalk.yellow(`[WARN] ${message}`)),
  title: (message) => console.log(chalk.magenta(`\n=== ${message} ===`))
};

/**
 * 测试生成一对鼓励和批评语句
 */
async function testGenerateSentencePair() {
  log.title('测试生成一对语句');
  
  try {
    const payload = {
      text: '我今天完成了项目报告，但是有一些小错误',
      encourageStyle: '热情鼓励',
      criticizeStyle: '委婉批评',
      characterStyle: '周杰伦'
    };
    
    log.info(`发送请求：POST ${SENTENCES_ENDPOINT}/generate`);
    log.info(`请求数据: ${JSON.stringify(payload, null, 2)}`);
    
    const startTime = Date.now();
    const response = await axios.post(`${SENTENCES_ENDPOINT}/generate`, payload);
    const endTime = Date.now();
    
    log.success(`请求成功！耗时: ${endTime - startTime}ms`);
    log.info('响应数据:');
    console.log(JSON.stringify(response.data, null, 2));
    
    return response.data;
  } catch (error) {
    log.error(`请求失败: ${error.message}`);
    if (error.response) {
      log.error(`状态码: ${error.response.status}`);
      log.error(`错误详情: ${JSON.stringify(error.response.data, null, 2)}`);
    }
  }
}

/**
 * 测试仅生成鼓励语句
 */
async function testGenerateEncourageSentence() {
  log.title('测试生成鼓励语句');
  
  try {
    const payload = {
      text: '我终于完成了这个艰难的项目',
      style: '热情鼓励',
      characterStyle: '马云'
    };
    
    log.info(`发送请求：POST ${SENTENCES_ENDPOINT}/encourage`);
    log.info(`请求数据: ${JSON.stringify(payload, null, 2)}`);
    
    const startTime = Date.now();
    const response = await axios.post(`${SENTENCES_ENDPOINT}/encourage`, payload);
    const endTime = Date.now();
    
    log.success(`请求成功！耗时: ${endTime - startTime}ms`);
    log.info('响应数据:');
    console.log(JSON.stringify(response.data, null, 2));
    
    return response.data;
  } catch (error) {
    log.error(`请求失败: ${error.message}`);
    if (error.response) {
      log.error(`状态码: ${error.response.status}`);
      log.error(`错误详情: ${JSON.stringify(error.response.data, null, 2)}`);
    }
  }
}

/**
 * 测试仅生成批评语句
 */
async function testGenerateCriticizeSentence() {
  log.title('测试生成批评语句');
  
  try {
    const payload = {
      text: '我完成了工作，但是迟交了两天',
      style: '委婉批评',
      characterStyle: '乔布斯'
    };
    
    log.info(`发送请求：POST ${SENTENCES_ENDPOINT}/criticize`);
    log.info(`请求数据: ${JSON.stringify(payload, null, 2)}`);
    
    const startTime = Date.now();
    const response = await axios.post(`${SENTENCES_ENDPOINT}/criticize`, payload);
    const endTime = Date.now();
    
    log.success(`请求成功！耗时: ${endTime - startTime}ms`);
    log.info('响应数据:');
    console.log(JSON.stringify(response.data, null, 2));
    
    return response.data;
  } catch (error) {
    log.error(`请求失败: ${error.message}`);
    if (error.response) {
      log.error(`状态码: ${error.response.status}`);
      log.error(`错误详情: ${JSON.stringify(error.response.data, null, 2)}`);
    }
  }
}

/**
 * 测试错误处理 - 缺少必要参数
 */
async function testMissingParameters() {
  log.title('测试错误处理 - 缺少必要参数');
  
  try {
    // 故意省略必要参数
    const payload = {
      text: '测试文本'
      // 缺少style参数
    };
    
    log.info(`发送请求：POST ${SENTENCES_ENDPOINT}/encourage`);
    log.info(`请求数据: ${JSON.stringify(payload, null, 2)}`);
    
    const response = await axios.post(`${SENTENCES_ENDPOINT}/encourage`, payload);
    
    log.warn('请求成功，但期望失败，检查服务端验证');
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    if (error.response && error.response.status === 400) {
      log.success(`如期望的，请求因缺少参数而失败: ${error.response.data.error}`);
    } else {
      log.error(`意外错误: ${error.message}`);
      if (error.response) {
        log.error(`状态码: ${error.response.status}`);
        log.error(`错误详情: ${JSON.stringify(error.response.data, null, 2)}`);
      }
    }
  }
}

/**
 * 运行所有测试
 */
async function runAllTests() {
  log.title('开始语句生成API测试');
  
  try {
    // 运行各项测试
    await testGenerateSentencePair();
    await testGenerateEncourageSentence();
    await testGenerateCriticizeSentence();
    await testMissingParameters();
    
    log.success('所有测试完成');
  } catch (error) {
    log.error(`测试过程中发生错误: ${error.message}`);
  }
}

// 执行测试
runAllTests(); 