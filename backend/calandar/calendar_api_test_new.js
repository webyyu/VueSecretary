/**
 * 日历API自动化测试脚本
 * 
 * 这个脚本会自动测试日历任务管理API的所有功能，包括：
 * - 用户登录获取认证令牌
 * - 获取指定日期的任务列表
 * - 创建新任务
 * - 获取任务详情
 * - 更新任务信息
 * - 获取日期范围内的任务
 * - 删除任务
 * 
 * 使用方法: node test/calendar_api_test_new.js
 */

const axios = require('axios');

// 控制台颜色输出
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
};

// 基础配置
const BASE_URL = 'http://localhost:3000/api/v1';
const AUTH_URL = `${BASE_URL}/auth/login`;
const CALENDAR_URL = `${BASE_URL}/calendar`;

// 测试用户凭据
const TEST_USER = {
  email: 'abc1567849@gmail.com',
  password: '123456'
};

// 存储认证令牌和创建的任务ID
let authToken = '';
let createdTaskId = '';
let groupId = ''; // 用于存储任务分组ID
const GROUP_URL = `${BASE_URL}/task-groups`; // 修正任务分组URL

// 测试结果统计
const testResults = {
  total: 0,
  passed: 0,
  failed: 0
};

/**
 * 格式化日期为YYYY-MM-DD
 */
const formatDate = (date) => {
  return date.toISOString().split('T')[0];
};

/**
 * 获取当前日期和明天的日期
 */
const today = new Date();
const tomorrow = new Date(today);
tomorrow.setDate(tomorrow.getDate() + 1);

/**
 * 打印API调用的结果
 */
function logApiResult(endpoint, method, success, data) {
  testResults.total++;
  if (success) {
    testResults.passed++;
  } else {
    testResults.failed++;
  }
  
  const statusSymbol = success ? '✓' : '✗';
  const statusColor = success ? colors.green : colors.red;
  const statusText = success ? '成功' : '失败';
  
  console.log(`\n${statusColor}${statusSymbol} ${method.toUpperCase()} ${endpoint} - ${statusText}${colors.reset}`);
  console.log(colors.dim + JSON.stringify(data, null, 2) + colors.reset);
}

/**
 * 打印测试摘要
 */
function printTestSummary() {
  console.log(`\n${colors.bright}${colors.blue}====== 测试结果摘要 ======${colors.reset}`);
  console.log(`总测试数: ${testResults.total}`);
  console.log(`${colors.green}通过: ${testResults.passed}${colors.reset}`);
  console.log(`${colors.red}失败: ${testResults.failed}${colors.reset}`);
  console.log(`通过率: ${Math.round((testResults.passed / testResults.total) * 100)}%`);
}

/**
 * 用户登录接口
 */
async function login() {
  console.log(`\n${colors.bright}${colors.blue}====== 用户登录 ======${colors.reset}`);
  
  try {
    const response = await axios.post(AUTH_URL, TEST_USER);
    
    // 处理不同的响应结构
    if (response.data.token) {
      authToken = response.data.token;
    } else if (response.data.data?.token) {
      authToken = response.data.data.token;
    }
    
    if (!authToken) {
      throw new Error('响应中未找到认证令牌');
    }
    
    logApiResult('/auth/login', 'POST', true, response.data);
    console.log(`\n${colors.cyan}获取到认证令牌: ${authToken.substring(0, 15)}...${colors.reset}`);
    
    return true;
  } catch (error) {
    logApiResult('/auth/login', 'POST', false, {
      message: error.message,
      response: error.response?.data
    });
    return false;
  }
}

/**
 * 创建任务分组
 */
