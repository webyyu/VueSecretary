/**
 * 反馈信息生成API测试脚本
 * 
 * 使用 axios 测试反馈信息生成API的功能
 */

import axios from 'axios';
import chalk from 'chalk';

// 配置
const API_BASE_URL = 'http://localhost:3000/api/v1'; // 修改为你的实际API地址
const FEEDBACK_ENDPOINT = `${API_BASE_URL}/feedback`;

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
 * 测试生成反馈信息
 */
async function testGenerateFeedback() {
  log.title('测试生成反馈信息');
  
  try {
    const payload = {
      userInput: '我今天完成了项目报告，但是有一些小错误',
      encourageStyle: '热情鼓励',
      criticizeStyle: '委婉批评'
    };
    
    log.info(`发送请求：POST ${FEEDBACK_ENDPOINT}`);
    log.info(`请求数据: ${JSON.stringify(payload, null, 2)}`);
    
    const startTime = Date.now();
    const response = await axios.post(FEEDBACK_ENDPOINT, payload);
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
 * 测试获取所有反馈信息
 */
async function testGetAllFeedback() {
  log.title('测试获取所有反馈信息');
  
  try {
    const params = {
      page: 1,
      limit: 5
    };
    
    log.info(`发送请求：GET ${FEEDBACK_ENDPOINT}`);
    log.info(`请求参数: ${JSON.stringify(params, null, 2)}`);
    
    const response = await axios.get(FEEDBACK_ENDPOINT, { params });
    
    log.success('请求成功！');
    log.info(`总记录数: ${response.data.count}`);
    log.info(`当前页码: ${response.data.pagination.page}`);
    log.info(`每页记录数: ${response.data.pagination.limit}`);
    log.info(`总页数: ${response.data.pagination.pages}`);
    log.info('记录预览:');
    
    response.data.data.forEach((item, index) => {
      console.log(chalk.cyan(`[${index + 1}] ID: ${item._id}`));
      console.log(chalk.yellow(`    用户输入: ${item.userInput}`));
      console.log(chalk.green(`    鼓励信息: ${item.encourageMessage}`));
      console.log(chalk.red(`    批评信息: ${item.criticizeMessage}`));
      console.log();
    });
    
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
 * 测试获取单条反馈信息
 */
async function testGetFeedbackById(id) {
  log.title('测试获取单条反馈信息');
  
  if (!id) {
    log.warn('未提供反馈ID，尝试先生成一条反馈信息');
    const result = await testGenerateFeedback();
    id = result?.data?.id;
    
    if (!id) {
      log.error('无法获取反馈ID，测试终止');
      return;
    }
  }
  
  try {
    log.info(`发送请求：GET ${FEEDBACK_ENDPOINT}/${id}`);
    
    const response = await axios.get(`${FEEDBACK_ENDPOINT}/${id}`);
    
    log.success('请求成功！');
    log.info('记录详情:');
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
      userInput: '测试文本'
      // 缺少 encourageStyle 和 criticizeStyle 参数
    };
    
    log.info(`发送请求：POST ${FEEDBACK_ENDPOINT}`);
    log.info(`请求数据: ${JSON.stringify(payload, null, 2)}`);
    
    const response = await axios.post(FEEDBACK_ENDPOINT, payload);
    
    log.warn('请求成功，但期望失败，检查服务端验证');
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    if (error.response && error.response.status === 400) {
      log.success(`如期望的，请求因缺少参数而失败: ${error.response.data.error || error.response.data.message}`);
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
  log.title('开始反馈信息生成API测试');
  
  try {
    // 运行生成反馈测试并获取ID
    const generatedFeedback = await testGenerateFeedback();
    const feedbackId = generatedFeedback?.data?.id;
    
    // 运行获取单条反馈测试
    if (feedbackId) {
      await testGetFeedbackById(feedbackId);
    }
    
    // 运行获取所有反馈测试
    await testGetAllFeedback();
    
    // 运行错误处理测试
    await testMissingParameters();
    
    log.success('所有测试完成');
  } catch (error) {
    log.error(`测试过程中发生错误: ${error.message}`);
  }
}

// 检查命令行参数
const args = process.argv.slice(2);
if (args.length > 0) {
  if (args[0] === 'generate') {
    testGenerateFeedback();
  } else if (args[0] === 'getall') {
    testGetAllFeedback();
  } else if (args[0] === 'getone' && args[1]) {
    testGetFeedbackById(args[1]);
  } else if (args[0] === 'error') {
    testMissingParameters();
  } else {
    log.info('可用命令:');
    log.info('- generate: 测试生成反馈');
    log.info('- getall: 测试获取所有反馈');
    log.info('- getone [id]: 测试获取单条反馈');
    log.info('- error: 测试错误处理');
  }
} else {
  // 默认运行所有测试
  runAllTests();
} 