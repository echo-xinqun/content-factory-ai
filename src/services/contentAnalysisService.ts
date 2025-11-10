// 文章内容分析服务

import { ArticleData } from '@/types/api';
import { ArticleSummary, SentimentAnalysis, ArticleAnalysisResult } from '@/types/aiInsights';
import { IContentAnalysisService } from '@/types/analysisTypes';
import { getOpenAIService } from './openAIService';

export class ContentAnalysisService implements IContentAnalysisService {
  private openAIService = getOpenAIService();

  /**
   * 分析单篇文章
   */
  async analyzeArticle(article: ArticleData): Promise<ArticleSummary> {
    const startTime = Date.now();

    try {
      const prompt = this.buildArticleAnalysisPrompt(article);

      const result = await this.openAIService.sendJSONPrompt<{
        summary: string;
        keyPoints: string[];
        highlights: string[];
        sentiment: 'positive' | 'neutral' | 'negative';
        topics: string[];
        keywords: string[];
        targetAudience: string;
        contentValue: 'high' | 'medium' | 'low';
      }>(prompt);

      const processingTime = Date.now() - startTime;

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
      console.error(`文章分析失败: ${article.title}`, error);
      throw new Error(`文章分析失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 批量分析文章
   */
  async analyzeBatch(articles: ArticleData[]): Promise<ArticleSummary[]> {
    const results: ArticleSummary[] = [];
    const errors: string[] = [];

    // 限制并发数量，避免API调用过快
    const concurrencyLimit = 3;
    const chunks = this.chunkArray(articles, concurrencyLimit);

    for (const chunk of chunks) {
      const chunkPromises = chunk.map(async (article) => {
        try {
          const result = await this.analyzeArticle(article);
          return { success: true, result };
        } catch (error) {
          const errorMessage = `文章分析失败: ${article.title} - ${error instanceof Error ? error.message : '未知错误'}`;
          errors.push(errorMessage);
          return { success: false, error: errorMessage };
        }
      });

      const chunkResults = await Promise.all(chunkPromises);

      // 收集成功的分析结果
      chunkResults.forEach(result => {
        if (result.success) {
          results.push(result.result);
        }
      });

      // 在批次之间添加小延迟，避免频率限制
      if (chunks.indexOf(chunk) < chunks.length - 1) {
        await this.delay(1000);
      }
    }

    if (errors.length > 0) {
      console.warn('批量分析中出现部分错误:', errors);
    }

    return results;
  }

  /**
   * 提取关键词
   */
  async extractKeywords(content: string): Promise<string[]> {
    const prompt = `
请从以下内容中提取5-10个最重要的关键词，要求：
1. 关键词应该是核心概念或主题
2. 避免过于常见的词汇
3. 按重要性排序
4. 每个关键词2-5个字

内容：
${content.substring(0, 2000)}${content.length > 2000 ? '...' : ''}

请按JSON格式回复：
{
  "keywords": ["关键词1", "关键词2", "关键词3", "关键词4", "关键词5"]
}
`;

    try {
      const result = await this.openAIService.sendJSONPrompt<{ keywords: string[] }>(prompt);
      return result.keywords;
    } catch (error) {
      console.error('关键词提取失败:', error);
      // 返回空数组作为降级处理
      return [];
    }
  }

  /**
   * 生成摘要
   */
  async generateSummary(content: string): Promise<string> {
    const prompt = `
请为以下内容生成一个简洁的摘要，要求：
1. 150字以内
2. 突出核心观点和价值
3. 语言简洁明了
4. 保持客观性

内容：
${content.substring(0, 3000)}${content.length > 3000 ? '...' : ''}

摘要：
`;

    try {
      const summary = await this.openAIService.sendPrompt(prompt);
      return summary.trim();
    } catch (error) {
      console.error('摘要生成失败:', error);
      // 返回截取的内容作为降级处理
      return content.substring(0, 150) + (content.length > 150 ? '...' : '');
    }
  }

  /**
   * 分析情感倾向
   */
  async analyzeSentiment(content: string): Promise<SentimentAnalysis> {
    const prompt = `
请分析以下内容的情感倾向，要求：
1. 评估整体情感（积极/中性/消极）
2. 识别情感调性（如：理性、感性、激励、警示等）
3. 评估用户参与度（高/中/低）
4. 确定主导情感
5. 给出情感评分（-1到1之间，-1最消极，1最积极）

内容：
${content.substring(0, 2000)}${content.length > 2000 ? '...' : ''}

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
      const result = await this.openAIService.sendJSONPrompt<SentimentAnalysis>(prompt);
      return result;
    } catch (error) {
      console.error('情感分析失败:', error);
      // 返回中性分析作为降级处理
      return {
        overall: '中性',
        emotionalTone: ['客观'],
        engagementLevel: '中等',
        dominantEmotion: '理性',
        sentimentScore: 0
      };
    }
  }

  /**
   * 分析文章质量
   */
  async analyzeQuality(article: ArticleData): Promise<{
    score: number; // 0-100
    strengths: string[];
    weaknesses: string[];
    suggestions: string[];
  }> {
    const prompt = `
请评估以下文章的质量，包括：
1. 内容质量评分（0-100分）
2. 文章优点（3-5个）
3. 文章不足（2-3个）
4. 改进建议（2-3个）

文章标题：${article.title}
文章内容：${article.content.substring(0, 2000)}${article.content.length > 2000 ? '...' : ''}
阅读量：${article.readCount}
点赞量：${article.likeCount}
发布者：${article.wxName}

请按JSON格式回复：
{
  "score": 85,
  "strengths": ["优点1", "优点2", "优点3"],
  "weaknesses": ["不足1", "不足2"],
  "suggestions": ["建议1", "建议2"]
}
`;

    try {
      const result = await this.openAIService.sendJSONPrompt<{
        score: number;
        strengths: string[];
        weaknesses: string[];
        suggestions: string[];
      }>(prompt);

      return {
        score: Math.min(100, Math.max(0, result.score)),
        strengths: result.strengths,
        weaknesses: result.weaknesses,
        suggestions: result.suggestions
      };
    } catch (error) {
      console.error('文章质量分析失败:', error);
      // 返回默认评估作为降级处理
      return {
        score: 70,
        strengths: ['内容完整'],
        weaknesses: ['分析有限'],
        suggestions: ['可进一步优化']
      };
    }
  }

  /**
   * 构建文章分析提示词
   */
  private buildArticleAnalysisPrompt(article: ArticleData): string {
    return `
请分析以下文章，提供结构化的分析结果：

文章标题：${article.title}
文章内容：${article.content.substring(0, 3000)}${article.content.length > 3000 ? '...' : ''}
发布者：${article.wxName}
阅读量：${article.readCount}
点赞量：${article.likeCount}
互动率：${article.interactiveRate}%
发布时间：${article.publishTime}

请按以下JSON格式回复：
{
  "summary": "文章摘要（150字以内，突出核心观点和价值）",
  "keyPoints": ["关键要点1", "关键要点2", "关键要点3", "关键要点4"],
  "highlights": ["文章亮点1", "文章亮点2", "文章亮点3"],
  "sentiment": "positive/neutral/negative",
  "topics": ["主题1", "主题2", "主题3", "主题4"],
  "keywords": ["关键词1", "关键词2", "关键词3", "关键词4", "关键词5"],
  "targetAudience": "目标受众描述（如：创业者、产品经理、技术爱好者等）",
  "contentValue": "high/medium/low"
}

分析要求：
1. summary要简明扼要，突出核心价值
2. keyPoints提取文章的核心观点和关键信息
3. highlights识别文章的亮点和创新点
4. sentiment基于内容情感倾向判断
5. topics识别文章涉及的主要话题领域
6. keywords提取最具代表性的关键词
7. targetAudience判断最适合的读者群体
8. contentValue基于内容的深度、独特性和实用性评估
`;
  }

  /**
   * 数组分块
   */
  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  /**
   * 延迟函数
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 验证分析结果
   */
  private validateAnalysisResult(result: any): boolean {
    return (
      result &&
      typeof result.summary === 'string' &&
      Array.isArray(result.keyPoints) &&
      Array.isArray(result.highlights) &&
      ['positive', 'neutral', 'negative'].includes(result.sentiment) &&
      Array.isArray(result.topics) &&
      Array.isArray(result.keywords) &&
      typeof result.targetAudience === 'string' &&
      ['high', 'medium', 'low'].includes(result.contentValue)
    );
  }
}

// 导出默认实例
export const contentAnalysisService = new ContentAnalysisService();

/**
 * 分析文章（便捷函数）
 */
export async function analyzeArticle(article: ArticleData): Promise<ArticleAnalysisResult> {
  const startTime = Date.now();

  try {
    const summary = await contentAnalysisService.analyzeArticle(article);
    const processingTime = Date.now() - startTime;

    return {
      success: true,
      summary,
      processingTime
    };
  } catch (error) {
    const processingTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : '未知错误';

    return {
      success: false,
      error: errorMessage,
      processingTime
    };
  }
}

/**
 * 批量分析文章（便捷函数）
 */
export async function analyzeBatchArticles(
  articles: ArticleData[],
  onProgress?: (completed: number, total: number) => void
): Promise<{
  totalArticles: number;
  successfulAnalyses: number;
  failedAnalyses: number;
  results: ArticleAnalysisResult[];
  totalProcessingTime: number;
}> {
  const startTime = Date.now();
  const results: ArticleAnalysisResult[] = [];

  let completed = 0;
  const total = Math.min(articles.length, 10); // 限制最大分析数量

  // 选择文章进行分析（优先选择高互动的文章）
  const selectedArticles = articles
    .sort((a, b) => b.interactiveRate - a.interactiveRate)
    .slice(0, total);

  for (const article of selectedArticles) {
    const result = await analyzeArticle(article);
    results.push(result);

    completed++;
    onProgress?.(completed, total);

    // 在请求之间添加小延迟
    if (completed < total) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  const successfulAnalyses = results.filter(r => r.success).length;
  const failedAnalyses = results.filter(r => !r.success).length;
  const totalProcessingTime = Date.now() - startTime;

  return {
    totalArticles: selectedArticles.length,
    successfulAnalyses,
    failedAnalyses,
    results,
    totalProcessingTime
  };
}