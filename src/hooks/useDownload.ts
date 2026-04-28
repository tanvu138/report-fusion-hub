import { useState, useCallback } from 'react';

export interface DownloadState {
  progress: number;
  status: 'idle' | 'downloading' | 'processing' | 'success' | 'error';
  error?: string;
}

export interface UseDownloadOptions {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export const useDownload = (options: UseDownloadOptions = {}) => {
  const [downloadState, setDownloadState] = useState<DownloadState>({
    progress: 0,
    status: 'idle'
  });

  const downloadFile = useCallback(async (url: string, filename?: string) => {
    setDownloadState({
      progress: 0,
      status: 'downloading'
    });

    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error(`Download failed: ${response.status} ${response.statusText}`);
      }

      const contentLength = response.headers.get('content-length');
      const total = contentLength ? parseInt(contentLength, 10) : 0;
      
      if (!response.body) {
        throw new Error('Response body is not available');
      }

      // Read the response body with progress tracking
      const reader = response.body.getReader();
      const chunks: Uint8Array[] = [];
      let loaded = 0;

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        chunks.push(value);
        loaded += value.length;

        if (total > 0) {
          const progress = Math.round((loaded / total) * 100);
          setDownloadState(prev => ({
            ...prev,
            progress
          }));
        }
      }

      // Process the downloaded data
      setDownloadState(prev => ({
        ...prev,
        status: 'processing'
      }));

      // Combine chunks into a single Uint8Array
      const blob = new Blob(chunks);
      
      // Create download link
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      
      // Set filename from response header or provided filename
      const contentDisposition = response.headers.get('content-disposition');
      let downloadFilename = filename;
      
      if (!downloadFilename && contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (filenameMatch && filenameMatch[1]) {
          downloadFilename = filenameMatch[1].replace(/['"]/g, '');
        }
      }
      
      if (downloadFilename) {
        link.download = downloadFilename;
      }

      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);

      setDownloadState({
        progress: 100,
        status: 'success'
      });
      
      options.onSuccess?.();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Download failed';
      setDownloadState({
        progress: 0,
        status: 'error',
        error: errorMessage
      });
      options.onError?.(errorMessage);
    }
  }, [options]);

  const reset = useCallback(() => {
    setDownloadState({
      progress: 0,
      status: 'idle'
    });
  }, []);

  return {
    downloadState,
    downloadFile,
    reset,
    isDownloading: downloadState.status === 'downloading',
    isSuccess: downloadState.status === 'success',
    isError: downloadState.status === 'error'
  };
};

export default useDownload;