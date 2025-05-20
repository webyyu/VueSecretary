const axios = require('axios');

// --- 配置 --- (请根据您的实际环境修改)
const BASE_URL = 'http://localhost:3000'; // 您的 API 基础 URL
const USER_EMAIL = 'abc1567849@gmail.com';
const USER_PASSWORD = '123456';

let authToken = null;
let testTaskId = null; // 用于测试的 taskId
let createdPomodoroSessionId = null;

// --- 辅助函数 ---
const logStep = (stepName, data) => {
  console.log(`\n--- ${stepName} ---`);
  if (data) {
    console.log(JSON.stringify(data, null, 2));
  }
};

const apiRequest = async (method, path, data = null, headers = {}) => {
  try {
    const config = {
      method,
      url: `${BASE_URL}${path}`,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };
    if (authToken) {
      config.headers['Authorization'] = `Bearer ${authToken}`;
    }
    if (data) {
      config.data = data;
    }
    const response = await axios(config);
    logStep(`SUCCESS: ${method} ${path}`, response.data);
    return response.data;
  } catch (error) {
    logStep(`ERROR: ${method} ${path}`, error.response ? error.response.data : error.message);
    throw error;
  }
};

// --- 测试步骤 ---

// 1. 用户登录
const login = async () => {
  logStep('1. 用户登录');
  // 假设登录接口为 /api/v1/auth/login，请根据实际情况修改
  const response = await apiRequest('POST', '/api/v1/auth/login', { email: USER_EMAIL, password: USER_PASSWORD });
  if (response && response.data && response.data.token) { // 假设 token 在 response.data.token 中
    authToken = response.data.token;
    console.log('登录成功, Token:', authToken);
  } else {
    console.error('登录失败或未获取到 Token');
    throw new Error('Login failed');
  }
};

// 2. 获取或创建一个任务ID (用于测试)
const getOrCreateTask = async () => {
  logStep('2. 获取或创建任务ID');
  // 假设获取任务列表的接口为 /api/v1/tasks
  // 并且假设返回的任务对象中有 _id 字段
  // 如果没有任务，您可能需要手动创建一个或调整此逻辑以创建任务
  try {
    const response = await apiRequest('GET', '/api/v1/tasks');
    if (response && response.data && response.data.length > 0) {
      testTaskId = response.data[0]._id; // 使用第一个任务的ID
      console.log('获取到测试任务ID:', testTaskId);
    } else {
      // 如果没有任务，尝试创建一个 (假设创建任务的接口和参数)
      console.log('没有找到现有任务，尝试创建一个新任务...');
      const newTaskResponse = await apiRequest('POST', '/api/v1/tasks', {
        title: 'Test Pomodoro Task',
        description: 'A task for testing Pomodoro API'
      });
      if (newTaskResponse && newTaskResponse.data && newTaskResponse.data._id) {
        testTaskId = newTaskResponse.data._id;
        console.log('新任务创建成功，任务ID:', testTaskId);
      } else {
        console.error('获取或创建任务ID失败');
        throw new Error('Failed to get or create a task ID');
      }
    }
  } catch (error) {
    console.error('获取任务列表失败，请确保至少有一个任务存在，或调整脚本以创建任务。');
    console.error('您也可以在此处硬编码一个已知的 testTaskId。');
    // 为了让脚本继续，您可以临时硬编码一个 taskId
    // testTaskId = 'YOUR_EXISTING_TASK_ID'; 
    // if (!testTaskId) throw error;
    throw error;
  }
  if (!testTaskId) {
      console.error('未能获取到 testTaskId，后续测试可能失败。');
      throw new Error('testTaskId is not set');
  }
};

