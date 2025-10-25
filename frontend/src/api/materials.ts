import type {
  MaterialUploadResponse,
  MaterialStatusResponse,
  MaterialChunksResponse,
} from '@/types/file';
import { API_BASE_URL, ApiError } from '@/lib/api-client';

/**
 * 上传材料文件
 * @param file - 文件对象
 * @param onProgress - 进度回调 (0-100)
 * @param signal - AbortSignal 用于取消上传
 * @param options - 可选参数 (courseId, title, tags)
 * @returns 上传响应
 */
export async function uploadMaterial(
  file: File,
  onProgress?: (progress: number) => void,
  signal?: AbortSignal,
  options?: {
    courseId?: string;
    title?: string;
    tags?: string[];
  }
): Promise<MaterialUploadResponse> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    // 监听上传进度
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) {
        const percent = Math.round((e.loaded / e.total) * 100);
        onProgress(percent);
      }
    });

    // 监听请求完成
    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          resolve(response);
        } catch (error) {
          reject(new ApiError('解析响应失败', xhr.status, 'PARSE_ERROR'));
        }
      } else {
        let errorMessage = `HTTP ${xhr.status}`;
        let errorCode = `HTTP_${xhr.status}`;

        try {
          const errorData = JSON.parse(xhr.responseText);
          errorMessage = errorData?.detail || errorData?.error?.message || errorMessage;
          errorCode = errorData?.error?.code || errorCode;
        } catch {
          // 无法解析错误响应
        }

        reject(new ApiError(errorMessage, xhr.status, errorCode));
      }
    });

    // 监听网络错误
    xhr.addEventListener('error', () => {
      reject(new ApiError('网络错误', undefined, 'NETWORK_ERROR'));
    });

    // 监听取消
    xhr.addEventListener('abort', () => {
      reject(new ApiError('上传已取消', undefined, 'ABORTED'));
    });

    // 支持 AbortController 取消
    signal?.addEventListener('abort', () => {
      xhr.abort();
    });

    // 构建 FormData
    const formData = new FormData();
    formData.append('file', file);

    if (options?.courseId) {
      formData.append('courseId', options.courseId);
    }
    if (options?.title) {
      formData.append('title', options.title);
    }
    if (options?.tags && options.tags.length > 0) {
      formData.append('tags', options.tags.join(','));
    }

    // 发送请求
    xhr.open('POST', `${API_BASE_URL}/materials`);
    xhr.send(formData);
  });
}

/**
 * 查询材料状态
 * @param materialId - 材料 ID
 * @returns 材料状态响应
 */
export async function getMaterialStatus(
  materialId: string
): Promise<MaterialStatusResponse> {
  const response = await fetch(`${API_BASE_URL}/materials/${materialId}`);

  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData?.detail || errorData?.error?.message || errorMessage;
    } catch {
      // 忽略解析错误
    }
    throw new ApiError(errorMessage, response.status);
  }

  return response.json();
}

/**
 * 删除材料
 * @param materialId - 材料 ID
 */
export async function deleteMaterial(materialId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/materials/${materialId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData?.detail || errorData?.error?.message || errorMessage;
    } catch {
      // 忽略解析错误
    }
    throw new ApiError(errorMessage, response.status);
  }
}

/**
 * 获取材料内容片段
 * @param materialId - 材料 ID
 * @param options - 查询参数
 * @returns 内容片段响应
 */
export async function getMaterialChunks(
  materialId: string,
  options?: {
    offset?: number;
    limit?: number;
    type?: 'text' | 'caption';
  }
): Promise<MaterialChunksResponse> {
  const params = new URLSearchParams();

  if (options?.offset !== undefined) {
    params.append('offset', options.offset.toString());
  }
  if (options?.limit !== undefined) {
    params.append('limit', options.limit.toString());
  }
  if (options?.type) {
    params.append('type', options.type);
  }

  const queryString = params.toString();
  const url = `${API_BASE_URL}/materials/${materialId}/chunks${queryString ? `?${queryString}` : ''}`;

  const response = await fetch(url);

  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData?.detail || errorData?.error?.message || errorMessage;
    } catch {
      // 忽略解析错误
    }
    throw new ApiError(errorMessage, response.status);
  }

  return response.json();
}

/**
 * 轮询材料处理状态
 * @param materialId - 材料 ID
 * @param onStatusChange - 状态变化回调
 * @param maxRetries - 最大轮询次数 (默认 60 次,共 2 分钟)
 * @param interval - 轮询间隔(毫秒,默认 2000ms)
 * @returns 最终状态响应
 */
export async function pollMaterialStatus(
  materialId: string,
  onStatusChange?: (status: MaterialStatusResponse) => void,
  maxRetries: number = 60,
  interval: number = 2000
): Promise<MaterialStatusResponse> {
  let retries = 0;

  while (retries < maxRetries) {
    try {
      const response = await getMaterialStatus(materialId);
      onStatusChange?.(response);

      // 如果处理完成或失败,停止轮询
      if (response.data.status === 'ready' || response.data.status === 'failed') {
        return response;
      }

      // 等待后继续轮询
      await new Promise((resolve) => setTimeout(resolve, interval));
      retries++;
    } catch (error) {
      // 轮询失败,重试
      retries++;
      if (retries >= maxRetries) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, interval));
    }
  }

  throw new ApiError('材料处理超时', undefined, 'TIMEOUT');
}
