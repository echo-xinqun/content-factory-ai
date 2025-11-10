// AI洞察生成核心服务

import { ArticleData } from '@/types/api';
import {
  AIEnhancedInsights,
  TopicInsight,
  SentimentAnalysis,
  Opportunity,
  AIMetadata,
  AIAnalysisRequest,
  AIAnalysisResponse,
  AIProcessingState,
  ArticleSummary
} from '@/types/aiInsights';
import {
  IAIAnalysisService,
  AnalysisConfig,
  DEFAULT_ANALYSIS_CONFIG,
  AnalysisError,
  AnalysisErrorType,
  AnalysisCache,
  AnalysisStatistics
} from '@/types/analysisTypes';
import { contentAnalysisService } from './contentAnalysisService';
import { getOpenAIService } from './openAIService';

export class AIInsightsService implements IAIAnalysisService {
  private cache = new Map<string, AnalysisCache>();
  private statistics: AnalysisStatistics = {
    totalAnalyses: 0,
    successfulAnalyses: 0,
    failedAnalyses: 0,
    averageProcessingTime: 0,
    totalTokensUsed: 0,
    lastAnalysisTime: 0,
    mostAnalyzedKeywords: []
  };

  /**
   * 生成AI洞察（主入口）
   */
  async generateInsights(request: AIAnalysisRequest): Promise<AIEnhancedInsights> {
    const startTime = Date.now();

    // 检查缓存
    const cached = await this.getCachedResult(request.searchId);
    if (cached) {
      console.log(`使用缓存的AI洞察: ${request.searchId}`);
      return cached;
    }

    try {
      // 选择要分析的文章
      const articlesToAnalyze = this.selectArticlesForAnalysis(
        request.articles,
        request.analysisOptions?.maxArticles
      );

      if (articlesToAnalyze.length === 0) {
        throw new Error('没有可分析的文章');
      }

      // 第一阶段：分析文章内容
      const articleSummaries = await this.analyzeArticles(
        articlesToAnalyze,
        request.analysisOptions
      );

      // 第二阶段：生成洞察
      const insights = await this.generateTopicInsights(
        articleSummaries,
        request.keyword
      );

      // 第三阶段：情感分析
      const sentimentAnalysis = await this.generateSentimentAnalysis(
        articleSummaries
      );

      // 第四阶段：机会识别
      const opportunities = await this.identifyOpportunities(
        articleSummaries,
        request.keyword
      );

      // 生成基础洞察（保留兼容性）
      const basicInsights = this.generateBasicInsights(request.articles);

      const processingTime = Date.now() - startTime;

      const result: AIEnhancedInsights = {
        basicInsights,
        aiAnalysis: {
          articleSummaries,
          topicInsights: insights,
          sentimentAnalysis,
          opportunities
        },
        metadata: {
          processingTime,
          confidence: this.calculateOverallConfidence(insights),
          aiModel: request.analysisOptions?.model || DEFAULT_ANALYSIS_CONFIG.aiModel,
          timestamp: Date.now(),
          articlesAnalyzed: articleSummaries.length,
          tokensUsed: this.estimateTokenUsage(articleSummaries),
          version: '2.0'
        }
      };

      // 缓存结果
      await this.cacheResult(request.searchId, request.keyword, result);

      // 更新统计信息
      this.updateStatistics(result, processingTime, true);

      return result;

    } catch (error) {
      const processingTime = Date.now() - startTime;
      this.updateStatistics(undefined as any, processingTime, false);
      throw error;
    }
  }

