import axios from 'axios';

// 当前不需要这些配置，因为我们将使用后端API
// const ARK_API_KEY = "6edbe8d5-7584-4c69-b062-6ef8c4d367f4";
// const API_URL = "https://ark.cn-beijing.volces.com/api/v3/chat/completions";
// const MODEL_NAME = "ep-20250427122528-dvmvp";

// 后端API基础URL，实际开发中可以从环境变量获取
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';

// System prompt template - similar to habit_task_analyzer.js but optimized for Vue app integration
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
         "id": "自动生成的ID",
         "title": "事件标题",
         "startTime": "事件开始时间（ISO格式）",
         "endTime": "事件结束时间（ISO格式，如果有）",
         "location": "事件地点（如有）",
         "description": "事件描述"
       }
     ],
     "tasks": [
       {
         "id": "自动生成的ID",
         "title": "任务标题",
         "dueDate": "截止日期",
         "description": "任务描述",
         "priority": "优先级评估（high/medium/low）",
         "completed": false,
         "subtasks": [
           {
             "id": "自动生成的子任务ID",
             "title": "子任务标题",
             "description": "子任务描述",
             "scheduledTime": "建议执行时间",
             "estimatedDuration": "预估用时"
           }
         ]
       }
     ],
     "habits": [
       {
         "id": "自动生成的ID",
         "title": "习惯标题",
         "category": "习惯类别（健身、学习、阅读等）",
         "frequency": "执行频率（每天、每周几次等）",
         "timeOfDay": "每天执行时间",
         "description": "习惯描述",
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
 * @returns {string} 格式化的当前日期和时间
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
 * 分析用户输入，提取事件、任务和习惯
 * @param {string} userInput - 用户输入的文本
 * @returns {Promise<Object>} - 解析后的结构化数据
 */
export async function analyzeInput(userInput) {
  // 获取当前时间，帮助模型更好地规划
  const currentDateTime = getCurrentDateTime();
  
  try {
    // 调用后端API进行分析
    const response = await fetch(`${API_BASE_URL}/task-analysis/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ inputText: userInput })
    });
    
    if (!response.ok) {
      throw new Error(`服务器响应错误: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (result.success) {
      // 将后端返回的数据格式转换为前端需要的格式
      let events = [];
      let tasks = [];
      let habits = [];
      
      if (result.data.type === '事件') {
        events = [convertEventFormat(result.data.data)];
      } else if (result.data.type === '任务') {
        tasks = [convertTaskFormat(result.data.data)];
      } else if (result.data.type === '习惯') {
        habits = [convertHabitFormat(result.data.data)];
      }
      
      return {
        success: true,
        data: {
          events,
          tasks,
          habits
        },
        currentTime: currentDateTime
      };
    } else {
      return {
        success: false,
        error: result.message || "分析失败",
        data: { 
          events: [],
          tasks: [],
          habits: []
        }
      };
    }
  } catch (error) {
    console.error("API请求失败:", error.message);
    
    return {
      success: false,
      error: "请求失败: " + error.message,
      data: { 
        events: [],
        tasks: [],
        habits: []
      }
    };
  }
}

/**
 * 转换事件格式
 * @param {Object} eventData - 后端返回的事件数据
 * @returns {Object} - 前端格式的事件数据
 */
function convertEventFormat(eventData) {
  return {
    id: generateId('event'),
    title: eventData.title,
    startTime: eventData.date + ' ' + (eventData.time || ''),
    endTime: calculateEndTime(eventData.date, eventData.time),
    location: eventData.location || '',
    description: eventData.description || '',
    priority: 'medium' // 默认优先级
  };
}

/**
 * 计算结束时间
 * @param {string} date - 日期
 * @param {string} time - 时间
 * @returns {string} - 结束时间
 */
function calculateEndTime(date, time) {
  if (!date || !time) return '';
  
  // 简单逻辑：结束时间默认为开始时间后1小时
  return date + ' ' + time;
}

/**
 * 转换任务格式
 * @param {Object} taskData - 后端返回的任务数据
 * @returns {Object} - 前端格式的任务数据
 */
function convertTaskFormat(taskData) {
  return {
    id: generateId('task'),
    title: taskData.title,
    dueDate: taskData.dueDate || '',
    description: taskData.description || '',
    priority: convertPriority(taskData.priority),
    completed: false,
    subtasks: (taskData.subtasks || []).map(st => ({
      id: generateId('subtask'),
      title: st.title,
      description: '',
      scheduledTime: '',
      estimatedDuration: st.estimatedTime || '1小时'
    }))
  };
}

/**
 * 转换优先级格式
 * @param {string} priority - 优先级文本
 * @returns {string} - 标准化的优先级
 */
function convertPriority(priority) {
  if (!priority) return 'medium';
  
  if (typeof priority === 'string') {
    if (priority.includes('高')) return 'high';
    if (priority.includes('低')) return 'low';
  }
  
  return 'medium';
}

/**
 * 转换习惯格式
 * @param {Object} habitData - 后端返回的习惯数据
 * @returns {Object} - 前端格式的习惯数据
 */
function convertHabitFormat(habitData) {
  return {
    id: generateId('habit'),
    title: habitData.name,
    category: detectCategory(habitData.name),
    frequency: habitData.frequency || '每天',
    timeOfDay: '',
    description: '',
    plan: {
      steps: habitData.recommendations || [],
      milestones: [],
      tracking: '每日打卡'
    },
    tips: habitData.recommendations || []
  };
}

/**
 * 检测习惯类别
 * @param {string} name - 习惯名称
 * @returns {string} - 习惯类别
 */
function detectCategory(name) {
  if (!name) return '其他';
  
  if (name.includes('健身') || name.includes('运动') || name.includes('跑步')) 
    return '健身';
  if (name.includes('阅读') || name.includes('读书')) 
    return '阅读';
  if (name.includes('学习') || name.includes('学') || name.includes('课')) 
    return '学习';
  
  return '其他';
}

/**
 * 生成简单的唯一ID
 * @param {string} prefix - ID前缀
 * @returns {string} - 生成的ID
 */
function generateId(prefix) {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
}

export default {
  analyzeInput
}; 