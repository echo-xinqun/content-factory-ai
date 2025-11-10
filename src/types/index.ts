export interface Article {
  id: string;
  title: string;
  content: string;
  status: ArticleStatus;
  createdAt: Date;
  updatedAt: Date;
  analysisId?: string;
  images?: string[];
  publishedAt?: Date;
}

export interface ArticleStatus {
  type: 'draft' | 'pending' | 'published' | 'failed';
  label: string;
  color: string;
}

export interface AnalysisRecord {
  id: string;
  keyword: string;
  reportData: AnalysisReport;
  createdAt: Date;
}

export interface AnalysisReport {
  topLikedArticles: ArticleStats[];
  topInteractiveArticles: ArticleStats[];
  wordCloud: WordCloudItem[];
  insights: string[];
}

export interface ArticleStats {
  id: string;
  title: string;
  content: string;
  readCount: number;
  likeCount: number;
  viewCount: number;
  interactiveRate: number;
}

export interface WordCloudItem {
  text: string;
  count: number;
}

export interface PublishRecord {
  id: string;
  articleId: string;
  platform: Platform;
  status: PublishStatus;
  publishedAt?: Date;
  externalId?: string;
}

export interface Platform {
  name: 'xiaohongshu' | 'wechat' | 'douyin' | 'video';
  label: string;
  color: string;
}

export interface PublishStatus {
  type: 'success' | 'pending' | 'failed';
  label: string;
  color: string;
}

export interface DashboardStats {
  totalArticles: number;
  totalReads: number;
  interactiveRate: number;
  publishSuccessRate: number;
  weeklyChange: {
    articles: number;
    reads: number;
    interactiveRate: number;
    publishSuccessRate: number;
  };
}

export interface TrendData {
  date: string;
  count: number;
}

export interface PlatformDistribution {
  platform: Platform;
  count: number;
  percentage: number;
}

export interface Activity {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  description: string;
  timestamp: Date;
}