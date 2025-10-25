import {
  FileText,
  FileType as FileTypeIcon,
  Image,
  Music,
  Video,
  File as FileIcon,
  Sheet,
  Presentation,
  type LucideIcon,
} from 'lucide-react';
import type { FileType } from '@/types/file';

/**
 * 文件类型图标映射
 */
const FILE_ICON_MAP: Record<FileType, LucideIcon> = {
  // 文档类
  txt: FileText,
  pdf: FileTypeIcon,
  doc: FileText,
  docx: FileText,
  ppt: Presentation,
  pptx: Presentation,
  xls: Sheet,
  xlsx: Sheet,
  // 图片类
  jpg: Image,
  jpeg: Image,
  png: Image,
  gif: Image,
  // 音频类
  mp3: Music,
  m4a: Music,
  wav: Music,
  // 视频类
  mp4: Video,
  avi: Video,
  mov: Video,
};

/**
 * 文件类型颜色映射
 */
const FILE_COLOR_MAP: Record<FileType, string> = {
  // 文档类 - 蓝色系
  txt: 'text-blue-500',
  pdf: 'text-red-500',
  doc: 'text-blue-600',
  docx: 'text-blue-600',
  ppt: 'text-orange-500',
  pptx: 'text-orange-500',
  xls: 'text-green-600',
  xlsx: 'text-green-600',
  // 图片类 - 紫色
  jpg: 'text-purple-500',
  jpeg: 'text-purple-500',
  png: 'text-purple-500',
  gif: 'text-purple-500',
  // 音频类 - 粉色
  mp3: 'text-pink-500',
  m4a: 'text-pink-500',
  wav: 'text-pink-500',
  // 视频类 - 靛蓝色
  mp4: 'text-indigo-500',
  avi: 'text-indigo-500',
  mov: 'text-indigo-500',
};

interface FileIconProps {
  /** 文件类型 */
  fileType: FileType;
  /** 图标大小类名 (默认 w-5 h-5) */
  className?: string;
}

/**
 * 文件类型图标组件
 * 根据文件类型显示对应的 lucide-react 图标和颜色
 */
export function FileIconComponent({ fileType, className = 'w-5 h-5' }: FileIconProps) {
  const Icon = FILE_ICON_MAP[fileType] || FileIcon;
  const colorClass = FILE_COLOR_MAP[fileType] || 'text-gray-500';

  return <Icon className={`${className} ${colorClass}`} />;
}
