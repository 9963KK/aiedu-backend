# AI 教育助手项目 - Claude 开发指南

## 项目概述

本项目是一个 AI 驱动的教育助手应用,主要功能包括:
- AI 智能问答和学习辅导
- 课程管理和学习进度追踪
- 学习资料管理
- 对话历史记录

**技术栈:**
- 前端: React + TypeScript + Vite + shadcn/ui + TanStack Query
- 后端: Supabase (数据库 + 认证)
- 部署: Lovable Platform

---

## 前后端协作开发流程规范

> **重要:** 这是本项目的核心开发流程,所有新功能开发必须严格遵循此流程。

### 开发流程概览

```
1. API 设计 → 2. 后端确认 → 3. 功能开发 → 4. 联调测试
```

### 详细步骤

#### 第一步:设计前端所需数据格式

**执行人:** Claude (前端 AI 助手)

**任务:**
1. 根据产品需求,分析前端功能所需的数据结构
2. 设计 RESTful API 接口规范
3. 定义请求/响应的 JSON 格式
4. 将接口设计写入 `docs/API.md` 文档

**输出物:**
- 更新的 API 文档 (`docs/API.md`)
- 包含完整的:
  - 接口路径和方法
  - 请求参数格式
  - 响应数据格式
  - 错误处理规范

**示例:**
```markdown
### 3.1 获取课程列表
**GET** `/courses`

**查询参数:**
- `page`: 页码
- `pageSize`: 每页数量

**响应:**
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {...}
  }
}
```

---

#### 第二步:询问后端实际接口

**执行人:** Claude (前端 AI 助手)

**任务:**
1. 向用户(后端开发者)询问实际可用的接口信息
2. 询问内容包括:
   - 后端已实现哪些接口?
   - 实际的接口路径是什么?
   - 实际的响应数据格式是什么?
   - 有哪些与设计不同的地方?
   - 是否需要特殊的认证或参数?

**提问模板:**
```
您好,我已经在 docs/API.md 中设计了 [功能名称] 所需的接口。
请告诉我:
1. 后端已经实现了哪些接口?
2. 实际的接口路径和参数是什么?
3. 实际返回的数据格式是什么样的?
4. 有哪些特殊说明或注意事项?

可以提供实际的接口文档或示例响应数据吗?
```

---

#### 第三步:结合实际接口完善功能

**执行人:** Claude (前端 AI 助手)

**任务:**
1. 根据后端反馈,更新 API 文档
2. 创建/更新 TypeScript 类型定义
3. 实现前端功能代码:
   - 创建 API 调用函数
   - 实现 UI 组件
   - 集成数据获取和状态管理
   - 处理加载和错误状态
4. 编写必要的测试代码

**关键原则:**
- **适配后端实际接口** - 不要假设接口格式,以后端实际为准
- **健壮的错误处理** - 处理所有可能的错误情况
- **类型安全** - 使用 TypeScript 确保类型正确
- **用户体验** - 添加加载状态、错误提示、空状态处理

---

#### 第四步:联调测试

**执行人:** Claude + 用户

**任务:**
1. 本地运行前端项目
2. 连接后端 API 进行测试
3. 验证功能是否正常工作
4. 修复发现的问题
5. 优化用户体验

---

## 开发流程示例

### 案例:开发"课程列表"功能

#### Step 1: 设计 API (Claude)

更新 `docs/API.md`:
```markdown
### 获取课程列表
GET /api/courses
响应: { items: Course[], pagination: {...} }
```

#### Step 2: 询问后端 (Claude → 用户)

```
请问后端的课程列表接口是:
1. 接口地址是 /api/courses 还是其他?
2. 是否需要认证?
3. 实际返回的数据格式是什么?
```

#### Step 3: 后端反馈 (用户 → Claude)

```
接口地址: GET /api/v1/courses
需要 Bearer Token 认证
响应格式:
{
  "success": true,
  "data": [...],
  "total": 10
}
```

#### Step 4: 完善功能 (Claude)

1. 更新类型定义
2. 创建 API 函数: `src/api/courses.ts`
3. 创建 Hook: `src/hooks/useCourses.ts`
4. 实现组件: `src/pages/Courses.tsx`

#### Step 5: 测试验证

运行项目,验证功能正常。

---

## 文件组织规范

### 目录结构

```
src/
├── api/                  # API 调用函数
│   ├── auth.ts          # 认证相关
│   ├── courses.ts       # 课程相关
│   ├── chat.ts          # 对话相关
│   └── client.ts        # API 客户端配置
├── types/               # TypeScript 类型定义
│   ├── api.ts           # API 响应类型
│   ├── models.ts        # 数据模型类型
│   └── index.ts         # 类型导出
├── hooks/               # 自定义 Hooks
│   ├── useCourses.ts    # 课程相关 hooks
│   ├── useAuth.ts       # 认证相关 hooks
│   └── useChat.ts       # 对话相关 hooks
├── components/          # UI 组件
│   ├── ui/              # shadcn/ui 组件
│   ├── features/        # 功能组件
│   └── layouts/         # 布局组件
├── pages/               # 页面组件
├── lib/                 # 工具函数
└── integrations/        # 第三方集成
    └── supabase/        # Supabase 配置
```