async function createTaskGroup() {
  console.log(`\n${colors.bright}${colors.blue}====== 创建新任务分组 ======${colors.reset}`);
  const newGroup = {
    name: `测试分组 ${new Date().toISOString()}`,
    // 你可以根据API要求添加其他必要的字段，例如颜色等
  };

  try {
    const response = await axios.post(
      GROUP_URL,
      newGroup,
      getAuthHeaders()
    );

    if (response.data.data?._id) {
      groupId = response.data.data._id;
    } else if (response.data.data?.id) {
      groupId = response.data.data.id;
    } else if (response.data._id) {
      groupId = response.data._id;
    }

    if (!groupId) {
      throw new Error('响应中未找到任务分组ID');
    }

    logApiResult('/calendar/groups', 'POST', true, response.data);
    console.log(`${colors.cyan}创建的任务分组ID: ${groupId}${colors.reset}`);
    return true;
  } catch (error) {
    logApiResult('/calendar/groups', 'POST', false, {
      message: error.message,
      response: error.response?.data
    });
    console.log(`${colors.red}创建任务分组失败，后续依赖此分组ID的测试可能失败。${colors.reset}`);
    return false;
  }
}

/**
 * 获取认证请求头
 */
const getAuthHeaders = () => {
  return {
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    }
  };
};

/**
 * 获取今天的任务列表
 */
async function getTodayTasks() {
  console.log(`\n${colors.bright}${colors.blue}====== 获取指定日期 (2025-04-28) 的任务列表 ======${colors.reset}`);
  
  try {
    const response = await axios.get(
      `${CALENDAR_URL}/tasks?date=2025-04-28`,
      getAuthHeaders()
    );
    
    logApiResult('/calendar/tasks?date=2025-04-28', 'GET', true, response.data);
    
    // 如果有任务，保存第一个任务的分组ID用于后续测试
    if (response.data.data && response.data.data.length > 0 && response.data.data[0].groupId) {
      if (typeof response.data.data[0].groupId === 'object') {
        groupId = response.data.data[0].groupId._id;
      } else {
        groupId = response.data.data[0].groupId;
      }
      console.log(`${colors.cyan}获取到任务分组ID: ${groupId}${colors.reset}`);
    } else {
      console.log(`${colors.yellow}未在现有任务中找到任务分组ID，尝试创建新分组...${colors.reset}`);
      const groupCreated = await createTaskGroup();
      if (!groupCreated) {
        console.log(`${colors.red}创建新任务分组失败，无法继续创建任务。${colors.reset}`);
        // 如果创建分组失败，可以选择返回false或抛出错误，以阻止后续依赖groupId的测试
        // 这里我们让groupId保持为空或无效状态，createTask会因此失败，符合预期
      }
    }
    
    return true;
  } catch (error) {
    logApiResult('/calendar/tasks?date=today', 'GET', false, {
      message: error.message,
      response: error.response?.data
    });
    return false;
  }
}

/**
 * 创建任务分组
 */
async function createTaskGroup() {
  console.log(`\n${colors.bright}${colors.blue}====== 创建新任务分组 ======${colors.reset}`);
  const newGroup = {
    name: `测试分组 ${new Date().toISOString()}`,
    // 你可以根据API要求添加其他必要的字段，例如颜色等
  };

  try {
    const response = await axios.post(
      GROUP_URL,
      newGroup,
      getAuthHeaders()
    );

    if (response.data.data?._id) {
      groupId = response.data.data._id;
    } else if (response.data.data?.id) {
      groupId = response.data.data.id;
    } else if (response.data._id) {
      groupId = response.data._id;
    }

    if (!groupId) {
      throw new Error('响应中未找到任务分组ID');
    }

    logApiResult('/calendar/groups', 'POST', true, response.data);
    console.log(`${colors.cyan}创建的任务分组ID: ${groupId}${colors.reset}`);
    return true;
  } catch (error) {
    logApiResult('/calendar/groups', 'POST', false, {
      message: error.message,
      response: error.response?.data
    });
    console.log(`${colors.red}创建任务分组失败，后续依赖此分组ID的测试可能失败。${colors.reset}`);
    return false;
  }
}

/**
 * 创建新任务
 */
