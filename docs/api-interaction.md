# AIEDU 前后端接口说明（规范版）

> 说明：本文件为唯一规范来源（Source of Truth）。`docs/API.md` 为历史版本，仅供参考。

本文定义当前系统的 HTTP 接口，覆盖健康检测、LLM 对话、课程管理、用户设置，以及多模态扩展规划。所有接口默认挂载在 `/api` 前缀下，示例基地址为 `http://127.0.0.1:8000/api`。

---

## 0. 通用约定

| 项目           | 说明 |
|----------------|------|
| 版本控制       | 预留 `/api/v1` 命名空间；当前处于 v1 试运行阶段。|
| 鉴权           | 暂时匿名访问；未来可通过 `Authorization: Bearer <token>` 接入 Supabase Auth 或自有 JWT。|
| 返回封装       | v1 已上线的 `health`/`test`/`llm` 接口为资源直出；新增模块按 `{ "data": ..., "error": null }` 统一封装，后续将逐步迁移统一。|
| 字段命名       | JSON 字段使用 camelCase（如 `sessionId`、`tokensUsed`）；查询参数使用 camelCase（如 `page`、`pageSize`）。|
| 时间格式       | ISO8601 UTC，例如 `2024-08-22T10:15:00Z`。|
| 分页参数       | `page`（默认 1）、`pageSize`（默认 20，最大 100）。|

---

## 1. 基础服务

### 1.1 健康检查

- **方法**：`GET`
- **路径**：`/health`
- **说明**：后端服务存活检查。
- **成功响应**

```json
{
  "status": "ok"
}
```

### 1.2 调试连通性

- **方法**：`GET`
- **路径**：`/test/ping`
- **说明**：返回应用名称与服务器时间，用于开发/监控探测。
- **成功响应**

```json
{
  "message": "pong",
  "app_name": "AIEDU Backend",
  "server_time": "2024-08-22T10:25:00.123456+00:00"
}
```

---

## 2. LLM 对话

React 首页（`Index`）及后续聊天功能依赖下列接口。系统区分非流式与流式调用：

### 2.1 非流式生成

- **方法**：`POST`
- **路径**：`/llm/messages`
- **说明**：一次性生成回答，适合批处理、表单生成等场景。
- **请求示例**

```json
{
  "message": "解释一下二叉树的前序遍历",
  "courseId": "course_123",
  "sessionId": "session_456",
  "context": {
    "previousMessages": [
      {"role": "user", "content": "什么是二叉树？"},
      {"role": "assistant", "content": "二叉树是..."}
    ],
    "metadata": {
      "language": "zh-CN"
    }
  },
  "options": {
    "model": "gpt-4o-mini",
    "temperature": 0.2
  }
}
```

- **成功响应（v1 实际返回：资源直出）**

```json
{
  "sessionId": "session_456",
  "messageId": "msg_789",
  "content": "前序遍历按照“根-左-右”的顺序访问节点...",
  "tokensUsed": {
    "prompt": 120,
    "completion": 180,
    "total": 300
  },
  "metadata": {}
}
```

### 2.2 流式生成（SSE）

- **方法**：`POST`
- **路径**：`/llm/messages/stream`
- **协议**：Server-Sent Events，`Content-Type: text/event-stream`
- **说明**：实时返回模型输出。
- **请求体**：与 2.1 相同（可附加 `streamOptions`）。
- **响应事件格式**

```
data: {"type":"start","sessionId":"session_456","messageId":"msg_789"}

data: {"type":"token","content":"前序遍历"}
data: {"type":"token","content":"按照“根-左-右”"}
...

data: {"type":"end","messageId":"msg_789","totalTokens":150,"durationMs":8200}

data: {"type":"error","message":"模型超时"}   # 可选，遇到异常时发送
```

- **注意事项**
  - 每条 SSE 事件后需空行分隔。
  - 断线后前端需主动重连或提示用户重试。

### 2.3 Prompt 模板管理（保留旧接口）

