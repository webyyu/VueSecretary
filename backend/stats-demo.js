/**
 * 统计模块 API 测试脚本
 * 
 * 用于测试统计模块的所有接口功能
 */

const axios = require('axios');
const chalk = require('chalk');
const dotenv = require('dotenv');

// 加载环境变量
dotenv.config();

// 设置 API 基础 URL
const API_URL = process.env.API_URL || 'http://localhost:3000/api/v1';
const EMAIL = 'abc1567849@gmail.com';
const PASSWORD = '123456';

// 创建 axios 实例
const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 用于保存认证信息
let authToken = '';

/**
 * 彩色日志输出函数
 */
const log = {
  info: (msg) => console.log(chalk.blue(`ℹ️ ${msg}`)),
  success: (msg) => console.log(chalk.green(`✅ ${msg}`)),
  error: (msg) => console.log(chalk.red(`❌ ${msg}`)),
  result: (data) => console.log(chalk.yellow('Response:'), JSON.stringify(data, null, 2)),
  title: (title) => console.log(chalk.cyan.bold(`\n=== ${title} ===\n`))
};

/**
 * 登录并获取认证令牌
 */
async function login() {
  log.info('正在登录系统...');
  
  try {
    const response = await api.post('/auth/login', {
      email: EMAIL,
      password: PASSWORD
    });
    
    log.result(response.data);
    
    // 检查API响应格式
    if (response.data && response.data.success && response.data.data) {
      // 新的API响应格式
      authToken = response.data.data.token;
    } else if (response.data && response.data.token) {
      // 旧的API响应格式
      authToken = response.data.token;
    } else {
      log.error('登录响应中没有找到认证令牌');
      return false;
    }
    
    if (authToken) {
      api.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
      log.success('登录成功！');
      return true;
    } else {
      log.error('无法提取认证令牌');
      return false;
    }
  } catch (error) {
    log.error(`登录失败: ${error.message}`);
    if (error.response) {
      log.result(error.response.data);
    }
    return false;
  }
}

/**
 * 从响应中提取数据
 */
function extractData(response) {
  if (response.data && response.data.success && response.data.data) {
    // 新的API响应格式
    return {
      data: response.data.data,
      success: true,
      message: response.data.message
    };
  } else if (response.data && response.data.status === 'success') {
    // 统计模块的响应格式
    return {
      data: response.data.data,
      success: true,
      message: '操作成功'
    };
  } else {
    // 其他响应格式
    return {
      data: response.data,
      success: !!response.data,
      message: '操作成功'
    };
  }
}

/**
 * 测试今日概览接口
 */
async function testTodaySummary() {
  log.title('测试今日概览接口');
  
  try {
    log.info('获取今日统计摘要...');
    const response = await api.get('/stats/today-summary');
    log.result(response.data);
    
    const { data, success } = extractData(response);
    
    if (success && data && 
        'completedTasks' in data && 
        'habitCheckins' in data && 
        'focusTime' in data) {
      log.success('成功获取今日统计摘要');
      return true;
    } else {
      log.error('请求成功但响应格式不正确');
      return false;
    }
  } catch (error) {
    log.error(`测试失败: ${error.message}`);
    if (error.response) {
      log.result(error.response.data);
    }
    return false;
  }
}

/**
 * 测试带日期参数的今日概览接口
 */
async function testTodaySummaryWithDate() {
  log.title('测试带日期参数的今日概览接口');
  
  try {
    // 使用特定日期参数
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = yesterday.toISOString().split('T')[0]; // 格式化为 YYYY-MM-DD
    
    log.info(`获取 ${dateStr} 的统计摘要...`);
    const response = await api.get(`/stats/today-summary?date=${dateStr}`);
    log.result(response.data);
    
    const { data, success } = extractData(response);
    
    if (success && data && 
        'completedTasks' in data && 
        'habitCheckins' in data && 
        'focusTime' in data) {
      log.success(`成功获取 ${dateStr} 的统计摘要`);
      return true;
    } else {
      log.error('请求成功但响应格式不正确');
      return false;
    }
  } catch (error) {
    log.error(`测试失败: ${error.message}`);
    if (error.response) {
      log.result(error.response.data);
    }
    return false;
  }
}

/**
 * 测试趋势数据接口 - 周趋势
 */
