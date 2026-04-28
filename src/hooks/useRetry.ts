import { useState, useCallback } from 'react';
import { isRetryableError } from '@/utils/errorUtils';

export interface RetryOptions {
  maxAttempts?: number;
  delay?: number;
  backoff?: boolean;
  retryCondition?: (error: unknown) => boolean;
}

export interface RetryState {
  attempts: number;
  isRetrying: boolean;
  lastError: unknown;
}

export const useRetry = (options: RetryOptions = {}) => {
  const {
    maxAttempts = 3,
    delay = 1000,
    backoff = true,
    retryCondition = isRetryableError
  } = options;

  const [retryState, setRetryState] = useState<RetryState>({
    attempts: 0,
    isRetrying: false,
    lastError: null
  });

  const executeWithRetry = useCallback(async <T>(
    fn: () => Promise<T>
  ): Promise<T> => {
    let currentAttempt = 0;
    
    while (currentAttempt < maxAttempts) {
      try {
        setRetryState({
          attempts: currentAttempt,
          isRetrying: currentAttempt > 0,
          lastError: null
        });

        const result = await fn();
        
        // Success - reset state
        setRetryState({
          attempts: 0,
          isRetrying: false,
          lastError: null
        });
        
        return result;
      } catch (error) {
        currentAttempt++;
        
        setRetryState({
          attempts: currentAttempt,
          isRetrying: false,
          lastError: error
        });

        // If we've reached max attempts or error is not retryable, throw
        if (currentAttempt >= maxAttempts || !retryCondition(error)) {
          throw error;
        }

        // Calculate delay with optional backoff
        const currentDelay = backoff ? delay * Math.pow(2, currentAttempt - 1) : delay;
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, currentDelay));
      }
    }

    // This should never be reached, but TypeScript requires it
    throw retryState.lastError;
  }, [maxAttempts, delay, backoff, retryCondition]);

  const reset = useCallback(() => {
    setRetryState({
      attempts: 0,
      isRetrying: false,
      lastError: null
    });
  }, []);

  return {
    executeWithRetry,
    retryState,
    reset,
    canRetry: retryState.attempts < maxAttempts && 
              retryState.lastError && 
              retryCondition(retryState.lastError)
  };
};

export default useRetry;