- **方法**：`GET /llm/prompts`、`POST /llm/prompts`（后续扩展）
- **说明**：为用户管理可复用 Prompt 模板，原 `POST /llm/prompt` 将转型至该用途。

### 2.4 会话管理（待实现）

- **创建会话**：`POST /llm/sessions`
- **追加消息**：`POST /llm/sessions/{sessionId}/messages`
- **拉取会话**：`GET /llm/sessions`、`GET /llm/sessions/{sessionId}`
- **说明**：用于保存历史对话，配合课程上下文检索。

#### 请求示例（创建会话）

```json
{
  "courseId": "course_123",
  "title": "二叉树基础",
  "initialPrompt": "请帮我整理二叉树遍历方法",
  "context": "system instructions",
  "metadata": {}
}
```

#### 成功响应

```json
{
  "data": {
    "sessionId": "sess_123",
    "messages": [
      {
        "role": "assistant",
        "content": "欢迎开始学习二叉树...",
        "createdAt": "2024-08-22T10:20:00Z"
      }
    ]
  },
  "error": null
}
```

---

## 3. 课程管理

目前前端使用静态数据，后端需提供 API 支持课程 CRUD、进度管理。

### 3.1 课程列表

- **方法**：`GET`
- **路径**：`/courses`
- **查询参数**：`page`, `pageSize`
- **说明**：返回完整课程列表。
- **成功响应**

```json
{
  "data": {
    "items": [
      {
        "id": "course_1",
        "name": "数据结构与算法",
        "description": "掌握关键数据结构与算法思想。",
        "thumbnailUrl": null,
        "progress": 0.45,
        "updatedAt": "2024-08-21T12:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 6
    }
  },
  "error": null
}
```

### 3.2 精简列表（Header 下拉）

- **方法**：`GET`
- **路径**：`/courses/short`
- **查询参数**：`limit`（默认 10）
- **说明**：仅返回 `id`、`name` 等基础字段。

### 3.3 创建 / 更新 / 删除

- **方法**：
  - `POST /courses` 创建
  - `PATCH /courses/{courseId}` 更新
  - `DELETE /courses/{courseId}` 删除（推荐软删除）
- **请求示例（创建）**

```json
{
  "name": "操作系统",
  "description": "进程管理、内存管理等核心概念",
  "coverImage": "https://cdn.example.com/os.png",
  "tags": ["CS", "基础"],
  "visibility": "private"
}
```

### 3.4 课程详情 & 进度

- **方法**：
  - `GET /courses/{courseId}` 详情
  - `GET /courses/{courseId}/progress` 获取用户进度
  - `POST /courses/{courseId}/progress` 更新进度
- **请求示例（更新进度）**

```json
{
  "completedPercentage": 0.6,
  "lastAccessedAt": "2024-08-22T09:30:00Z",
  "notes": "完成第 3 章练习题"
}
```

---

## 4. 用户设置

设置页当前使用 `localStorage` 保存用户信息，后端接口如下。

### 4.1 获取个人资料

- **方法**：`GET`
- **路径**：`/users/me`

### 4.2 更新个人资料

- **方法**：`PUT`
- **路径**：`/users/me`
- **请求示例**

```json
{
  "name": "张三",
  "email": "zhangsan@example.com",
  "phone": "+86-13800000000",
  "avatarUrl": null,
  "preferences": {
    "language": "zh-CN",
    "timezone": "Asia/Shanghai"
  }
}
```

- **成功响应**

```json
{
  "data": {
    "id": "user_123",
    "name": "张三",
    "email": "zhangsan@example.com",
    "phone": "+86-13800000000",
    "avatarUrl": null,
    "preferences": {
      "language": "zh-CN",
      "timezone": "Asia/Shanghai"
    },
    "updatedAt": "2024-08-22T08:00:00Z"
  },
  "error": null
}
```

---

## 5. 任务与学习记录（可选扩展）

