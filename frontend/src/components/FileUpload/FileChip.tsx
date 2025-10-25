import { Check, Loader2, AlertCircle, X } from 'lucide-react';
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
 * 悬停时: 右上角显示删除按钮
 */
export function FileChip({ file, onRemove }: FileChipProps) {
  const { name, type, status, materialStatus, progress = 0 } = file;

  // 判断状态
  const isUploading = status === 'uploading';
  const isProcessing = status === 'processing' || (status === 'success' && materialStatus === 'processing');
  const isSuccess = status === 'success' && materialStatus === 'ready';
  const isError = status === 'error';

  // 圆形进度条参数
  const radius = 8;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div
      className="relative inline-flex items-center justify-between gap-2 px-3 py-1.5 bg-muted/50 rounded-full border border-border/50 hover:border-border transition-all animate-in slide-in-from-bottom-2 duration-200 group"
    >
      {/* 左侧: 文件图标 + 文件名 */}
      <div className="flex items-center gap-2 min-w-0">
        {/* 文件图标背景 */}
        <div className="w-7 h-7 rounded-md bg-background/80 flex items-center justify-center flex-shrink-0">
          <FileIconComponent fileType={type} className="w-4 h-4" />
        </div>

        {/* 文件名 */}
        <span className="text-xs font-medium text-foreground truncate max-w-[160px]">
          {name}
        </span>
      </div>

      {/* 右侧: 圆形状态指示器 */}
      <div className="relative w-5 h-5 flex-shrink-0">
        {isUploading ? (
          // 上传中 - 圆形进度条
          <svg className="w-full h-full transform -rotate-90">
            {/* 背景圆环 */}
            <circle
              cx="10"
              cy="10"
              r={radius}
              className="stroke-muted-foreground/20"
              strokeWidth="2"
              fill="none"
            />
            {/* 进度圆环 */}
            <circle
              cx="10"
              cy="10"
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
            <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
          </div>
        ) : isSuccess ? (
          // 成功 - Apple 风格的圆形对勾
          <div className="w-full h-full flex items-center justify-center animate-in zoom-in duration-200">
            <div className="relative w-5 h-5">
              {/* 绿色圆形背景 */}
              <div className="absolute inset-0 bg-green-500 rounded-full" />
              {/* 白色对勾 */}
              <Check className="absolute inset-0 w-5 h-5 text-white p-0.5" strokeWidth={3} />
            </div>
          </div>
        ) : isError ? (
          // 错误 - 红色感叹号
          <div className="w-full h-full flex items-center justify-center">
            <div className="relative w-5 h-5">
              <div className="absolute inset-0 bg-red-500 rounded-full" />
              <AlertCircle className="absolute inset-0 w-5 h-5 text-white p-0.5" strokeWidth={3} />
            </div>
          </div>
        ) : null}
      </div>

      {/* 悬停时显示的删除按钮 - 右上角 */}
      {!isUploading && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
          title="删除文件"
        >
          <X className="w-3 h-3 text-white" strokeWidth={2.5} />
        </button>
      )}
    </div>
  );
}
