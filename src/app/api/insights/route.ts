import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';

// GET - 获取所有洞察报告用于内容创作
export async function GET() {
  try {
    const db = getDatabase();

    // 获取所有已完成的AI分析结果，按时间倒序
    const query = `
      SELECT
        sh.id as search_id,
        sh.keyword,
        sh.search_time,
        sh.total_articles,
        sh.created_at,
        ai.result_data,
        ai.created_at as ai_created_at
      FROM search_history sh
      LEFT JOIN ai_analysis_results ai ON sh.id = ai.search_id
      WHERE sh.total_articles > 0
      ORDER BY sh.search_time DESC, sh.created_at DESC
      LIMIT 50
    `;

    const results = db.prepare(query).all() as Array<{
      search_id: number;
      keyword: string;
      search_time: number;
      total_articles: number;
      created_at: number;
      result_data: string | null;
      ai_created_at: number | null;
    }>;

    // 处理数据，添加AI洞察信息
    const insights = results.map(result => {
      let aiAnalysis = null;

      try {
        if (result.result_data) {
          aiAnalysis = JSON.parse(result.result_data);
        }
      } catch (error) {
        console.error('解析AI分析结果失败:', error);
      }

      // 基于关键词和AI分析生成推荐选题
      const recommendedTopics = generateRecommendedTopics(
        result.keyword,
        aiAnalysis
      );

      return {
        id: result.search_id,
        keyword: result.keyword,
        searchTime: result.search_time,
        totalArticles: result.total_articles,
        createdAt: result.created_at,
        aiAnalysis,
        recommendedTopics,
        // 添加一些便于展示的统计信息
        stats: {
          totalInsights: recommendedTopics.length,
          avgConfidence: recommendedTopics.length > 0
            ? recommendedTopics.reduce((sum: number, topic: any) => sum + topic.confidence, 0) / recommendedTopics.length
            : 0,
          opportunitiesCount: aiAnalysis?.aiAnalysis?.opportunities?.length || 0,
          sentimentScore: aiAnalysis?.aiAnalysis?.sentimentAnalysis?.sentimentScore || 0
        }
      };
    });

    return NextResponse.json({
      success: true,
      data: insights,
      total: insights.length
    });

  } catch (error) {
    console.error('获取洞察报告失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// 根据AI分析结果生成推荐选题
function generateRecommendedTopics(
  keyword: string,
  aiAnalysis: any
): Array<{
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  potential: 'high' | 'medium' | 'low';
  category: string;
  source: 'trend' | 'opportunity' | 'sentiment' | 'keyword';
  confidence: number;
  keywords: string[];
  targetAudience: string;
  estimatedReadTime: number;
}> {
  const topics: Array<{
    title: string;
    description: string;
    difficulty: 'easy' | 'medium' | 'hard';
    potential: 'high' | 'medium' | 'low';
    category: string;
    source: 'trend' | 'opportunity' | 'sentiment' | 'keyword';
    confidence: number;
    keywords: string[];
    targetAudience: string;
    estimatedReadTime: number;
  }> = [];

  // 1. 基于关键词生成基础选题
  topics.push({
    title: `${keyword}的现状分析与发展趋势`,
    description: `深入分析${keyword}当前的发展状况和未来趋势`,
    difficulty: 'medium',
    potential: 'high',
    category: 'trend',
    source: 'keyword',
    confidence: 0.9,
    keywords: [keyword, '发展趋势', '现状分析'],
    targetAudience: '行业从业者',
    estimatedReadTime: 8
  });

  // 2. 基于话题洞察生成选题
  if (aiAnalysis?.aiAnalysis?.topicInsights) {
    const topicInsights = aiAnalysis.aiAnalysis.topicInsights;
    topicInsights
      .filter((insight: any) => insight.confidence > 0.6)
      .slice(0, 3)
      .forEach((insight: any) => {
        topics.push({
          title: insight.recommendation || `${keyword}：${insight.trend}`,
          description: `${insight.trend}\n支撑证据：${insight.evidence ? insight.evidence.slice(0, 2).join('；') : '暂无'}`,
          difficulty: insight.difficulty || 'medium',
          potential: insight.potential || 'medium',
          category: insight.category || 'trend',
          source: 'trend',
          confidence: insight.confidence,
          keywords: [keyword, insight.trend.substring(0, 20)],
          targetAudience: getTargetAudience(insight.category),
          estimatedReadTime: getEstimatedReadTime(insight.difficulty)
        });
      });
  }

  // 3. 基于机会识别生成选题
  if (aiAnalysis?.aiAnalysis?.opportunities) {
    const opportunities = aiAnalysis.aiAnalysis.opportunities;
    opportunities
      .slice(0, 2)
      .forEach((opportunity: any) => {
        topics.push({
          title: `${keyword}：${opportunity.gap}`,
          description: `${opportunity.potential}\n建议行动：${opportunity.suggestedAction}`,
          difficulty: opportunity.estimatedDifficulty || 'medium',
          potential: opportunity.competition === 'low' ? 'high' : opportunity.competition === 'medium' ? 'medium' : 'low',
          category: 'opportunity',
          source: 'opportunity',
          confidence: 0.8,
          keywords: [keyword, '市场机会', opportunity.gap.substring(0, 20)],
          targetAudience: '创业者、投资者',
          estimatedReadTime: 6
        });
      });
  }

  // 4. 基于情感分析生成选题
  if (aiAnalysis?.aiAnalysis?.sentimentAnalysis) {
    const sentiment = aiAnalysis.aiAnalysis.sentimentAnalysis;
    if (sentiment.overall) {
      topics.push({
        title: `${keyword}用户情感${sentiment.overall === 'positive' ? '积极' : sentiment.overall === 'negative' ? '消极' : '中性'}态度分析`,
        description: `主导情感：${sentiment.dominantEmotion}\n情感调性：${sentiment.emotionalTone ? sentiment.emotionalTone.join('、') : '暂无'}`,
        difficulty: 'easy',
        potential: sentiment.overall === 'positive' ? 'high' : 'medium',
        category: 'sentiment',
        source: 'sentiment',
        confidence: Math.abs(sentiment.sentimentScore || 0),
        keywords: [keyword, '用户情感', '态度分析', '舆情监测'],
        targetAudience: '市场分析师、产品经理',
        estimatedReadTime: 5
      });
    }
  }

  return topics.sort((a, b) => b.confidence - a.confidence);
}

// 辅助函数：根据类别确定目标受众
function getTargetAudience(category: string): string {
  switch (category) {
    case 'trend': return '行业从业者';
    case 'opportunity': return '创业者、投资者';
    case 'strategy': return '管理者、决策者';
    case 'content': return '内容创作者、营销人员';
    case 'audience': return '产品经理、用户研究员';
    default: return '行业关注者';
  }
}

// 辅助函数：根据难度估算阅读时间
function getEstimatedReadTime(difficulty: string): number {
  switch (difficulty) {
    case 'easy': return 5;
    case 'medium': return 8;
    case 'hard': return 12;
    default: return 8;
  }
}