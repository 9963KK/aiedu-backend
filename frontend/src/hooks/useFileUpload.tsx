import { useRef, useState } from "react";

type UploadState = "idle" | "uploading" | "processing" | "success" | "error";

type UploadItem = {
  id: string;
  name: string;
  status: UploadState;
  progress: number;
  materialId?: string;
  xhr?: XMLHttpRequest;
};

export function useFileUpload() {
  const [files, setFiles] = useState<UploadItem[]>([]);
  const xhrMap = useRef(new Map<string, XMLHttpRequest>());

  const addFiles = (list: FileList) => {
    const arr = Array.from(list);
    arr.forEach(async (f) => {
      const id = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
      const item: UploadItem = { id, name: f.name, status: "uploading", progress: 0 };
      setFiles((prev) => [...prev, item]);

      const form = new FormData();
      form.append("file", f);

      const xhr = new XMLHttpRequest();
      xhr.open("POST", `/api/materials`);
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const pct = Math.min(100, Math.round((e.loaded / e.total) * 100));
          setFiles((prev) => prev.map((x) => (x.id === id ? { ...x, progress: pct } : x)));
        }
      };
      xhr.onreadystatechange = () => {
        if (xhr.readyState === 4) {
          try {
            if (xhr.status >= 200 && xhr.status < 300) {
              const data = JSON.parse(xhr.responseText);
              setFiles((prev) =>
                prev.map((x) => (x.id === id ? { ...x, status: "success", progress: 100, materialId: data.data.materialId } : x))
              );
            } else {
              setFiles((prev) => prev.map((x) => (x.id === id ? { ...x, status: "error" } : x)));
            }
          } catch {
            setFiles((prev) => prev.map((x) => (x.id === id ? { ...x, status: "error" } : x)));
          }
          xhrMap.current.delete(id);
        }
      };
      xhr.onerror = () => {
        setFiles((prev) => prev.map((x) => (x.id === id ? { ...x, status: "error" } : x)));
        xhrMap.current.delete(id);
      };
      xhr.send(form);
      xhrMap.current.set(id, xhr);
    });
  };

  const cancelUpload = (id: string) => {
    const xhr = xhrMap.current.get(id);
    if (xhr && xhr.readyState !== 4) {
      try {
        xhr.abort();
      } catch {}
    }
    xhrMap.current.delete(id);
    setFiles((prev) => prev.filter((x) => x.id !== id));
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((x) => x.id !== id));
  };

  const getUploadedMaterialIds = () => files.filter((f) => f.status === "success").map((f) => f.materialId).filter(Boolean) as string[];

  return { files, addFiles, cancelUpload, removeFile, getUploadedMaterialIds };
}


