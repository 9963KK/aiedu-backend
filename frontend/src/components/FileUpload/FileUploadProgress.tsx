type UploadingFile = {
  id: string;
  name: string;
  progress: number; // 0-100
};

export function FileUploadProgress({ file, onCancel }: { file: UploadingFile; onCancel: () => void }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border bg-card p-3 shadow">
      <div className="relative h-8 w-8">
        <svg className="absolute inset-0" viewBox="0 0 36 36">
          <path
            className="text-muted stroke-current"
            d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            strokeWidth="3"
            opacity="0.2"
          />
          <path
            className="text-primary stroke-current"
            d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            strokeWidth="3"
            strokeDasharray={`${file.progress}, 100`}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-xs">{Math.round(file.progress)}%</div>
      </div>
      <div className="min-w-0 flex-1 truncate text-sm">{file.name}</div>
      <button onClick={onCancel} className="text-xs text-muted-foreground hover:text-foreground">取消</button>
    </div>
  );
}

import { X, CheckCircle } from 'lucide-react';
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
 * 显示圆形进度条,上传完成后变为绿色勾
 */
export function FileUploadProgress({ file, onCancel }: FileUploadProgressProps) {
  const { name, size, type, progress } = file;

  // 判断是否上传完成
  const isComplete = progress === 100;

  // 计算圆形进度条参数
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="flex items-center gap-3 p-3 bg-card border rounded-lg shadow-sm animate-in slide-in-from-bottom-2 duration-300">
      {/* 圆形进度条 / 成功图标 */}
      <div className="relative w-14 h-14 flex-shrink-0">
        {!isComplete ? (
          // 上传中 - 圆形进度条
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
            {/* 百分比文字 */}
            <text
              x="28"
              y="28"
              className="fill-foreground text-xs font-semibold"
              textAnchor="middle"
              dominantBaseline="middle"
              transform="rotate(90 28 28)"
            >
              {progress}%
            </text>
          </svg>
        ) : (
          // 上传完成 - 绿色圆形勾
          <div className="w-full h-full flex items-center justify-center animate-in zoom-in duration-300">
            <div className="relative">
              {/* 绿色圆形背景 */}
              <div className="absolute inset-0 bg-green-500 rounded-full animate-in zoom-in duration-200" />
              {/* 白色勾图标 */}
              <CheckCircle className="w-14 h-14 text-white relative z-10" strokeWidth={2} />
            </div>
          </div>
        )}
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
          {isComplete ? '上传完成' : '正在上传...'} {formatFileSize(size)}
        </p>
      </div>

      {/* 取消按钮 (仅在上传中显示) */}
      {!isComplete && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 flex-shrink-0"
          onClick={onCancel}
          title="取消上传"
        >
          <X className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
}
