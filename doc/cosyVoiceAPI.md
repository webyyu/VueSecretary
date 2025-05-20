# 语音克隆与合成 API 文档

本文档描述了后端语音克隆和语音合成服务的API接口。这些服务允许用户上传音频文件，克隆声音，并使用克隆的声音合成语音。

## 概述

系统由两部分组成：
1. **Express后端**：负责处理用户请求、文件管理和数据存储
2. **Flask语音服务**：负责语音克隆和语音合成的核心功能

## 数据模型

### Voice 集合
存储用户上传的原始音频文件信息
```
{
  userId: ObjectId,       // 用户ID
  fileName: String,       // 文件名
  fileUrl: String,        // 文件URL
  fileSize: Number,       // 文件大小
  cosKey: String,         // 对象存储键
  feedback_id: ObjectId,  // 反馈消息ID（可选）
  createdAt: Date         // 创建时间
}
```

### CosyVoice 集合
存储语音克隆和合成结果
```
{
  voice_id: String,              // 克隆声音ID
  audio_url: String,             // 原始音频URL
  feedback_id: ObjectId,         // 反馈消息ID
  synthesized_audio_url: String, // 合成音频URL
  userId: ObjectId,              // 用户ID
  status: String,                // 状态：pending/cloned/synthesized/error
  error: String,                 // 错误信息（如有）
  createdAt: Date,               // 创建时间
  updatedAt: Date                // 更新时间
}
```

## API 端点

### 1. 上传音频文件

该接口上传音频文件并可选择触发自动语音克隆。

**请求**:
```
POST /api/v1/voice
```

**请求头**:
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**请求参数**:
```
audioFile: File          // 音频文件（必需）
feedback_id: ObjectId    // 反馈消息ID（可选，提供时会自动触发克隆）
```

**响应**:
```json
{
  "success": true,
  "data": {
    "fileId": "60f7e5d3a2d8b32f4c567890",
    "fileUrl": "https://example.com/audio.mp3",
    "fileName": "original.mp3",
    "fileSize": 1024000,
    "feedback_id": "60f7e5d3a2d8b32f4c123456",
    "message": "文件上传成功并已启动语音克隆"
  },
  "message": "文件上传成功"
}
```

### 2. 触发语音克隆

该接口手动触发语音克隆过程。

**请求**:
```
POST /api/v1/cosyvoice/clone
```

**请求头**:
```
Authorization: Bearer <token>
Content-Type: application/json
```

**请求体**:
```json
{
  "voiceId": "60f7e5d3a2d8b32f4c567890",  // Voice集合中的ID
  "feedbackId": "60f7e5d3a2d8b32f4c123456" // FeedbackMessage集合中的ID
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "message": "语音克隆已成功启动",
    "voice_id": "voice-12345678",
    "cosyVoiceId": "60f7e5d3a2d8b32f4c987654"
  }
}
```

### 3. 手动触发语音合成

该接口手动触发语音合成过程。

**请求**:
```
POST /api/v1/cosyvoice/synthesize
```

**请求头**:
```
Authorization: Bearer <token>
Content-Type: application/json
```

**请求体**:
```json
{
  "voiceId": "voice-12345678",            // 克隆生成的voice_id
  "feedbackId": "60f7e5d3a2d8b32f4c123456" // 反馈消息ID
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "message": "语音合成已成功完成",
    "synthesized_audio_url": "https://example.com/synthesized.mp3"
  }
}
```

### 4. 通过voice_id获取CosyVoice

**请求**:
```
GET /api/v1/cosyvoice/voice/:voiceId
```

**请求头**:
```
Authorization: Bearer <token>
```

**响应**:
```json
{
  "success": true,
  "data": {
    "cosyVoice": {
      "_id": "60f7e5d3a2d8b32f4c987654",
      "voice_id": "voice-12345678",
      "audio_url": "https://example.com/audio.mp3",
      "feedback_id": "60f7e5d3a2d8b32f4c123456",
      "synthesized_audio_url": "https://example.com/synthesized.mp3",
      "userId": "60f7e5d3a2d8b32f4c111111",
      "status": "synthesized",
      "createdAt": "2023-07-21T12:00:00.000Z",
      "updatedAt": "2023-07-21T12:05:00.000Z"
    }
  }
}
```

### 5. 通过feedback_id获取CosyVoice

**请求**:
```
GET /api/v1/cosyvoice/feedback/:feedbackId
```

**请求头**:
```
Authorization: Bearer <token>
```

**响应**:
```json
{
  "success": true,
  "data": {
    "cosyVoices": [
      {
        "_id": "60f7e5d3a2d8b32f4c987654",
        "voice_id": "voice-12345678",
        "audio_url": "https://example.com/audio.mp3",
        "feedback_id": "60f7e5d3a2d8b32f4c123456",
        "synthesized_audio_url": "https://example.com/synthesized.mp3",
        "userId": "60f7e5d3a2d8b32f4c111111",
        "status": "synthesized",
        "createdAt": "2023-07-21T12:00:00.000Z",
        "updatedAt": "2023-07-21T12:05:00.000Z"
      }
    ]
  }
}
```

## 自动化流程

系统支持两种方式进行语音克隆和合成：

### 1. 自动流程（推荐）

1. 前端在上传音频文件时，提供`feedback_id`参数
2. 后端在上传成功后，自动触发语音克隆
3. 语音克隆完成后，自动触发语音合成
4. 整个过程无需前端额外干预

### 2. 手动流程

1. 前端上传音频文件
2. 前端调用语音克隆API触发克隆
3. 前端调用语音合成API触发合成

## 状态追踪

可以通过调用以下API来追踪语音克隆和合成的状态：

- `GET /api/v1/cosyvoice/voice/:voiceId` - 查询单个声音的状态
- `GET /api/v1/cosyvoice/feedback/:feedbackId` - 查询与特定反馈相关的所有声音

`status`字段表示当前处理状态：
- `pending`: 等待处理
- `cloned`: 声音克隆已完成
- `synthesized`: 语音合成已完成
- `error`: 处理失败（查看`error`字段获取详细信息）

## 错误处理

所有API在遇到错误时会返回以下格式的响应：

```json
{
  "success": false,
  "message": "错误详细信息",
  "statusCode": 400
}
```

常见错误代码：
- 400: 请求参数错误
- 401: 未授权
- 403: 无权访问资源
- 404: 资源不存在
- 500: 服务器内部错误 