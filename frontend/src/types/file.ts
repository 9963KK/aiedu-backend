/**
 * 文件类型定义
 * 支持的文件扩展名
 */
export type FileType =
  // 文档类
  | 'txt'
  | 'pdf'
  | 'doc'
  | 'docx'
  | 'ppt'
  | 'pptx'
  | 'xls'
  | 'xlsx'
  // 图片类
  | 'jpg'
  | 'jpeg'
  | 'png'
  | 'gif'
  // 音频类
  | 'mp3'
  | 'm4a'
  | 'wav'
  // 视频类
  | 'mp4'
  | 'avi'
  | 'mov';

/**
 * 材料处理状态
 * - uploaded: 上传完成,待处理
 * - queued: 已加入处理队列
 * - processing: 正在处理(解析/转写/VQA等)
 * - ready: 处理完成,可用于对话
 * - failed: 处理失败
 */
export type MaterialStatus = 'uploaded' | 'queued' | 'processing' | 'ready' | 'failed';

/**
 * 上传文件状态(简化版,即时问答无需等待解析)
 * - pending: 等待上传
 * - uploading: 正在上传
 * - success: 上传完成(可用于问答)
 * - error: 上传失败
 */
export type UploadStatus = 'pending' | 'uploading' | 'success' | 'error';

/**
 * 上传文件模型(即时问答简化版)
 */
export interface UploadFile {
  /** 前端临时 ID */
  id: string;
  /** 原始文件对象 */
  file: File;
  /** 文件名 */
  name: string;
  /** 文件大小(字节) */
  size: number;
  /** 文件类型 */
  type: FileType;
  /** 上传状态 */
  status: UploadStatus;
  /** 上传进度 (0-100) */
  progress: number;
  /** 错误信息 */
  error?: string;
  /** 上传成功后的材料 ID(保留,用于知识库问答场景) */
  materialId?: string;
  /** 用于取消上传 */
  abortController?: AbortController;
}

/**
 * 材料上传响应
 * 对应后端 POST /api/materials 的响应
 */
export interface MaterialUploadResponse {
  data: {
    /** 材料 ID */
    materialId: string;
    /** 状态 */
    status: MaterialStatus;
    /** MIME 类型 */
    mime: string;
    /** 原始文件名 */
    originalName: string;
    /** 文件大小(字节) */
    sizeBytes: number;
  };
  error: null | {
    code: string;
    message: string;
  };
}

/**
 * 材料状态查询响应
 * 对应后端 GET /api/materials/{materialId}
 */
export interface MaterialStatusResponse {
  data: {
    materialId: string;
    status: MaterialStatus;
    mime: string;
    originalName: string;
    sizeBytes: number;
    /** 处理结果元数据 */
    metadata?: {
      /** 文本内容字符数 */
      textLength?: number;
      /** 视觉问答结果 */
      vqaResult?: string;
      /** 语音转写结果 */
      asrResult?: string;
    };
  };
  error: null | {
    code: string;
    message: string;
  };
}

/**
 * 材料内容片段响应
 * 对应后端 GET /api/materials/{materialId}/chunks
 */
export interface MaterialChunksResponse {
  data: {
    chunks: Array<{
      /** 片段 ID */
      id: string;
      /** 片段内容 */
      content: string;
      /** 片段类型 (text/caption) */
      type: 'text' | 'caption';
      /** 时间戳(秒,仅音视频) */
      timestamp?: number;
    }>;
    total: number;
  };
  error: null | {
    code: string;
    message: string;
  };
}

/**
 * 文件验证结果
 */
export interface FileValidationResult {
  /** 是否有效 */
  valid: boolean;
  /** 错误信息 */
  error?: string;
}