// 3. 创建新的番茄钟会话
const createPomodoroSession = async () => {
  logStep('3. 创建新的番茄钟会话');
  const now = new Date();
  const startTime = now.toISOString();
  const endTime = new Date(now.getTime() + 25 * 60 * 1000).toISOString(); // 25 分钟后

  const pomodoroData = {
    duration: 1500, // 25 minutes in seconds
    startTime: startTime,
    endTime: endTime,
    notes: '测试番茄钟会话创建',
  };
  const response = await apiRequest('POST', `/api/v1/tasks/${testTaskId}/pomodoro`, pomodoroData);
  if (response && response.data && response.data._id) {
    createdPomodoroSessionId = response.data._id;
    console.log('番茄钟会话创建成功, Session ID:', createdPomodoroSessionId);
  } else {
    console.error('番茄钟会话创建失败');
    throw new Error('Failed to create Pomodoro session');
  }
};

// 4. 获取任务的所有番茄钟会话
const getAllPomodoroSessions = async () => {
  logStep('4. 获取任务的所有番茄钟会话');
  await apiRequest('GET', `/api/v1/tasks/${testTaskId}/pomodoro`);
};

// 5. 获取指定的番茄钟会话
const getSpecificPomodoroSession = async () => {
  logStep('5. 获取指定的番茄钟会话');
  if (!createdPomodoroSessionId) {
    console.error('没有可获取的番茄钟会话ID');
    return;
  }
  await apiRequest('GET', `/api/v1/tasks/${testTaskId}/pomodoro/${createdPomodoroSessionId}`);
};

// 6. 更新番茄钟会话
const updatePomodoroSession = async () => {
  logStep('6. 更新番茄钟会话');
  if (!createdPomodoroSessionId) {
    console.error('没有可更新的番茄钟会话ID');
    return;
  }
  const now = new Date();
  const startTime = new Date(now.getTime() + 5 * 60 * 1000).toISOString(); // 5分钟后开始
  const endTime = new Date(now.getTime() + 30 * 60 * 1000).toISOString();   // 30分钟后结束 (总时长25分钟)

  const updatedData = {
    duration: 1800, // 30 minutes in seconds
    startTime: startTime,
    endTime: endTime,
    notes: '更新后的番茄钟备注信息',
  };
  await apiRequest('PUT', `/api/v1/tasks/${testTaskId}/pomodoro/${createdPomodoroSessionId}`, updatedData);
};

// 7. 删除番茄钟会话
const deletePomodoroSession = async () => {
  logStep('7. 删除番茄钟会话');
  if (!createdPomodoroSessionId) {
    console.error('没有可删除的番茄钟会话ID');
    return;
  }
  // 对于 DELETE 请求，axios 在成功时 (204 No Content) response.data 可能为 undefined 或空字符串
  // 我们主要关心的是请求是否成功 (没有抛出错误)
  try {
    await axios({
        method: 'DELETE',
        url: `${BASE_URL}/api/v1/tasks/${testTaskId}/pomodoro/${createdPomodoroSessionId}`,
        headers: {
            'Authorization': `Bearer ${authToken}`
        }
    });
    logStep(`SUCCESS: DELETE /api/v1/tasks/${testTaskId}/pomodoro/${createdPomodoroSessionId}`, { message: 'Pomodoro session deleted successfully' });
  } catch (error) {
    logStep(`ERROR: DELETE /api/v1/tasks/${testTaskId}/pomodoro/${createdPomodoroSessionId}`, error.response ? error.response.data : error.message);
    throw error;
  }
};

// --- 主执行函数 ---
const runTests = async () => {
  try {
    await login();
    await getOrCreateTask();
    if (!testTaskId) {
        console.error("无法获取 Task ID，测试中止。");
        return;
    }
    await createPomodoroSession();
    if (!createdPomodoroSessionId) {
        console.error("无法创建番茄钟会话，后续依赖此会话的测试将跳过。");
    } else {
        await getAllPomodoroSessions();
        await getSpecificPomodoroSession();
        await updatePomodoroSession();
        await deletePomodoroSession();
    }
    logStep('所有番茄钟 API 测试完成!');
  } catch (error) {
    console.error('\n--- 测试过程中发生错误 ---');
    // 错误已在 apiRequest 中打印，这里可以添加额外处理
  }
};

runTests();