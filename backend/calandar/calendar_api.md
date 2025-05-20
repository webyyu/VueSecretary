# 日历任务管理 API 文档

## 概述

本文档描述了通过日历视图管理任务的API接口。这些接口允许前端用户通过日历界面查看和管理任务（Task集合）。

所有接口都需要用户认证，请在请求头中包含有效的认证令牌。

## 基础URL

```
/api/v1/calendar
```

## 接口列表

### 1. 获取日期任务列表

按日期或日期范围获取任务列表。

- **URL**: `/tasks`
- **方法**: `GET`
- **URL参数**:
  - `date`: 指定日期，格式为YYYY-MM-DD（可选）
  - `startDate`: 开始日期，格式为YYYY-MM-DD（可选）
  - `endDate`: 结束日期，格式为YYYY-MM-DD（可选）

> 注意：如果不提供任何日期参数，将返回今天的任务。如果提供了`date`参数，将返回该日期的任务。如果提供了`startDate`和`endDate`参数，将返回该日期范围内的任务。

- **成功响应**:
  - 状态码: `200 OK`
  - 内容示例:

```json
{
  "status": "success",
  "data": [
    {
      "_id": "60d21b4667d0d8992e610c85",
      "name": "完成项目报告",
      "completed": false,
      "priority": "high",
      "dueDate": "2023-05-15T00:00:00.000Z",
      "groupId": {
        "_id": "60d21b4667d0d8992e610c80",
        "name": "工作"
      },
      "isImportant": true,
      "isUrgent": true,
      "createdAt": "2023-05-10T08:40:51.620Z",
      "updatedAt": "2023-05-10T08:40:51.620Z"
    },
    {
      "_id": "60d21b4667d0d8992e610c86",
      "name": "购买生日礼物",
      "completed": false,
      "priority": "medium",
      "dueDate": "2023-05-15T00:00:00.000Z",
      "groupId": {
        "_id": "60d21b4667d0d8992e610c81",
        "name": "个人"
      },
      "isImportant": false,
      "isUrgent": false,
      "createdAt": "2023-05-10T09:15:22.430Z",
      "updatedAt": "2023-05-10T09:15:22.430Z"
    }
  ]
}
```

- **错误响应**:
  - 状态码: `500 Internal Server Error`
  - 内容示例:

```json
{
  "status": "error",
  "message": "Failed to get calendar tasks"
}
```

### 2. 创建任务

在日历视图中创建新任务。

- **URL**: `/tasks`
- **方法**: `POST`
- **请求体**:
  - `name`: 任务名称（必填）
  - `groupId`: 任务分组ID（必填）
  - `priority`: 优先级，可选值为"low", "medium", "high"（可选，默认为"medium"）
  - `dueDate`: 到期日期，格式为ISO日期字符串（可选，默认为当前日期）
  - `isImportant`: 是否重要（可选，默认为false）
  - `isUrgent`: 是否紧急（可选，默认为false）

- **请求体示例**:

```json
{
  "name": "准备会议材料",
  "groupId": "60d21b4667d0d8992e610c80",
  "priority": "high",
  "dueDate": "2023-05-16T00:00:00.000Z",
  "isImportant": true,
  "isUrgent": true
}
```

- **成功响应**:
  - 状态码: `201 Created`
  - 内容示例:

```json
{
  "status": "success",
  "message": "任务创建成功",
  "data": {
    "_id": "60d21b4667d0d8992e610c87",
    "name": "准备会议材料",
    "completed": false,
    "priority": "high",
    "dueDate": "2023-05-16T00:00:00.000Z",
    "groupId": {
      "_id": "60d21b4667d0d8992e610c80",
      "name": "工作"
    },
    "isImportant": true,
    "isUrgent": true,
    "createdAt": "2023-05-11T10:30:45.123Z",
    "updatedAt": "2023-05-11T10:30:45.123Z"
  }
}
```

- **错误响应**:
  - 状态码: `400 Bad Request` 或 `404 Not Found` 或 `500 Internal Server Error`
  - 内容示例:

```json
{
  "status": "error",
  "message": "任务名称不能为空"
}
```

### 3. 获取任务详情

获取特定任务的详细信息。

- **URL**: `/tasks/:taskId`
- **方法**: `GET`
- **URL参数**:
  - `taskId`: 任务ID

- **成功响应**:
  - 状态码: `200 OK`
  - 内容示例:

