# AI 教育助手 - API 接口文档

> 重要：本文件为历史版本，最新接口规范请参考 `docs/api-interaction.md`（本项目唯一规范来源）。以 `docs/api-interaction.md` 为准。

## 概述

本文档定义了 AI 教育助手前端所需的核心 API 接口规范。

**基础信息:**
- 基础 URL: `https://your-api-domain.com/api/v1`
- 数据格式: JSON
- 字符编码: UTF-8
- 认证方式: JWT Bearer Token

---

## 目录

1. [认证相关](#1-认证相关)
2. [用户管理](#2-用户管理)
3. [课程管理](#3-课程管理)
4. [AI 对话](#4-ai-对话)
5. [学习资料](#5-学习资料)
6. [历史记录](#6-历史记录)
7. [设置管理](#7-设置管理)

---

## 通用响应格式

### 成功响应
```json
{
  "success": true,
  "data": { /* 业务数据 */ },
  "message": "操作成功",
  "timestamp": "2025-01-24T10:00:00Z"
}
```

### 错误响应
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "错误描述",
    "details": { /* 详细错误信息 */ }
  },
  "timestamp": "2025-01-24T10:00:00Z"
}
```

### 分页响应
```json
{
  "success": true,
  "data": {
    "items": [ /* 数据列表 */ ],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 100,
      "totalPages": 5
    }
  }
}
```

---

## 1. 认证相关

### 1.1 用户注册
**POST** `/auth/register`

**请求体:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "username": "用户名",
  "agreeToTerms": true
}
```

**响应:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "username": "用户名",
      "createdAt": "2025-01-24T10:00:00Z"
    },
    "session": {
      "accessToken": "jwt_token",
      "refreshToken": "refresh_token",
      "expiresAt": "2025-01-24T11:00:00Z"
    }
  }
}
```

### 1.2 用户登录
**POST** `/auth/login`

**请求体:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**响应:** 同注册响应

### 1.3 刷新令牌
**POST** `/auth/refresh`

**请求头:**
```
Authorization: Bearer {refresh_token}
```

**响应:**
```json
{
  "success": true,
  "data": {
    "accessToken": "new_jwt_token",
    "expiresAt": "2025-01-24T12:00:00Z"
  }
}
```

### 1.4 退出登录
**POST** `/auth/logout`

**请求头:**
```
Authorization: Bearer {access_token}
```

---

## 2. 用户管理

### 2.1 获取当前用户信息
**GET** `/users/me`

**响应:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "用户名",
    "avatar": "https://...",
    "preferences": {
      "theme": "light",
      "language": "zh-CN"
    },
    "createdAt": "2025-01-24T10:00:00Z",
    "updatedAt": "2025-01-24T10:00:00Z"
  }
}
```

### 2.2 更新用户信息
**PATCH** `/users/me`

**请求体:**
```json
{
  "username": "新用户名",
  "avatar": "https://..."
}
```

---

## 3. 课程管理

### 3.1 获取课程列表
**GET** `/courses`

**查询参数:**
- `page` (可选): 页码,默认 1
- `pageSize` (可选): 每页数量,默认 20
- `search` (可选): 搜索关键词
- `status` (可选): 课程状态 (`active` | `archived`)

**响应:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "name": "数据结构与算法",
        "description": "课程描述",
        "icon": "BookOpen",
        "color": "from-primary to-accent",
        "status": "active",
        "progress": 45.5,
        "totalLessons": 20,
        "completedLessons": 9,
        "lastStudiedAt": "2025-01-24T09:00:00Z",
        "createdAt": "2025-01-20T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 6,
      "totalPages": 1
    }
  }
}
```

### 3.2 获取单个课程详情
**GET** `/courses/{courseId}`

**响应:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "数据结构与算法",
    "description": "详细课程描述",
    "syllabus": [
      {
        "id": "lesson-1",
        "title": "第一章:基础概念",
        "lessons": [
          {
            "id": "lesson-1-1",
            "title": "1.1 什么是数据结构",
            "duration": 1800,
            "completed": true
          }
        ]
      }
    ],
    "materials": [
      {
        "id": "material-1",
        "name": "教材.pdf",
        "type": "pdf",
        "url": "https://...",
        "uploadedAt": "2025-01-20T10:00:00Z"
      }
    ],
    "progress": 45.5,
    "createdAt": "2025-01-20T10:00:00Z"
  }
}
```