async function testWeeklyTrends() {
  log.title('测试周趋势数据接口');
  
  try {
    log.info('获取周趋势数据...');
    const response = await api.get('/stats/trends?timeRange=week');
    log.result(response.data);
    
    const { data, success } = extractData(response);
    
    if (success && data && 
        Array.isArray(data.labels) && 
        Array.isArray(data.datasets) &&
        data.datasets.length === 3) {
      log.success('成功获取周趋势数据');
      return true;
    } else {
      log.error('请求成功但响应格式不正确');
      return false;
    }
  } catch (error) {
    log.error(`测试失败: ${error.message}`);
    if (error.response) {
      log.result(error.response.data);
    }
    return false;
  }
}

/**
 * 测试趋势数据接口 - 月趋势
 */
async function testMonthlyTrends() {
  log.title('测试月趋势数据接口');
  
  try {
    log.info('获取月趋势数据...');
    const response = await api.get('/stats/trends?timeRange=month');
    log.result(response.data);
    
    const { data, success } = extractData(response);
    
    if (success && data && 
        Array.isArray(data.labels) && 
        Array.isArray(data.datasets) &&
        data.datasets.length === 3) {
      log.success('成功获取月趋势数据');
      return true;
    } else {
      log.error('请求成功但响应格式不正确');
      return false;
    }
  } catch (error) {
    log.error(`测试失败: ${error.message}`);
    if (error.response) {
      log.result(error.response.data);
    }
    return false;
  }
}

/**
 * 测试趋势数据接口 - 年趋势
 */
async function testYearlyTrends() {
  log.title('测试年趋势数据接口');
  
  try {
    log.info('获取年趋势数据...');
    const response = await api.get('/stats/trends?timeRange=year');
    log.result(response.data);
    
    const { data, success } = extractData(response);
    
    if (success && data && 
        Array.isArray(data.labels) && 
        Array.isArray(data.datasets) &&
        data.datasets.length === 3) {
      log.success('成功获取年趋势数据');
      return true;
    } else {
      log.error('请求成功但响应格式不正确');
      return false;
    }
  } catch (error) {
    log.error(`测试失败: ${error.message}`);
    if (error.response) {
      log.result(error.response.data);
    }
    return false;
  }
}

/**
 * 测试带日期参数的趋势数据接口
 */
async function testTrendsWithDate() {
  log.title('测试带日期参数的趋势数据接口');
  
  try {
    // 使用特定结束日期参数
    const endDate = new Date();
    endDate.setDate(endDate.getDate() - 5); // 5天前
    const dateStr = endDate.toISOString().split('T')[0]; // 格式化为 YYYY-MM-DD
    
    log.info(`获取截至 ${dateStr} 的周趋势数据...`);
    const response = await api.get(`/stats/trends?timeRange=week&endDate=${dateStr}`);
    log.result(response.data);
    
    const { data, success } = extractData(response);
    
    if (success && data && 
        Array.isArray(data.labels) && 
        Array.isArray(data.datasets) &&
        data.datasets.length === 3) {
      log.success(`成功获取截至 ${dateStr} 的周趋势数据`);
      return true;
    } else {
      log.error('请求成功但响应格式不正确');
      return false;
    }
  } catch (error) {
    log.error(`测试失败: ${error.message}`);
    if (error.response) {
      log.result(error.response.data);
    }
    return false;
  }
}

/**
 * 测试月度汇总接口
 */
async function testMonthlySummary() {
  log.title('测试月度汇总接口');
  
  try {
    // 获取当前月份的YYYY-MM格式
    const now = new Date();
    const month = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
    
    log.info(`获取 ${month} 的月度汇总数据...`);
    const response = await api.get(`/stats/monthly-summary?month=${month}`);
    log.result(response.data);
    
    const { data, success } = extractData(response);
    
    if (success && data && 
        Array.isArray(data.labels) && 
        Array.isArray(data.actualData) &&
        data.labels.length === data.actualData.length) {
      log.success(`成功获取 ${month} 的月度汇总数据`);
      return true;
    } else {
      log.error('请求成功但响应格式不正确');
      return false;
    }
  } catch (error) {
    log.error(`测试失败: ${error.message}`);
    if (error.response) {
      log.result(error.response.data);
    }
    return false;
  }
}

/**
 * 测试导出报告接口
 */
async function testExportStats() {
  log.title('测试导出报告接口');
  
  try {
    log.info('尝试导出PDF格式的统计报告...');
    
    try {
      const response = await api.get('/stats/export?reportType=pdf&timeRange=last_month');
      log.result(response.data);
      log.error('导出报告应当返回501状态码，但实际成功返回了');
      return false;
    } catch (error) {
      if (error.response && error.response.status === 501) {
        log.result(error.response.data);
        log.success('如预期一样，导出报告功能返回了501状态码（未实现）');
        return true;
      } else {
        log.error(`导出报告测试失败: ${error.message}`);
        if (error.response) {
          log.result(error.response.data);
        }
        return false;
      }
    }
  } catch (error) {
    log.error(`测试失败: ${error.message}`);
    return false;
  }
}

