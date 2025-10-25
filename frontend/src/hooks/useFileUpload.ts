import { useState, useCallback, useRef, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { UploadFile } from '@/types/file';
import { generateFileId, getFileType } from '@/lib/file-utils';
import { uploadMaterial, pollMaterialStatus, deleteMaterial } from '@/api/materials';

/** 最大并发上传数 */
const MAX_CONCURRENT_UPLOADS = 3;

/**
 * 文件上传 Hook
 * 管理文件上传队列、进度追踪、状态轮询
 */
export function useFileUpload() {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const { toast } = useToast();

  // 上传队列管理
  const uploadQueueRef = useRef<UploadFile[]>([]);
  const activeUploadsRef = useRef<number>(0);

  /**
   * 添加文件到上传列表
   */
  const addFiles = useCallback((newFiles: File[]) => {
    const uploadFiles: UploadFile[] = newFiles.map((file) => {
      const fileType = getFileType(file.name);

      return {
        id: generateFileId(),
        file,
        name: file.name,
        size: file.size,
        type: fileType!,
        status: 'pending',
        progress: 0,
      };
    });

    setFiles((prev) => [...prev, ...uploadFiles]);

    // 添加到队列并开始处理
    uploadQueueRef.current.push(...uploadFiles);
    processQueue();
  }, []);

  /**
   * 处理上传队列
   */
  const processQueue = useCallback(() => {
    while (
      activeUploadsRef.current < MAX_CONCURRENT_UPLOADS &&
      uploadQueueRef.current.length > 0
    ) {
      const file = uploadQueueRef.current.shift();
      if (file) {
        activeUploadsRef.current++;
        uploadFile(file).finally(() => {
          activeUploadsRef.current--;
          processQueue();
        });
      }
    }
  }, []);

  /**
   * 上传单个文件
   */
  const uploadFile = async (uploadFile: UploadFile) => {
    const controller = new AbortController();

    // 更新状态为 uploading
    setFiles((prev) =>
      prev.map((f) =>
        f.id === uploadFile.id
          ? { ...f, status: 'uploading', abortController: controller }
          : f
      )
    );

    try {
      // 上传文件
      const response = await uploadMaterial(
        uploadFile.file,
        (progress) => {
          setFiles((prev) =>
            prev.map((f) => (f.id === uploadFile.id ? { ...f, progress } : f))
          );
        },
        controller.signal
      );

      const { materialId, status } = response.data;

      // 上传成功,更新状态
      setFiles((prev) =>
        prev.map((f) =>
          f.id === uploadFile.id
            ? {
                ...f,
                status: 'processing',
                progress: 100,
                materialId,
                materialStatus: status,
              }
            : f
        )
      );

      // 开始轮询处理状态
      if (status !== 'ready' && status !== 'failed') {
        pollStatus(uploadFile.id, materialId);
      }

      toast({
        title: '上传成功',
        description: `${uploadFile.name} 已上传`,
      });
    } catch (error: any) {
      // 上传失败
      const errorMessage =
        error?.message || error?.toString() || '上传失败';

      setFiles((prev) =>
        prev.map((f) =>
          f.id === uploadFile.id
            ? { ...f, status: 'error', error: errorMessage }
            : f
        )
      );

      // 如果不是取消操作,显示错误提示
      if (error?.code !== 'ABORTED') {
        toast({
          variant: 'destructive',
          title: '上传失败',
          description: `${uploadFile.name}: ${errorMessage}`,
        });
      }
    }
  };

  /**
   * 轮询材料处理状态
   */
  const pollStatus = async (fileId: string, materialId: string) => {
    try {
      await pollMaterialStatus(
        materialId,
        (response) => {
          setFiles((prev) =>
            prev.map((f) =>
              f.id === fileId
                ? {
                    ...f,
                    materialStatus: response.data.status,
                    status:
                      response.data.status === 'ready'
                        ? 'success'
                        : response.data.status === 'failed'
                          ? 'error'
                          : 'processing',
                  }
                : f
            )
          );
        },
        60,
        2000
      );
    } catch (error: any) {
      // 轮询超时或失败
      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileId
            ? {
                ...f,
                status: 'error',
                error: error?.message || '处理超时',
              }
            : f
        )
      );
    }
  };

  /**
   * 取消上传
   */
  const cancelUpload = useCallback((fileId: string) => {
    setFiles((prev) => {
      const file = prev.find((f) => f.id === fileId);
      if (file?.abortController) {
        file.abortController.abort();
      }

      // 从队列中移除
      uploadQueueRef.current = uploadQueueRef.current.filter(
        (f) => f.id !== fileId
      );

      return prev.filter((f) => f.id !== fileId);
    });
  }, []);

  /**
   * 删除文件
   */
  const removeFile = useCallback(async (fileId: string) => {
    const file = files.find((f) => f.id === fileId);

    // 如果有 materialId,调用后端删除接口
    if (file?.materialId) {
      try {
        await deleteMaterial(file.materialId);
      } catch (error) {
        console.error('删除材料失败:', error);
        // 即使删除失败也从前端移除
      }
    }

    // 从列表中移除
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
  }, [files]);

  /**
   * 清空所有文件
   */
  const clearFiles = useCallback(() => {
    // 取消所有正在上传的文件
    files.forEach((file) => {
      if (file.status === 'uploading' && file.abortController) {
        file.abortController.abort();
      }
    });

    setFiles([]);
    uploadQueueRef.current = [];
  }, [files]);

  /**
   * 获取成功上传的材料 ID 列表
   */
  const getUploadedMaterialIds = useCallback(() => {
    return files
      .filter((f) => f.status === 'success' && f.materialId)
      .map((f) => f.materialId!);
  }, [files]);

  return {
    files,
    addFiles,
    cancelUpload,
    removeFile,
    clearFiles,
    getUploadedMaterialIds,
    // 统计信息
    uploadingCount: files.filter((f) => f.status === 'uploading').length,
    successCount: files.filter((f) => f.status === 'success').length,
    errorCount: files.filter((f) => f.status === 'error').length,
  };
}
