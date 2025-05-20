


          
以下是番茄钟 (Pomodoro) 功能的详细 API 文档，可供前端参考以实现交互。

---

## 番茄钟 API 文档

**基础路径**: `/api/v1/tasks/:taskId/pomodoro`

**认证**: 所有番茄钟相关的 API 都需要用户认证。请在请求头中包含 `Authorization: Bearer <token>`。

**通用响应格式**:

*   **成功**:
    ```json
    {
      "status": "success",
      "message": "可选的成功消息",
      "data": {} // 或 []，包含请求的数据
    }
    ```
*   **失败**:
    ```json
    {
      "status": "error",
      "message": "错误描述信息",
      "errors": {} // 可选的详细验证错误
    }
    ```

**番茄钟对象结构**:
```json
{
  "_id": "ObjectId",       // 番茄钟会话的唯一ID (自动生成)
  "taskId": "ObjectId",    // 关联的任务ID (必须)
  "duration": Number,      // 会话持续时间 (秒, 必须, >= 1)
  "startTime": "Date",     // 开始时间 (ISO 8601 格式, 必须)
  "endTime": "Date",       // 结束时间 (ISO 8601 格式, 必须, 必须晚于 startTime)
  "notes": "String",       // 备注 (可选, 最多500字符)
  "createdAt": "Date",     // 创建时间 (自动生成)
  "updatedAt": "Date"      // 更新时间 (自动生成)
}
```

---

### 1. 创建新的番茄钟会话

*   **描述**: 为指定的任务记录一个新的番茄钟会话。
*   **方法**: `POST`
*   **路径**: `/api/v1/tasks/:taskId/pomodoro`
*   **路径参数**:
    *   `taskId` (ObjectId, 必须): 需要关联的任务的 ID。
*   **请求体** (JSON):
    ```json
    {
      "duration": 1500, // 持续时间 (秒, 必须, >= 1)
      "startTime": "2023-10-27T10:00:00.000Z", // 开始时间 (ISO 8601, 必须)
      "endTime": "2023-10-27T10:25:00.000Z",   // 结束时间 (ISO 8601, 必须, 晚于 startTime)
      "notes": "完成了第一部分报告" // 备注 (可选, <= 500 字符)
    }
    ```
*   **成功响应** (201 Created):
    ```json
    {
      "status": "success",
      "message": "Pomodoro session logged successfully",
      "data": {
        // 新创建的番茄钟对象 (结构见上文)
      }
    }
    ```
*   **失败响应**:
    *   `400 Bad Request`: 请求体验证失败 (例如，`duration` < 1, `endTime` <= `startTime`, 格式错误)。
    *   `401 Unauthorized`: 未提供或无效的认证 Token。
    *   `404 Not Found`: 提供的 `taskId` 对应的任务不存在。
    *   `500 Internal Server Error`: 服务器内部错误。

---

### 2. 获取任务的所有番茄钟会话

*   **描述**: 获取指定任务的所有番茄钟会话记录，按开始时间降序排列。
*   **方法**: `GET`
*   **路径**: `/api/v1/tasks/:taskId/pomodoro`
*   **路径参数**:
    *   `taskId` (ObjectId, 必须): 需要查询的任务的 ID。
*   **请求体**: 无
*   **成功响应** (200 OK):
    ```json
    {
      "status": "success",
      "data": [
        // 番茄钟对象数组 (结构见上文)
        // 按 startTime 降序排列
      ]
    }
    ```
*   **失败响应**:
    *   `401 Unauthorized`: 未提供或无效的认证 Token。
    *   `404 Not Found`: 提供的 `taskId` 对应的任务不存在。
    *   `500 Internal Server Error`: 服务器内部错误。

---

### 3. 获取指定的番茄钟会话

*   **描述**: 获取某个任务下特定的番茄钟会话详情。
*   **方法**: `GET`
*   **路径**: `/api/v1/tasks/:taskId/pomodoro/:sessionId`
*   **路径参数**:
    *   `taskId` (ObjectId, 必须): 任务的 ID。
    *   `sessionId` (ObjectId, 必须): 需要获取的番茄钟会话的 ID。
*   **请求体**: 无
*   **成功响应** (200 OK):
    ```json
    {
      "status": "success",
      "data": {
        // 指定的番茄钟对象 (结构见上文)
      }
    }
    ```
*   **失败响应**:
    *   `401 Unauthorized`: 未提供或无效的认证 Token。
    *   `404 Not Found`: 提供的 `taskId` 或 `sessionId` 不存在，或该会话不属于该任务。
    *   `500 Internal Server Error`: 服务器内部错误。

---

### 4. 更新番茄钟会话

*   **描述**: 更新一个已存在的番茄钟会话信息。
*   **方法**: `PUT`
*   **路径**: `/api/v1/tasks/:taskId/pomodoro/:sessionId`
*   **路径参数**:
    *   `taskId` (ObjectId, 必须): 任务的 ID。
    *   `sessionId` (ObjectId, 必须): 需要更新的番茄钟会话的 ID。
*   **请求体** (JSON):
    ```json
    {
      "duration": 1800, // 新的持续时间 (秒, 必须, >= 1)
      "startTime": "2023-10-27T10:05:00.000Z", // 新的开始时间 (ISO 8601, 必须)
      "endTime": "2023-10-27T10:35:00.000Z",   // 新的结束时间 (ISO 8601, 必须, 晚于 startTime)
      "notes": "更新了备注信息" // 新的备注 (可选, <= 500 字符)
    }
    ```
*   **成功响应** (200 OK):
    ```json
    {
      "status": "success",
      "message": "Pomodoro session updated successfully",
      "data": {
        // 更新后的番茄钟对象 (结构见上文)
      }
    }
    ```
*   **失败响应**:
    *   `400 Bad Request`: 请求体验证失败 (同创建接口)。
    *   `401 Unauthorized`: 未提供或无效的认证 Token。
    *   `404 Not Found`: 提供的 `taskId` 或 `sessionId` 不存在，或该会话不属于该任务。
    *   `500 Internal Server Error`: 服务器内部错误。

---

### 5. 删除番茄钟会话

*   **描述**: 删除一个指定的番茄钟会话记录。
*   **方法**: `DELETE`
*   **路径**: `/api/v1/tasks/:taskId/pomodoro/:sessionId`
*   **路径参数**:
    *   `taskId` (ObjectId, 必须): 任务的 ID。
    *   `sessionId` (ObjectId, 必须): 需要删除的番茄钟会话的 ID。
*   **请求体**: 无
*   **成功响应** (204 No Content): 无响应体。
*   **失败响应**:
    *   `401 Unauthorized`: 未提供或无效的认证 Token。
    *   `404 Not Found`: 提供的 `taskId` 或 `sessionId` 不存在，或该会话不属于该任务。
    *   `500 Internal Server Error`: 服务器内部错误。

---

        