/**
 * 测试接口的错误处理 - 无效的日期格式
 */
async function testInvalidDateFormat() {
  log.title('测试无效日期格式的错误处理');
  
  try {
    log.info('使用无效的日期格式获取今日概览...');
    
    try {
      const response = await api.get('/stats/today-summary?date=invalid-date');
      log.result(response.data);
      log.error('应当返回错误，但实际成功返回了');
      return false;
    } catch (error) {
      if (error.response && (error.response.status === 400 || error.response.status === 500)) {
        log.result(error.response.data);
        log.success('如预期一样，无效日期格式返回了错误');
        return true;
      } else {
        log.error(`测试失败: ${error.message}`);
        if (error.response) {
          log.result(error.response.data);
        }
        return false;
      }
    }
  } catch (error) {
    log.error(`测试失败: ${error.message}`);
    return false;
  }
}

/**
 * 测试接口的错误处理 - 无效的时间范围
 */
async function testInvalidTimeRange() {
  log.title('测试无效时间范围的错误处理');
  
  try {
    log.info('使用无效的时间范围获取趋势数据...');
    
    try {
      const response = await api.get('/stats/trends?timeRange=invalid');
      log.result(response.data);
      log.error('应当返回错误，但实际成功返回了');
      return false;
    } catch (error) {
      if (error.response && (error.response.status === 400 || error.response.status === 500)) {
        log.result(error.response.data);
        log.success('如预期一样，无效时间范围返回了错误');
        return true;
      } else {
        log.error(`测试失败: ${error.message}`);
        if (error.response) {
          log.result(error.response.data);
        }
        return false;
      }
    }
  } catch (error) {
    log.error(`测试失败: ${error.message}`);
    return false;
  }
}

/**
 * 测试接口的错误处理 - 无效的月份格式
 */
async function testInvalidMonthFormat() {
  log.title('测试无效月份格式的错误处理');
  
  try {
    log.info('使用无效的月份格式获取月度汇总...');
    
    try {
      const response = await api.get('/stats/monthly-summary?month=invalid');
      log.result(response.data);
      log.error('应当返回错误，但实际成功返回了');
      return false;
    } catch (error) {
      if (error.response && (error.response.status === 400 || error.response.status === 500)) {
        log.result(error.response.data);
        log.success('如预期一样，无效月份格式返回了错误');
        return true;
      } else {
        log.error(`测试失败: ${error.message}`);
        if (error.response) {
          log.result(error.response.data);
        }
        return false;
      }
    }
  } catch (error) {
    log.error(`测试失败: ${error.message}`);
    return false;
  }
}

/**
 * 运行所有测试
 */
async function runAllTests() {
  log.title('统计模块 API 自动化测试');
  
  // 登录
  const loggedIn = await login();
  if (!loggedIn) {
    log.error('登录失败，中止测试');
    return;
  }
  
  // 测试成功计数
  let successCount = 0;
  let totalTests = 0;
  
  const runTest = async (testFn, name) => {
    totalTests++;
    const success = await testFn();
    if (success) successCount++;
    return success;
  };
  
  // 基础功能测试
  await runTest(testTodaySummary, '今日概览');
  await runTest(testTodaySummaryWithDate, '带日期参数的今日概览');
  await runTest(testWeeklyTrends, '周趋势数据');
  await runTest(testMonthlyTrends, '月趋势数据');
  await runTest(testYearlyTrends, '年趋势数据');
  await runTest(testTrendsWithDate, '带日期参数的趋势数据');
  await runTest(testMonthlySummary, '月度汇总');
  await runTest(testExportStats, '导出报告');
  
  // 错误处理测试
  await runTest(testInvalidDateFormat, '无效日期格式错误处理');
  await runTest(testInvalidTimeRange, '无效时间范围错误处理');
  await runTest(testInvalidMonthFormat, '无效月份格式错误处理');
  
  // 测试结果总结
  log.title('测试结果汇总');
  console.log(chalk.bold(`通过: ${successCount}/${totalTests} (${Math.round(successCount/totalTests*100)}%)`));
  
  if (successCount === totalTests) {
    log.success('所有测试都已通过!');
  } else {
    log.error(`${totalTests - successCount} 个测试未通过`);
  }
}

// 执行测试
runAllTests().catch(error => {
  log.error(`测试过程中出现未处理的错误: ${error.message}`);
  console.error(error);
}); 