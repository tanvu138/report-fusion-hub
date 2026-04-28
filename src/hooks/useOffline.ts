import { useState, useEffect, useCallback } from 'react';

export interface OfflineAction {
  id: string;
  type: string;
  data: any;
  timestamp: number;
  retryCount: number;
}

export interface OfflineState {
  isOnline: boolean;
  queue: OfflineAction[];
  isProcessingQueue: boolean;
}

export const useOffline = () => {
  const [offlineState, setOfflineState] = useState<OfflineState>({
    isOnline: navigator.onLine,
    queue: [],
    isProcessingQueue: false
  });

  // Load queued actions from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('offlineQueue');
      if (saved) {
        const queue = JSON.parse(saved);
        setOfflineState(prev => ({ ...prev, queue }));
      }
    } catch (error) {
      console.error('Failed to load offline queue:', error);
    }
  }, []);

  // Save queue to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('offlineQueue', JSON.stringify(offlineState.queue));
    } catch (error) {
      console.error('Failed to save offline queue:', error);
    }
  }, [offlineState.queue]);

  // Handle online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setOfflineState(prev => ({ ...prev, isOnline: true }));
    };

    const handleOffline = () => {
      setOfflineState(prev => ({ ...prev, isOnline: false }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Process queue when coming back online
  useEffect(() => {
    if (offlineState.isOnline && offlineState.queue.length > 0 && !offlineState.isProcessingQueue) {
      processQueue();
    }
  }, [offlineState.isOnline, offlineState.queue.length]);

  const addToQueue = useCallback((action: Omit<OfflineAction, 'id' | 'timestamp' | 'retryCount'>) => {
    const queueAction: OfflineAction = {
      ...action,
      id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      retryCount: 0
    };

    setOfflineState(prev => ({
      ...prev,
      queue: [...prev.queue, queueAction]
    }));

    return queueAction.id;
  }, []);

  const removeFromQueue = useCallback((actionId: string) => {
    setOfflineState(prev => ({
      ...prev,
      queue: prev.queue.filter(action => action.id !== actionId)
    }));
  }, []);

  const processQueue = useCallback(async () => {
    if (!offlineState.isOnline || offlineState.isProcessingQueue) {
      return;
    }

    setOfflineState(prev => ({ ...prev, isProcessingQueue: true }));

    const queueToProcess = [...offlineState.queue];
    
    for (const action of queueToProcess) {
      try {
        // Emit custom event for action processing
        const event = new CustomEvent('processOfflineAction', {
          detail: action
        });
        window.dispatchEvent(event);

        // Remove successful action from queue
        removeFromQueue(action.id);
      } catch (error) {
        console.error('Failed to process offline action:', error);
        
        // Increment retry count
        setOfflineState(prev => ({
          ...prev,
          queue: prev.queue.map(a =>
            a.id === action.id
              ? { ...a, retryCount: a.retryCount + 1 }
              : a
          )
        }));

        // Remove action if it has failed too many times
        if (action.retryCount >= 3) {
          removeFromQueue(action.id);
        }
      }
    }

    setOfflineState(prev => ({ ...prev, isProcessingQueue: false }));
  }, [offlineState.isOnline, offlineState.isProcessingQueue, offlineState.queue, removeFromQueue]);

  const clearQueue = useCallback(() => {
    setOfflineState(prev => ({ ...prev, queue: [] }));
  }, []);

  const executeWhenOnline = useCallback(async <T>(
    action: () => Promise<T>,
    fallbackAction?: Omit<OfflineAction, 'id' | 'timestamp' | 'retryCount'>
  ): Promise<T> => {
    if (offlineState.isOnline) {
      try {
        return await action();
      } catch (error) {
        // If we get a network error while "online", we might actually be offline
        if (error instanceof Error && 
            (error.message.includes('fetch') || 
             error.message.includes('network') || 
             error.message.includes('connection'))) {
          setOfflineState(prev => ({ ...prev, isOnline: false }));
          
          if (fallbackAction) {
            addToQueue(fallbackAction);
          }
        }
        throw error;
      }
    } else {
      if (fallbackAction) {
        addToQueue(fallbackAction);
        // Return a pending promise that resolves when the action is processed
        return new Promise<T>((resolve, reject) => {
          const handleProcessed = (event: CustomEvent) => {
            if (event.detail.id === fallbackAction.type) {
              window.removeEventListener('processOfflineAction', handleProcessed as EventListener);
              resolve(event.detail.result);
            }
          };
          window.addEventListener('processOfflineAction', handleProcessed as EventListener);
        });
      } else {
        throw new Error('No internet connection available');
      }
    }
  }, [offlineState.isOnline, addToQueue]);

  return {
    isOnline: offlineState.isOnline,
    queue: offlineState.queue,
    queueLength: offlineState.queue.length,
    isProcessingQueue: offlineState.isProcessingQueue,
    addToQueue,
    removeFromQueue,
    clearQueue,
    processQueue,
    executeWhenOnline
  };
};

export default useOffline;