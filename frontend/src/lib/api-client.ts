/**
 * API 客户端配置
 * 统一的 API 基础路径和错误处理
 */

/** API 基础路径 */
export const API_BASE_URL = '/api';

/**
 * API 错误类
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * 统一的 Fetch 封装
 */
export async function apiFetch<T = any>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...options?.headers,
      },
    });

    // 处理非 2xx 响应
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}`;
      let errorCode = `HTTP_${response.status}`;
      let errorDetails: any;

      try {
        const errorData = await response.json();
        errorMessage = errorData?.detail || errorData?.error?.message || errorMessage;
        errorCode = errorData?.error?.code || errorCode;
        errorDetails = errorData;
      } catch {
        // 无法解析错误响应,使用默认错误信息
      }

      throw new ApiError(errorMessage, response.status, errorCode, errorDetails);
    }

    // 解析 JSON 响应
    const data = await response.json();
    return data as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    // 网络错误或其他错误
    throw new ApiError(
      error instanceof Error ? error.message : '网络请求失败',
      undefined,
      'NETWORK_ERROR'
    );
  }
}
