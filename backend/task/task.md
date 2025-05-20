以下是基于你项目现有后端实现（包括任务组、任务、番茄钟等）整理的前后端交互API文档，涵盖请求方式、URL、请求体、成功响应、失败响应等内容。所有任务相关接口均需登录后携带JWT Token（`Authorization: Bearer <token>`）。

---

# 任务管理系统 API 文档

## 认证说明
- **所有任务相关接口均需认证**，需在请求头添加：
  ```
  Authorization: Bearer <token>
  ```

---

## 任务组（Task Group）相关接口

### 1. 获取所有任务组
- **请求方式**：GET
- **请求URL**：`/api/v1/task-groups`
- **成功响应**：
    ```json
    {
      "data": [
        {
          "_id": "65f3b7a8c8e1f2001a87d123",
          "name": "开发任务",
          "tasks": [ /* 任务数组 */ ]
        }
      ],
      "success": true
    }
    ```
- **失败响应**（如未认证）：
    ```json
    {
      "error": {
        "code": "UNAUTHORIZED",
        "message": "Authentication required"
      },
      "success": false
    }
    ```

### 2. 创建任务组
- **请求方式**：POST
- **请求URL**：`/api/v1/task-groups`
- **请求体**：
    ```json
    {
      "name": "开发任务"
    }
    ```
- **成功响应**：
    ```json
    {
      "data": {
        "_id": "65f3b7a8c8e1f2001a87d123",
        "name": "开发任务"
      },
      "message": "Task group created successfully",
      "success": true
    }
    ```
- **失败响应**（如参数校验失败）：
    ```json
    {
      "error": {
        "code": "VALIDATION_ERROR",
        "message": "Validation failed",
        "details": {
          "name": "任务集名称不能为空"
        }
      },
      "success": false
    }
    ```

### 3. 更新任务组
- **请求方式**：PUT
- **请求URL**：`/api/v1/task-groups/:groupId`
- **请求体**：
    ```json
    {
      "name": "新名称"
    }
    ```
- **成功响应**：
    ```json
    {
      "data": {
        "_id": "65f3b7a8c8e1f2001a87d123",
        "name": "新名称"
      },
      "message": "Task group updated successfully",
      "success": true
    }
    ```
- **失败响应**（如找不到任务组）：
    ```json
    {
      "error": {
        "code": "NOT_FOUND",
        "message": "Task group with ID xxx not found"
      },
      "success": false
    }
    ```

### 4. 删除任务组
- **请求方式**：DELETE
- **请求URL**：`/api/v1/task-groups/:groupId`
- **成功响应**：
    - 状态码204，无内容
- **失败响应**（如找不到任务组）：
    ```json
    {
      "error": {
        "code": "NOT_FOUND",
        "message": "Task group with ID xxx not found"
      },
      "success": false
    }
    ```

---

## 任务（Task）相关接口

### 1. 获取所有任务
- **请求方式**：GET
- **请求URL**：`/api/v1/tasks`
- **成功响应**：
    ```json
    {
      "data": [
        {
          "_id": "65f3b7a8c8e1f2001a87d124",
          "name": "实现登录功能",
          "completed": false,
          "priority": "high",
          "groupId": {
            "_id": "65f3b7a8c8e1f2001a87d123",
            "name": "开发任务"
          }
        }
      ],
      "success": true
    }
    ```

### 2. 创建任务
- **请求方式**：POST
- **请求URL**：`/api/v1/tasks`
- **请求体**：
    ```json
    {
      "name": "实现登录功能",
      "groupId": "65f3b7a8c8e1f2001a87d123",
      "priority": "high",
      "dueDate": "2024-05-01T12:00:00Z",
      "isImportant": true,
      "isUrgent": false
    }
    ```
- **成功响应**：
    ```json
    {
      "data": {
        "_id": "65f3b7a8c8e1f2001a87d124",
        "name": "实现登录功能",
        "priority": "high",
        "groupId": {
          "_id": "65f3b7a8c8e1f2001a87d123",
          "name": "开发任务"
        }
      },
      "message": "Task created successfully",
      "success": true
    }
    ```
- **失败响应**（如任务集不存在）：
    ```json
    {
      "error": {
        "code": "NOT_FOUND",
        "message": "Task group with ID xxx not found"
      },
      "success": false
    }
    ```

