import type { FileType, FileValidationResult } from '@/types/file';

/**
 * 文件大小限制配置(字节)
 * 根据后端配置:
 * - UPLOAD_MAX_MB: 200MB (普通文件)
 * - VIDEO_MAX_MB: 500MB (视频文件)
 * - AUDIO_MAX_MINUTES: 120 分钟
 */
const FILE_SIZE_LIMITS = {
  // 视频文件: 500MB
  video: 500 * 1024 * 1024,
  // 其他文件: 200MB
  default: 200 * 1024 * 1024,
};

/**
 * 允许的文件类型
 * 对应后端: txt,pdf,ppt,pptx,doc,docx,jpg,jpeg,png,mp3,m4a,wav,mp4
 */
const ALLOWED_FILE_TYPES: FileType[] = [
  'txt',
  'pdf',
  'doc',
  'docx',
  'ppt',
  'pptx',
  'xls',
  'xlsx',
  'jpg',
  'jpeg',
  'png',
  'mp3',
  'm4a',
  'wav',
  'mp4',
];

/**
 * 获取文件扩展名
 * @param filename - 文件名
 * @returns 小写扩展名(不含点)
 */
export function getFileExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.');
  if (lastDot === -1) return '';
  return filename.slice(lastDot + 1).toLowerCase();
}

/**
 * 识别文件类型
 * @param filename - 文件名
 * @returns 文件类型,如果不支持则返回 undefined
 */
export function getFileType(filename: string): FileType | undefined {
  const ext = getFileExtension(filename);
  if (ALLOWED_FILE_TYPES.includes(ext as FileType)) {
    return ext as FileType;
  }
  return undefined;
}

/**
 * 格式化文件大小
 * @param bytes - 字节数
 * @returns 格式化后的字符串 (如 "1.5 MB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${units[i]}`;
}

/**
 * 获取文件大小限制
 * @param fileType - 文件类型
 * @returns 大小限制(字节)
 */
export function getFileSizeLimit(fileType: FileType): number {
  // 视频文件有更大的限制
  if (fileType === 'mp4' || fileType === 'avi' || fileType === 'mov') {
    return FILE_SIZE_LIMITS.video;
  }
  return FILE_SIZE_LIMITS.default;
}

/**
 * 验证文件
 * @param file - 文件对象
 * @returns 验证结果
 */
export function validateFile(file: File): FileValidationResult {
  // 检查文件类型
  const fileType = getFileType(file.name);
  if (!fileType) {
    return {
      valid: false,
      error: `不支持的文件类型。支持的类型: ${ALLOWED_FILE_TYPES.join(', ')}`,
    };
  }

  // 检查文件大小
  const sizeLimit = getFileSizeLimit(fileType);
  if (file.size > sizeLimit) {
    return {
      valid: false,
      error: `文件过大。最大支持 ${formatFileSize(sizeLimit)}`,
    };
  }

  return { valid: true };
}

/**
 * 生成随机 ID
 * @returns 唯一 ID 字符串
 */
export function generateFileId(): string {
  return `file_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * 判断文件是否为图片
 * @param fileType - 文件类型
 * @returns 是否为图片
 */
export function isImageFile(fileType: FileType): boolean {
  return ['jpg', 'jpeg', 'png', 'gif'].includes(fileType);
}

/**
 * 判断文件是否为视频
 * @param fileType - 文件类型
 * @returns 是否为视频
 */
export function isVideoFile(fileType: FileType): boolean {
  return ['mp4', 'avi', 'mov'].includes(fileType);
}

/**
 * 判断文件是否为音频
 * @param fileType - 文件类型
 * @returns 是否为音频
 */
export function isAudioFile(fileType: FileType): boolean {
  return ['mp3', 'm4a', 'wav'].includes(fileType);
}

/**
 * 获取文件 MIME 类型对应的 accept 属性
 * @returns accept 属性值
 */
export function getFileAcceptTypes(): string {
  return [
    // 文档
    '.txt',
    '.pdf',
    '.doc',
    '.docx',
    '.ppt',
    '.pptx',
    '.xls',
    '.xlsx',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    // 图片
    'image/jpeg',
    'image/png',
    'image/gif',
    // 音频
    'audio/mpeg',
    'audio/mp4',
    'audio/wav',
    // 视频
    'video/mp4',
  ].join(',');
}
