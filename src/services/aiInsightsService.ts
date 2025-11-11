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
import { handleError, createAnalysisError } from '@/utils/errorHandler';

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
    const limit = maxArticles || 5; // 固定选择TOP 5篇文章

    // 按互动率和点赞量排序，选择最优质的文章
    return articles
      .sort((a, b) => {
        // 综合评分：互动率60% + 点赞量40%
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
    const concurrencyLimit = 2; // 限制并发数，避免API限流

    console.log(`开始分析 ${articles.length} 篇文章内容`);

    for (let i = 0; i < articles.length; i += concurrencyLimit) {
      const batch = articles.slice(i, i + concurrencyLimit);
      const batchIndex = Math.floor(i / concurrencyLimit) + 1;
      const totalBatches = Math.ceil(articles.length / concurrencyLimit);

      console.log(`处理第 ${batchIndex}/${totalBatches} 批文章`);

      const batchPromises = batch.map((article, index) =>
        this.analyzeSingleArticle(article, i + index + 1, articles.length)
      );

      const batchResults = await Promise.allSettled(batchPromises);

      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          summaries.push(result.value);
          console.log(`文章 ${i + index + 1} 分析完成`);
        } else {
          console.error(`文章 ${i + index + 1} 分析失败:`, result.reason);
          // 失败时创建一个基础的摘要，确保流程继续
          summaries.push(this.createFallbackSummary(batch[index], i + index + 1));
        }
      });

      // 在批次间添加延迟，避免API限流
      if (i + concurrencyLimit < articles.length) {
        console.log('批次间延迟1秒，避免API限流');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log(`文章分析完成，共分析成功 ${summaries.length}/${articles.length} 篇文章`);
    return summaries;
  }

  /**
   * 分析单篇文章内容
   */
  private async analyzeSingleArticle(
    article: ArticleData,
    articleIndex: number,
    totalArticles: number
  ): Promise<ArticleSummary> {
    const openAIService = getOpenAIService();

    const prompt = `
请对以下文章进行深度分析，提取关键信息并生成结构化摘要：

文章信息：
- 标题: ${article.title}
- 公众号: ${article.wxName}
- 发布时间: ${article.publishTime}
- 阅读量: ${article.readCount}
- 点赞量: ${article.likeCount}
- 互动率: ${article.interactiveRate}%

文章内容：
${article.content}

请分析并提取以下信息，严格按照JSON格式回复：
{
  "summary": "文章核心内容摘要（100-200字）",
  "keyPoints": [
    "关键要点1",
    "关键要点2",
    "关键要点3",
    "关键要点4"
  ],
  "highlights": [
    "文章亮点1",
    "文章亮点2",
    "文章亮点3"
  ],
  "sentiment": "positive/neutral/negative",
  "topics": [
    "话题标签1",
    "话题标签2",
    "话题标签3"
  ],
  "keywords": [
    "关键词1",
    "关键词2",
    "关键词3",
    "关键词4"
  ],
  "targetAudience": "目标受众群体描述",
  "contentValue": "high/medium/low"
}

分析要求：
1. 摘要要简明扼要，突出核心观点
2. 关键要点要准确反映文章主要论述
3. 亮点要提取文章中最有价值的信息
4. 话题标签要准确分类
5. 关键词要覆盖文章核心概念
6. 情感倾向要基于整体基调判断
7. 内容价值评估要考虑信息量和实用性
`;

    try {
      const result = await openAIService.sendJSONPrompt<{
        summary: string;
        keyPoints: string[];
        highlights: string[];
        sentiment: 'positive' | 'neutral' | 'negative';
        topics: string[];
        keywords: string[];
        targetAudience: string;
        contentValue: 'high' | 'medium' | 'low';
      }>(prompt);

      return {
        articleId: article.id,
        title: article.title,
        summary: result.summary,
        keyPoints: result.keyPoints,
        highlights: result.highlights,
        sentiment: result.sentiment,
        topics: result.topics,
        keywords: result.keywords,
        targetAudience: result.targetAudience,
        contentValue: result.contentValue
      };

    } catch (error) {
      console.error(`文章 ${articleIndex} AI分析失败:`, error);
      throw error;
    }
  }

  /**
   * 创建备用摘要（AI分析失败时使用）
   */
  private createFallbackSummary(article: ArticleData, articleIndex: number): ArticleSummary {
    // 使用文章内容生成基础摘要
    const content = article.content || '';
    const summary = content.length > 200
      ? content.substring(0, 200) + '...'
      : content;

    // 提取基础关键词（从标题和内容中）
    const title = article.title || '';
    const combinedText = `${title} ${content}`.toLowerCase();

    const keywords: string[] = [];
    if (title) keywords.push(title.substring(0, 10));
    if (combinedText.includes('人工智能')) keywords.push('人工智能');
    if (combinedText.includes('技术')) keywords.push('技术');
    if (combinedText.includes('应用')) keywords.push('应用');

    return {
      articleId: article.id,
      title: article.title,
      summary: summary || '文章内容暂无摘要',
      keyPoints: [
        '基于文章内容的要点1',
        '基于文章内容的要点2'
      ],
      highlights: [
        '文章亮点1',
        '文章亮点2'
      ],
      sentiment: 'neutral',
      topics: ['未分类'],
      keywords: keywords.length > 0 ? keywords : ['未识别'],
      targetAudience: '未知受众',
      contentValue: 'medium'
    };
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
你是一个专业的内容策略分析师。基于以下对TOP ${articleSummaries.length} 篇热门文章的深度分析结果，请为关键词"${keyword}"生成结构化的选题洞察。

## 文章分析数据：
${articleSummaries.map((summary, index) => `
### 文章${index + 1}: ${summary.title}
**核心摘要**: ${summary.summary}
**关键要点**:
${summary.keyPoints.map(point => `• ${point}`).join('\n')}
**文章亮点**:
${summary.highlights.map(highlight => `✨ ${highlight}`).join('\n')}
**情感倾向**: ${summary.sentiment}
**目标受众**: ${summary.targetAudience}
**话题标签**: ${summary.topics.join(', ')}
**关键词**: ${summary.keywords.join(', ')}
**内容价值**: ${summary.contentValue}
`).join('\n')}

## 分析要求：
请生成5-7条高质量的选题洞察，每条洞察必须包含：

1. **趋势识别**: 基于数据分析发现的趋势或模式
2. **证据支撑**: 必须从上述文章分析中找到具体证据
3. **实操建议**: 提供具体可执行的内容创作建议
4. **难度评估**: realistic评估实施难度（考虑时间、资源、技能要求）
5. **潜力评估**: 评估市场潜力和用户需求强度
6. **分类标签**: 准确分类洞察类型

## 洞察类型说明：
- **趋势**: 发现的内容趋势或发展方向
- **机会**: 市场空白或未被满足的需求
- **策略**: 内容创作或运营策略建议
- **内容**: 具体的内容形式或主题建议
- **受众**: 目标用户群体的特征和需求

## 输出格式：
请严格按照以下JSON格式回复：
{
  "insights": [
    {
      "trend": "具体明确的趋势或发现",
      "evidence": [
        "支撑证据1（注明来源文章）",
        "支撑证据2（注明来源文章）",
        "支撑证据3（如有）"
      ],
      "confidence": 0.85,
      "recommendation": "具体可执行的内容创作建议，包含明确的行动步骤",
      "difficulty": "easy/medium/hard",
      "potential": "high/medium/low",
      "category": "trend/opportunity/strategy/content/audience"
    }
  ]
}

## 质量标准：
- 趋势描述要具体明确，避免空泛表述
- 证据必须来自上述文章分析，确保真实可信
- 建议要具体可操作，避免抽象建议
- 难度和潜力评估要客观实际
- 每条洞察都要有独特的价值，避免重复
- 总共生成5-7条高质量洞察

请开始分析并生成洞察结果。
`;

    try {
      const result = await openAIService.sendJSONPrompt<{
        insights: TopicInsight[];
      }>(prompt);

      console.log(`成功生成 ${result.insights.length} 条选题洞察`);

      // 确保每个洞察都有唯一ID并验证数据完整性
      const insights = result.insights.map((insight, index) => ({
        ...insight,
        id: `insight_${Date.now()}_${index}`,
        confidence: typeof insight.confidence === 'number' ?
          Math.min(Math.max(insight.confidence, 0.1), 1.0) : 0.7, // 确保在0.1-1.0范围内
        difficulty: ['easy', 'medium', 'hard'].includes(insight.difficulty) ?
          insight.difficulty : 'medium',
        potential: ['high', 'medium', 'low'].includes(insight.potential) ?
          insight.potential : 'medium',
        category: ['trend', 'opportunity', 'strategy', 'content', 'audience'].includes(insight.category) ?
          insight.category : 'trend'
      }));

      // 按置信度排序，优先显示高质量的洞察
      insights.sort((a, b) => b.confidence - a.confidence);

      console.log(`洞察验证完成，返回 ${insights.length} 条高质量洞察`);
      return insights;

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

    const summariesText = articleSummaries.map(summary => summary.summary).join('\n\n');

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

    const summariesList = articleSummaries.map(summary => `
- 话题: ${summary.topics.join(', ')}
- 目标受众: ${summary.targetAudience}
- 关键要点: ${summary.keyPoints.join(', ')}
`).join('\n');

    const prompt = `
基于关键词"${keyword}"和相关文章分析，请识别市场机会：

文章分析数据：
${summariesList}

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