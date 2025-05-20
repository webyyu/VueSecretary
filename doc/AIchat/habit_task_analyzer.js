const axios = require('axios');
const readline = require('readline');
const fs = require('fs');
const path = require('path');

// 配置参数
const ARK_API_KEY = "6edbe8d5-7584-4c69-b062-6ef8c4d367f4";
const API_URL = "https://ark.cn-beijing.volces.com/api/v3/chat/completions";
const MODEL_NAME = "ep-20250427122528-dvmvp";

// 文件路径配置
const HABITS_FILE = 'habits.json';

// 创建readline接口用于获取用户输入
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// 优化后的提示词模板 - 添加习惯识别功能
const SYSTEM_PROMPT = `你是一个专业的事件、任务和习惯分析助手。你需要分析用户输入的自然语言，提取出"具体事件"、"任务"和"习惯"，并进行结构化输出。

重要分析规则：
1. 首先准确区分"事件"、"任务"和"习惯"：
   - 事件：指定时间点需要参与的活动，如"开会"、"打电话"、"面试"、"看电影"、"打游戏"等
   - 任务：需要完成的工作项目，通常包含多个步骤，如"准备演讲"、"完成报告"、"策划活动"等
   - 习惯：用户希望长期养成的规律性行为，通常包含"开始做某事"、"每天/每周做某事"等表述，如"开始健身"、"每天读书"等
   - 娱乐类活动如"打游戏"、"看电影"、"听音乐"等应归类为事件，而非任务或习惯
   
2. 对于任务，必须进行智能拆解为3-5个具体子任务
   - 例如："准备演讲"应拆解为"收集资料"、"撰写提纲"、"制作幻灯片"、"练习演讲"等
   - 为每个任务和子任务分配合理的优先级和预估完成时间

3. 对于习惯，必须进行详细分析：
   - 识别用户想要养成的习惯内容
   - 确定习惯的频率（每天、每周几次等）
   - 提供具体的执行计划和追踪方式
   - 对习惯提出合理的建议，如开始时间、持续时长等
   - 如果是"健身"类习惯，需要提供具体的健身方案和计划

4. 时间规划非常重要：
   - 对于明确时间点的事件，保留原始时间
   - 对于有截止日期的任务（如"周五之前完成"），提供合理的时间安排
   - 对于习惯，提供合理的开始时间和执行频率
   - 计算当前日期，并考虑用户提到的时间点进行合理的时间安排
   - 时间安排应尽量具体，包括日期和时间段
   
5. 严格按照以下JSON格式输出结果：
   {
     "events": [
       {
         "time": "事件时间（尽量具体到日期和时刻）",
         "content": "事件内容",
         "location": "事件地点（如有）",
         "priority": "优先级评估（高/中/低）"
       }
     ],
     "tasks": [
       {
         "title": "任务标题",
         "deadline": "截止日期（如有）",
         "subtasks": [
           {
             "content": "子任务1",
             "scheduledTime": "建议执行时间",
             "estimatedDuration": "预估用时"
           },
           {
             "content": "子任务2",
             "scheduledTime": "建议执行时间",
             "estimatedDuration": "预估用时"
           }
         ],
         "priority": "优先级建议（高/中/低）",
         "totalEstimatedDuration": "总预估完成时间"
       }
     ],
     "habits": [
       {
         "title": "习惯标题",
         "category": "习惯类别（健身、学习、阅读等）",
         "frequency": "执行频率（每天、每周几次等）",
         "duration": "每次持续时间",
         "startDate": "建议开始日期",
         "schedule": "建议执行时间（如晚上8点-9点）",
         "plan": {
           "steps": ["具体步骤1", "具体步骤2", "具体步骤3"],
           "milestones": ["第一周目标", "第一个月目标"],
           "tracking": "建议的追踪方式"
         },
         "tips": ["相关建议1", "相关建议2"]
       }
     ]
   }

重要格式要求：
- 你必须只返回有效的JSON格式，不要包含任何其他解释或文本
- 如果没有识别到任何事件，events数组应为空数组，而不是null
- 如果没有识别到任何任务，tasks数组应为空数组，而不是null
- 如果没有识别到任何习惯，habits数组应为空数组，而不是null
- 对于未明确提及的信息，地点可以为空字符串，但时间和优先级必须合理推断
- 结果必须是严格有效的JSON格式，可以被JSON.parse()直接解析`;

