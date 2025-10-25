import { Check, Loader2, AlertCircle } from 'lucide-react';
import { FileIconComponent } from './FileIcon';
import type { UploadFile } from '@/types/file';

interface FileChipProps {
  /** 上传文件对象 */
  file: UploadFile;
  /** 删除文件回调 */
  onRemove: () => void;
}

/**
 * 文件缩略图组件 (Apple 风格)
 * 左侧: 文件图标 + 文件名
 * 右侧: 圆形进度条/完成图标
 */
export function FileChip({ file, onRemove }: FileChipProps) {
  const { name, type, status, materialStatus, progress = 0 } = file;

  // 判断状态
  const isUploading = status === 'uploading';
  const isProcessing = status === 'processing' || (status === 'success' && materialStatus === 'processing');
  const isSuccess = status === 'success' && materialStatus === 'ready';
  const isError = status === 'error';

  // 圆形进度条参数
  const radius = 10;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div
      className="inline-flex items-center justify-between gap-3 px-4 py-2.5 bg-muted/50 rounded-full border border-border/50 hover:border-border transition-all animate-in slide-in-from-bottom-2 duration-200"
      onClick={(e) => {
        // 点击整个区域时删除文件(除了正在上传的)
        if (!isUploading) {
          e.stopPropagation();
          onRemove();
        }
      }}
      style={{ cursor: isUploading ? 'default' : 'pointer' }}
    >
      {/* 左侧: 文件图标 + 文件名 */}
      <div className="flex items-center gap-2.5 min-w-0">
        {/* 文件图标背景 */}
        <div className="w-10 h-10 rounded-lg bg-background/80 flex items-center justify-center flex-shrink-0">
          <FileIconComponent fileType={type} className="w-5 h-5" />
        </div>

        {/* 文件名 */}
        <span className="text-sm font-medium text-foreground truncate max-w-[200px]">
          {name}
        </span>
      </div>

      {/* 右侧: 圆形状态指示器 */}
      <div className="relative w-6 h-6 flex-shrink-0">
        {isUploading ? (
          // 上传中 - 圆形进度条
          <svg className="w-full h-full transform -rotate-90">
            {/* 背景圆环 */}
            <circle
              cx="12"
              cy="12"
              r={radius}
              className="stroke-muted-foreground/20"
              strokeWidth="2"
              fill="none"
            />
            {/* 进度圆环 */}
            <circle
              cx="12"
              cy="12"
              r={radius}
              className="stroke-primary transition-all duration-300"
              strokeWidth="2"
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
            />
          </svg>
        ) : isProcessing ? (
          // 处理中 - 旋转加载器
          <div className="w-full h-full flex items-center justify-center">
            <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
          </div>
        ) : isSuccess ? (
          // 成功 - Apple 风格的圆形对勾
          <div className="w-full h-full flex items-center justify-center animate-in zoom-in duration-200">
            <div className="relative w-6 h-6">
              {/* 绿色圆形背景 */}
              <div className="absolute inset-0 bg-green-500 rounded-full" />
              {/* 白色对勾 */}
              <Check className="absolute inset-0 w-6 h-6 text-white p-1" strokeWidth={3} />
            </div>
          </div>
        ) : isError ? (
          // 错误 - 红色感叹号
          <div className="w-full h-full flex items-center justify-center">
            <div className="relative w-6 h-6">
              <div className="absolute inset-0 bg-red-500 rounded-full" />
              <AlertCircle className="absolute inset-0 w-6 h-6 text-white p-1" strokeWidth={3} />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
