import { useState } from "react";

type UploadState = "idle" | "uploading" | "processing" | "success" | "error";

type UploadItem = {
  id: string;
  name: string;
  status: UploadState;
  progress: number;
  materialId?: string;
};

export function useFileUpload() {
  const [files, setFiles] = useState<UploadItem[]>([]);

  const addFiles = (list: FileList) => {
    const arr = Array.from(list);
    arr.forEach(async (f) => {
      const id = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
      const item: UploadItem = { id, name: f.name, status: "uploading", progress: 0 };
      setFiles((prev) => [...prev, item]);

      const form = new FormData();
      form.append("file", f);

      try {
        const res = await fetch(`/api/materials`, {
          method: "POST",
          body: form,
        });
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const data = await res.json();
        setFiles((prev) =>
          prev.map((x) =>
            x.id === id ? { ...x, status: "processing", progress: 100, materialId: data.data.materialId } : x
          )
        );
      } catch (e) {
        setFiles((prev) => prev.map((x) => (x.id === id ? { ...x, status: "error" } : x)));
      }
    });
  };

  const cancelUpload = (id: string) => {
    // MVP: 本地无法中断 fetch，直接标记为 error 并从 UI 移除
    setFiles((prev) => prev.filter((x) => x.id !== id));
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((x) => x.id !== id));
  };

  const getUploadedMaterialIds = () => files.map((f) => f.materialId).filter(Boolean) as string[];

  return { files, addFiles, cancelUpload, removeFile, getUploadedMaterialIds };
}


