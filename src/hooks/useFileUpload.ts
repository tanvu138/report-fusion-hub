import { useState, useCallback } from 'react';

export interface FileUploadState {
  progress: number;
  status: 'idle' | 'uploading' | 'processing' | 'success' | 'error';
  error?: string;
  result?: any;
}

export interface UseFileUploadOptions {
  onSuccess?: (result: any) => void;
  onError?: (error: string) => void;
  maxFileSize?: number; // in bytes
  allowedTypes?: string[];
}

export const useFileUpload = (options: UseFileUploadOptions = {}) => {
  const [uploadState, setUploadState] = useState<FileUploadState>({
    progress: 0,
    status: 'idle'
  });

  const validateFile = useCallback((file: File): string | null => {
    if (options.maxFileSize && file.size > options.maxFileSize) {
      return `File size exceeds limit of ${Math.round(options.maxFileSize / 1024 / 1024)}MB`;
    }

    if (options.allowedTypes && !options.allowedTypes.includes(file.type)) {
      return `File type not allowed. Allowed types: ${options.allowedTypes.join(', ')}`;
    }

    return null;
  }, [options.maxFileSize, options.allowedTypes]);

  const uploadFile = useCallback(async (file: File, uploadUrl: string, additionalData?: Record<string, any>) => {
    // Validate file
    const validationError = validateFile(file);
    if (validationError) {
      setUploadState({
        progress: 0,
        status: 'error',
        error: validationError
      });
      options.onError?.(validationError);
      return;
    }

    // Create FormData
    const formData = new FormData();
    formData.append('file', file);
    
    // Add additional data if provided
    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, String(value));
      });
    }

    // Reset state and start upload
    setUploadState({
      progress: 0,
      status: 'uploading'
    });

    try {
      const xhr = new XMLHttpRequest();

      // Track upload progress
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setUploadState(prev => ({
            ...prev,
            progress
          }));
        }
      });

      // Handle completion
      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          let result;
          try {
            result = JSON.parse(xhr.responseText);
          } catch {
            result = xhr.responseText;
          }

          setUploadState({
            progress: 100,
            status: 'success',
            result
          });
          options.onSuccess?.(result);
        } else {
          const error = `Upload failed: ${xhr.status} ${xhr.statusText}`;
          setUploadState({
            progress: 0,
            status: 'error',
            error
          });
          options.onError?.(error);
        }
      });

      // Handle errors
      xhr.addEventListener('error', () => {
        const error = 'Upload failed due to network error';
        setUploadState({
          progress: 0,
          status: 'error',
          error
        });
        options.onError?.(error);
      });

      // Handle aborts
      xhr.addEventListener('abort', () => {
        setUploadState({
          progress: 0,
          status: 'idle'
        });
      });

      // Start upload
      xhr.open('POST', uploadUrl);
      
      // Add authentication header if available
      const token = localStorage.getItem('token');
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }

      xhr.send(formData);

      // Return abort function
      return () => xhr.abort();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      setUploadState({
        progress: 0,
        status: 'error',
        error: errorMessage
      });
      options.onError?.(errorMessage);
    }
  }, [validateFile, options]);

  const reset = useCallback(() => {
    setUploadState({
      progress: 0,
      status: 'idle'
    });
  }, []);

  return {
    uploadState,
    uploadFile,
    reset,
    isUploading: uploadState.status === 'uploading',
    isSuccess: uploadState.status === 'success',
    isError: uploadState.status === 'error'
  };
};

export default useFileUpload;