/**
 * 获取当前日期和时间的字符串
 */
function getCurrentDateTime() {
  const now = new Date();
  return now.toLocaleString('zh-CN', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
}

/**
 * 加载已有习惯数据
 */
function loadHabits() {
  try {
    if (fs.existsSync(HABITS_FILE)) {
      const data = fs.readFileSync(HABITS_FILE, 'utf8');
      return JSON.parse(data);
    }
    return { habits: [] };
  } catch (error) {
    console.error('加载习惯数据失败:', error.message);
    return { habits: [] };
  }
}

/**
 * 保存习惯数据
 */
function saveHabits(habitsData) {
  try {
    const data = JSON.stringify(habitsData, null, 2);
    fs.writeFileSync(HABITS_FILE, data, 'utf8');
    console.log(`习惯数据已保存至 ${HABITS_FILE}`);
  } catch (error) {
    console.error('保存习惯数据失败:', error.message);
  }
}

/**
 * 调用AI模型处理用户输入
 * @param {string} userInput - 用户输入的文本
 * @returns {Promise<object>} - 解析后的结构化数据
 */
async function analyzeInput(userInput) {
  console.log("正在分析...");
  
  const currentDateTime = getCurrentDateTime();
  
  // 增强提示，包含当前时间以便于模型做出更好的时间规划
  const enhancedPrompt = `当前时间是${currentDateTime}。请分析以下输入：\n\n${userInput}`;
  
  // 请求数据
  const payload = {
    model: MODEL_NAME,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: enhancedPrompt }
    ],
    temperature: 0.2  // 降低随机性，使输出更加确定性
  };

  // 记录开始时间
  const startTime = Date.now();
  
  try {
    // 发送POST请求
    const response = await axios.post(API_URL, payload, {
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${ARK_API_KEY}`,
        "Accept-Charset": "utf-8"
      },
      timeout: 30000 // 30秒超时设置
    });

    // 计算响应时间（毫秒）
    const responseTime = Date.now() - startTime;
    
    // 解析结果
    const result = response.data;
    const assistantMessage = result.choices[0].message.content;
    
    // 尝试将结果解析为JSON
    let parsedResult;
    try {
      // 尝试清理可能存在的非JSON内容（如引号或说明文字）
      let cleanedContent = assistantMessage.trim();
      
      // 如果内容被```包围，则移除这些标记
      if (cleanedContent.startsWith('```json')) {
        cleanedContent = cleanedContent.substring(7);
      } else if (cleanedContent.startsWith('```')) {
        cleanedContent = cleanedContent.substring(3);
      }
      
      if (cleanedContent.endsWith('```')) {
        cleanedContent = cleanedContent.substring(0, cleanedContent.length - 3);
      }
      
      cleanedContent = cleanedContent.trim();
      
      // 解析JSON
      parsedResult = JSON.parse(cleanedContent);
      
      // 确保events、tasks和habits至少是空数组
      if (!parsedResult.events) parsedResult.events = [];
      if (!parsedResult.tasks) parsedResult.tasks = [];
      if (!parsedResult.habits) parsedResult.habits = [];
      
      // 验证JSON格式是否符合预期
      validateJsonStructure(parsedResult);
      
    } catch (error) {
      console.log("AI返回的不是有效JSON格式，原始输出：");
      console.log(assistantMessage);
      // 构造一个默认的空结果
      parsedResult = { 
        events: [],
        tasks: [],
        habits: [],
        error: "解析失败: " + error.message,
        raw: assistantMessage
      };
    }
    
    return {
      data: parsedResult,
      responseTime,
      tokenUsage: result.usage,
      currentTime: currentDateTime
    };
  } catch (error) {
    console.error("请求失败:", error.message);
    if (error.response) {
      console.error("错误状态码:", error.response.status);
      console.error("错误详情:", error.response.data);
    } else if (error.request) {
      console.error("未收到响应，可能是网络问题或超时");
    }
    throw error;
  }
}

/**
 * 验证JSON结构是否符合预期格式
 */
