# AIEDU 前后端统一接口与技术文档（Source of Truth）

本文件是本项目唯一的接口与技术规范来源。任何前后端接口调整，必须同步更新本文件。

—

## 0. 基本信息

- 基础前缀：`/api`
- 本地基地址（默认开发环境）：`http://127.0.0.1:8000/api`
- 数据格式：JSON（SSE 流式为 `text/event-stream`）
- 字符编码：UTF-8
- 鉴权：当前未启用（未来将支持 `Authorization: Bearer <token>`）
- 自动文档：`/docs`（Swagger UI），OpenAPI：`/openapi.json`

—

## 1. 环境与配置

后端通过环境变量（`.env` 或系统环境）加载配置（见 `backend/app/core/config.py`）：

- 应用
  - `APP_NAME`（默认 AIEDU Backend）
  - `APP_DEBUG`（默认 false）
- 文本大模型（OpenAI 兼容 Chat Completions）
  - `TXT_PROVIDER`（默认 openai，用于标识供应商名）
  - `TXT_BASEURL`（默认 `https://api.openai.com/v1`）
  - `TXT_MODEL`（默认 `gpt-4o-mini`）
  - `TXT_APIKEY`（必填，用于后端直连 LLM）
  - `REQUEST_TIMEOUT_SECONDS`（默认 60）
- 多模态临时存储/解析（当前存本地临时目录）
  - `STORAGE_TMP_DIR`（默认 `/tmp/aiedu_uploads`）
  - `UPLOAD_MAX_MB`（默认 200）
  - `VIDEO_MAX_MB`（默认 500）
  - `AUDIO_MAX_MINUTES`（默认 120）
- 预留：视觉问答（VQA_*）、语音转写（ASR_*）参数位

前端（Vite）开发代理：`frontend/vite.config.ts`

```txt
server.proxy["/api"] -> http://127.0.0.1:8000
```

—

## 2. 启动与本地开发

后端（Python 3.10+）：

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

前端（Node 18+）：

```bash
cd frontend
npm install
npm run dev
```

—

## 3. 基础服务

### 3.1 健康检查
- 方法：GET
- 路径：`/health`
- 响应：

```json
{ "status": "ok" }
```

### 3.2 调试连通性
- 方法：GET
- 路径：`/test/ping`
- 响应示例：

```json
{
  "message": "pong",
  "app_name": "AIEDU Backend",
  "server_time": "2025-01-24T10:25:00.123456+00:00"
}
```

—

## 4. LLM 对话

后端：`backend/app/api/routes/llm.py`，服务：`backend/app/services/llm_service.py`

### 4.1 非流式生成
- 方法：POST
- 路径：`/llm/messages`
- 请求体：

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
    "metadata": { "systemPrompt": "你是一名严谨的 CS 助教" }
  },
  "options": { "model": "gpt-4o-mini", "temperature": 0.2 }
}
```

- 成功响应：

```json
{
  "sessionId": "session_456",
  "messageId": "msg_789",
  "content": "前序遍历按照“根-左-右”的顺序访问节点...",
  "tokensUsed": { "prompt": 120, "completion": 180, "total": 300 },
  "metadata": { "provider": "openai", "model": "gpt-4o-mini" }
}
```

### 4.2 流式生成（SSE）
- 方法：POST
- 路径：`/llm/messages/stream`
- 协议：Server-Sent Events（响应头 `Content-Type: text/event-stream`）
- 请求体：与 4.1 相同
- 事件流格式：

```txt
data: {"type":"start","sessionId":"session_456","messageId":"msg_789"}

data: {"type":"token","content":"前序遍历"}
data: {"type":"token","content":"按照“根-左-右”"}
...

data: {"type":"end","messageId":"msg_789","totalTokens":150}

