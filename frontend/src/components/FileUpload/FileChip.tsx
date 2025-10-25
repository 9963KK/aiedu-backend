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
 * 文件缩略图组件 (创新设计)
 * - 使用圆角矩形边框作为上传进度指示器
 * - 上传中: 边框逐渐填充显示进度
 * - 上传成功: 边框变为绿色
 * - 悬停时: 右上角显示删除按钮
 */
export function FileChip({ file, onRemove }: FileChipProps) {
  const { name, type, status, materialStatus, progress = 0 } = file;

  // 判断状态
  const isUploading = status === 'uploading';
  const isProcessing = status === 'processing' || (status === 'success' && materialStatus === 'processing');
  const isSuccess = status === 'success' && materialStatus === 'ready';
  const isError = status === 'error';

  // 计算边框颜色
  const getBorderClass = () => {
    if (isSuccess) return 'border-green-500 border-2';
    if (isError) return 'border-red-500 border-2';
    if (isProcessing) return 'border-blue-500 border-2';
    return 'border-border/50';
  };

  // 计算圆角矩形周长进度 (用于 SVG 描边动画)
  // 假设矩形宽度约 240px, 高度约 36px, 圆角 18px
  const width = 240;
  const height = 36;
  const borderRadius = 18;

  // 圆角矩形周长近似计算: 2*(w+h) - 4*r + 2*π*r
  const perimeter = 2 * (width + height) - 4 * borderRadius + 2 * Math.PI * borderRadius;
  const dashOffset = perimeter * (1 - progress / 100);

  return (
    <div className="relative inline-flex group">
      {/* SVG 进度边框 (仅上传中显示) */}
      {isUploading && (
        <svg
          className="absolute inset-0 pointer-events-none"
          width={width}
          height={height}
          style={{ overflow: 'visible' }}
        >
          <rect
            x="1"
            y="1"
            width={width - 2}
            height={height - 2}
            rx={borderRadius}
            ry={borderRadius}
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="2"
            strokeDasharray={perimeter}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            className="transition-all duration-300"
          />
        </svg>
      )}

      {/* 文件内容卡片 */}
      <div
        className={`inline-flex items-center justify-between gap-2 px-3 py-1.5 bg-muted/50 rounded-full hover:bg-muted/70 transition-all ${getBorderClass()}`}
        style={{ minWidth: `${width}px`, height: `${height}px` }}
      >
        {/* 左侧: 文件图标 + 文件名 */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {/* 文件图标背景 */}
          <div className="w-7 h-7 rounded-md bg-background/80 flex items-center justify-center flex-shrink-0">
            <FileIconComponent fileType={type} className="w-4 h-4" />
          </div>

          {/* 文件名 */}
          <span className="text-xs font-medium text-foreground truncate">
            {name}
          </span>
        </div>

        {/* 右侧: 状态图标 */}
        <div className="relative w-5 h-5 flex-shrink-0">
          {isProcessing ? (
            // 处理中 - 旋转加载器
            <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
          ) : isSuccess ? (
            // 成功 - 绿色对勾
            <div className="w-full h-full flex items-center justify-center animate-in zoom-in duration-200">
              <Check className="w-5 h-5 text-green-500" strokeWidth={3} />
            </div>
          ) : isError ? (
            // 错误 - 红色感叹号
            <AlertCircle className="w-5 h-5 text-red-500" strokeWidth={2.5} />
          ) : null}
        </div>
      </div>

      {/* 悬停时显示的删除按钮 - 右上角 */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className={`absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center shadow-md z-10 transition-all ${
          isUploading
            ? 'bg-gray-500 hover:bg-gray-600 opacity-100'
            : 'bg-red-500 hover:bg-red-600 opacity-0 group-hover:opacity-100'
        }`}
        title={isUploading ? '取消上传' : '删除文件'}
      >
        <X className="w-3 h-3 text-white" strokeWidth={2.5} />
      </button>
    </div>
  );
}