async function createTask() {
  console.log(`\n${colors.bright}${colors.blue}====== 创建新任务 ======${colors.reset}`);
  
  const newTask = {
    name: `测试任务 ${new Date().toISOString()}`,
    groupId: groupId,
    priority: 'medium',
    dueDate: tomorrow.toISOString(),
    isImportant: true,
    isUrgent: false
  };
  
  try {
    const response = await axios.post(
      `${CALENDAR_URL}/tasks`,
      newTask,
      getAuthHeaders()
    );
    
    // 处理不同的响应结构，提取任务ID
    if (response.data.data?._id) {
      createdTaskId = response.data.data._id;
    } else if (response.data.data?.id) {
      createdTaskId = response.data.data.id;
    } else if (response.data._id) {
      createdTaskId = response.data._id;
    }
    
    logApiResult('/calendar/tasks', 'POST', true, response.data);
    console.log(`${colors.cyan}创建的任务ID: ${createdTaskId}${colors.reset}`);
    
    return true;
  } catch (error) {
    logApiResult('/calendar/tasks', 'POST', false, {
      message: error.message,
      response: error.response?.data
    });
    return false;
  }
}

/**
 * 创建任务分组
 */
async function createTaskGroup() {
  console.log(`\n${colors.bright}${colors.blue}====== 创建新任务分组 ======${colors.reset}`);
  const newGroup = {
    name: `测试分组 ${new Date().toISOString()}`,
    // 你可以根据API要求添加其他必要的字段，例如颜色等
  };

  try {
    const response = await axios.post(
      GROUP_URL,
      newGroup,
      getAuthHeaders()
    );

    if (response.data.data?._id) {
      groupId = response.data.data._id;
    } else if (response.data.data?.id) {
      groupId = response.data.data.id;
    } else if (response.data._id) {
      groupId = response.data._id;
    }

    if (!groupId) {
      throw new Error('响应中未找到任务分组ID');
    }

    logApiResult('/calendar/groups', 'POST', true, response.data);
    console.log(`${colors.cyan}创建的任务分组ID: ${groupId}${colors.reset}`);
    return true;
  } catch (error) {
    logApiResult('/calendar/groups', 'POST', false, {
      message: error.message,
      response: error.response?.data
    });
    console.log(`${colors.red}创建任务分组失败，后续依赖此分组ID的测试可能失败。${colors.reset}`);
    return false;
  }
}

/**
 * 获取任务详情
 */
async function getTaskDetail() {
  if (!createdTaskId) {
    console.log(`${colors.yellow}跳过获取任务详情测试：没有可用的任务ID${colors.reset}`);
    return false;
  }
  
  console.log(`\n${colors.bright}${colors.blue}====== 获取任务详情 ======${colors.reset}`);
  
  try {
    const response = await axios.get(
      `${CALENDAR_URL}/tasks/${createdTaskId}`,
      getAuthHeaders()
    );
    
    logApiResult(`/calendar/tasks/${createdTaskId}`, 'GET', true, response.data);
    return true;
  } catch (error) {
    logApiResult(`/calendar/tasks/${createdTaskId}`, 'GET', false, {
      message: error.message,
      response: error.response?.data
    });
    return false;
  }
}

/**
 * 创建任务分组
 */
async function createTaskGroup() {
  console.log(`\n${colors.bright}${colors.blue}====== 创建新任务分组 ======${colors.reset}`);
  const newGroup = {
    name: `测试分组 ${new Date().toISOString()}`,
    // 你可以根据API要求添加其他必要的字段，例如颜色等
  };

  try {
    const response = await axios.post(
      GROUP_URL,
      newGroup,
      getAuthHeaders()
    );

    if (response.data.data?._id) {
      groupId = response.data.data._id;
    } else if (response.data.data?.id) {
      groupId = response.data.data.id;
    } else if (response.data._id) {
      groupId = response.data._id;
    }

    if (!groupId) {
      throw new Error('响应中未找到任务分组ID');
    }

    logApiResult('/calendar/groups', 'POST', true, response.data);
    console.log(`${colors.cyan}创建的任务分组ID: ${groupId}${colors.reset}`);
    return true;
  } catch (error) {
    logApiResult('/calendar/groups', 'POST', false, {
      message: error.message,
      response: error.response?.data
    });
    console.log(`${colors.red}创建任务分组失败，后续依赖此分组ID的测试可能失败。${colors.reset}`);
    return false;
  }
}

