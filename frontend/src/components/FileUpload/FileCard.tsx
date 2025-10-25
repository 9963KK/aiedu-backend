import { X, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FileIconComponent } from './FileIcon';
import { formatFileSize } from '@/lib/file-utils';
import type { UploadFile } from '@/types/file';

interface FileCardProps {
  /** 上传文件对象 */
  file: UploadFile;
  /** 删除文件回调 */
  onRemove: () => void;
}

/**
 * 文件卡片组件
 * 显示上传完成的文件信息
 */
export function FileCard({ file, onRemove }: FileCardProps) {
  const { name, size, type, status, materialStatus, error } = file;

  // 状态文本和图标
  const getStatusInfo = () => {
    if (status === 'error') {
      return {
        text: error || '上传失败',
        icon: <AlertCircle className="w-4 h-4 text-red-500" />,
        color: 'text-red-500',
      };
    }

    if (status === 'processing') {
      return {
        text: '处理中...',
        icon: <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />,
        color: 'text-blue-500',
      };
    }

    if (status === 'success') {
      if (materialStatus === 'processing' || materialStatus === 'queued') {
        return {
          text: '解析中...',
          icon: <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />,
          color: 'text-blue-500',
        };
      }

      if (materialStatus === 'ready') {
        return {
          text: '已就绪',
          icon: <CheckCircle2 className="w-4 h-4 text-green-500" />,
          color: 'text-green-500',
        };
      }

      if (materialStatus === 'failed') {
        return {
          text: '解析失败',
          icon: <AlertCircle className="w-4 h-4 text-red-500" />,
          color: 'text-red-500',
        };
      }

      return {
        text: '上传成功',
        icon: <CheckCircle2 className="w-4 h-4 text-green-500" />,
        color: 'text-green-500',
      };
    }

    return {
      text: '等待上传',
      icon: null,
      color: 'text-muted-foreground',
    };
  };

  const statusInfo = getStatusInfo();

  return (
    <div className="flex items-center gap-3 p-3 bg-card border rounded-lg shadow-sm hover:shadow-md transition-shadow animate-in slide-in-from-bottom-2 duration-300">
      {/* 文件图标 */}
      <div className="flex-shrink-0">
        <FileIconComponent fileType={type} className="w-8 h-8" />
      </div>

      {/* 文件信息 */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate mb-1">
          {name}
        </p>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-muted-foreground">
            {formatFileSize(size)}
          </span>
          <span className="text-muted-foreground">·</span>
          <div className="flex items-center gap-1">
            {statusInfo.icon}
            <span className={statusInfo.color}>{statusInfo.text}</span>
          </div>
        </div>
      </div>

      {/* 删除按钮 */}
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 flex-shrink-0 hover:bg-destructive/10 hover:text-destructive"
        onClick={onRemove}
        title="删除文件"
      >
        <X className="w-4 h-4" />
      </Button>
    </div>
  );
}
