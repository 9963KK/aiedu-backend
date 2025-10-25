import { API_BASE_URL, ApiError } from '@/lib/api-client';

/**
 * QA SSE 事件类型
 */
export interface QASSEEvent {
  type: 'start' | 'token' | 'end' | 'error';
  messageId?: string;
  content?: string;
  message?: string;
}

/**
 * SSE 流解析回调
 */
export interface SSECallbacks {
  onStart?: (data: { messageId: string }) => void;
  onToken?: (token: string) => void;
  onEnd?: (data: { messageId: string }) => void;
  onError?: (error: { message: string }) => void;
}

/**
 * 解析错误响应(支持 JSON 和纯文本)
 */
async function parseErrorResponse(response: Response): Promise<string> {
  const defaultMessage = `HTTP ${response.status}`;

  try {
    const contentType = response.headers.get('content-type');

    if (contentType && contentType.includes('application/json')) {
      const errorData = await response.json();
      return errorData?.detail || errorData?.error?.message || defaultMessage;
    } else {
      // 如果不是 JSON,读取文本内容
      const text = await response.text();
      return text || defaultMessage;
    }
  } catch {
    return defaultMessage;
  }
}

/**
 * 解析 SSE 流
 * @param stream - ReadableStream
 * @param callbacks - 事件回调
 */
export async function parseSSEStream(
  stream: ReadableStream<Uint8Array>,
  callbacks: SSECallbacks
): Promise<void> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // 以双换行符分隔事件（兼容 \r\n）
      const events = buffer.split(/\r?\n\r?\n/);
      buffer = events.pop() ?? '';

      for (const evt of events) {
        // 聚合多行 data: 的内容
        const lines = evt.split(/\r?\n/);
        const dataLines: string[] = [];
        for (const ln of lines) {
          const t = ln.trim();
          if (t.startsWith('data:')) {
            dataLines.push(t.slice('data:'.length).trim());
          }
        }
        if (dataLines.length === 0) continue;
        const jsonStr = dataLines.join('\n');

        let payload: QASSEEvent;
        try {
          payload = JSON.parse(jsonStr);
        } catch {
          console.warn('无法解析 SSE 事件:', jsonStr);
          continue;
        }

        // 分发事件
        switch (payload.type) {
          case 'start':
            if (payload.messageId) {
              callbacks.onStart?.({ messageId: payload.messageId });
            }
            break;
          case 'token':
            if (payload.content) {
              callbacks.onToken?.(payload.content);
            }
            break;
          case 'end':
            if (payload.messageId) {
              callbacks.onEnd?.({ messageId: payload.messageId });
            }
            break;
          case 'error':
            callbacks.onError?.({ message: payload.message || '未知错误' });
            break;
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

/**
 * 即时提问(多模态直答) - multipart/form-data 形态
 * @param message - 问题文本
 * @param files - 文件数组(可选)
 * @param hints - 提示信息(可选)
 * @param signal - AbortSignal 用于取消
 * @returns ReadableStream
 */
export async function askInstant(
  message: string,
  files?: File[],
  hints?: Record<string, any>,
  signal?: AbortSignal
): Promise<ReadableStream<Uint8Array>> {
  const formData = new FormData();
  formData.append('message', message);

  // 添加文件
  if (files && files.length > 0) {
    files.forEach((file) => {
      formData.append('file', file);
    });
  }

  // 添加提示信息
  if (hints) {
    formData.append('hints', JSON.stringify(hints));
  }

  const response = await fetch(`${API_BASE_URL}/qa/instant`, {
    method: 'POST',
    headers: {
      'Accept': 'text/event-stream',
    },
    body: formData,
    signal,
  });

  if (!response.ok || !response.body) {
    const errorMessage = await parseErrorResponse(response);
    throw new ApiError(errorMessage, response.status);
  }

  return response.body;
}

/**
 * 即时提问(多模态直答) - application/json 形态
 * @param message - 问题文本
 * @param materialIds - 材料 ID 数组(可选)
 * @param hints - 提示信息(可选)
 * @param signal - AbortSignal 用于取消
 * @returns ReadableStream
 */
export async function askInstantWithMaterials(
  message: string,
  materialIds?: string[],
  hints?: Record<string, any>,
  signal?: AbortSignal
): Promise<ReadableStream<Uint8Array>> {
  const response = await fetch(`${API_BASE_URL}/qa/instant`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'text/event-stream',
    },
    body: JSON.stringify({
      message,
      materialIds,
      hints,
    }),
    signal,
  });

  if (!response.ok || !response.body) {
    const errorMessage = await parseErrorResponse(response);
    throw new ApiError(errorMessage, response.status);
  }

  return response.body;
}

/**
 * 知识库提问(占位,当前返回 501)
 * @param message - 问题文本
 * @param courseId - 课程 ID
 * @param materialIds - 材料 ID 数组(可选)
 * @param topK - 检索数量(可选)
 * @param signal - AbortSignal 用于取消
 * @returns ReadableStream
 */
export async function askKnowledge(
  message: string,
  courseId: string,
  materialIds?: string[],
  topK?: number,
  signal?: AbortSignal
): Promise<ReadableStream<Uint8Array>> {
  const response = await fetch(`${API_BASE_URL}/qa/knowledge`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message,
      courseId,
      materialIds,
      topK,
    }),
    signal,
  });

  if (!response.ok || !response.body) {
    // 特殊处理 501
    if (response.status === 501) {
      throw new ApiError('知识库检索功能建设中,请稍后再试', response.status);
    }

    const errorMessage = await parseErrorResponse(response);
    throw new ApiError(errorMessage, response.status);
  }

  return response.body;
}

/**
 * 触发材料后台索引(问答结束后调用)
 * @param materialId - 材料 ID
 * @returns 202 Accepted
 */
export async function triggerMaterialIndex(materialId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/materials/${materialId}/index`, {
    method: 'POST',
  });

  if (!response.ok) {
    const errorMessage = await parseErrorResponse(response);
    throw new ApiError(errorMessage, response.status);
  }
}
