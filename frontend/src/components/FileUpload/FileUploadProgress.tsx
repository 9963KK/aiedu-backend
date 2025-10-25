import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FileIconComponent } from './FileIcon';
import { formatFileSize } from '@/lib/file-utils';
import type { UploadFile } from '@/types/file';

interface FileUploadProgressProps {
  /** 上传文件对象 */
  file: UploadFile;
  /** 取消上传回调 */
  onCancel: () => void;
}

/**
 * 文件上传进度组件
 * 显示圆形进度条和文件信息
 */
export function FileUploadProgress({ file, onCancel }: FileUploadProgressProps) {
  const { name, size, type, progress } = file;

  // 计算圆形进度条参数
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="flex items-center gap-3 p-3 bg-card border rounded-lg shadow-sm animate-in slide-in-from-bottom-2 duration-300">
      {/* 圆形进度条 */}
      <div className="relative w-14 h-14 flex-shrink-0">
        <svg className="w-full h-full transform -rotate-90">
          {/* 背景圆环 */}
          <circle
            cx="28"
            cy="28"
            r={radius}
            className="stroke-muted"
            strokeWidth="4"
            fill="none"
          />
          {/* 进度圆环 */}
          <circle
            cx="28"
            cy="28"
            r={radius}
            className="stroke-primary transition-all duration-300"
            strokeWidth="4"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </svg>
        {/* 百分比文字 */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-semibold text-foreground">
            {progress}%
          </span>
        </div>
      </div>

      {/* 文件信息 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <FileIconComponent fileType={type} className="w-4 h-4 flex-shrink-0" />
          <p className="text-sm font-medium text-foreground truncate">
            {name}
          </p>
        </div>
        <p className="text-xs text-muted-foreground">
          正在上传... {formatFileSize(size)}
        </p>
      </div>

      {/* 取消按钮 */}
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 flex-shrink-0"
        onClick={onCancel}
        title="取消上传"
      >
        <X className="w-4 h-4" />
      </Button>
    </div>
  );
}
