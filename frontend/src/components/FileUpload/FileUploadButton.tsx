import { useRef } from 'react';
import { Paperclip } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { getFileAcceptTypes, validateFile } from '@/lib/file-utils';

interface FileUploadButtonProps {
  /** 文件选择回调 */
  onFilesSelected: (files: File[]) => void;
  /** 是否禁用 */
  disabled?: boolean;
  /** 是否支持多选 (默认 true) */
  multiple?: boolean;
  /** 自定义样式 */
  className?: string;
}

/**
 * 文件上传按钮组件
 * 触发文件选择对话框
 */
export function FileUploadButton({
  onFilesSelected,
  disabled = false,
  multiple = true,
  className,
}: FileUploadButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    if (files.length === 0) return;

    // 验证所有文件
    const validFiles: File[] = [];
    const errors: string[] = [];

    for (const file of files) {
      const validation = validateFile(file);
      if (validation.valid) {
        validFiles.push(file);
      } else {
        errors.push(`${file.name}: ${validation.error}`);
      }
    }

    // 显示错误提示
    if (errors.length > 0) {
      toast({
        variant: 'destructive',
        title: '文件验证失败',
        description: errors.slice(0, 3).join('\n') + (errors.length > 3 ? '\n...' : ''),
      });
    }

    // 添加有效文件
    if (validFiles.length > 0) {
      onFilesSelected(validFiles);
    }

    // 清空 input,允许重复选择相同文件
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={className || 'h-8 w-8 shrink-0'}
        onClick={handleClick}
        disabled={disabled}
        title="上传文件"
      >
        <Paperclip className="w-5 h-5" />
      </Button>

      <input
        ref={inputRef}
        type="file"
        multiple={multiple}
        accept={getFileAcceptTypes()}
        onChange={handleFileChange}
        className="hidden"
        aria-label="上传文件"
      />
    </>
  );
}
