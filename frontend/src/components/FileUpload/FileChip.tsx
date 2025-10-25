export type FileChipItem = {
  id: string;
  name: string;
  status: "processing" | "success" | "error";
};

export function FileChip({ file, onRemove }: { file: FileChipItem; onRemove: () => void }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 shadow">
      <span className="text-sm truncate max-w-[200px]">{file.name}</span>
      {file.status === "error" && <span className="text-red-500">!</span>}
      <button onClick={onRemove} className="text-muted-foreground hover:text-foreground">✕</button>
    </div>
  );
}

import { X, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FileIconComponent } from './FileIcon';
import type { UploadFile } from '@/types/file';

interface FileChipProps {
  /** 上传文件对象 */
  file: UploadFile;
  /** 删除文件回调 */
  onRemove: () => void;
}

/**
 * 文件缩略图组件 (紧凑模式)
 * 用于在输入框上方显示文件标签
 */
export function FileChip({ file, onRemove }: FileChipProps) {
  const { name, type, status, materialStatus } = file;

  // 状态图标
  const getStatusIcon = () => {
    if (status === 'error') {
      return <AlertCircle className="w-3 h-3 text-red-500" />;
    }

    if (status === 'processing' || (status === 'success' && materialStatus === 'processing')) {
      return <Loader2 className="w-3 h-3 text-blue-500 animate-spin" />;
    }

    if (status === 'success' && materialStatus === 'ready') {
      return <CheckCircle2 className="w-3 h-3 text-green-500" />;
    }

    return null;
  };

  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-card border rounded-lg shadow-sm hover:shadow-md transition-shadow animate-in slide-in-from-bottom-2 duration-200">
      {/* 文件图标 */}
      <FileIconComponent fileType={type} className="w-4 h-4 flex-shrink-0" />

      {/* 文件名 */}
      <span className="text-xs font-medium text-foreground truncate max-w-[120px]">
        {name.length > 20 ? `${name.slice(0, 17)}...` : name}
      </span>

      {/* 状态图标 */}
      {getStatusIcon()}

      {/* 删除按钮 */}
      <Button
        variant="ghost"
        size="icon"
        className="h-4 w-4 p-0 hover:bg-destructive/10 hover:text-destructive flex-shrink-0"
        onClick={onRemove}
        title="删除文件"
      >
        <X className="w-3 h-3" />
      </Button>
    </div>
  );
}
