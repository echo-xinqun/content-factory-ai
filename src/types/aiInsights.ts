// AI增强洞察数据类型定义

export interface ArticleSummary {
  articleId: string;
  title: string;
  summary: string;           // AI生成的摘要
  keyPoints: string[];       // 关键要点
  highlights: string[];      // 文章亮点
  sentiment: 'positive' | 'neutral' | 'negative';
  topics: string[];          // 话题标签
  keywords: string[];         // 关键词
  targetAudience: string;    // 目标受众
  contentValue: 'high' | 'medium' | 'low';  // 内容价值评估
}

export interface TopicInsight {
  id: string;
  trend: string;             // 趋势描述
  evidence: string[];        // 支撑证据
  confidence: number;        // 置信度 0-1
  recommendation: string;    // 内容建议
  difficulty: 'easy' | 'medium' | 'hard';
  potential: 'high' | 'medium' | 'low';
  category: 'trend' | 'opportunity' | 'strategy' | 'content' | 'audience';
}

export interface SentimentAnalysis {
  overall: string;           // 整体情感倾向
  emotionalTone: string[];   // 情感调性
  engagementLevel: string;   // 用户参与度
  dominantEmotion: string;   // 主导情感
  sentimentScore: number;    // 情感评分 -1 到 1
}

export interface Opportunity {
  gap: string;               // 市场空白或需求缺口
  potential: string;         // 发展潜力说明
  competition: 'low' | 'medium' | 'high'; // 竞争程度
  suggestedAction: string;   // 建议的具体行动
  estimatedDifficulty: 'easy' | 'medium' | 'hard';
  marketSize: string;        // 市场规模评估
}

export interface AIMetadata {
  processingTime: number;    // 处理时间（毫秒）
  confidence: number;        // 整体置信度
  aiModel: string;          // 使用的AI模型
  timestamp: number;        // 分析时间戳
  articlesAnalyzed: number; // 分析的文章数量
  tokensUsed: number;       // 使用的token数量
  version: string;          // 分析版本
}

export interface AIAnalysis {
  articleSummaries: ArticleSummary[];
  topicInsights: TopicInsight[];
  sentimentAnalysis: SentimentAnalysis;
  opportunities: Opportunity[];
}

export interface AIEnhancedInsights {
  // 基础统计信息（保留兼容性）
  basicInsights: string[];

  // AI分析结果
  aiAnalysis: AIAnalysis;

  // 处理元数据
  metadata: AIMetadata;
}

// AI分析请求类型
export interface AIAnalysisRequest {
  searchId: string;
  keyword: string;
  articles: any[]; // ArticleData[]
  onProgress?: (progress: number, step: string) => void; // 进度回调
  analysisOptions?: {
    maxArticles?: number;    // 最大分析文章数
    includeSentiment?: boolean;
    includeOpportunities?: boolean;
    model?: string;          // AI模型选择
  };
}

// AI分析响应类型
export interface AIAnalysisResponse {
  success: boolean;
  data?: AIEnhancedInsights;
  error?: string;
  cached?: boolean;         // 是否使用缓存
  processingTime?: number;
}

// AI处理状态类型
export type AIProcessingStatus = 'idle' | 'processing' | 'completed' | 'error';

export interface AIProcessingState {
  status: AIProcessingStatus;
  progress: number;          // 进度百分比 0-100
  currentStep: string;       // 当前处理步骤
  error?: string;
  startTime?: number;
  endTime?: number;
}

// 文章分析结果类型
export interface ArticleAnalysisResult {
  success: boolean;
  summary?: ArticleSummary;
  error?: string;
  processingTime: number;
}

// 批量分析结果类型
export interface BatchAnalysisResult {
  totalArticles: number;
  successfulAnalyses: number;
  failedAnalyses: number;
  results: ArticleAnalysisResult[];
  totalProcessingTime: number;
}

// AI服务配置类型
export interface AIServiceConfig {
  apiKey: string;
  baseURL?: string;
  model: string;
  maxTokens: number;
  temperature: number;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
  provider?: 'openai' | 'deepseek' | 'custom';
}

// 洞察过滤选项
export interface InsightFilterOptions {
  categories?: TopicInsight['category'][];
  minConfidence?: number;
  difficulty?: TopicInsight['difficulty'][];
  potential?: TopicInsight['potential'][];
  searchTerm?: string;
}

// 导出选项类型
export interface ExportOptions {
  format: 'json' | 'markdown' | 'pdf' | 'csv';
  includeMetadata?: boolean;
  includeBasicInsights?: boolean;
  includeArticleSummaries?: boolean;
  filterOptions?: InsightFilterOptions;
}