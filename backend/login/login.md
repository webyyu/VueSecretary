

根据您的身份认证系统实现，我将为您生成规范的OpenAPI格式文档：

```markdown
# 用户认证 API 文档

## 基础信息
- **Base URL**: `http://localhost:3000/api/v1/auth`
- 所有请求必须携带 `Content-Type: application/json` 头

## 用户注册
`POST /register`

### 请求示例
```json
{
  "name": "测试用户",
  "email": "test@supertimer.com",
  "password": "test1234"
}
```

### 成功响应 (201 Created)
```json
{
  "data": {
    "user": {
      "_id": "65f3b7a8c8e1f2001a87d123",
      "name": "测试用户",
      "email": "test@supertimer.com",
      "role": "user"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "注册成功",
  "success": true
}
```

### 失败响应
**400 Bad Request** (验证错误)
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": {
      "email": "邮箱格式不正确"
    }
  },
  "success": false
}

**409 Conflict** (邮箱已存在)
```json
{
  "error": {
    "code": "CONFLICT",
    "message": "邮箱已被注册"
  },
  "success": false
}
```

## 用户登录
`POST /login`

### 请求示例
```json
{
  "email": "test@supertimer.com",
  "password": "test1234"
}
```

### 成功响应 (200 OK)
```json
{
  "data": {
    "user": {
      "_id": "65f3b7a8c8e1f2001a87d123",
      "name": "测试用户",
      "email": "test@supertimer.com"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "登录成功",
  "success": true
}
```

### 失败响应
**401 Unauthorized** (凭据错误)
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "邮箱或密码不正确"
  },
  "success": false
}
```

## 认证要求
后续请求需要在请求头中添加：
```http
Authorization: Bearer <token>
```

## 开发环境准备
```bash
# 启动开发服务器
npm run dev

# 环境变量配置（Windows PowerShell）
$env:MONGODB_URI = "mongodb://localhost:27017/supertimer"
$env:JWT_SECRET = "development_secret"
$env:NODE_ENV = "development"
```

## 错误代码对照表
| HTTP 状态码 | 错误代码           | 说明                     |
|-------------|--------------------|--------------------------|
| 400         | VALIDATION_ERROR   | 请求参数验证失败         |
| 401         | UNAUTHORIZED       | 认证失败或Token无效      |
| 404         | NOT_FOUND          | 资源不存在               |
| 409         | CONFLICT           | 数据冲突（如重复邮箱）   |
| 500         | SERVER_ERROR       | 服务器内部错误           |
```

该文档完全基于您当前的<a mcsymbol name="register" filename="authController.js" path="src/controllers/authController.js" startline="33" type="function">注册逻辑</a>和<a mcsymbol name="login" filename="authController.js" path="src/controllers/authController.js" startline="85" type="function">登录逻辑</a>实现，可直接用于前端开发对接。