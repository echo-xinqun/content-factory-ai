import { AnalysisErrorType, AnalysisError } from '@/types/analysisTypes';

// 错误日志接口
interface ErrorLog {
  timestamp: number;
  type: AnalysisErrorType;
  message: string;
  context?: any;
  userAgent?: string;
  url?: string;
  userId?: string;
}

// 错误处理配置
interface ErrorHandlerConfig {
  enableLogging: boolean;
  enableUserNotification: boolean;
  maxLogEntries: number;
  logToConsole: boolean;
  logToService: boolean;
}

// 默认配置
const DEFAULT_CONFIG: ErrorHandlerConfig = {
  enableLogging: true,
  enableUserNotification: true,
  maxLogEntries: 100,
  logToConsole: true,
  logToService: false // 在生产环境中可以启用
};

class ErrorHandler {
  private config: ErrorHandlerConfig;
  private errorLogs: ErrorLog[] = [];

  constructor(config: Partial<ErrorHandlerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // 创建标准化的错误对象
  createError(
    type: AnalysisErrorType,
    message: string,
    context?: any,
    retryable: boolean = false
  ): AnalysisError {
    return {
      type,
      message,
      details: context,
      timestamp: Date.now(),
      retryable
    };
  }

  // 处理错误
  handleError(
    error: Error | AnalysisError | string,
    context?: any,
    options: { silent?: boolean; retryable?: boolean } = {}
  ): AnalysisError {
    const { silent = false, retryable = false } = options;

    // 标准化错误对象
    let analysisError: AnalysisError;

    if (typeof error === 'string') {
      analysisError = this.createError(
        AnalysisErrorType.UNKNOWN_ERROR,
        error,
        context,
        retryable
      );
    } else if (error instanceof Error) {
      const type = this.mapErrorToAnalysisErrorType(error);
      analysisError = this.createError(
        type,
        error.message,
        { ...context, stack: error.stack },
        retryable
      );
    } else {
      analysisError = error;
    }

    // 记录错误
    if (this.config.enableLogging && !silent) {
      this.logError(analysisError);
    }

    return analysisError;
  }

  // 映射通用错误类型到分析错误类型
  private mapErrorToAnalysisErrorType(error: Error): AnalysisErrorType {
    const message = error.message.toLowerCase();
    const stack = error.stack?.toLowerCase() || '';

    if (message.includes('network') || message.includes('fetch') || stack.includes('network')) {
      return AnalysisErrorType.NETWORK_ERROR;
    }

    if (message.includes('timeout') || message.includes('time out')) {
      return AnalysisErrorType.TIMEOUT_ERROR;
    }

    if (message.includes('api key') || message.includes('authentication') || message.includes('unauthorized')) {
      return AnalysisErrorType.API_ERROR;
    }

    if (message.includes('quota') || message.includes('limit') || message.includes('rate')) {
      return AnalysisErrorType.QUOTA_ERROR;
    }

    if (message.includes('json') || message.includes('parse')) {
      return AnalysisErrorType.PARSING_ERROR;
    }

    if (message.includes('validation') || message.includes('invalid')) {
      return AnalysisErrorType.VALIDATION_ERROR;
    }

    if (message.includes('server') || message.includes('500')) {
      return AnalysisErrorType.SERVER_ERROR;
    }

    return AnalysisErrorType.UNKNOWN_ERROR;
  }

  // 记录错误日志
  private logError(error: AnalysisError): void {
    const logEntry: ErrorLog = {
      timestamp: error.timestamp,
      type: error.type,
      message: error.message,
      context: error.details,
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
      url: typeof window !== 'undefined' ? window.location.href : undefined
    };

    // 添加到内存日志
    this.errorLogs.push(logEntry);

    // 限制日志条数
    if (this.errorLogs.length > this.config.maxLogEntries) {
      this.errorLogs = this.errorLogs.slice(-this.config.maxLogEntries);
    }

    // 控制台输出
    if (this.config.logToConsole) {
      console.error('[AI Analysis Error]', {
        type: error.type,
        message: error.message,
        context: error.details,
        timestamp: new Date(error.timestamp).toISOString(),
        retryable: error.retryable
      });
    }

    // TODO: 可以在这里添加远程日志服务集成
    // if (this.config.logToService) {
    //   this.sendToLogService(logEntry);
    // }
  }

  // 获取用户友好的错误消息
  getUserFriendlyMessage(error: AnalysisError): string {
    switch (error.type) {
      case AnalysisErrorType.NETWORK_ERROR:
        return '网络连接失败，请检查网络连接后重试';

      case AnalysisErrorType.TIMEOUT_ERROR:
        return '请求超时，请稍后重试';

      case AnalysisErrorType.API_ERROR:
        return 'AI服务认证失败，请检查API配置';

      case AnalysisErrorType.QUOTA_ERROR:
        return 'API调用次数已达上限，请稍后重试或升级套餐';

      case AnalysisErrorType.PARSING_ERROR:
        return '数据解析失败，请检查输入数据格式';

      case AnalysisErrorType.VALIDATION_ERROR:
        return '输入数据验证失败，请检查数据格式';

      case AnalysisErrorType.INSUFFICIENT_DATA:
        return '数据量不足，无法进行有效分析';

      case AnalysisErrorType.SERVER_ERROR:
        return '服务器内部错误，请稍后重试';

      case AnalysisErrorType.UNKNOWN_ERROR:
      default:
        return '发生未知错误，请稍后重试';
    }
  }

  // 判断错误是否可重试
  isRetryableError(error: AnalysisError): boolean {
    return error.retryable || [
      AnalysisErrorType.NETWORK_ERROR,
      AnalysisErrorType.TIMEOUT_ERROR,
      AnalysisErrorType.QUOTA_ERROR,
      AnalysisErrorType.SERVER_ERROR
    ].includes(error.type);
  }

  // 获取重试建议
  getRetrySuggestion(error: AnalysisError): { shouldRetry: boolean; delay: number; maxRetries: number } {
    const baseConfig = {
      shouldRetry: this.isRetryableError(error),
      delay: 1000,
      maxRetries: 3
    };

    switch (error.type) {
      case AnalysisErrorType.NETWORK_ERROR:
        return { ...baseConfig, delay: 2000, maxRetries: 5 };

      case AnalysisErrorType.TIMEOUT_ERROR:
        return { ...baseConfig, delay: 5000, maxRetries: 2 };

      case AnalysisErrorType.QUOTA_ERROR:
        return { ...baseConfig, delay: 60000, maxRetries: 1 }; // 1分钟后重试

      case AnalysisErrorType.SERVER_ERROR:
        return { ...baseConfig, delay: 3000, maxRetries: 3 };

      default:
        return baseConfig;
    }
  }

  // 获取错误统计
  getErrorStats(): { [key in AnalysisErrorType]?: number } {
    const stats: { [key in AnalysisErrorType]?: number } = {};

    this.errorLogs.forEach(log => {
      stats[log.type] = (stats[log.type] || 0) + 1;
    });

    return stats;
  }

  // 清除错误日志
  clearLogs(): void {
    this.errorLogs = [];
  }

  // 获取最近的错误日志
  getRecentErrors(limit: number = 10): ErrorLog[] {
    return this.errorLogs.slice(-limit);
  }
}

// 创建全局错误处理器实例
export const globalErrorHandler = new ErrorHandler();

// 导出工具函数
export const createAnalysisError = (type: AnalysisErrorType, message: string, context?: any, retryable?: boolean) =>
  globalErrorHandler.createError(type, message, context, retryable);

export const handleError = (error: Error | AnalysisError | string, context?: any, options?: { silent?: boolean; retryable?: boolean }) =>
  globalErrorHandler.handleError(error, context, options);

export const getUserFriendlyMessage = (error: AnalysisError) =>
  globalErrorHandler.getUserFriendlyMessage(error);

export const isRetryableError = (error: AnalysisError) =>
  globalErrorHandler.isRetryableError(error);

export const getRetrySuggestion = (error: AnalysisError) =>
  globalErrorHandler.getRetrySuggestion(error);

export const getErrorStats = () =>
  globalErrorHandler.getErrorStats();

export default ErrorHandler;