  /**
   * 流式生成AI洞察
   */
  async *generateInsightsStream(
    request: AIAnalysisRequest
  ): AsyncGenerator<AIProcessingState, AIEnhancedInsights, unknown> {
    const startTime = Date.now();

    try {
      yield {
        status: 'processing',
        progress: 10,
        currentStep: '准备分析数据...'
      };

      // 检查缓存
      const cached = await this.getCachedResult(request.searchId);
      if (cached) {
        yield {
          status: 'completed',
          progress: 100,
          currentStep: '已加载缓存结果'
        };
        return cached;
      }

      yield {
        status: 'processing',
        progress: 20,
        currentStep: '选择分析文章...'
      };

      const articlesToAnalyze = this.selectArticlesForAnalysis(
        request.articles,
        request.analysisOptions?.maxArticles
      );

      if (articlesToAnalyze.length === 0) {
        throw new Error('没有可分析的文章');
      }

      yield {
        status: 'processing',
        progress: 30,
        currentStep: '分析文章内容...'
      };

      // 分析文章内容
      const articleSummaries = await this.analyzeArticles(
        articlesToAnalyze,
        request.analysisOptions
      );

      yield {
        status: 'processing',
        progress: 50,
        currentStep: '生成选题洞察...'
      };

      // 生成洞察
      const insights = await this.generateTopicInsights(
        articleSummaries,
        request.keyword
      );

      yield {
        status: 'processing',
        progress: 70,
        currentStep: '分析情感倾向...'
      };

      // 情感分析
      const sentimentAnalysis = await this.generateSentimentAnalysis(
        articleSummaries
      );

      yield {
        status: 'processing',
        progress: 85,
        currentStep: '识别市场机会...'
      };

      // 机会识别
      const opportunities = await this.identifyOpportunities(
        articleSummaries,
        request.keyword
      );

      yield {
        status: 'processing',
        progress: 95,
        currentStep: '整合分析结果...'
      };

      const processingTime = Date.now() - startTime;
      const basicInsights = this.generateBasicInsights(request.articles);

      const result: AIEnhancedInsights = {
        basicInsights,
        aiAnalysis: {
          articleSummaries,
          topicInsights: insights,
          sentimentAnalysis,
          opportunities
        },
        metadata: {
          processingTime,
          confidence: this.calculateOverallConfidence(insights),
          aiModel: request.analysisOptions?.model || DEFAULT_ANALYSIS_CONFIG.aiModel,
          timestamp: Date.now(),
          articlesAnalyzed: articleSummaries.length,
          tokensUsed: this.estimateTokenUsage(articleSummaries),
          version: '2.0'
        }
      };

      // 缓存结果
      await this.cacheResult(request.searchId, request.keyword, result);

      yield {
        status: 'completed',
        progress: 100,
        currentStep: '分析完成'
      };

      return result;

    } catch (error) {
      yield {
        status: 'error',
        progress: 0,
        currentStep: `分析失败: ${error instanceof Error ? error.message : '未知错误'}`,
        error: error instanceof Error ? error.message : '未知错误',
        startTime,
        endTime: Date.now()
      };
      throw error;
    }
  }

  /**
   * 获取缓存结果
   */
  async getCachedResult(searchId: string): Promise<AIEnhancedInsights | null> {
    const cached = this.cache.get(searchId);
    if (cached && cached.expiresAt > Date.now()) {
      cached.hitCount++;
      return cached.result;
    }

    // 清理过期缓存
    if (cached && cached.expiresAt <= Date.now()) {
      this.cache.delete(searchId);
    }

    return null;
  }

  /**
   * 清理缓存
   */
  async clearCache(searchId?: string): Promise<void> {
    if (searchId) {
      this.cache.delete(searchId);
    } else {
      this.cache.clear();
    }
  }

  /**
   * 获取分析统计
   */
  async getAnalysisStatistics(): Promise<AnalysisStatistics> {
    return { ...this.statistics };
  }

  /**
   * 选择要分析的文章
   */
  private selectArticlesForAnalysis(
    articles: ArticleData[],
    maxArticles?: number
  ): ArticleData[] {
    const limit = maxArticles || DEFAULT_ANALYSIS_CONFIG.maxArticles;

    // 按互动率和点赞量排序，选择最优质的文章
    return articles
      .sort((a, b) => {
        const scoreA = a.interactiveRate * 0.6 + a.likeCount * 0.4;
        const scoreB = b.interactiveRate * 0.6 + b.likeCount * 0.4;
        return scoreB - scoreA;
      })
      .slice(0, limit);
  }

