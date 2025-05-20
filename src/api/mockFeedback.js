/**
 * Mock Feedback API Module
 * 
 * Provides mock implementations of the feedback API for testing
 * or when the backend server is not available.
 */

// 模拟延迟
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// 模拟数据库
const mockDatabase = {
  feedbacks: []
};

// 生成唯一ID
const generateId = () => Math.random().toString(36).substring(2, 15);

/**
 * 生成反馈信息
 * 
 * @param {Object} params - 请求参数
 * @returns {Promise} - 返回结果的Promise
 */
export const generateFeedback = async (params) => {
  console.log('使用模拟 API 生成反馈:', params);

  // 模拟处理时间
  const startTime = Date.now();
  await delay(1000); // 模拟网络延迟
  
  // 生成模拟反馈
  let encourageMessage = '';
  let criticizeMessage = '';
  
  // 根据不同风格生成不同的模拟反馈内容
  switch (params.encourageStyle) {
    case '热情鼓励':
      encourageMessage = `太棒了！${params.userInput}真是令人印象深刻！你的努力和才华显而易见，继续保持这样的热情！`;
      break;
    case '温和鼓励':
      encourageMessage = `很好，${params.userInput}显示了你的进步。继续坚持，你会做得更好的。`;
      break;
    case '专业鼓励':
      encourageMessage = `从专业角度看，${params.userInput}达到了预期标准。你的方法是有效的，继续这样的工作方式。`;
      break;
    case '幽默鼓励':
      encourageMessage = `哇哦！${params.userInput}简直是超级英雄级别的表现！如果有"完美完成任务"的奖牌，你绝对能拿金牌！`;
      break;
    default:
      encourageMessage = `做得好！${params.userInput}是一个很好的成就。`;
  }
  
  switch (params.criticizeStyle) {
    case '建设性批评':
      criticizeMessage = `关于${params.userInput}，我注意到有些地方可以改进。如果能更加注重细节，效果会更好。你可以考虑下次这样做...`;
      break;
    case '直接批评':
      criticizeMessage = `${params.userInput}中有几处明显的问题需要解决。这些部分不够理想，需要重新调整。`;
      break;
    case '委婉批评':
      criticizeMessage = `${params.userInput}总体不错，不过也许我们可以尝试从另一个角度思考？有些小细节可能需要稍微调整。`;
      break;
    case '教练式批评':
      criticizeMessage = `思考一下：${params.userInput}的目标是什么？你是否达到了预期效果？考虑一下如何让它更符合你的期望。`;
      break;
    default:
      criticizeMessage = `${params.userInput}有改进的空间，考虑一下可能的优化方向。`;
  }
  
  const endTime = Date.now();
  const processingTime = endTime - startTime;
  
  // 创建反馈记录
  const feedbackRecord = {
    _id: generateId(),
    userInput: params.userInput,
    encourageStyle: params.encourageStyle,
    criticizeStyle: params.criticizeStyle,
    encourageMessage: encourageMessage,
    criticizeMessage: criticizeMessage,
    processingTime: processingTime,
    tokenUsage: {
      prompt_tokens: Math.floor(Math.random() * 100) + 50,
      completion_tokens: Math.floor(Math.random() * 50) + 20,
      total_tokens: Math.floor(Math.random() * 150) + 70
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  // 添加到模拟数据库
  mockDatabase.feedbacks.push(feedbackRecord);
  
  // 返回模拟响应
  return {
    success: true,
    data: {
      encourage: encourageMessage,
      criticize: criticizeMessage,
      id: feedbackRecord._id
    },
    meta: {
      processingTime: processingTime,
      tokenUsage: feedbackRecord.tokenUsage
    }
  };
};

/**
 * 获取所有反馈信息
 * 
 * @param {Object} params - 请求参数（分页）
 * @returns {Promise} - 返回结果的Promise
 */
export const getAllFeedback = async (params = { page: 1, limit: 10 }) => {
  console.log('使用模拟 API 获取所有反馈:', params);
  
  // 模拟网络延迟
  await delay(500);
  
  const page = parseInt(params.page) || 1;
  const limit = parseInt(params.limit) || 10;
  
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  
  const totalCount = mockDatabase.feedbacks.length;
  const totalPages = Math.ceil(totalCount / limit);
  
  const paginatedData = mockDatabase.feedbacks.slice(startIndex, endIndex);
  
  return {
    success: true,
    count: totalCount,
    pagination: {
      total: totalCount,
      page: page,
      pages: totalPages,
      limit: limit
    },
    data: paginatedData
  };
};

/**
 * 获取单个反馈信息
 * 
 * @param {string} id - 反馈信息ID
 * @returns {Promise} - 返回结果的Promise
 */
export const getFeedbackById = async (id) => {
  console.log('使用模拟 API 获取单个反馈:', id);
  
  // 模拟网络延迟
  await delay(300);
  
  const feedback = mockDatabase.feedbacks.find(item => item._id === id);
  
  if (!feedback) {
    return {
      success: false,
      message: '未找到反馈信息'
    };
  }
  
  return {
    success: true,
    data: feedback
  };
}; 