### 3.3 创建新课程
**POST** `/courses`

**请求体:**
```json
{
  "name": "课程名称",
  "description": "课程描述",
  "icon": "BookOpen",
  "color": "from-primary to-accent"
}
```

**响应:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "课程名称",
    "description": "课程描述",
    "status": "active",
    "createdAt": "2025-01-24T10:00:00Z"
  }
}
```

### 3.4 更新课程信息
**PATCH** `/courses/{courseId}`

**请求体:**
```json
{
  "name": "新课程名称",
  "description": "新描述"
}
```

### 3.5 删除课程
**DELETE** `/courses/{courseId}`

**响应:**
```json
{
  "success": true,
  "message": "课程已删除"
}
```

### 3.6 更新课程进度
**POST** `/courses/{courseId}/progress`

**请求体:**
```json
{
  "lessonId": "lesson-1-1",
  "completed": true,
  "timeSpent": 1800
}
```

---

## 4. AI 对话

### 4.1 创建对话会话
**POST** `/chat/sessions`

**请求体:**
```json
{
  "courseId": "uuid",
  "title": "会话标题(可选)"
}
```

**响应:**
```json
{
  "success": true,
  "data": {
    "id": "session-uuid",
    "courseId": "uuid",
    "title": "会话标题",
    "createdAt": "2025-01-24T10:00:00Z"
  }
}
```

### 4.2 发送消息 (流式响应)
**POST** `/chat/messages/stream`

> **设计说明:** 这是前端期望的接口格式,用于实现流式 LLM 对话功能。
> 前端需要实时显示 AI 回答,因此使用 Server-Sent Events (SSE) 流式传输。

**请求头:**
```
Content-Type: application/json
Authorization: Bearer {access_token}
Accept: text/event-stream
```

**请求体:**
```json
{
  "message": "用户问题内容",
  "courseId": "uuid (可选)",
  "sessionId": "session-uuid (可选,如果是新对话则不传)",
  "context": {
    "previousMessages": [
      {
        "role": "user",
        "content": "之前的问题"
      },
      {
        "role": "assistant",
        "content": "之前的回答"
      }
    ]
  }
}
```

**响应格式 (Server-Sent Events 流式):**

流式响应使用 SSE 格式,每个事件以 `data:` 开头,包含 JSON 数据:

```
# 1. 开始事件
data: {"type": "start", "sessionId": "session-uuid", "messageId": "msg-uuid", "timestamp": "2025-01-24T10:00:00Z"}

# 2. 文本片段事件 (持续接收)
data: {"type": "token", "content": "这"}

data: {"type": "token", "content": "是"}

data: {"type": "token", "content": "一个"}

data: {"type": "token", "content": "AI"}

data: {"type": "token", "content": "回答"}

# 3. 结束事件
data: {"type": "end", "messageId": "msg-uuid", "totalTokens": 150, "timestamp": "2025-01-24T10:00:05Z"}

