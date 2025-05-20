# 统计模块 API 文档

本文档详细描述了统计模块的API接口，包括接口路径、请求方法、参数和响应格式。

## 基本信息

- 基础URL: `/api/v1/stats`
- 认证方式: JWT Bearer Token（所有接口都需要认证）
- 响应格式: JSON

## 1. 今日概览

获取用户当日完成的任务数、习惯打卡次数和专注时长。

### 请求信息

- 路径: `/today-summary`
- 方法: `GET`

### 查询参数

| 参数名 | 类型 | 必填 | 描述 |
|-------|------|-----|------|
| date  | String | 否 | 指定日期，格式为YYYY-MM-DD，默认为当天 |

### 响应格式

```json
{
  "status": "success",
  "data": {
    "completedTasks": 6,  // 完成的任务数量
    "habitCheckins": 3,   // 习惯打卡次数
    "focusTime": 2.5      // 专注时长（小时）
  }
}
```

### 错误响应

```json
{
  "status": "error",
  "message": "错误信息"
}
```

### 可能的错误

- 400: 无效的日期格式
- 401: 未认证
- 500: 服务器内部错误

## 2. 趋势数据

获取指定时间范围内的任务完成、习惯打卡和专注时间的趋势数据。

### 请求信息

- 路径: `/trends`
- 方法: `GET`

### 查询参数

| 参数名 | 类型 | 必填 | 描述 |
|-------|------|-----|------|
| timeRange | String | 是 | 时间范围，可选值为 "week"、"month" 或 "year" |
| endDate | String | 否 | 结束日期，格式为YYYY-MM-DD，默认为当天 |

### 响应格式

```json
{
  "status": "success",
  "data": {
    "labels": ["周一", "周二", "周三", "周四", "周五", "周六", "周日"],
    "datasets": [
      {
        "label": "任务",
        "data": [5, 7, 4, 6, 8, 3, 6]
      },
      {
        "label": "习惯",
        "data": [3, 3, 2, 4, 3, 2, 3]
      },
      {
        "label": "专注时间(小时)",
        "data": [2.5, 3, 1.5, 4, 3.5, 1, 2.5]
      }
    ]
  }
}
```

### 标签格式说明

根据不同的`timeRange`值，返回的`labels`数组会有不同的格式：

- `week`: 返回周几标签，如 ["周一", "周二", ..., "周日"]
- `month`: 返回周数标签，如 ["第1周", "第2周", "第3周", "第4周"]
- `year`: 返回月份标签，如 ["1月", "2月", ..., "12月"]

### 错误响应

```json
{
  "status": "error",
  "message": "错误信息"
}
```

### 可能的错误

- 400: 无效的时间范围或日期格式
- 401: 未认证
- 500: 服务器内部错误

## 3. 月度汇总

获取指定月份的任务完成率、习惯坚持率和专注效率的数据。

### 请求信息

- 路径: `/monthly-summary`
- 方法: `GET`

### 查询参数

| 参数名 | 类型 | 必填 | 描述 |
|-------|------|-----|------|
| month | String | 是 | 月份，格式为YYYY-MM，如 "2023-10" |

### 响应格式

```json
{
  "status": "success",
  "data": {
    "labels": ["任务完成率", "习惯坚持率", "专注效率"],
    "actualData": [75, 85, 65]  // 实际百分比值
  }
}
```

### 错误响应

```json
{
  "status": "error",
  "message": "错误信息"
}
```

### 可能的错误

- 400: 无效的月份格式
- 401: 未认证
- 500: 服务器内部错误

## 4. 导出报告

导出统计报告（目前尚未实现，返回501状态码）。

### 请求信息

- 路径: `/export`
- 方法: `GET`

### 查询参数

| 参数名 | 类型 | 必填 | 描述 |
|-------|------|-----|------|
| reportType | String | 否 | 报告类型，可选值为 "pdf" 或 "csv"，默认为 "pdf" |
| timeRange | String | 否 | 时间范围，可选值为 "last_week"、"last_month" 或 "last_year"，默认为 "last_month" |

### 响应格式

目前此接口尚未实现，返回501状态码和错误消息：

```json
{
  "status": "error",
  "message": "报告导出功能尚未实现，将在后续版本中提供"
}
```

## 错误处理

所有API接口可能返回以下HTTP状态码：

- 200: 成功
- 400: 请求参数错误
- 401: 未认证或认证令牌无效
- 404: 资源不存在
- 500: 服务器内部错误
- 501: 功能尚未实现

## 示例代码

### 获取今日概览

```javascript
// 使用axios发起请求
const response = await axios.get('/api/v1/stats/today-summary', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const todayStats = response.data.data;
console.log(`今日完成任务: ${todayStats.completedTasks}`);
console.log(`今日习惯打卡: ${todayStats.habitCheckins}`);
console.log(`今日专注时长: ${todayStats.focusTime}小时`);
```

### 获取趋势数据

```javascript
// 获取周趋势
const response = await axios.get('/api/v1/stats/trends', {
  params: {
    timeRange: 'week'
  },
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const trendData = response.data.data;
// 可以用于绘制图表
```

### 获取月度汇总

```javascript
// 获取当月汇总
const now = new Date();
const month = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;

const response = await axios.get('/api/v1/stats/monthly-summary', {
  params: {
    month
  },
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const monthlySummary = response.data.data;
// 可以用于绘制图表
``` 