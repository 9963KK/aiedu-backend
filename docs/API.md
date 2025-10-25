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
- 多模态大模型（VLM，OpenAI 兼容接口）
  - `VLM_PROVIDER`（默认 openai）
  - `VLM_BASEURL`（默认 `https://api.openai.com/v1`）
  - `VLM_MODEL`（示例 `gpt-4o-mini`）
  - `VLM_APIKEY`（密钥）
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

## 4. 已废弃接口

原 `/llm/*` 系列接口（`/llm/messages`、`/llm/messages/stream`、`/llm/prompt`）已废弃，请全部迁移到 `/qa/*`。本文档已移除详细说明。

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

### 5.6 取消解析（占位）
- 方法：POST `/materials/{materialId}/cancel`
- 说明：当材料处于 `processing`（解析中）阶段时，请求中断后台解析任务。当前为占位实现，后续接入解析队列后将真正中断任务。
- 成功响应：

```json
{ "data": { "cancelled": true }, "error": null }
```

- 异常：若材料非解析中或已完成/失败/已取消，返回 `409 CONFLICT`。

### 5.7 触发后台索引（占位）
- 方法：POST `/materials/{materialId}/index`
- 说明：在“知识库问答结束后”，由前端调用此接口触发后台解析/Markdown 化/分块与 embedding，立即返回 `202 Accepted`。
- 响应：

```json
{ "data": { "accepted": true }, "error": null }
```

### 5.8 状态机与取消/删除协作
- 状态流转：`uploaded → queued → processing → ready | failed | cancelled`
- 前端取消约定：
  - 上传阶段（XHR 未完成）：前端 `abort()`，无需调用后端；不会产生 `materialId`。
  - 上传后/解析未开始（`uploaded/queued`）：调用 `DELETE /materials/{id}` 直接清理。
  - 解析中（`processing`）：先 `POST /materials/{id}/cancel` 请求中断，再 `DELETE /materials/{id}` 清理。
  - 解析完成（`ready/failed`）：调用 `DELETE /materials/{id}` 清理。
- 进度约定：
  - 上传进度由前端监听 `XMLHttpRequest.upload.onprogress` 并展示；后端不返回上传百分比。
  - 解析本期不提供细粒度进度，仅在完成时进入 `ready/failed`；如需更细粒度可扩展事件或轮询。

—

## 6. 问答接口

### 7.1 即时提问（多模态直答）
- 方法：POST `/qa/instant`
- 形态A：`multipart/form-data`
  - 字段：`message`（文本问题，必填）、`file`（可多文件，选填）、`hints`（JSON 字符串，选填）
- 形态B：`application/json`
  - 体：`{ "message": "...", "materialIds": ["mat_123"], "hints": { "pages": [1,3], "discipline": "cs" } }`
- 响应：SSE 事件流（`start/token/end/error`），由 VLM 直接解析回答；不依赖材料解析/向量库。

### 7.2 知识库提问（占位）
- 方法：POST `/qa/knowledge`
- 体：`{ "message": "...", "courseId": "course_xxx", "materialIds": ["mat_1"], "topK": 8 }`
- 当前：返回 `501 Not Implemented`。未来将走（BM25→向量）检索增强再回答。

—

## 7. 错误约定与返回风格

当前已上线接口存在两种返回风格：
- 资源直出（如 `/health`、`/test/ping`）
- 统一封装 `{ "data": ..., "error": null }`（如 `materials` 模块）

短期内兼容共存，后续将逐步统一为封装风格并在此文档同步更新。

常见错误：
- 400 Bad Request：参数不合法（LLM/上传格式校验失败等）
- 404 Not Found：资源不存在（材料 ID 不存在等）
- 501 Not Implemented：功能未开通（S3 预签名）
- 5xx：上游 LLM 或服务内部错误

—

—

## 8. 变更管理要求

按照团队规则：
1) 先明确功能需求；2) 设计前后端对接文档（即本文件）；3) 先后端实现；4) 每次接口调整必须同步更新本文件并提交。

—

文档版本：v1.2.0（废弃 /llm/*，统一至 /qa/*；新增索引触发）
最后更新：2025-10-25
维护者：AIEDU 开发团队

