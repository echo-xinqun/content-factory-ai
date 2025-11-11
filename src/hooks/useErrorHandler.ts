import { useState, useCallback } from 'react';
import { AnalysisError, AnalysisErrorType } from '@/types/analysisTypes';
import {
  globalErrorHandler,
  getUserFriendlyMessage,
  isRetryableError,
  getRetrySuggestion
} from '@/utils/errorHandler';

interface ErrorState {
  error: AnalysisError | null;
  isRetrying: boolean;
  retryCount: number;
  lastRetryTime: number;
}

interface UseErrorHandlerReturn extends ErrorState {
  handleError: (error: Error | AnalysisError | string, context?: any) => void;
  clearError: () => void;
  retry: () => Promise<void>;
  canRetry: boolean;
  retryDelay: number;
  maxRetries: number;
  userFriendlyMessage: string;
}

export function useErrorHandler(): UseErrorHandlerReturn {
  const [errorState, setErrorState] = useState<ErrorState>({
    error: null,
    isRetrying: false,
    retryCount: 0,
    lastRetryTime: 0
  });

  const handleError = useCallback((error: Error | AnalysisError | string, context?: any) => {
    const analysisError = globalErrorHandler.handleError(error, context);
    setErrorState(prev => ({
      ...prev,
      error: analysisError,
      isRetrying: false,
      retryCount: 0,
      lastRetryTime: 0
    }));
  }, []);

  const clearError = useCallback(() => {
    setErrorState(prev => ({
      ...prev,
      error: null,
      isRetrying: false,
      retryCount: 0,
      lastRetryTime: 0
    }));
  }, []);

  const retry = useCallback(async () => {
    if (!errorState.error || !isRetryableError(errorState.error)) {
      return;
    }

    const retrySuggestion = getRetrySuggestion(errorState.error);
    const now = Date.now();

    // 检查是否超过最大重试次数
    if (errorState.retryCount >= retrySuggestion.maxRetries) {
      return;
    }

    // 检查重试间隔
    if (now - errorState.lastRetryTime < retrySuggestion.delay) {
      return;
    }

    setErrorState(prev => ({
      ...prev,
      isRetrying: true,
      lastRetryTime: now
    }));

    // 这里可以添加重试逻辑，通常需要调用外部传入的重试函数
    // 为了更好的灵活性，我们建议通过参数传入重试函数
    console.log('重试中...', { retryCount: errorState.retryCount + 1 });

    // 模拟重试延迟
    setTimeout(() => {
      setErrorState(prev => ({
        ...prev,
        isRetrying: false,
        retryCount: prev.retryCount + 1
      }));
    }, retrySuggestion.delay);
  }, [errorState.error, errorState.retryCount, errorState.lastRetryTime]);

  const { error, isRetrying, retryCount, lastRetryTime } = errorState;

  const canRetry = error ? isRetryableError(error) && retryCount < (getRetrySuggestion(error).maxRetries) : false;
  const retryDelay = error ? getRetrySuggestion(error).delay : 1000;
  const maxRetries = error ? getRetrySuggestion(error).maxRetries : 0;
  const userFriendlyMessage = error ? getUserFriendlyMessage(error) : '';

  return {
    error,
    isRetrying,
    retryCount,
    lastRetryTime,
    handleError,
    clearError,
    retry,
    canRetry,
    retryDelay,
    maxRetries,
    userFriendlyMessage
  };
}

// 带有重试功能的错误处理Hook
export function useAsyncErrorHandler<T extends (...args: any[]) => Promise<any>>(
  asyncFunction: T,
  options: {
    onError?: (error: AnalysisError) => void;
    onSuccess?: (result: Awaited<ReturnType<T>>) => void;
    maxRetries?: number;
    retryDelay?: number;
  } = {}
) {
  const [errorState, setErrorState] = useState<ErrorState>({
    error: null,
    isRetrying: false,
    retryCount: 0,
    lastRetryTime: 0
  });
  const [result, setResult] = useState<Awaited<ReturnType<T>> | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const execute = useCallback(async (...args: Parameters<T>): Promise<Awaited<ReturnType<T>> | null> => {
    setIsLoading(true);
    setErrorState(prev => ({ ...prev, error: null }));

    try {
      const response = await asyncFunction(...args);
      setResult(response);
      options.onSuccess?.(response);
      return response;
    } catch (error) {
      const analysisError = globalErrorHandler.handleError(error);
      setErrorState(prev => ({
        ...prev,
        error: analysisError,
        isRetrying: false,
        retryCount: 0,
        lastRetryTime: 0
      }));
      options.onError?.(analysisError);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [asyncFunction, options]);

  const retry = useCallback(async (...args: Parameters<T>): Promise<Awaited<ReturnType<T>> | null> => {
    if (!errorState.error || !isRetryableError(errorState.error)) {
      return null;
    }

    const retrySuggestion = getRetrySuggestion(errorState.error);
    const maxRetries = options.maxRetries ?? retrySuggestion.maxRetries;

    if (errorState.retryCount >= maxRetries) {
      return null;
    }

    setErrorState(prev => ({
      ...prev,
      isRetrying: true,
      retryCount: prev.retryCount + 1,
      lastRetryTime: Date.now()
    }));

    // 延迟重试
    const delay = options.retryDelay ?? retrySuggestion.delay;
    await new Promise(resolve => setTimeout(resolve, delay));

    return execute(...args);
  }, [errorState.error, errorState.retryCount, options, execute]);

  const reset = useCallback(() => {
    setErrorState({
      error: null,
      isRetrying: false,
      retryCount: 0,
      lastRetryTime: 0
    });
    setResult(null);
    setIsLoading(false);
  }, []);

  const { error, isRetrying, retryCount } = errorState;

  const canRetry = error ? isRetryableError(error) && retryCount < (options.maxRetries ?? getRetrySuggestion(error).maxRetries) : false;
  const userFriendlyMessage = error ? getUserFriendlyMessage(error) : '';

  return {
    execute,
    retry,
    reset,
    result,
    error,
    isLoading,
    isRetrying,
    retryCount,
    canRetry,
    userFriendlyMessage
  };
}

export default useErrorHandler;