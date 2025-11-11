// 分析相关类型扩展

import { ArticleData } from './api';
import { AIEnhancedInsights, AIProcessingState } from './aiInsights';

// 增强的搜索历史详情接口
export interface EnhancedSearchHistoryDetail {
  id: number;
  keyword: string;
  searchTime: number;
  totalArticles: number;
  avgReadCount: number;
  avgLikeCount: number;
  avgInteractionRate: number;
  createdAt: number;
  updatedAt: number;
  articles: ArticleData[];
  wordCloud: any[]; // WordCloudData[]
  insights: string[];  // 保留原有基础洞察

  // AI增强分析
  aiInsights?: AIEnhancedInsights;
  aiAnalysisStatus?: AIProcessingState;
}

// 分析状态枚举
export enum AnalysisStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CACHED = 'cached'
}

// 分析任务类型
export interface AnalysisTask {
  id: string;
  searchId: string;
  keyword: string;
  status: AnalysisStatus;
  progress: number;
  startTime: number;
  endTime?: number;
  error?: string;
  result?: AIEnhancedInsights;
}

// 分析配置选项
export interface AnalysisConfig {
  maxArticles: number;        // 最大分析文章数量
  enableAI: boolean;          // 是否启用AI分析
  aiModel: string;           // AI模型选择
  includeSentiment: boolean; // 是否包含情感分析
  includeOpportunities: boolean; // 是否包含机会识别
  minConfidence: number;     // 最小置信度阈值
  cacheResults: boolean;     // 是否缓存结果
  timeout: number;           // 分析超时时间（秒）
}

// 默认分析配置
export const DEFAULT_ANALYSIS_CONFIG: AnalysisConfig = {
  maxArticles: 10,
  enableAI: true,
  aiModel: 'gpt-4',
  includeSentiment: true,
  includeOpportunities: true,
  minConfidence: 0.6,
  cacheResults: true,
  timeout: 300 // 5分钟
};

// 分析结果缓存类型
export interface AnalysisCache {
  searchId: string;
  keyword: string;
  result: AIEnhancedInsights;
  createdAt: number;
  expiresAt: number;
  hitCount: number;
}

// 统计数据类型
export interface AnalysisStatistics {
  totalAnalyses: number;
  successfulAnalyses: number;
  failedAnalyses: number;
  averageProcessingTime: number;
  totalTokensUsed: number;
  lastAnalysisTime: number;
  mostAnalyzedKeywords: string[];
}

// 分析错误类型
export enum AnalysisErrorType {
  NETWORK_ERROR = 'network_error',
  API_ERROR = 'api_error',
  TIMEOUT_ERROR = 'timeout_error',
  PARSING_ERROR = 'parsing_error',
  VALIDATION_ERROR = 'validation_error',
  INSUFFICIENT_DATA = 'insufficient_data',
  RATE_LIMIT_ERROR = 'rate_limit_error',
  QUOTA_ERROR = 'quota_error',
  SERVER_ERROR = 'server_error',
  UNKNOWN_ERROR = 'unknown_error'
}

// 分析错误详情
export interface AnalysisError {
  type: AnalysisErrorType;
  message: string;
  details?: any;
  timestamp: number;
  retryable: boolean;
}

// 分析进度更新回调类型
export type ProgressCallback = (progress: number, step: string) => void;

// 分析完成回调类型
export type CompletionCallback = (result: AIEnhancedInsights | null, error?: AnalysisError) => void;

// 分析选项类型
export interface AnalysisOptions {
  config?: Partial<AnalysisConfig>;
  onProgress?: ProgressCallback;
  onComplete?: CompletionCallback;
  priority?: 'low' | 'normal' | 'high';
}

// 批量分析请求类型
export interface BatchAnalysisRequest {
  tasks: Array<{
    searchId: string;
    keyword: string;
    articles: ArticleData[];
    options?: AnalysisOptions;
  }>;
  globalConfig?: Partial<AnalysisConfig>;
}

// 批量分析结果类型
export interface BatchAnalysisResult {
  taskId: string;
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  results: Array<{
    searchId: string;
    success: boolean;
    result?: AIEnhancedInsights;
    error?: AnalysisError;
  }>;
  totalProcessingTime: number;
}

// AI分析服务接口
export interface IAIAnalysisService {
  generateInsights(request: AIAnalysisRequest): Promise<AIEnhancedInsights>;
  generateInsightsStream(request: AIAnalysisRequest): AsyncGenerator<AIProcessingState, AIEnhancedInsights, unknown>;
  getCachedResult(searchId: string): Promise<AIEnhancedInsights | null>;
  clearCache(searchId?: string): Promise<void>;
  getAnalysisStatistics(): Promise<AnalysisStatistics>;
}

// 内容分析服务接口
export interface IContentAnalysisService {
  analyzeArticle(article: ArticleData): Promise<any>; // ArticleSummary
  analyzeBatch(articles: ArticleData[]): Promise<any[]>; // ArticleSummary[]
  extractKeywords(content: string): Promise<string[]>;
  generateSummary(content: string): Promise<string>;
  analyzeSentiment(content: string): Promise<any>; // SentimentAnalysis
}

// 验证工具类型
export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

// 分析请求验证结果
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: string[];
}

// 导出相关类型
export interface ExportFormat {
  type: 'json' | 'markdown' | 'pdf' | 'csv';
  mimeType: string;
  extension: string;
}

export const SUPPORTED_EXPORT_FORMATS: Record<string, ExportFormat> = {
  json: {
    type: 'json',
    mimeType: 'application/json',
    extension: '.json'
  },
  markdown: {
    type: 'markdown',
    mimeType: 'text/markdown',
    extension: '.md'
  },
  pdf: {
    type: 'pdf',
    mimeType: 'application/pdf',
    extension: '.pdf'
  },
  csv: {
    type: 'csv',
    mimeType: 'text/csv',
    extension: '.csv'
  }
};