  /**
   * 分析文章内容
   */
  private async analyzeArticles(
    articles: ArticleData[],
    options?: AIAnalysisRequest['analysisOptions']
  ): Promise<ArticleSummary[]> {
    const summaries: ArticleSummary[] = [];
    const concurrencyLimit = 2; // 限制并发数

    for (let i = 0; i < articles.length; i += concurrencyLimit) {
      const batch = articles.slice(i, i + concurrencyLimit);

      const batchPromises = batch.map(article =>
        contentAnalysisService.analyzeArticle(article)
      );

      const batchResults = await Promise.allSettled(batchPromises);

      batchResults.forEach(result => {
        if (result.status === 'fulfilled') {
          summaries.push(result.value);
        } else {
          console.error('文章分析失败:', result.reason);
        }
      });

      // 在批次间添加延迟
      if (i + concurrencyLimit < articles.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return summaries;
  }

  /**
   * 生成选题洞察
   */
  private async generateTopicInsights(
    articleSummaries: ArticleSummary[],
    keyword: string
  ): Promise<TopicInsight[]> {
    const openAIService = getOpenAIService();

    const prompt = `
基于以下文章分析结果，请生成关于关键词"${keyword}"的选题洞察：

文章分析数据：
${articleSummaries.map(summary => `
- 标题: ${summary.title}
- 摘要: ${summary.summary}
- 关键要点: ${summary.keyPoints.join(', ')}
- 话题标签: ${summary.topics.join(', ')}
- 关键词: ${summary.keywords.join(', ')}
- 情感倾向: ${summary.sentiment}
- 目标受众: ${summary.targetAudience}
`).join('\\n')}

请生成至少5条结构化的选题洞察，要求：
1. 基于文章内容的具体证据
2. 提供可操作的内容建议
3. 评估实施难度和潜力
4. 考虑目标受众需求
5. 识别不同类型的洞察（趋势、机会、策略、内容、受众）

请按JSON格式回复：
{
  "insights": [
    {
      "trend": "趋势描述（清晰具体）",
      "evidence": ["支撑证据1", "支撑证据2"],
      "confidence": 0.85,
      "recommendation": "具体的内容创作建议",
      "difficulty": "easy/medium/hard",
      "potential": "high/medium/low",
      "category": "trend/opportunity/strategy/content/audience"
    }
  ]
}
`;

    try {
      const result = await openAIService.sendJSONPrompt<{
        insights: TopicInsight[];
      }>(prompt);

      // 确保每个洞察都有唯一ID
      return result.insights.map((insight, index) => ({
        ...insight,
        id: `insight_${Date.now()}_${index}`
      }));

    } catch (error) {
      console.error('洞察生成失败:', error);
      // 返回默认洞察
      return this.getDefaultInsights(keyword, articleSummaries);
    }
  }

  /**
   * 生成情感分析
   */
  private async generateSentimentAnalysis(
    articleSummaries: ArticleSummary[]
  ): Promise<SentimentAnalysis> {
    const openAIService = getOpenAIService();

    const summariesText = articleSummaries.map(summary => summary.summary).join('\\n\\n');

    const prompt = `
基于以下文章摘要，请进行整体情感分析：

文章摘要：
${summariesText}

请按JSON格式回复：
{
  "overall": "整体情感倾向描述",
  "emotionalTone": ["情感调性1", "情感调性2"],
  "engagementLevel": "用户参与度评估",
  "dominantEmotion": "主导情感",
  "sentimentScore": 0.5
}
`;

    try {
      const result = await openAIService.sendJSONPrompt<SentimentAnalysis>(prompt);
      return result;
    } catch (error) {
      console.error('情感分析失败:', error);
      // 计算基础情感分析
      return this.calculateBasicSentiment(articleSummaries);
    }
  }

  /**
   * 识别市场机会
   */
  private async identifyOpportunities(
    articleSummaries: ArticleSummary[],
    keyword: string
  ): Promise<Opportunity[]> {
    const openAIService = getOpenAIService();

    const prompt = `
基于关键词"${keyword}"和相关文章分析，请识别市场机会：

文章分析数据：
${articleSummaries.map(summary => `
- 话题: ${summary.topics.join(', ')}
- 目标受众: ${summary.targetAudience}
- 关键要点: ${summary.keyPoints.join(', ')}
`).join('\\n')}

请按JSON格式回复：
{
  "opportunities": [
    {
      "gap": "市场空白或需求缺口",
      "potential": "发展潜力说明",
      "competition": "low/medium/high",
      "suggestedAction": "建议的具体行动",
      "estimatedDifficulty": "easy/medium/hard",
      "marketSize": "市场规模评估"
    }
  ]
}
`;

    try {
      const result = await openAIService.sendJSONPrompt<{
        opportunities: Opportunity[];
      }>(prompt);
      return result.opportunities;
    } catch (error) {
      console.error('机会识别失败:', error);
      // 返回默认机会分析
      return this.getDefaultOpportunities(keyword, articleSummaries);
    }
  }

  /**
   * 生成基础洞察（兼容性）
   */
  private generateBasicInsights(articles: ArticleData[]): string[] {
    const avgReadCount = Math.round(
      articles.reduce((sum, article) => sum + article.readCount, 0) / articles.length
    );
    const avgLikeCount = Math.round(
      articles.reduce((sum, article) => sum + article.likeCount, 0) / articles.length
    );
    const avgInteractionRate = (
      articles.reduce((sum, article) => sum + article.interactiveRate, 0) / articles.length
    ).toFixed(1);

    const originalCount = articles.filter(article => article.isOriginal).length;
    const originalRate = ((originalCount / articles.length) * 100).toFixed(1);

    // 获取TOP3公众号
    const wxCount = articles.reduce((acc, article) => {
      acc[article.wxName] = (acc[article.wxName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topWx = Object.entries(wxCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([name]) => name);

    const insights = [
      `关键词相关文章共${articles.length}篇`,
      `平均阅读量为${avgReadCount}次，平均点赞数为${avgLikeCount}个`,
      `平均互动率为${avgInteractionRate}%`,
      `原创内容占比为${originalRate}%`,
      `主要内容来源：${topWx.join('、')}`
    ];

    // 根据互动率添加额外洞察
    if (parseFloat(avgInteractionRate) > 10) {
      insights.push('该领域文章互动率较高，用户参与度强');
    } else if (parseFloat(avgInteractionRate) < 5) {
      insights.push('该领域文章互动率偏低，需要优化内容策略');
    }

    return insights;
  }

  /**
   * 计算整体置信度
   */
  private calculateOverallConfidence(insights: TopicInsight[]): number {
    if (insights.length === 0) return 0;

    const totalConfidence = insights.reduce((sum, insight) => sum + insight.confidence, 0);
    return totalConfidence / insights.length;
  }

  /**
   * 估算Token使用量
   */
  private estimateTokenUsage(articleSummaries: ArticleSummary[]): number {
    // 粗略估算：每个字符约0.5个token
    const totalCharacters = articleSummaries.reduce((sum, summary) => {
      return sum + JSON.stringify(summary).length;
    }, 0);

    return Math.round(totalCharacters * 0.5);
  }

  /**
   * 缓存结果
   */
  private async cacheResult(
    searchId: string,
    keyword: string,
    result: AIEnhancedInsights
  ): Promise<void> {
    const cache: AnalysisCache = {
      searchId,
      keyword,
      result,
      createdAt: Date.now(),
      expiresAt: Date.now() + (24 * 60 * 60 * 1000), // 24小时过期
      hitCount: 1
    };

    this.cache.set(searchId, cache);
  }

  /**
   * 更新统计信息
   */
  private updateStatistics(
    result: AIEnhancedInsights | undefined,
    processingTime: number,
    success: boolean
  ): void {
    this.statistics.totalAnalyses++;

    if (success && result) {
      this.statistics.successfulAnalyses++;
      this.statistics.totalTokensUsed += result.metadata.tokensUsed;
      this.statistics.lastAnalysisTime = result.metadata.timestamp;

      // 更新平均处理时间
      const totalProcessingTime = this.statistics.averageProcessingTime * (this.statistics.successfulAnalyses - 1) + processingTime;
      this.statistics.averageProcessingTime = totalProcessingTime / this.statistics.successfulAnalyses;
    } else {
      this.statistics.failedAnalyses++;
    }
  }

  /**
   * 获取默认洞察
   */
  private getDefaultInsights(keyword: string, articleSummaries: ArticleSummary[]): TopicInsight[] {
    const topics = articleSummaries.flatMap(s => s.topics);
    const topicCounts = topics.reduce((acc, topic) => {
      acc[topic] = (acc[topic] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topTopics = Object.entries(topicCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    return topTopics.map((topic, index) => ({
      id: `default_insight_${index}`,
      trend: `关于"${topic[0]}"的内容在相关文章中被频繁提及`,
      evidence: [`多个文章都涉及${topic[0]}相关内容`],
      confidence: 0.6,
      recommendation: `可以考虑深入探讨${topic[0]}的不同角度`,
      difficulty: 'medium',
      potential: 'medium',
      category: 'trend' as const
    }));
  }

  /**
   * 计算基础情感分析
   */
  private calculateBasicSentiment(articleSummaries: ArticleSummary[]): SentimentAnalysis {
    const sentiments = articleSummaries.map(s => s.sentiment);
    const positiveCount = sentiments.filter(s => s === 'positive').length;
    const negativeCount = sentiments.filter(s => s === 'negative').length;
    const neutralCount = sentiments.filter(s === s === 'neutral').length;

    let overall = '中性';
    if (positiveCount > negativeCount && positiveCount > neutralCount) {
      overall = '积极';
    } else if (negativeCount > positiveCount && negativeCount > neutralCount) {
      overall = '消极';
    }

    const sentimentScore = (positiveCount - negativeCount) / articleSummaries.length;

    return {
      overall,
      emotionalTone: ['客观'],
      engagementLevel: '中等',
      dominantEmotion: '理性',
      sentimentScore
    };
  }

  /**
   * 获取默认机会分析
   */
  private getDefaultOpportunities(keyword: string, articleSummaries: ArticleSummary[]): Opportunity[] {
    return [
      {
        gap: `${keyword}相关内容的深度分析仍有空间`,
        potential: '可以通过更深入的分析提供独特价值',
        competition: 'medium',
        suggestedAction: '建议进行更深入的数据分析和案例研究',
        estimatedDifficulty: 'medium',
        marketSize: '中等'
      }
    ];
  }
}

// 导出默认服务实例
export const aiInsightsService = new AIInsightsService();

/**
 * 生成AI洞察（便捷函数）
 */
export async function generateAIInsights(request: AIAnalysisRequest): Promise<AIAnalysisResponse> {
  try {
    const result = await aiInsightsService.generateInsights(request);

    return {
      success: true,
      data: result,
      processingTime: result.metadata.processingTime
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    };
  }
}