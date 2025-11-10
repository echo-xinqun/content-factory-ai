import { db } from '@/lib/db';
import { ArticleData, WordCloudData } from '@/types/api';
import { AIEnhancedInsights, TopicInsight, SentimentAnalysis, Opportunity, ArticleSummary } from '@/types/aiInsights';

// 搜索历史记录类型
export interface SearchHistory {
  id: number;
  keyword: string;
  searchTime: number;
  totalArticles: number;
  avgReadCount: number;
  avgLikeCount: number;
  avgInteractionRate: number;
  createdAt: number;
  updatedAt: number;
}

// 搜索记录详情（包含文章列表）
export interface SearchHistoryDetail extends SearchHistory {
  articles: ArticleData[];
  wordCloud: WordCloudData[];
  insights: string[];
}

// 创建或更新搜索记录
export function createOrUpdateSearchRecord(keyword: string, articles: ArticleData[], wordCloud: WordCloudData[], insights: string[]): number {
  const transaction = db.transaction(() => {
    const searchTime = Date.now();
    const totalArticles = articles.length;
    const avgReadCount = articles.length > 0 ? Math.round(articles.reduce((sum, a) => sum + a.readCount, 0) / articles.length) : 0;
    const avgLikeCount = articles.length > 0 ? Math.round(articles.reduce((sum, a) => sum + a.likeCount, 0) / articles.length) : 0;
    const avgInteractionRate = articles.length > 0 ?
      Math.round((articles.reduce((sum, a) => sum + a.interactiveRate, 0) / articles.length) * 10) / 10 : 0;

    // 尝试更新现有记录
    const updateStmt = db.prepare(`
      UPDATE search_history
      SET search_time = ?, total_articles = ?, avg_read_count = ?,
          avg_like_count = ?, avg_interaction_rate = ?, updated_at = ?
      WHERE keyword = ?
    `);

    const updateResult = updateStmt.run(
      searchTime, totalArticles, avgReadCount, avgLikeCount, avgInteractionRate, searchTime, keyword
    );

    let searchId: number;

    if (updateResult.changes > 0) {
      // 更新了现有记录，获取ID
      const record = db.prepare('SELECT id FROM search_history WHERE keyword = ?').get(keyword) as { id: number };
      searchId = record.id;

      // 删除旧的关联数据
      db.prepare('DELETE FROM articles WHERE search_id = ?').run(searchId);
      db.prepare('DELETE FROM word_clouds WHERE search_id = ?').run(searchId);
      db.prepare('DELETE FROM insights WHERE search_id = ?').run(searchId);
    } else {
      // 插入新记录
      const insertStmt = db.prepare(`
        INSERT INTO search_history (keyword, search_time, total_articles, avg_read_count, avg_like_count, avg_interaction_rate)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      const insertResult = insertStmt.run(keyword, searchTime, totalArticles, avgReadCount, avgLikeCount, avgInteractionRate);
      searchId = insertResult.lastInsertRowid as number;
    }

    // 插入文章数据
    const articleStmt = db.prepare(`
      INSERT INTO articles (search_id, article_id, title, content, summary, wx_name, publish_time,
                           read_count, like_count, view_count, interactive_rate, url, avatar,
                           classify, is_original)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const article of articles) {
      articleStmt.run(
        searchId, article.id, article.title, article.content, article.summary,
        article.wxName, article.publishTime, article.readCount, article.likeCount,
        article.viewCount, article.interactiveRate, article.url, article.avatar,
        article.classify, article.isOriginal ? 1 : 0
      );
    }

    // 插入词云数据
    const wordCloudStmt = db.prepare(`
      INSERT INTO word_clouds (search_id, word, count)
      VALUES (?, ?, ?)
    `);

    for (const word of wordCloud) {
      wordCloudStmt.run(searchId, word.text, word.count);
    }

    // 插入洞察数据
    const insightStmt = db.prepare(`
      INSERT INTO insights (search_id, insight)
      VALUES (?, ?)
    `);

    for (const insight of insights) {
      insightStmt.run(searchId, insight);
    }

    return searchId;
  });

  return transaction();
}

// 获取搜索历史列表
export function getSearchHistoryList(limit: number = 30): SearchHistory[] {
  const stmt = db.prepare(`
    SELECT id, keyword, search_time as searchTime, total_articles as totalArticles,
           avg_read_count as avgReadCount, avg_like_count as avgLikeCount,
           avg_interaction_rate as avgInteractionRate, created_at as createdAt, updated_at as updatedAt
    FROM search_history
    ORDER BY search_time DESC
    LIMIT ?
  `);

  return stmt.all(limit) as SearchHistory[];
}

// 获取搜索记录详情
export function getSearchHistoryDetail(id: number): SearchHistoryDetail | null {
  // 获取基本信息
  const basicInfo = db.prepare(`
    SELECT id, keyword, search_time as searchTime, total_articles as totalArticles,
           avg_read_count as avgReadCount, avg_like_count as avgLikeCount,
           avg_interaction_rate as avgInteractionRate, created_at as createdAt, updated_at as updatedAt
    FROM search_history
    WHERE id = ?
  `).get(id) as SearchHistoryDetail;

  if (!basicInfo) {
    return null;
  }

  // 获取文章列表
  const articles = db.prepare(`
    SELECT article_id as id, title, content, summary, wx_name as wxName, publish_time as publishTime,
           read_count as readCount, like_count as likeCount, view_count as viewCount,
           interactive_rate as interactiveRate, url, avatar, classify, is_original as isOriginal
    FROM articles
    WHERE search_id = ?
    ORDER BY read_count DESC
  `).all(id) as ArticleData[];

  // 转换is_original字段
  articles.forEach(article => {
    article.isOriginal = Boolean(article.isOriginal);
  });

  // 获取词云数据
  const wordCloud = db.prepare(`
    SELECT word as text, count
    FROM word_clouds
    WHERE search_id = ?
    ORDER BY count DESC
  `).all(id) as WordCloudData[];

  // 获取洞察数据
  const insights = db.prepare(`
    SELECT insight
    FROM insights
    WHERE search_id = ?
    ORDER BY id ASC
  `).all(id).map(row => (row as { insight: string }).insight);

  basicInfo.articles = articles;
  basicInfo.wordCloud = wordCloud;
  basicInfo.insights = insights;

  return basicInfo;
}

// 删除搜索记录
export function deleteSearchHistory(id: number): boolean {
  const stmt = db.prepare('DELETE FROM search_history WHERE id = ?');
  const result = stmt.run(id);
  return result.changes > 0;
}

// 搜索历史记录
export function searchHistoryRecords(keyword: string, limit: number = 30): SearchHistory[] {
  const stmt = db.prepare(`
    SELECT id, keyword, search_time as searchTime, total_articles as totalArticles,
           avg_read_count as avgReadCount, avg_like_count as avgLikeCount,
           avg_interaction_rate as avgInteractionRate, created_at as createdAt, updated_at as updatedAt
    FROM search_history
    WHERE keyword LIKE ?
    ORDER BY search_time DESC
    LIMIT ?
  `);

  return stmt.all(`%${keyword}%`, limit) as SearchHistory[];
}

// 获取热门关键词
export function getPopularKeywords(limit: number = 10): { keyword: string; count: number }[] {
  const stmt = db.prepare(`
    SELECT keyword, COUNT(*) as count
    FROM search_history
    GROUP BY keyword
    ORDER BY count DESC
    LIMIT ?
  `);

  return stmt.all(limit) as { keyword: string; count: number }[];
}

// ============ AI分析相关数据库操作 ============

// 保存AI分析结果
export function saveAIAnalysisResult(searchId: number, insights: AIEnhancedInsights): number {
  const transaction = db.transaction(() => {
    // 保存AI分析结果主记录
    const resultStmt = db.prepare(`
      INSERT INTO ai_analysis_results (
        search_id, analysis_type, result_data, confidence_score, processing_time,
        ai_model, articles_analyzed, tokens_used, version
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = resultStmt.run(
      searchId,
      'enhanced',
      JSON.stringify(insights),
      insights.metadata.confidence,
      insights.metadata.processingTime,
      insights.metadata.aiModel,
      insights.metadata.articlesAnalyzed,
      insights.metadata.tokensUsed,
      insights.metadata.version
    );

    const analysisId = result.lastInsertRowid as number;

    // 保存选题洞察
    if (insights.aiAnalysis?.topicInsights) {
      const insightStmt = db.prepare(`
        INSERT INTO topic_insights (
          search_id, insight_id, trend_text, evidence, confidence, recommendation,
          difficulty, potential, category
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const insight of insights.aiAnalysis.topicInsights) {
        insightStmt.run(
          searchId,
          insight.id,
          insight.trend,
          JSON.stringify(insight.evidence),
          insight.confidence,
          insight.recommendation,
          insight.difficulty,
          insight.potential,
          insight.category
        );
      }
    }

    // 保存文章AI摘要
    if (insights.aiAnalysis?.articleSummaries) {
      const summaryStmt = db.prepare(`
        INSERT INTO article_ai_summaries (
          search_id, article_id, summary, key_points, highlights, sentiment,
          topics, keywords, target_audience, content_value, confidence, processing_time
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const summary of insights.aiAnalysis.articleSummaries) {
        summaryStmt.run(
          searchId,
          summary.articleId,
          summary.summary,
          JSON.stringify(summary.keyPoints),
          JSON.stringify(summary.highlights),
          summary.sentiment,
          JSON.stringify(summary.topics),
          JSON.stringify(summary.keywords),
          summary.targetAudience,
          summary.contentValue,
          0.8, // 默认置信度
          0 // 默认处理时间
        );
      }
    }

    // 保存情感分析
    if (insights.aiAnalysis?.sentimentAnalysis) {
      const sentimentStmt = db.prepare(`
        INSERT INTO ai_sentiment_analysis (
          search_id, overall_sentiment, emotional_tone, engagement_level,
          dominant_emotion, sentiment_score, confidence
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      sentimentStmt.run(
        searchId,
        insights.aiAnalysis.sentimentAnalysis.overall,
        JSON.stringify(insights.aiAnalysis.sentimentAnalysis.emotionalTone),
        insights.aiAnalysis.sentimentAnalysis.engagementLevel,
        insights.aiAnalysis.sentimentAnalysis.dominantEmotion,
        insights.aiAnalysis.sentimentAnalysis.sentimentScore,
        0.8 // 默认置信度
      );
    }

    // 保存机会识别
    if (insights.aiAnalysis?.opportunities) {
      const opportunityStmt = db.prepare(`
        INSERT INTO ai_opportunities (
          search_id, gap_description, potential, competition_level,
          suggested_action, estimated_difficulty, market_size, confidence
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const opportunity of insights.aiAnalysis.opportunities) {
        opportunityStmt.run(
          searchId,
          opportunity.gap,
          opportunity.potential,
          opportunity.competition,
          opportunity.suggestedAction,
          opportunity.estimatedDifficulty,
          opportunity.marketSize,
          0.7 // 默认置信度
        );
      }
    }

    return analysisId;
  });

  return transaction();
}

// 获取AI分析结果
export function getAIAnalysisResult(searchId: number): AIEnhancedInsights | null {
  // 获取主要分析结果
  const resultQuery = db.prepare(`
    SELECT result_data, confidence_score, processing_time, ai_model,
           articles_analyzed, tokens_used, version, created_at
    FROM ai_analysis_results
    WHERE search_id = ?
    ORDER BY created_at DESC
    LIMIT 1
  `);

  const result = resultQuery.get(searchId) as any;
  if (!result) {
    return null;
  }

  try {
    return JSON.parse(result.result_data) as AIEnhancedInsights;
  } catch (error) {
    console.error('Failed to parse AI analysis result:', error);
    return null;
  }
}

// 检查是否有缓存的AI分析结果
export function hasAIAnalysisResult(searchId: number): boolean {
  const stmt = db.prepare(`
    SELECT COUNT(*) as count FROM ai_analysis_results WHERE search_id = ?
  `);

  const result = stmt.get(searchId) as { count: number };
  return result.count > 0;
}

// 获取选题洞察
export function getTopicInsights(searchId: number): TopicInsight[] {
  const stmt = db.prepare(`
    SELECT insight_id as id, trend_text as trend, evidence, confidence,
           recommendation, difficulty, potential, category
    FROM topic_insights
    WHERE search_id = ?
    ORDER BY confidence DESC, id ASC
  `);

  const results = stmt.all(searchId) as any[];
  return results.map(row => ({
    ...row,
    evidence: JSON.parse(row.evidence || '[]')
  }));
}

// 获取文章AI摘要
export function getArticleAISummaries(searchId: number): ArticleSummary[] {
  const stmt = db.prepare(`
    SELECT article_id as articleId, title, summary, key_points, highlights,
           sentiment, topics, keywords, target_audience as targetAudience,
           content_value as contentValue, confidence
    FROM article_ai_summaries
    LEFT JOIN articles ON article_ai_summaries.article_id = articles.article_id
    WHERE article_ai_summaries.search_id = ?
    ORDER BY confidence DESC
  `);

  const results = stmt.all(searchId) as any[];
  return results.map(row => ({
    articleId: row.articleId,
    title: row.title,
    summary: row.summary,
    keyPoints: JSON.parse(row.key_points || '[]'),
    highlights: JSON.parse(row.highlights || '[]'),
    sentiment: row.sentiment,
    topics: JSON.parse(row.topics || '[]'),
    keywords: JSON.parse(row.keywords || '[]'),
    targetAudience: row.targetAudience,
    contentValue: row.contentValue
  }));
}

// 获取情感分析
export function getSentimentAnalysis(searchId: number): SentimentAnalysis | null {
  const stmt = db.prepare(`
    SELECT overall_sentiment as overall, emotional_tone, engagement_level as engagementLevel,
           dominant_emotion as dominantEmotion, sentiment_score as sentimentScore, confidence
    FROM ai_sentiment_analysis
    WHERE search_id = ?
    ORDER BY created_at DESC
    LIMIT 1
  `);

  const result = stmt.get(searchId) as any;
  if (!result) {
    return null;
  }

  return {
    overall: result.overall,
    emotionalTone: JSON.parse(result.emotional_tone || '[]'),
    engagementLevel: result.engagementLevel,
    dominantEmotion: result.dominantEmotion,
    sentimentScore: result.sentimentScore
  };
}

// 获取机会识别
export function getOpportunities(searchId: number): Opportunity[] {
  const stmt = db.prepare(`
    SELECT gap_description as gap, potential, competition_level as competition,
           suggested_action as suggestedAction, estimated_difficulty as estimatedDifficulty,
           market_size as marketSize, confidence
    FROM ai_opportunities
    WHERE search_id = ?
    ORDER BY confidence DESC
  `);

  return stmt.all(searchId) as Opportunity[];
}

// 保存AI分析缓存
export function saveAIAnalysisCache(searchId: string, keyword: string, insights: AIEnhancedInsights, ttl: number = 24 * 60 * 60 * 1000): void {
  const expiresAt = Date.now() + ttl;

  const stmt = db.prepare(`
    INSERT OR REPLACE INTO ai_analysis_cache (search_id, keyword, result_data, created_at, expires_at, last_accessed)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    searchId,
    keyword,
    JSON.stringify(insights),
    Date.now(),
    expiresAt,
    Date.now()
  );
}

// 获取AI分析缓存
export function getAIAnalysisCache(searchId: string): AIEnhancedInsights | null {
  // 先更新访问时间
  const updateAccessStmt = db.prepare(`
    UPDATE ai_analysis_cache
    SET last_accessed = ?, hit_count = hit_count + 1
    WHERE search_id = ? AND expires_at > ?
  `);

  const now = Date.now();
  updateAccessStmt.run(now, searchId, now);

  // 获取缓存数据
  const stmt = db.prepare(`
    SELECT result_data FROM ai_analysis_cache
    WHERE search_id = ? AND expires_at > ?
  `);

  const result = stmt.get(searchId, now) as any;
  if (!result) {
    return null;
  }

  try {
    return JSON.parse(result.result_data) as AIEnhancedInsights;
  } catch (error) {
    console.error('Failed to parse cached AI analysis result:', error);
    return null;
  }
}

// 清理AI分析缓存
export function clearAIAnalysisCache(searchId?: string): number {
  if (searchId) {
    const stmt = db.prepare('DELETE FROM ai_analysis_cache WHERE search_id = ?');
    const result = stmt.run(searchId);
    return result.changes;
  } else {
    const stmt = db.prepare('DELETE FROM ai_analysis_cache');
    const result = stmt.run();
    return result.changes;
  }
}

// 保存AI分析任务状态
export function saveAIAnalysisTask(taskId: string, searchId: number, keyword: string, status: string, progress: number = 0): void {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO ai_analysis_tasks (id, search_id, keyword, status, progress, start_time)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  stmt.run(taskId, searchId, keyword, status, progress, Date.now());
}

// 更新AI分析任务状态
export function updateAIAnalysisTask(taskId: string, updates: { status?: string; progress?: number; end_time?: number; error_message?: string }): void {
  const setClause = [];
  const values = [];

  if (updates.status !== undefined) {
    setClause.push('status = ?');
    values.push(updates.status);
  }

  if (updates.progress !== undefined) {
    setClause.push('progress = ?');
    values.push(updates.progress);
  }

  if (updates.end_time !== undefined) {
    setClause.push('end_time = ?');
    values.push(updates.end_time);
  }

  if (updates.error_message !== undefined) {
    setClause.push('error_message = ?');
    values.push(updates.error_message);
  }

  if (setClause.length === 0) {
    return;
  }

  values.push(taskId);

  const stmt = db.prepare(`
    UPDATE ai_analysis_tasks
    SET ${setClause.join(', ')}
    WHERE id = ?
  `);

  stmt.run(...values);
}

// 获取AI分析任务状态
export function getAIAnalysisTask(taskId: string): any | null {
  const stmt = db.prepare(`
    SELECT id, search_id as searchId, keyword, status, progress, start_time as startTime,
           end_time as endTime, error_message as errorMessage
    FROM ai_analysis_tasks
    WHERE id = ?
  `);

  return stmt.get(taskId) || null;
}

// 删除AI分析任务
export function deleteAIAnalysisTask(taskId: string): boolean {
  const stmt = db.prepare('DELETE FROM ai_analysis_tasks WHERE id = ?');
  const result = stmt.run(taskId);
  return result.changes > 0;
}