function validateJsonStructure(data) {
  // 检查events数组
  if (data.events && Array.isArray(data.events)) {
    for (const event of data.events) {
      if (!event.time) event.time = "未指定时间";
      if (!event.content) event.content = "未知事件";
      if (!event.priority) event.priority = "中";
      if (!event.location) event.location = "";
    }
  }
  
  // 检查tasks数组
  if (data.tasks && Array.isArray(data.tasks)) {
    for (const task of data.tasks) {
      if (!task.title) task.title = "未命名任务";
      if (!task.priority) task.priority = "中";
      if (!task.totalEstimatedDuration) task.totalEstimatedDuration = "未知";
      if (!task.deadline) task.deadline = "无截止日期";
      
      // 确保subtasks是数组且有内容
      if (!task.subtasks || !Array.isArray(task.subtasks) || task.subtasks.length === 0) {
        task.subtasks = [{ 
          content: "完成" + task.title, 
          scheduledTime: "尽快", 
          estimatedDuration: "未知" 
        }];
      } else {
        // 确保每个子任务都有完整信息
        for (const subtask of task.subtasks) {
          if (typeof subtask === 'string') {
            // 如果子任务只是字符串，转换为正确的格式
            const content = subtask;
            task.subtasks[task.subtasks.indexOf(subtask)] = {
              content: content,
              scheduledTime: "尽快",
              estimatedDuration: "未知"
            };
          } else {
            if (!subtask.content) subtask.content = "未命名子任务";
            if (!subtask.scheduledTime) subtask.scheduledTime = "尽快";
            if (!subtask.estimatedDuration) subtask.estimatedDuration = "未知";
          }
        }
      }
    }
  }
  
  // 检查habits数组
  if (data.habits && Array.isArray(data.habits)) {
    for (const habit of data.habits) {
      if (!habit.title) habit.title = "未命名习惯";
      if (!habit.category) habit.category = "其他";
      if (!habit.frequency) habit.frequency = "每天";
      if (!habit.duration) habit.duration = "未指定";
      if (!habit.startDate) habit.startDate = "今天";
      if (!habit.schedule) habit.schedule = "灵活安排";
      
      // 确保plan对象存在
      if (!habit.plan) {
        habit.plan = {
          steps: ["开始践行该习惯"],
          milestones: ["坚持一周", "坚持一个月"],
          tracking: "使用习惯追踪App记录"
        };
      } else {
        if (!habit.plan.steps || !Array.isArray(habit.plan.steps) || habit.plan.steps.length === 0) {
          habit.plan.steps = ["开始践行该习惯"];
        }
        if (!habit.plan.milestones || !Array.isArray(habit.plan.milestones) || habit.plan.milestones.length === 0) {
          habit.plan.milestones = ["坚持一周", "坚持一个月"];
        }
        if (!habit.plan.tracking) {
          habit.plan.tracking = "使用习惯追踪App记录";
        }
      }
      
      // 确保tips数组存在
      if (!habit.tips || !Array.isArray(habit.tips) || habit.tips.length === 0) {
        habit.tips = ["保持一致性是培养习惯的关键"];
      }
    }
  }
  
  return data;
}

/**
 * 处理习惯，保存到习惯集合中
 */
function processHabits(result) {
  if (result.habits && result.habits.length > 0) {
    // 加载现有习惯
    const habitsData = loadHabits();
    let hasNewHabits = false;
    
    // 添加新习惯，避免重复
    for (const habit of result.habits) {
      // 检查是否已存在相同习惯
      const existingHabitIndex = habitsData.habits.findIndex(h => 
        h.title.toLowerCase() === habit.title.toLowerCase() &&
        h.category.toLowerCase() === habit.category.toLowerCase()
      );
      
      if (existingHabitIndex >= 0) {
        console.log(`习惯 "${habit.title}" 已存在，更新信息...`);
        habitsData.habits[existingHabitIndex] = {
          ...habitsData.habits[existingHabitIndex],
          ...habit,
          updatedAt: getCurrentDateTime()
        };
      } else {
        console.log(`添加新习惯: "${habit.title}"`);
        habitsData.habits.push({
          ...habit,
          createdAt: getCurrentDateTime(),
          updatedAt: getCurrentDateTime(),
          streak: 0,  // 连续执行次数
          totalCompletions: 0,  // 总完成次数
          lastCompleted: null  // 上次完成时间
        });
      }
      hasNewHabits = true;
    }
    
    if (hasNewHabits) {
      // 保存更新后的习惯数据
      saveHabits(habitsData);
      return true;
    }
  }
  return false;
}

/**
 * 显示所有习惯
 */
