
# Todo List API 接口调用文档

> 基础URL: https://xlimbtrxgghx.sealoshzh.site

## 目录

- [1. 健康检查](#1-健康检查)
- [2. 任务集合管理](#2-任务集合管理)
- [3. 任务管理](#3-任务管理)
- [4. 四象限任务管理](#4-四象限任务管理)
- [5. 番茄钟与计时功能](#5-番茄钟与计时功能)
- [6. 用户偏好设置](#6-用户偏好设置)
- [7. 通用错误响应](#7-通用错误响应)

## 1. 健康检查

### 1.1 获取API状态

- **URL**: `/`
- **方法**: `GET`
- **描述**: 检查API是否正常运行

**成功响应**:
```json
{
  "message": "Todo List API is running",
  "version": "1.0.0"
}
```

## 2. 任务集合管理

### 2.1 获取所有任务集合

- **URL**: `/api/task-groups`
- **方法**: `GET`
- **描述**: 获取用户的所有任务集合（包含子任务）

**成功响应**:
```json
{
  "success": true,
  "data": [
    {
      "id": "60d21b4667d0d8992e610c85",
      "name": "健身",
      "icon": "dumbbell",
      "iconColor": "#FF3B30",
      "isOpen": true,
      "tasks": [
        { "id": "60d21b4667d0d8992e610c86", "content": "练肩", "completed": false },
        { "id": "60d21b4667d0d8992e610c87", "content": "练背", "completed": true }
      ]
    }
  ]
}
```

**失败响应**:
```json
{
  "success": false,
  "error": {
    "code": "SERVER_ERROR",
    "message": "获取任务集合失败"
  }
}
```

### 2.2 创建新的任务集合

- **URL**: `/api/task-groups`
- **方法**: `POST`
- **请求头**:
  - `Content-Type: application/json`
- **请求体**:
```json
{
  "name": "学习",
  "icon": "book",
  "iconColor": "#34C759"
}
```

**参数说明**:
- `name` (必填): 任务集合名称
- `icon` (可选): 图标名称
- `iconColor` (可选): 图标颜色，16进制颜色代码

**成功响应**:
```json
{
  "success": true,
  "data": {
    "id": "60d21b4667d0d8992e610c88",
    "name": "学习",
    "icon": "book",
    "iconColor": "#34C759",
    "isOpen": false,
    "tasks": []
  }
}
```

**失败响应**:
```json
{
  "success": false,
  "error": {
    "code": "INVALID_INPUT",
    "message": "Name is required"
  }
}
```

### 2.3 更新任务集合

- **URL**: `/api/task-groups/:id`
- **方法**: `PUT`
- **请求头**:
  - `Content-Type: application/json`
- **URL参数**:
  - `id`: 任务集合的ID
- **请求体**:
```json
{
  "name": "工作任务",
  "icon": "briefcase",
  "iconColor": "#007AFF"
}
```

**参数说明**:
- `name` (可选): 更新的任务集合名称
- `icon` (可选): 更新的图标名称
- `iconColor` (可选): 更新的图标颜色

**成功响应**:
```json
{
  "success": true,
  "data": {
    "id": "60d21b4667d0d8992e610c89",
    "name": "工作任务",
    "icon": "briefcase",
    "iconColor": "#007AFF"
  }
}
```

**失败响应**:
```json
{
  "success": false,
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "Task group not found"
  }
}
```

### 2.4 删除任务集合

- **URL**: `/api/task-groups/:id`
- **方法**: `DELETE`
- **URL参数**:
  - `id`: 任务集合的ID

**成功响应**:
```json
{
  "success": true,
  "message": "任务集合删除成功"
}
```

**失败响应**:
```json
{
  "success": false,
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "Task group not found"
  }
}
```

## 3. 任务管理

### 3.1 获取集合内所有任务

- **URL**: `/api/task-groups/:groupId/tasks`
- **方法**: `GET`
- **URL参数**:
  - `groupId`: 任务集合的ID

**成功响应**:
```json
{
  "success": true,
  "data": [
    { "id": "60d21b4667d0d8992e610c90", "content": "练肩", "completed": false },
    { "id": "60d21b4667d0d8992e610c91", "content": "练背", "completed": true }
  ]
}
```

**失败响应**:
```json
{
  "success": false,
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "Task group not found"
  }
}
```

### 3.2 添加新任务

- **URL**: `/api/task-groups/:groupId/tasks`
- **方法**: `POST`
- **请求头**:
  - `Content-Type: application/json`
- **URL参数**:
  - `groupId`: 任务集合的ID
- **请求体**:
```json
{
  "content": "练腿",
  "completed": false
}
```

**参数说明**:
- `content` (必填): 任务内容
- `completed` (可选): 任务完成状态，默认为false

**成功响应**:
```json
{
  "success": true,
  "data": {
    "id": "60d21b4667d0d8992e610c92",
    "content": "练腿",
    "completed": false
  }
}
```

**失败响应**:
```json
{
  "success": false,
  "error": {
    "code": "INVALID_INPUT",
    "message": "Task content is required"
  }
}
```

### 3.3 更新任务状态

- **URL**: `/api/tasks/:id`
- **方法**: `PUT`
- **请求头**:
  - `Content-Type: application/json`
- **URL参数**:
  - `id`: 任务的ID
- **请求体**:
```json
{
  "content": "每周三练腿",
  "completed": true
}
```

**参数说明**:
- `content` (可选): 更新的任务内容
- `completed` (可选): 更新的任务完成状态

**成功响应**:
```json
{
  "success": true,
  "data": {
    "id": "60d21b4667d0d8992e610c92",
    "content": "每周三练腿",
    "completed": true
  }
}
```

**失败响应**:
```json
{
  "success": false,
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "Task not found"
  }
}
```

### 3.4 删除任务

- **URL**: `/api/tasks/:id`
- **方法**: `DELETE`
- **URL参数**:
  - `id`: 任务的ID

**成功响应**:
```json
{
  "success": true,
  "message": "任务删除成功"
}
```

**失败响应**:
```json
{
  "success": false,
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "Task not found"
  }
}
```

## 4. 四象限任务管理

### 4.1 获取四象限任务

- **URL**: `/api/quadrant-tasks`
- **方法**: `GET`
- **描述**: 获取所有四象限任务

**成功响应**:
```json
{
  "success": true,
  "data": {
    "q1": [
      { "id": "60d21b4667d0d8992e610d01", "content": "提交报告", "completed": false }
    ],
    "q2": [
      { "id": "60d21b4667d0d8992e610d02", "content": "学习Swift", "completed": false }
    ],
    "q3": [
      { "id": "60d21b4667d0d8992e610d03", "content": "电话会议", "completed": false }
    ],
    "q4": [
      { "id": "60d21b4667d0d8992e610d04", "content": "整理邮箱", "completed": false }
    ]
  }
}
```

**失败响应**:
```json
{
  "success": false,
  "error": {
    "code": "SERVER_ERROR",
    "message": "获取四象限任务失败"
  }
}
```

### 4.2 添加四象限任务

- **URL**: `/api/quadrant-tasks`
- **方法**: `POST`
- **请求头**:
  - `Content-Type: application/json`
- **请求体**:
```json
{
  "quadrant": "q1",
  "content": "紧急会议",
  "completed": false
}
```

**参数说明**:
- `quadrant` (必填): 象限标识，值为 q1, q2, q3, q4
- `content` (必填): 任务内容
- `completed` (可选): 任务完成状态，默认为false

**成功响应**:
```json
{
  "success": true,
  "data": {
    "id": "60d21b4667d0d8992e610d05",
    "quadrant": "q1",
    "content": "紧急会议",
    "completed": false
  }
}
```

**失败响应**:
```json
{
  "success": false,
  "error": {
    "code": "INVALID_INPUT",
    "message": "Invalid quadrant value"
  }
}
```

### 4.3 更新四象限任务状态

- **URL**: `/api/quadrant-tasks/:id`
- **方法**: `PUT`
- **请求头**:
  - `Content-Type: application/json`
- **URL参数**:
  - `id`: 四象限任务的ID
- **请求体**:
```json
{
  "completed": true,
  "quadrant": "q2"
}
```

**参数说明**:
- `completed` (可选): 更新的任务完成状态
- `quadrant` (可选): 更新的象限，值为 q1, q2, q3, q4

**成功响应**:
```json
{
  "success": true,
  "data": {
    "id": "60d21b4667d0d8992e610d05",
    "quadrant": "q2",
    "content": "紧急会议",
    "completed": true
  }
}
```

**失败响应**:
```json
{
  "success": false,
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "Quadrant task not found"
  }
}
```

### 4.4 删除四象限任务

- **URL**: `/api/quadrant-tasks/:id`
- **方法**: `DELETE`
- **URL参数**:
  - `id`: 四象限任务的ID

**成功响应**:
```json
{
  "success": true,
  "message": "任务删除成功"
}
```

**失败响应**:
```json
{
  "success": false,
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "Quadrant task not found"
  }
}
```

## 5. 番茄钟与计时功能

### 5.1 保存番茄钟记录

- **URL**: `/api/pomodoro-records`
- **方法**: `POST`
- **请求头**:
  - `Content-Type: application/json`
- **请求体**:
```json
{
  "taskId": "60d21b4667d0d8992e610c90",
  "taskContent": "练肩",
  "duration": 25,
  "completedAt": "2023-08-15T14:30:00Z"
}
```

**参数说明**:
- `taskId` (可选): 关联的任务ID
- `taskContent` (必填): 任务内容描述
- `duration` (必填): 完成的时长，单位分钟
- `completedAt` (可选): 完成时间，ISO 8601格式，默认为当前时间

**成功响应**:
```json
{
  "success": true,
  "data": {
    "id": "60d21b4667d0d8992e610e01",
    "taskId": "60d21b4667d0d8992e610c90",
    "taskContent": "练肩",
    "duration": 25,
    "completedAt": "2023-08-15T14:30:00Z"
  }
}
```

**失败响应**:
```json
{
  "success": false,
  "error": {
    "code": "INVALID_INPUT",
    "message": "Task content is required"
  }
}
```

### 5.2 获取番茄钟统计

- **URL**: `/api/pomodoro-statistics`
- **方法**: `GET`
- **查询参数**:
  - `startDate` (可选): 开始日期，格式为 YYYY-MM-DD
  - `endDate` (可选): 结束日期，格式为 YYYY-MM-DD

**成功响应**:
```json
{
  "success": true,
  "data": {
    "totalCount": 45,
    "totalMinutes": 1125,
    "dailyAverage": 3.2,
    "byTask": [
      { "taskContent": "练肩", "count": 12 },
      { "taskContent": "学习Swift", "count": 8 }
    ],
    "byDay": [
      { "date": "2023-08-01", "count": 4 },
      { "date": "2023-08-02", "count": 3 }
    ]
  }
}
```

**失败响应**:
```json
{
  "success": false,
  "error": {
    "code": "INVALID_INPUT",
    "message": "Invalid date format"
  }
}
```

## 6. 用户偏好设置

### 6.1 获取用户设置

- **URL**: `/api/user-settings`
- **方法**: `GET`

**成功响应**:
```json
{
  "success": true,
  "data": {
    "defaultPomodoroTime": 25,
    "defaultView": "task-list",
    "theme": "light",
    "notificationsEnabled": true
  }
}
```

**失败响应**:
```json
{
  "success": false,
  "error": {
    "code": "SERVER_ERROR",
    "message": "获取用户设置失败"
  }
}
```

### 6.2 更新用户设置

- **URL**: `/api/user-settings`
- **方法**: `PUT`
- **请求头**:
  - `Content-Type: application/json`
- **请求体**:
```json
{
  "defaultPomodoroTime": 45,
  "defaultView": "quadrant",
  "theme": "dark",
  "notificationsEnabled": false
}
```

**参数说明**:
- `defaultPomodoroTime` (可选): 默认番茄钟时长，单位分钟，范围1-120
- `defaultView` (可选): 默认视图，值为 "task-list" 或 "quadrant"
- `theme` (可选): 主题，值为 "light" 或 "dark"
- `notificationsEnabled` (可选): 是否启用通知

**成功响应**:
```json
{
  "success": true,
  "data": {
    "defaultPomodoroTime": 45,
    "defaultView": "quadrant",
    "theme": "dark",
    "notificationsEnabled": false
  }
}
```

**失败响应**:
```json
{
  "success": false,
  "error": {
    "code": "INVALID_INPUT",
    "message": "Pomodoro time must be between 1 and 120 minutes"
  }
}
```

## 7. 通用错误响应

所有接口在遇到错误时都会返回统一格式的错误信息：

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "错误信息描述"
  }
}
```

常见错误代码：

| 错误代码 | 状态码 | 描述 |
|---------|------|------|
| `INVALID_INPUT` | 400 | 请求参数不符合要求 |
| `RESOURCE_NOT_FOUND` | 404 | 请求的资源不存在 |
| `UNAUTHORIZED` | 401 | 未授权访问 |
| `SERVER_ERROR` | 500 | 服务器内部错误 |

## 前端实现建议

1. **请求封装**：建议使用Axios或Fetch API封装请求，统一处理错误和成功响应
2. **状态管理**：对于需要在多个组件间共享的数据（如任务列表），建议使用状态管理库
3. **错误处理**：根据错误代码显示不同的错误提示
4. **数据缓存**：对于频繁访问但不常变化的数据（如用户设置）可以考虑本地缓存

### 请求封装示例（使用Axios）:

```javascript
import axios from 'axios';

const API_BASE_URL = 'https://xlimbtrxgghx.sealoshzh.site';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 响应拦截器
api.interceptors.response.use(
  response => response.data,
  error => {
    const errorResponse = error.response?.data || {
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: '网络请求失败'
      }
    };
    return Promise.reject(errorResponse);
  }
);

export default api;
```

### 使用示例:

```javascript
// 获取所有任务集合
const getTaskGroups = async () => {
  try {
    const response = await api.get('/api/task-groups');
    if (response.success) {
      return response.data;
    }
  } catch (error) {
    console.error('获取任务集合失败:', error);
    // 显示错误提示
  }
};

// 创建新任务
const createTask = async (groupId, taskData) => {
  try {
    const response = await api.post(`/api/task-groups/${groupId}/tasks`, taskData);
    if (response.success) {
      return response.data;
    }
  } catch (error) {
    console.error('创建任务失败:', error);
    // 显示错误提示
  }
};
```