/**
 * 更新任务
 */
async function updateTask() {
  if (!createdTaskId) {
    console.log(`${colors.yellow}跳过更新任务测试：没有可用的任务ID${colors.reset}`);
    return false;
  }
  
  console.log(`\n${colors.bright}${colors.blue}====== 更新任务 ======${colors.reset}`);
  
  const updateData = {
    name: `更新后的任务 ${new Date().toISOString()}`,
    priority: 'high',
    isImportant: true,
    isUrgent: true
  };
  
  try {
    const response = await axios.put(
      `${CALENDAR_URL}/tasks/${createdTaskId}`,
      updateData,
      getAuthHeaders()
    );
    
    logApiResult(`/calendar/tasks/${createdTaskId}`, 'PUT', true, response.data);
    return true;
  } catch (error) {
    logApiResult(`/calendar/tasks/${createdTaskId}`, 'PUT', false, {
      message: error.message,
      response: error.response?.data
    });
    return false;
  }
}

/**
 * 创建任务分组
 */
async function createTaskGroup() {
  console.log(`\n${colors.bright}${colors.blue}====== 创建新任务分组 ======${colors.reset}`);
  const newGroup = {
    name: `测试分组 ${new Date().toISOString()}`,
    // 你可以根据API要求添加其他必要的字段，例如颜色等
  };

  try {
    const response = await axios.post(
      GROUP_URL,
      newGroup,
      getAuthHeaders()
    );

    if (response.data.data?._id) {
      groupId = response.data.data._id;
    } else if (response.data.data?.id) {
      groupId = response.data.data.id;
    } else if (response.data._id) {
      groupId = response.data._id;
    }

    if (!groupId) {
      throw new Error('响应中未找到任务分组ID');
    }

    logApiResult('/calendar/groups', 'POST', true, response.data);
    console.log(`${colors.cyan}创建的任务分组ID: ${groupId}${colors.reset}`);
    return true;
  } catch (error) {
    logApiResult('/calendar/groups', 'POST', false, {
      message: error.message,
      response: error.response?.data
    });
    console.log(`${colors.red}创建任务分组失败，后续依赖此分组ID的测试可能失败。${colors.reset}`);
    return false;
  }
}

/**
 * 获取日期范围内的任务
 */
async function getTasksByDateRange() {
  console.log(`\n${colors.bright}${colors.blue}====== 获取日期范围内的任务 ======${colors.reset}`);
  
  const startDate = formatDate(today);
  const endDate = formatDate(tomorrow);
  
  try {
    const response = await axios.get(
      `${CALENDAR_URL}/tasks?startDate=${startDate}&endDate=${endDate}`,
      getAuthHeaders()
    );
    
    logApiResult(`/calendar/tasks?startDate=${startDate}&endDate=${endDate}`, 'GET', true, response.data);
    return true;
  } catch (error) {
    logApiResult(`/calendar/tasks?startDate=${startDate}&endDate=${endDate}`, 'GET', false, {
      message: error.message,
      response: error.response?.data
    });
    return false;
  }
}

/**
 * 创建任务分组
 */