```json
{
  "status": "success",
  "data": {
    "_id": "60d21b4667d0d8992e610c85",
    "name": "完成项目报告",
    "completed": false,
    "priority": "high",
    "dueDate": "2023-05-15T00:00:00.000Z",
    "groupId": {
      "_id": "60d21b4667d0d8992e610c80",
      "name": "工作"
    },
    "isImportant": true,
    "isUrgent": true,
    "createdAt": "2023-05-10T08:40:51.620Z",
    "updatedAt": "2023-05-10T08:40:51.620Z"
  }
}
```

- **错误响应**:
  - 状态码: `404 Not Found` 或 `500 Internal Server Error`
  - 内容示例:

```json
{
  "status": "error",
  "message": "ID为60d21b4667d0d8992e610c99的任务不存在"
}
```

### 4. 更新任务

更新特定任务的信息。

- **URL**: `/tasks/:taskId`
- **方法**: `PUT`
- **URL参数**:
  - `taskId`: 任务ID
- **请求体**:
  - `name`: 任务名称（可选）
  - `priority`: 优先级，可选值为"low", "medium", "high"（可选）
  - `dueDate`: 到期日期，格式为ISO日期字符串（可选）
  - `groupId`: 任务分组ID（可选）
  - `isImportant`: 是否重要（可选）
  - `isUrgent`: 是否紧急（可选）
  - `completed`: 是否已完成（可选）

- **请求体示例**:

```json
{
  "name": "完成项目最终报告",
  "priority": "high",
  "completed": true
}
```

- **成功响应**:
  - 状态码: `200 OK`
  - 内容示例:

```json
{
  "status": "success",
  "message": "任务更新成功",
  "data": {
    "_id": "60d21b4667d0d8992e610c85",
    "name": "完成项目最终报告",
    "completed": true,
    "priority": "high",
    "dueDate": "2023-05-15T00:00:00.000Z",
    "groupId": {
      "_id": "60d21b4667d0d8992e610c80",
      "name": "工作"
    },
    "isImportant": true,
    "isUrgent": true,
    "createdAt": "2023-05-10T08:40:51.620Z",
    "updatedAt": "2023-05-11T14:25:30.789Z"
  }
}
```

- **错误响应**:
  - 状态码: `400 Bad Request` 或 `404 Not Found` 或 `500 Internal Server Error`
  - 内容示例:

```json
{
  "status": "error",
  "message": "ID为60d21b4667d0d8992e610c99的任务不存在"
}
```

### 5. 删除任务

删除特定任务。

- **URL**: `/tasks/:taskId`
- **方法**: `DELETE`
- **URL参数**:
  - `taskId`: 任务ID

- **成功响应**:
  - 状态码: `200 OK`
  - 内容示例:

```json
{
  "status": "success",
  "message": "任务删除成功",
  "data": {}
}
```

- **错误响应**:
  - 状态码: `404 Not Found` 或 `500 Internal Server Error`
  - 内容示例:

```json
{
  "status": "error",
  "message": "ID为60d21b4667d0d8992e610c99的任务不存在"
}
```

## 状态码说明

- `200 OK`: 请求成功
- `201 Created`: 资源创建成功
- `400 Bad Request`: 请求参数错误
- `404 Not Found`: 请求的资源不存在
- `500 Internal Server Error`: 服务器内部错误

## 注意事项

1. 所有日期相关的字段都使用ISO格式的字符串（例如："2023-05-15T00:00:00.000Z"）
2. 创建任务时，必须提供任务名称（name）和任务分组ID（groupId）
3. 如果不指定dueDate，默认为当前日期
4. 所有接口都需要用户认证，请确保在请求头中包含有效的认证令牌

## 前端集成示例

### 获取特定日期的任务

```javascript
async function getTasksForDate(date) {
  try {
    const formattedDate = date.toISOString().split('T')[0]; // 格式化为YYYY-MM-DD
    const response = await fetch(`/api/v1/calendar/tasks?date=${formattedDate}`, {
      headers: {
        'Authorization': `Bearer ${token}` // 添加认证令牌
      }
    });
    
    if (!response.ok) {
      throw new Error('获取任务失败');
    }
    
    const data = await response.json();
    return data.data; // 返回任务数组
  } catch (error) {
    console.error('获取任务出错:', error);
    return [];
  }
}
```

### 创建新任务

```javascript
async function createTask(taskData) {
  try {
    const response = await fetch('/api/v1/calendar/tasks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` // 添加认证令牌
      },
      body: JSON.stringify(taskData)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || '创建任务失败');
    }
    
    const data = await response.json();
    return data.data; // 返回创建的任务
  } catch (error) {
    console.error('创建任务出错:', error);
    throw error;
  }
}
```

## 更新日志

- **2023-05-12**: 初始版本
- **2023-05-15**: 添加了前端集成示例