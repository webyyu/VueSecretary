# CosyVoice API 文档

## 概述

CosyVoice API 提供了语音克隆和语音合成的功能，支持将文本转换为指定声音的语音文件。本API支持两种类型的语音合成：鼓励(encourage)和批评(criticize)，可以分别生成这两种不同风格的语音。

## 基础URL

```
http://localhost:3000/api/v1
```

## 认证

所有API请求都需要通过JWT令牌进行认证。在请求头中添加：

```
Authorization: Bearer <your_jwt_token>
```

## API端点

### 1. 触发语音克隆

将音频文件克隆为可用于语音合成的声音模型。

**请求**

```
POST /cosyvoice/clone
```

**请求体**

```json
{
  "voiceId": "64a7b3e5d25e8f12345678",  // 语音文件ID
  "feedbackId": "64a7b3e5d25e8f87654321"  // 反馈消息ID
}
```

**响应**

```json
{
  "success": true,
  "data": {
    "message": "Voice cloning initiated successfully",
    "voice_id": "cosyvoice-v2-abc123",
    "cosyVoiceId": "64a7b3e5d25e8f12345678"
  }
}
```

### 2. 手动触发语音合成

手动触发语音合成过程，同时合成鼓励和批评两种语音。

**请求**

```
POST /cosyvoice/synthesize
```

**请求体**

```json
{
  "voiceId": "cosyvoice-v2-abc123",  // 克隆的声音ID
  "feedbackId": "64a7b3e5d25e8f87654321"  // 反馈消息ID，用于获取合成文本
}
```

**响应**

```json
{
  "success": true,
  "data": {
    "message": "Speech synthesis completed successfully",
    "synthesized_encourage_url": "https://example.com/path/to/encourage_audio.mp3",
    "synthesized_criticize_url": "https://example.com/path/to/criticize_audio.mp3"
  }
}
```

### 3. 按声音ID获取CosyVoice

通过voice_id获取CosyVoice记录的详细信息。

**请求**

```
GET /cosyvoice/voice/:voiceId
```

**响应**

```json
{
  "success": true,
  "data": {
    "cosyVoice": {
      "voice_id": "cosyvoice-v2-abc123",
      "audio_url": "https://example.com/path/to/original_audio.wav",
      "feedback_id": "64a7b3e5d25e8f87654321",
      "synthesized_encourage_url": "https://example.com/path/to/encourage_audio.mp3",
      "synthesized_criticize_url": "https://example.com/path/to/criticize_audio.mp3",
      "userId": "64a7b3e5d25e8f12345678",
      "status": "synthesized",
      "error": null,
      "createdAt": "2025-05-02T07:50:50.068Z",
      "updatedAt": "2025-05-02T07:50:55.123Z"
    }
  }
}
```

### 4. 按反馈ID获取CosyVoice记录

通过feedback_id获取CosyVoice记录列表，可选择按类型过滤。

**请求**

```
GET /cosyvoice/feedback/:feedbackId
```

**可选查询参数**

- `type`: 语音类型，可以是 "encourage" 或 "criticize"

**无类型参数响应**

```json
{
  "success": true,
  "data": {
    "cosyVoices": [
      {
        "voice_id": "cosyvoice-v2-abc123",
        "audio_url": "https://example.com/path/to/original_audio.wav",
        "feedback_id": "64a7b3e5d25e8f87654321",
        "synthesized_encourage_url": "https://example.com/path/to/encourage_audio.mp3",
        "synthesized_criticize_url": "https://example.com/path/to/criticize_audio.mp3",
        "userId": "64a7b3e5d25e8f12345678",
        "status": "synthesized",
        "error": null,
        "createdAt": "2025-05-02T07:50:50.068Z",
        "updatedAt": "2025-05-02T07:50:55.123Z"
      }
      // 更多记录...
    ]
  }
}
```

**指定类型参数响应**

```json
{
  "success": true,
  "data": {
    "type": "encourage",
    "cosyVoices": [
      {
        "voice_id": "cosyvoice-v2-abc123",
        "synthesized_encourage_url": "https://example.com/path/to/encourage_audio.mp3",
        "status": "synthesized"
      }
      // 更多记录...
    ]
  }
}
```

### 5. 直接获取音频URL

获取特定反馈消息的音频URL，必须指定类型。

**请求**

```
GET /cosyvoice/feedback/:feedbackId/audio?type=encourage
```

**必选查询参数**

- `type`: 语音类型，必须是 "encourage" 或 "criticize"

**响应**

```json
{
  "success": true,
  "data": {
    "type": "encourage",
    "audioUrl": "https://example.com/path/to/encourage_audio.mp3",
    "voice_id": "cosyvoice-v2-abc123"
  }
}
```

## 错误响应

所有错误响应遵循以下格式：

```json
{
  "success": false,
  "message": "错误描述信息",
  "error": "详细错误信息（如果有）"
}
```

常见错误状态码：

- `400`: 请求参数错误
- `401`: 认证失败
- `403`: 权限不足
- `404`: 资源不存在
- `500`: 服务器内部错误

## 流程示例

### 完整的语音克隆和合成流程

1. 上传语音文件到 `/api/v1/voice` 端点，并提供 `feedback_id` 参数
2. 服务器自动触发语音克隆流程，创建 CosyVoice 记录
3. 服务器自动合成两种语音（鼓励和批评）
4. 前端可以通过 `/api/v1/cosyvoice/feedback/:feedbackId/audio?type=encourage` 或 `/api/v1/cosyvoice/feedback/:feedbackId/audio?type=criticize` 获取对应的音频URL，并播放 