# 4. 连接关闭
```

**事件类型说明:**

| 事件类型 | 字段 | 说明 |
|---------|------|------|
| `start` | `sessionId`, `messageId`, `timestamp` | 流式响应开始 |
| `token` | `content` | AI 生成的文本片段 |
| `error` | `code`, `message` | 发生错误 |
| `end` | `messageId`, `totalTokens`, `timestamp` | 流式响应结束 |

**错误事件示例:**
```
data: {"type": "error", "code": "RATE_LIMIT", "message": "请求过于频繁，请稍后再试"}
```

### 4.3 发送消息 (非流式响应)
**POST** `/chat/messages`

> **说明:** 用于不需要流式输出的场景,一次性返回完整回答。

**请求体:**
```json
{
  "message": "用户问题内容",
  "courseId": "uuid (可选)",
  "sessionId": "session-uuid (可选)"
}
```

**响应:**
```json
{
  "success": true,
  "data": {
    "sessionId": "session-uuid",
    "messageId": "msg-uuid",
    "userMessage": {
      "id": "user-msg-uuid",
      "role": "user",
      "content": "用户问题内容",
      "createdAt": "2025-01-24T10:00:00Z"
    },
    "assistantMessage": {
      "id": "assistant-msg-uuid",
      "role": "assistant",
      "content": "完整的 AI 回答内容...",
      "createdAt": "2025-01-24T10:00:05Z"
    },
    "metadata": {
      "tokensUsed": 150,
      "model": "gpt-4",
      "responseTime": 5200
    }
  }
}
```

### 4.4 获取会话历史
**GET** `/chat/sessions/{sessionId}/messages`

**查询参数:**
- `limit` (可选): 消息数量,默认 50
- `before` (可选): 获取此消息 ID 之前的消息

**响应:**
```json
{
  "success": true,
  "data": {
    "messages": [
      {
        "id": "msg-uuid",
        "sessionId": "session-uuid",
        "role": "user",
        "content": "用户问题",
        "createdAt": "2025-01-24T10:00:00Z"
      },
      {
        "id": "msg-uuid-2",
        "sessionId": "session-uuid",
        "role": "assistant",
        "content": "AI 回答",
        "createdAt": "2025-01-24T10:00:05Z"
      }
    ],
    "hasMore": false
  }
}
```

### 4.5 语音转文字
**POST** `/chat/voice/transcribe`

**请求体 (multipart/form-data):**
```
audio: <audio_file>
language: "zh-CN"
```

**响应:**
```json
{
  "success": true,
  "data": {
    "text": "转录的文字内容",
    "language": "zh-CN",
    "confidence": 0.95,
    "duration": 5.2
  }
}
```

---

## 5. 学习资料

### 5.1 上传学习资料
**POST** `/materials`

**请求体 (multipart/form-data):**
```
file: <file>
courseId: "uuid"
name: "资料名称"
type: "pdf" | "doc" | "image" | "video"
```

**响应:**
```json
{
  "success": true,
  "data": {
    "id": "material-uuid",
    "name": "资料.pdf",
    "type": "pdf",
    "url": "https://...",
    "size": 1024000,
    "courseId": "uuid",
    "uploadedAt": "2025-01-24T10:00:00Z"
  }
}
```

### 5.2 获取资料列表
**GET** `/materials`

**查询参数:**
- `courseId` (可选): 课程 ID
- `type` (可选): 资料类型

**响应:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "material-uuid",
        "name": "资料.pdf",
        "type": "pdf",
        "url": "https://...",
        "size": 1024000,
        "courseId": "uuid",
        "uploadedAt": "2025-01-24T10:00:00Z"
      }
    ]
  }
}
```

### 5.3 删除资料
**DELETE** `/materials/{materialId}`

---

## 6. 历史记录

### 6.1 获取对话会话列表
**GET** `/chat/sessions`

**查询参数:**
- `page` (可选): 页码
- `pageSize` (可选): 每页数量
- `courseId` (可选): 课程 ID