### 3. 获取单个任务
- **请求方式**：GET
- **请求URL**：`/api/v1/tasks/:taskId`
- **成功响应**：
    ```json
    {
      "data": {
        "_id": "65f3b7a8c8e1f2001a87d124",
        "name": "实现登录功能",
        "priority": "high",
        "groupId": {
          "_id": "65f3b7a8c8e1f2001a87d123",
          "name": "开发任务"
        }
      },
      "success": true
    }
    ```
- **失败响应**（如找不到任务）：
    ```json
    {
      "error": {
        "code": "NOT_FOUND",
        "message": "Task with ID xxx not found"
      },
      "success": false
    }
    ```

### 4. 更新任务
- **请求方式**：PUT
- **请求URL**：`/api/v1/tasks/:taskId`
- **请求体**：
    ```json
    {
      "name": "新任务名",
      "priority": "medium",
      "completed": true
    }
    ```
- **成功响应**：
    ```json
    {
      "data": {
        "_id": "65f3b7a8c8e1f2001a87d124",
        "name": "新任务名",
        "priority": "medium",
        "completed": true
      },
      "message": "Task updated successfully",
      "success": true
    }
    ```

### 5. 更新任务状态
- **请求方式**：PATCH
- **请求URL**：`/api/v1/tasks/:taskId/status`
- **请求体**：
    ```json
    {
      "completed": true
    }
    ```
- **成功响应**：
    ```json
    {
      "data": {
        "id": "65f3b7a8c8e1f2001a87d124",
        "completed": true
      },
      "success": true
    }
    ```

### 6. 删除任务
- **请求方式**：DELETE
- **请求URL**：`/api/v1/tasks/:taskId`
- **成功响应**：
    - 状态码204，无内容

---

## 四象限任务视图
- **请求方式**：GET
- **请求URL**：`/api/v1/tasks/quadrants`
- **成功响应**：
    ```json
    {
      "data": {
        "q1": [ /* 重要且紧急 */ ],
        "q2": [ /* 重要不紧急 */ ],
        "q3": [ /* 不重要但紧急 */ ],
        "q4": [ /* 不重要不紧急 */ ]
      },
      "success": true
    }
    ```

---

## 番茄钟（Pomodoro）相关接口

### 1. 创建番茄钟记录
- **请求方式**：POST
- **请求URL**：`/api/v1/tasks/:taskId/pomodoro`
- **请求体**：
    ```json
    {
      "duration": 1500,
      "startTime": "2024-05-01T09:00:00Z",
      "endTime": "2024-05-01T09:25:00Z",
      "notes": "专注开发"
    }
    ```
- **成功响应**：
    ```json
    {
      "data": {
        "_id": "65f3b7a8c8e1f2001a87d125",
        "duration": 1500,
        "taskId": "65f3b7a8c8e1f2001a87d124"
      },
      "message": "Pomodoro session logged successfully",
      "success": true
    }
    ```

### 2. 获取任务下所有番茄钟
- **请求方式**：GET
- **请求URL**：`/api/v1/tasks/:taskId/pomodoro`
- **成功响应**：
    ```json
    {
      "data": [
        {
          "_id": "65f3b7a8c8e1f2001a87d125",
          "duration": 1500,
          "startTime": "2024-05-01T09:00:00Z",
          "endTime": "2024-05-01T09:25:00Z",
          "notes": "专注开发"
        }
      ],
      "success": true
    }
    ```

---

## 错误响应通用格式

- **未认证/Token无效**：
    ```json
    {
      "error": {
        "code": "UNAUTHORIZED",
        "message": "Authentication required"
      },
      "success": false
    }
    ```
- **参数校验失败**：
    ```json
    {
      "error": {
        "code": "VALIDATION_ERROR",
        "message": "Validation failed",
        "details": {
          "name": "任务名称不能为空"
        }
      },
      "success": false
    }
    ```
- **资源不存在**：
    ```json
    {
      "error": {
        "code": "NOT_FOUND",
        "message": "Task with ID xxx not found"
      },
      "success": false
    }
    ```

---

**说明**：  
- 所有接口均需认证（除注册/登录外），Token获取方式见登录注册API文档。  
- 详细字段校验规则见<mcsymbol name="taskValidators" filename="validators.js" path="src/middleware/validators.js" startline="74" type="variable">validators.js</mcsymbol>。  
- 任务组与任务的ID均为MongoDB ObjectId字符串。  
- 删除操作成功返回204状态码，无响应体。

如需更多接口细节或特殊用例，请补充说明。