data: {"type":"error","message":"模型超时"}
```

注意：每个事件以 `data:` 开头，后跟 JSON 字符串，并以空行分隔。

### 4.3 Prompt 直出（兼容接口）
- 方法：POST
- 路径：`/llm/prompt`
- 请求体：

```json
{ "prompt": "解释栈与队列的区别", "context": "你是一名 CS 助教" }
```

- 响应：

```json
{ "response": "栈是后进先出（LIFO），队列是先进先出（FIFO）..." }
```

—

## 5. 多模态材料（当前存本地临时目录）

后端：`backend/app/api/routes/materials.py`

允许类型：`txt,pdf,ppt,pptx,doc,docx,jpg,jpeg,png,mp3,m4a,wav,mp4`

### 5.1 上传
- 方法：POST
- 路径：`/materials`
- Content-Type：`multipart/form-data`
- 表单字段：`file`（必填）、`courseId`（可选）、`title`（可选）、`tags`（可选）
- 成功响应：

```json
{
  "data": {
    "materialId": "mat_123",
    "status": "uploaded",
    "mime": "application/pdf",
    "originalName": "CS101-Intro.pdf",
    "sizeBytes": 1048576
  },
  "error": null
}
```

### 5.2 查询材料
- 方法：GET `/materials/{materialId}` → 返回占位元数据
- 方法：GET `/materials` → 列出所有（从临时目录扫描）
- 方法：DELETE `/materials/{materialId}` → 删除对应目录

### 5.3 原始文件下载 URL（未实现）
- 方法：GET `/materials/{materialId}/original-url` → 返回 `501 Not Implemented`

### 5.4 文本块/字幕片段（占位）
- 方法：GET `/materials/{materialId}/chunks`（参数：`offset`,`limit`,`type=text|caption`）

### 5.5 重新解析（占位）
- 方法：POST `/materials/{materialId}/parse`（参数：`mode=auto|vision|asr|text`）

—

## 6. 错误约定与返回风格

当前已上线接口存在两种返回风格：
- 资源直出（如 `/health`、`/test/ping`、`/llm/messages`）
- 统一封装 `{ "data": ..., "error": null }`（如 `materials` 模块）

短期内兼容共存，后续将逐步统一为封装风格并在此文档同步更新。

常见错误：
- 400 Bad Request：参数不合法（LLM/上传格式校验失败等）
- 404 Not Found：资源不存在（材料 ID 不存在等）
- 501 Not Implemented：功能未开通（S3 预签名）
- 5xx：上游 LLM 或服务内部错误

—

## 7. 前端集成要点

### 7.1 LLM 对话集成

代码位置：`frontend/src/pages/Index.tsx`
- 使用 `fetch('/api/llm/messages/stream', { method: 'POST', headers: { 'Content-Type': 'application/json' } })` 开启 SSE 流。
- 前端解析规则：以 `\n\n` 分隔事件,行以 `data:` 开头;事件类型包含 `start`、`token`、`end`、`error`。
- 会话处理：保存 `sessionId`,携带最近若干条 `previousMessages` 作为上下文。
- **材料引用**：在 `context` 中添加 `materialIds` 数组,传递已上传材料的 ID 列表,供 LLM 检索使用。

示例请求:

```json
{
  "message": "这个文档讲了什么?",
  "sessionId": "session_456",
  "context": {
    "previousMessages": [...],
    "materialIds": ["mat_123", "mat_456"]  // 已上传的材料 ID
  }
}
```

### 7.2 文件上传集成

代码位置：`frontend/src/components/FileUpload/` 和 `frontend/src/hooks/useFileUpload.ts`

**核心组件:**

- `FileUploadButton` - 文件选择触发器
- `FileUploadProgress` - 上传进度显示(圆形进度条)
- `FileCard` - 文件卡片显示
- `useFileUpload` Hook - 上传队列管理

**使用示例:**

```tsx
import { useFileUpload } from '@/hooks/useFileUpload';
import { FileUploadButton } from '@/components/FileUpload/FileUploadButton';
import { FileCard } from '@/components/FileUpload/FileCard';

function ChatInterface() {
  const { files, addFiles, removeFile, getUploadedMaterialIds } = useFileUpload();

  return (
    <>
      <FileUploadButton onFilesSelected={addFiles} />
      {files.map(file => (
        <FileCard key={file.id} file={file} onRemove={() => removeFile(file.id)} />
      ))}
    </>
  );
}
```

**上传流程:**

1. 用户选择文件 → 前端验证(类型、大小)
2. 调用 `uploadMaterial()` 上传 → 显示进度条(XHR upload progress)
3. 上传成功获得 `materialId` → 自动轮询处理状态(`uploaded` → `processing` → `ready`)
4. 材料就绪后可在对话中引用

**并发控制:**

- 最多同时上传 3 个文件
- 队列自动管理,超出部分排队等待

**文件类型与限制:**

- 支持类型: txt,pdf,doc,docx,ppt,pptx,xls,xlsx,jpg,jpeg,png,mp3,m4a,wav,mp4
- 普通文件: 最大 200MB
- 视频文件: 最大 500MB

Vite 代理（开发）：请求以 `/api` 开头自动转发到后端，无需额外 CORS 配置。

—

## 8. 变更管理要求

按照团队规则：
1) 先明确功能需求；2) 设计前后端对接文档（即本文件）；3) 先后端实现；4) 每次接口调整必须同步更新本文件并提交。

—

文档版本：v1.1.0（新增多模态文件上传功能）
最后更新：2025-10-25
维护者：AIEDU 开发团队

