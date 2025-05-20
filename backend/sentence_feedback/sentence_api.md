# 反馈信息生成 API 文档

## 概述

反馈信息生成 API 是一个用于生成鼓励和批评语句的接口，它使用 Doubao-1.5-lite-32k 大语言模型根据用户输入和指定的风格生成个性化反馈。生成的反馈将存储在 MongoDB 数据库中，并可以通过 API 进行查询。

## 业务流程图

```
┌─────────┐         ┌─────────────┐         ┌────────────┐         ┌───────────┐
│  用户   │         │   前端UI    │         │  后端API   │         │  Doubao   │
│         │         │             │         │            │         │  LLM API   │
└────┬────┘         └──────┬──────┘         └─────┬──────┘         └─────┬─────┘
     │                     │                      │                      │
     │  输入文本+风格选择  │                      │                      │
     │ ─────────────────> │                      │                      │
     │                     │                      │                      │
     │                     │   POST /api/v1/feedback                     │
     │                     │ ─────────────────────>                      │
     │                     │                      │                      │
     │                     │                      │   API请求(prompt)    │
     │                     │                      │ ────────────────────>│
     │                     │                      │                      │
     │                     │                      │   返回生成的内容     │
     │                     │                      │ <────────────────────│
     │                     │                      │                      │
     │                     │                      │  解析内容并存储到    │
     │                     │                      │ ┌─────────────┐     │
     │                     │                      │ │  MongoDB    │     │
     │                     │                      │ └─────────────┘     │
     │                     │                      │                      │
     │                     │   返回生成的结果     │                      │
     │                     │ <─────────────────────                      │
     │                     │                      │                      │
```

## 数据流程

1. 用户输入文本内容，并选择鼓励风格和批评风格
2. 前端将信息提交到后端API
3. 后端构造提示词，并向Doubao LLM API发送请求
4. Doubao LLM API返回生成的鼓励语句和批评语句
5. 后端解析响应，将原始输入和生成的内容存储到MongoDB
6. 后端返回结果给前端
7. 前端显示生成的反馈信息给用户

## 基础 URL

```
/api/v1/feedback
```

## API 端点

### 1. 生成反馈信息

生成鼓励和批评语句，并将其存储到数据库。

**请求**

```
POST /api/v1/feedback
```

**请求体**

```json
{
  "userInput": "用户输入的文本内容",
  "encourageStyle": "鼓励风格描述",
  "criticizeStyle": "批评风格描述"
}
```

**参数说明**

| 参数名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| userInput | String | 是 | 用户输入的文本内容，将用于生成反馈 |
| encourageStyle | String | 是 | 鼓励语句的风格描述，如"热情鼓励"、"温和鼓励"等 |
| criticizeStyle | String | 是 | 批评语句的风格描述，如"委婉批评"、"直接批评"等 |

**响应**

```json
{
  "success": true,
  "data": {
    "encourage": "生成的鼓励语句",
    "criticize": "生成的批评语句",
    "id": "反馈信息在数据库中的ID"
  },
  "meta": {
    "processingTime": 1234,
    "tokenUsage": {
      "prompt_tokens": 123,
      "completion_tokens": 45,
      "total_tokens": 168
    }
  }
}
```

**响应参数说明**

| 参数名 | 类型 | 描述 |
|--------|------|------|
| success | Boolean | 请求是否成功 |
| data.encourage | String | 生成的鼓励语句 |
| data.criticize | String | 生成的批评语句 |
| data.id | String | 反馈信息在数据库中的ID |
| meta.processingTime | Number | 处理时间（毫秒） |
| meta.tokenUsage.prompt_tokens | Number | 提示词使用的 token 数量 |
| meta.tokenUsage.completion_tokens | Number | 模型生成使用的 token 数量 |
| meta.tokenUsage.total_tokens | Number | 总共使用的 token 数量 |

**错误响应**

```json
{
  "success": false,
  "message": "错误消息",
  "error": "详细错误信息"
}
```

### 2. 获取所有反馈信息

获取所有已存储的反馈信息，支持分页。

**请求**

```
GET /api/v1/feedback
```

**查询参数**

| 参数名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| page | Number | 否 | 页码，默认为 1 |
| limit | Number | 否 | 每页数量，默认为 10 |

**响应**

```json
{
  "success": true,
  "count": 10,
  "pagination": {
    "total": 25,
    "page": 1,
    "pages": 3,
    "limit": 10
  },
  "data": [
    {
      "_id": "反馈信息ID",
      "userInput": "用户输入的文本内容",
      "encourageStyle": "鼓励风格描述",
      "criticizeStyle": "批评风格描述",
      "encourageMessage": "生成的鼓励语句",
      "criticizeMessage": "生成的批评语句",
      "rawResponse": "API原始响应",
      "tokenUsage": {
        "prompt_tokens": 123,
        "completion_tokens": 45,
        "total_tokens": 168
      },
      "processingTime": 1234,
      "createdAt": "创建时间",
      "updatedAt": "更新时间"
    },
    // ... 更多反馈信息
  ]
}
```