| 方法 | 路径            | 功能说明 |
|------|-----------------|----------|
| GET  | `/tasks`        | 获取学习任务列表 |
| POST | `/tasks`        | 创建学习任务（例如“完成二叉树遍历练习”） |
| PATCH| `/tasks/{id}`   | 更新任务状态、备注等 |
| GET  | `/notes`        | 获取 AI/用户生成的学习笔记 |
| POST | `/notes`        | 新增笔记，或保存 LLM 总结 |

---

## 6. 多模态材料

学生可上传 PPT、教材 PDF、音视频等材料，系统需提供解析与检索能力。

### 6.1 材料上传

- **方法**：`POST`
- **路径**：`/materials`
- **说明**：接收文件，保存至对象存储，触发解析任务。
- **响应**：返回 `materialId`、任务状态。

### 6.2 材料解析状态

- **方法**：`GET`
- **路径**：`/materials/{materialId}`
- **说明**：查询解析进度、错误信息、生成的摘要等。

### 6.3 文本片段检索

- **方法**：`GET`
- **路径**：`/materials/{materialId}/chunks`
- **查询参数**：`search`、`page` 等
- **说明**：返回结构化文本块，供聊天上下文使用。

### 6.4 流式引用广播

- SSE 事件可扩展字段（例如 `{"type":"meta","reference":["materialId","chunkId"]}`）提醒前端展示引用来源。

---

## 7. 错误码约定

| 代码 | HTTP 状态 | 说明 |
|------|-----------|------|
| `BAD_REQUEST`         | 400 | 参数缺失或格式错误 |
| `UNAUTHORIZED`        | 401 | 未登录或令牌失效 |
| `FORBIDDEN`           | 403 | 无访问权限 |
| `NOT_FOUND`           | 404 | 资源不存在 |
| `CONFLICT`            | 409 | 状态冲突（重复创建等） |
| `RATE_LIMITED`        | 429 | 触发频率限制 |
| `SERVER_ERROR`        | 500 | 未处理的服务端异常 |
| `LLM_PROVIDER_ERROR`  | 502 | 上游大模型返回错误 |

---

## 8. 开发规划摘要

### 8.1 流式对话路线图

| 阶段 | 后端重点 | 前端重点 |
|------|----------|----------|
| Sprint 1 | 实现 `/llm/messages` 与 `/llm/messages/stream`；集成 LLM 流式 SDK；缓存会话上下文（内存/Redis） | 解析 SSE，建立聊天状态机，提供实时渲染与取消功能 |
| Sprint 2 | 会话持久化（PostgreSQL）；根据 `courseId` 注入课程资料；鉴权与速率限制 | 前端 store 同步 `sessionId`，发送 `previousMessages`，对接课程上下文 |
| Sprint 3 | 多模态输入（附件 → 解析）；SSE 扩展元数据与引用；监控告警 | 支持附件上传与引用展示；断线重连、历史记录回放 |

### 8.2 多模态协作

| 模块 | 后端责任 | 前端责任 |
|------|----------|----------|
| 材料上传 | `/materials` 接口、对象存储、解析任务队列 | 上传 UI、进度展示、状态轮询 |
| 知识检索 | 文本/图像向量化、检索 API、聊天上下文注入 | 携带 `courseId` 调用、展示引用片段 |
| 多模态对话 | SSE 事件区分文本/音频/图像；转写、OCR、描述模型 | 适配不同内容类型的展示组件 |
| 监控回放 | 会话日志、token 统计、速率限制 | 历史记录页面、复用会话继续提问 |

---

## 9. 前端集成建议

1. 使用 React Query 管理接口缓存，`queryKey` 设计为 `["courses", {page}]` 等。
2. `.env` 设置 `VITE_API_BASE_URL`，统一请求前缀；SSE 可用 `EventSource` 或 `fetch` streaming。
3. 根据 `error.code` 做统一提示或跳转。
4. 获取 OpenAPI 文档（`/openapi.json`）可用 `openapi-typescript` 生成类型定义。
5. 对流式请求提供取消/重试机制，防止长时间占用连接。

---

如需新增模块，请在此文档扩展对应章节并同步更新后端实现。***