async function createTaskGroup() {
  console.log(`\n${colors.bright}${colors.blue}====== 创建新任务分组 ======${colors.reset}`);
  const newGroup = {
    name: `测试分组 ${new Date().toISOString()}`,
    // 你可以根据API要求添加其他必要的字段，例如颜色等
  };

  try {
    const response = await axios.post(
      GROUP_URL,
      newGroup,
      getAuthHeaders()
    );

    if (response.data.data?._id) {
      groupId = response.data.data._id;
    } else if (response.data.data?.id) {
      groupId = response.data.data.id;
    } else if (response.data._id) {
      groupId = response.data._id;
    }

    if (!groupId) {
      throw new Error('响应中未找到任务分组ID');
    }

    logApiResult('/calendar/groups', 'POST', true, response.data);
    console.log(`${colors.cyan}创建的任务分组ID: ${groupId}${colors.reset}`);
    return true;
  } catch (error) {
    logApiResult('/calendar/groups', 'POST', false, {
      message: error.message,
      response: error.response?.data
    });
    console.log(`${colors.red}创建任务分组失败，后续依赖此分组ID的测试可能失败。${colors.reset}`);
    return false;
  }
}

/**
 * 删除任务
 */
async function deleteTask() {
  if (!createdTaskId) {
    console.log(`${colors.yellow}跳过删除任务测试：没有可用的任务ID${colors.reset}`);
    return false;
  }
  
  console.log(`\n${colors.bright}${colors.blue}====== 删除任务 ======${colors.reset}`);
  
  try {
    const response = await axios.delete(
      `${CALENDAR_URL}/tasks/${createdTaskId}`,
      getAuthHeaders()
    );
    
    logApiResult(`/calendar/tasks/${createdTaskId}`, 'DELETE', true, response.data);
    return true;
  } catch (error) {
    logApiResult(`/calendar/tasks/${createdTaskId}`, 'DELETE', false, {
      message: error.message,
      response: error.response?.data
    });
    return false;
  }
}

/**
 * 创建任务分组
 */
async function createTaskGroup() {
  console.log(`\n${colors.bright}${colors.blue}====== 创建新任务分组 ======${colors.reset}`);
  const newGroup = {
    name: `测试分组 ${new Date().toISOString()}`,
    // 你可以根据API要求添加其他必要的字段，例如颜色等
  };

  try {
    const response = await axios.post(
      GROUP_URL,
      newGroup,
      getAuthHeaders()
    );

    if (response.data.data?._id) {
      groupId = response.data.data._id;
    } else if (response.data.data?.id) {
      groupId = response.data.data.id;
    } else if (response.data._id) {
      groupId = response.data._id;
    }

    if (!groupId) {
      throw new Error('响应中未找到任务分组ID');
    }

    logApiResult('/calendar/groups', 'POST', true, response.data);
    console.log(`${colors.cyan}创建的任务分组ID: ${groupId}${colors.reset}`);
    return true;
  } catch (error) {
    logApiResult('/calendar/groups', 'POST', false, {
      message: error.message,
      response: error.response?.data
    });
    console.log(`${colors.red}创建任务分组失败，后续依赖此分组ID的测试可能失败。${colors.reset}`);
    return false;
  }
}

/**
 * 主函数：按顺序执行所有测试
 */
async function runTests() {
  console.log(`${colors.bright}${colors.blue}====== 开始日历API测试 ======${colors.reset}`);
  console.log(`测试时间: ${new Date().toLocaleString()}`);
  
  // 登录获取认证令牌
  const loginSuccess = await login();
  if (!loginSuccess) {
    console.log(`${colors.red}登录失败，无法继续测试${colors.reset}`);
    printTestSummary();
    return;
  }
  
  // 执行其他测试
  await getTodayTasks(); // getTodayTasks 内部可能会调用 createTaskGroup
  
  // 确保在调用createTask之前groupId是有效的
  if (!groupId) {
    console.log(`${colors.red}未能获取或创建任务分组ID，跳过创建任务及后续相关测试。${colors.reset}`);
    printTestSummary();
    return;
  }
  await createTask();
  await getTaskDetail();
  await updateTask();
  await getTasksByDateRange();
  await deleteTask();
  
  // 打印测试摘要
  printTestSummary();
}

// 执行测试
runTests().catch(error => {
  console.error(`${colors.red}测试过程中发生错误: ${error.message}${colors.reset}`);
});