### 命名规范

- **组件:** PascalCase (e.g., `CourseCard.tsx`)
- **Hooks:** camelCase + use 前缀 (e.g., `useCourses.ts`)
- **API 函数:** camelCase (e.g., `getCourses`)
- **类型:** PascalCase (e.g., `Course`, `ApiResponse`)
- **常量:** UPPER_SNAKE_CASE (e.g., `API_BASE_URL`)

---

## 代码规范

### API 调用示例

```typescript
// src/api/courses.ts
import { supabase } from '@/integrations/supabase/client';

export async function getCourses(params?: {
  page?: number;
  pageSize?: number;
}) {
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .range(
      (params?.page ?? 0) * (params?.pageSize ?? 20),
      ((params?.page ?? 0) + 1) * (params?.pageSize ?? 20) - 1
    );

  if (error) throw error;
  return data;
}
```

### Hook 示例

```typescript
// src/hooks/useCourses.ts
import { useQuery } from '@tanstack/react-query';
import { getCourses } from '@/api/courses';

export function useCourses(params?: { page?: number }) {
  return useQuery({
    queryKey: ['courses', params],
    queryFn: () => getCourses(params),
  });
}
```

### 组件示例

```typescript
// src/pages/Courses.tsx
import { useCourses } from '@/hooks/useCourses';

export default function Courses() {
  const { data, isLoading, error } = useCourses();

  if (isLoading) return <Loading />;
  if (error) return <Error message={error.message} />;

  return (
    <div>
      {data?.map(course => (
        <CourseCard key={course.id} course={course} />
      ))}
    </div>
  );
}
```

---

## 重要约定

### 1. 永远不要假设接口格式

❌ **错误做法:**
```typescript
// 直接按照自己设计的格式写代码
const data = await fetch('/api/courses');
// 假设返回 { items: [], pagination: {} }
```

✅ **正确做法:**
```typescript
// 先询问后端实际格式,然后根据实际情况编码
// 如果后端返回的是 { data: [], total: 0 }
// 就按照实际格式处理
```

### 2. 类型定义要与后端对齐

在收到后端实际响应格式后,立即更新类型定义:

```typescript
// src/types/api.ts
// 根据后端实际响应定义
export interface CoursesResponse {
  success: boolean;
  data: Course[];
  total: number;
}
```

### 3. 错误处理要完善

```typescript
try {
  const data = await getCourses();
  // 处理成功情况
} catch (error) {
  // 处理错误情况
  if (error.message.includes('401')) {
    // 未授权,跳转登录
  } else {
    // 显示错误提示
  }
}
```

### 4. 文档同步更新

每次根据后端反馈调整接口后,必须同步更新 `docs/API.md`:

```markdown
<!-- 添加"实际实现"部分 -->
### 获取课程列表
**设计:** GET /api/courses
**实际:** GET /api/v1/courses (需要认证)
```

---

## 开发检查清单

在完成一个功能开发前,确保:

- [ ] 已在 `docs/API.md` 中设计接口
- [ ] 已询问后端实际接口情况
- [ ] 已根据实际接口更新文档
- [ ] 已创建/更新 TypeScript 类型定义
- [ ] 已实现 API 调用函数
- [ ] 已创建自定义 Hook (如需要)
- [ ] 已实现 UI 组件
- [ ] 已处理加载状态
- [ ] 已处理错误状态
- [ ] 已处理空数据状态
- [ ] 已测试功能正常工作
- [ ] 已提交代码到 Git

---

## 常见问题

### Q1: 后端接口还没实现怎么办?

**A:** 可以先使用 Mock 数据开发:

```typescript
// src/api/courses.ts
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

export async function getCourses() {
  if (USE_MOCK) {
    return mockCourses; // 返回模拟数据
  }
  // 实际 API 调用
}
```

### Q2: 后端接口格式与设计差异很大怎么办?

**A:**
1. 在 API 层做适配转换
2. 更新文档说明实际格式
3. 如果差异过大,与后端沟通是否可以调整

### Q3: 如何处理 Supabase 直接查询 vs REST API?

**A:**
- 简单 CRUD: 直接使用 Supabase Client
- 复杂业务逻辑: 使用后端 REST API
- 在文档中明确标注使用哪种方式

---

## 相关文档

- [API 接口文档](./docs/API.md) - 完整的 API 设计和实现文档
- [README.md](./README.md) - 项目说明和快速开始
- [Supabase 文档](https://supabase.com/docs) - Supabase 使用指南

---

**文档版本:** v1.0.0
**最后更新:** 2025-01-24
**维护者:** AI 教育助手开发团队