**响应:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "session-uuid",
        "title": "关于链表的讨论",
        "courseId": "uuid",
        "courseName": "数据结构与算法",
        "lastMessage": "AI 的最后回复...",
        "messageCount": 12,
        "createdAt": "2025-01-24T10:00:00Z",
        "updatedAt": "2025-01-24T10:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 50,
      "totalPages": 3
    }
  }
}
```

### 6.2 删除会话
**DELETE** `/chat/sessions/{sessionId}`

### 6.3 重命名会话
**PATCH** `/chat/sessions/{sessionId}`

**请求体:**
```json
{
  "title": "新会话标题"
}
```

---

## 7. 设置管理

### 7.1 获取用户设置
**GET** `/settings`

**响应:**
```json
{
  "success": true,
  "data": {
    "theme": "light",
    "language": "zh-CN",
    "notifications": {
      "email": true,
      "push": false
    },
    "ai": {
      "model": "gpt-4",
      "temperature": 0.7,
      "streamResponse": true
    },
    "privacy": {
      "shareData": false
    }
  }
}
```

### 7.2 更新设置
**PATCH** `/settings`

**请求体:**
```json
{
  "theme": "dark",
  "ai": {
    "model": "gpt-3.5-turbo"
  }
}
```

---

## 错误码表

| 错误码 | HTTP 状态码 | 说明 |
|--------|------------|------|
| `UNAUTHORIZED` | 401 | 未授权,需要登录 |
| `FORBIDDEN` | 403 | 禁止访问 |
| `NOT_FOUND` | 404 | 资源不存在 |
| `VALIDATION_ERROR` | 422 | 请求参数验证失败 |
| `RATE_LIMIT_EXCEEDED` | 429 | 请求频率超限 |
| `INTERNAL_ERROR` | 500 | 服务器内部错误 |
| `SERVICE_UNAVAILABLE` | 503 | 服务暂时不可用 |
| `COURSE_NOT_FOUND` | 404 | 课程不存在 |
| `SESSION_NOT_FOUND` | 404 | 会话不存在 |
| `MATERIAL_UPLOAD_FAILED` | 500 | 资料上传失败 |
| `AI_SERVICE_ERROR` | 503 | AI 服务错误 |
| `INSUFFICIENT_CREDITS` | 402 | 积分不足 |

---

## 数据模型

### User (用户)
```typescript
interface User {
  id: string;
  email: string;
  username: string;
  avatar?: string;
  preferences: UserPreferences;
  createdAt: string;
  updatedAt: string;
}
```

### Course (课程)
```typescript
interface Course {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  status: 'active' | 'archived';
  progress: number;
  totalLessons: number;
  completedLessons: number;
  lastStudiedAt?: string;
  createdAt: string;
  updatedAt: string;
}
```

### ChatSession (对话会话)
```typescript
interface ChatSession {
  id: string;
  userId: string;
  courseId?: string;
  title: string;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
}
```

### Message (消息)
```typescript
interface Message {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  attachments?: Attachment[];
  metadata?: MessageMetadata;
  createdAt: string;
}
```

### Material (学习资料)
```typescript
interface Material {
  id: string;
  courseId: string;
  name: string;
  type: 'pdf' | 'doc' | 'image' | 'video';
  url: string;
  size: number;
  uploadedAt: string;
}
```

---

## WebSocket 实时通信

**连接地址:** `wss://your-api-domain.com/ws`

**连接参数:**
```
?token={access_token}
```

### 事件类型

#### 客户端 -> 服务器

**发送消息:**
```json
{
  "type": "chat.message",
  "sessionId": "session-uuid",
  "content": "用户问题"
}
```

#### 服务器 -> 客户端

**AI 流式响应:**
```json
{
  "type": "chat.stream",
  "sessionId": "session-uuid",
  "messageId": "msg-uuid",
  "token": "文字片段"
}
```

**流式响应结束:**
```json
{
  "type": "chat.stream.end",
  "sessionId": "session-uuid",
  "messageId": "msg-uuid"
}
```

---

## 附录

### A. 认证流程

1. 用户登录获取 `accessToken` 和 `refreshToken`
2. 在所有需要认证的请求头中添加: `Authorization: Bearer {accessToken}`
3. 当 `accessToken` 过期时,使用 `refreshToken` 刷新令牌
4. 如果 `refreshToken` 也过期,要求用户重新登录

### B. 文件上传限制

- 单个文件大小: 最大 50MB
- 支持格式:
  - 文档: PDF, DOC, DOCX, TXT, MD
  - 图片: JPG, PNG, GIF, WEBP
  - 视频: MP4, MOV, AVI
- 总存储空间: 每用户 5GB

### C. API 限流规则

- 普通请求: 100 次/分钟
- AI 对话: 20 次/分钟
- 文件上传: 10 次/分钟
- WebSocket 连接: 5 个/用户

---

**文档版本:** v1.0.0
**最后更新:** 2025-01-24
**维护者:** AI 教育助手开发团队