function showAllHabits() {
  const habitsData = loadHabits();
  
  if (habitsData.habits.length === 0) {
    console.log("当前没有记录的习惯。");
    return;
  }
  
  console.log("\n=== 已记录的习惯 ===");
  habitsData.habits.forEach((habit, index) => {
    console.log(`\n${index + 1}. ${habit.title} (${habit.category})`);
    console.log(`   频率: ${habit.frequency}`);
    console.log(`   计划时间: ${habit.schedule}`);
    console.log(`   已坚持: ${habit.streak} 次连续, 共 ${habit.totalCompletions} 次`);
    console.log(`   上次完成: ${habit.lastCompleted || '从未'}`);
  });
  console.log("\n");
}

/**
 * 运行一次测试用例
 */
async function runTest(testInput) {
  console.log(`\n测试输入: "${testInput}"\n`);
  
  try {
    const result = await analyzeInput(testInput);
    
    console.log("分析结果：");
    console.log(JSON.stringify(result.data, null, 2));
    
    // 处理习惯
    if (result.data.habits && result.data.habits.length > 0) {
      console.log("\n检测到习惯信息，正在处理...");
      processHabits(result.data);
    }
    
    console.log(`\n基于当前时间: ${result.currentTime}`);
    console.log(`响应时间: ${result.responseTime}ms`);
    console.log(`Token使用: 输入=${result.tokenUsage.prompt_tokens}, 输出=${result.tokenUsage.completion_tokens}, 总计=${result.tokenUsage.total_tokens}`);
    
    return result;
  } catch (error) {
    console.error("测试失败:", error);
    return null;
  }
}

/**
 * 主函数 - 交互模式
 */
async function interactiveMode() {
  console.log("欢迎使用事件、任务和习惯分析器！");
  console.log("请输入您的日程或任务描述，或输入以下命令：");
  console.log("- test1: 测试事件场景 (如会议安排)");
  console.log("- test2: 测试任务场景 (如准备演讲)");
  console.log("- test3: 测试混合场景 (事件+任务)");
  console.log("- test4: 测试习惯场景 (如开始健身)");
  console.log("- habits: 查看所有已记录的习惯");
  console.log("- exit: 退出程序");
  console.log("---------------------------------------------");
  
  rl.on('line', async (input) => {
    if (input.toLowerCase() === 'exit' || input.toLowerCase() === 'quit') {
      console.log("感谢使用，再见！");
      rl.close();
      return;
    }
    
    if (input.toLowerCase() === 'habits') {
      showAllHabits();
    }
    // 预设测试用例
    else if (input.toLowerCase() === 'test1') {
      await runTest("早上十一点有会议，十二点想打电话给妈妈，晚上七点面试");
    } 
    else if (input.toLowerCase() === 'test2') {
      await runTest("我要准备明天的演讲，拆分下任务吧");
    }
    else if (input.toLowerCase() === 'test3') {
      await runTest("明天上午9点开会，中午12点吃饭，下午3点去健身房，还有需要准备周报，晚上还想打一个游戏");
    }
    else if (input.toLowerCase() === 'test4') {
      await runTest("从今天开始我要养成每天健身的习惯，每周至少去健身房3次，每次1小时");
    }
    else {
      try {
        await runTest(input);
      } catch (error) {
        console.error("处理失败，请重试。");
      }
    }
    
    console.log("\n请输入新的描述，或输入'exit'退出：");
  });
}

/**
 * 一次性处理多个测试用例
 */
async function batchTest() {
  const testCases = [
    "早上十一点有会议，十二点想打电话给妈妈，晚上七点面试",
    "我要准备明天的演讲，拆分下任务吧",
    "明天上午9点开会，中午12点吃饭，下午3点去健身房，还有需要准备周报，晚上还想打一个游戏",
    "需要完成项目报告，周五之前交给经理",
    "这周末想去看一场电影",
    "从今天开始我要养成每天健身的习惯，每周至少去健身房3次，每次1小时",
    "我打算开始每天读书，希望能持续下去"
  ];
  
  console.log("开始批量测试...\n");
  
  for (const testCase of testCases) {
    await runTest(testCase);
    console.log("---------------------------------------------");
  }
  
  console.log("\n批量测试完成");
  console.log("\n所有记录的习惯:");
  showAllHabits();
  
  process.exit(0);
}

// 根据命令行参数决定运行模式
if (process.argv.includes('--batch') || process.argv.includes('-b')) {
  batchTest();
} else {
  interactiveMode();
} 