### 3. 获取单条反馈信息

根据ID获取单条反馈信息。

**请求**

```
GET /api/v1/feedback/:id
```

**路径参数**

| 参数名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| id | String | 是 | 反馈信息的ID |

**响应**

```json
{
  "success": true,
  "data": {
    "_id": "反馈信息ID",
    "userInput": "用户输入的文本内容",
    "encourageStyle": "鼓励风格描述",
    "criticizeStyle": "批评风格描述",
    "encourageMessage": "生成的鼓励语句",
    "criticizeMessage": "生成的批评语句",
    "rawResponse": "API原始响应",
    "tokenUsage": {
      "prompt_tokens": 123,
      "completion_tokens": 45,
      "total_tokens": 168
    },
    "processingTime": 1234,
    "createdAt": "创建时间",
    "updatedAt": "更新时间"
  }
}
```

## 数据库模型

### FeedbackMessage 模型

```javascript
const FeedbackMessageSchema = new mongoose.Schema(
  {
    userInput: {
      type: String,
      required: true,
      trim: true,
    },
    encourageStyle: {
      type: String,
      required: true,
      trim: true,
    },
    criticizeStyle: {
      type: String,
      required: true,
      trim: true,
    },
    encourageMessage: {
      type: String,
      required: true,
      trim: true,
    },
    criticizeMessage: {
      type: String,
      required: true,
      trim: true,
    },
    rawResponse: {
      type: String,
      required: false,
      trim: true,
    },
    tokenUsage: {
      prompt_tokens: {
        type: Number,
        default: 0
      },
      completion_tokens: {
        type: Number,
        default: 0
      },
      total_tokens: {
        type: Number,
        default: 0
      }
    },
    processingTime: {
      type: Number,
      default: 0
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false, // Optional: 当用户认证时使用
    },
  },
  {
    timestamps: true,
  }
);
```

## 使用示例

### 1. 生成反馈信息

**请求示例**

```javascript
// 使用 axios 发送请求
const response = await axios.post('/api/v1/feedback', {
  userInput: "今天我完成了所有计划的工作",
  encourageStyle: "热情鼓励",
  criticizeStyle: "建设性批评"
});
```

**响应示例**

```json
{
  "success": true,
  "data": {
    "encourage": "太棒了！今天你完成了所有计划的工作，这种高效率和执行力真是令人佩服！继续保持这样的状态，你一定能够取得更多成就！",
    "criticize": "今天完成了所有计划的工作，这是好事。不过，建议你可以考虑进一步优化工作计划，适当加入一些有挑战性的任务，这样可以更好地提升自己的能力和效率。",
    "id": "60a1f2c3b4d5e6f7g8h9i0j1"
  },
  "meta": {
    "processingTime": 856,
    "tokenUsage": {
      "prompt_tokens": 132,
      "completion_tokens": 89,
      "total_tokens": 221
    }
  }
}
```

## 提示词构造

API使用以下格式构造提示词：

```
请根据以下要求，生成一句鼓励语句和一句批评语句，并以JSON格式返回：
{
  "encourage": "鼓励语句",
  "criticize": "批评语句"
}
用户输入内容：${userInput}
鼓励语句要求：请用"${userInput}+${encourageStyle}"的表达风格来鼓励用户。
批评语句要求：请用"${userInput}+${criticizeStyle}"的表达风格来提出批评建议。
注意：只返回JSON对象，不要添加其他内容。
```

## 注意事项

1. API 密钥保护：请确保 Doubao API 密钥受到适当保护，不要在客户端代码中暴露。
2. 错误处理：在集成API时，请实现适当的错误处理机制。
3. 请求限制：考虑实现请求限制，以避免API过载。
4. 敏感内容：该API不过滤用户输入，请在前端实现适当的内容审核或提醒用户不要输入敏感内容。
5. 数据存储：所有的用户输入和生成内容都会存储在MongoDB中，注意合规性和用户隐私。

## 状态码

| 状态码 | 描述 |
|--------|------|
| 200 | 请求成功（用于GET请求） |
| 201 | 创建成功（用于POST请求） |
| 400 | 请求无效，通常是由于缺少必要参数 |
| 404 | 未找到请求的资源 |
| 500 | 服务器内部错误 |

## 测试

API包含了测试脚本`test/feedbackService.test.js`，可以用来测试Doubao API调用和MongoDB存储功能：

```bash
node test/feedbackService.test.js
```

该测试脚本将生成测试用例并存储到MongoDB中，同时显示MongoDB中存储的最新记录。 