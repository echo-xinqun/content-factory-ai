import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';

// GET - 获取特定洞察报告的选题推荐
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const searchId = parseInt(idParam);

    if (isNaN(searchId)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid insight ID parameter'
        },
        { status: 400 }
      );
    }

    const db = getDatabase();

    // 获取搜索历史信息
    const searchHistoryQuery = db.prepare(`
      SELECT id, keyword, total_articles, search_time, created_at
      FROM search_history
      WHERE id = ?
    `).get(searchId) as {
      id: number;
      keyword: string;
      total_articles: number;
      search_time: number;
      created_at: number;
    } | undefined;

    if (!searchHistoryQuery) {
      return NextResponse.json(
        {
          success: false,
          error: 'Insight not found'
        },
        { status: 404 }
      );
    }

    // 获取AI分析结果
    const aiAnalysisQuery = db.prepare(`
      SELECT result_data, confidence_score, created_at
      FROM ai_analysis_results
      WHERE search_id = ?
      ORDER BY created_at DESC
      LIMIT 1
    `).get(searchId) as {
      result_data: string | null;
      confidence_score: number;
      created_at: number;
    } | undefined;

    let aiAnalysis = null;
    if (aiAnalysisQuery?.result_data) {
      try {
        aiAnalysis = JSON.parse(aiAnalysisQuery.result_data);
      } catch (error) {
        console.error('解析AI分析结果失败:', error);
      }
    }

    // 获取话题洞察
    const topicInsightsQuery = db.prepare(`
      SELECT trend_text, evidence, confidence, recommendation, difficulty, potential, category
      FROM topic_insights
      WHERE search_id = ?
      ORDER BY confidence DESC
    `).all(searchId) as Array<{
      trend_text: string;
      evidence: string | null;
      confidence: number;
      recommendation: string | null;
      difficulty: string;
      potential: string;
      category: string;
    }>;

    // 获取机会识别
    const opportunitiesQuery = db.prepare(`
      SELECT gap_description, potential, competition_level, suggested_action, estimated_difficulty
      FROM ai_opportunities
      WHERE search_id = ?
      ORDER BY confidence DESC
    `).all(searchId) as Array<{
      gap_description: string;
      potential: string | null;
      competition_level: string;
      suggested_action: string | null;
      estimated_difficulty: string;
    }>;

    // 获取情感分析
    const sentimentQuery = db.prepare(`
      SELECT overall_sentiment, dominant_emotion, sentiment_score, emotional_tone
      FROM ai_sentiment_analysis
      WHERE search_id = ?
      ORDER BY created_at DESC
      LIMIT 1
    `).get(searchId) as {
      overall_sentiment: string | null;
      dominant_emotion: string | null;
      sentiment_score: number | null;
      emotional_tone: string | null;
    } | undefined;

    // 生成推荐选题
    const recommendedTopics = generateDetailedTopics(
      searchHistoryQuery.keyword,
      topicInsightsQuery,
      opportunitiesQuery,
      sentimentQuery,
      aiAnalysis
    );

    return NextResponse.json({
      success: true,
      data: {
        insight: {
          id: searchHistoryQuery.id,
          keyword: searchHistoryQuery.keyword,
          totalArticles: searchHistoryQuery.total_articles,
          searchTime: searchHistoryQuery.search_time,
          createdAt: searchHistoryQuery.created_at,
          aiAnalysis,
          stats: {
            totalInsights: topicInsightsQuery.length,
            avgConfidence: topicInsightsQuery.length > 0
              ? topicInsightsQuery.reduce((sum, insight) => sum + insight.confidence, 0) / topicInsightsQuery.length
              : 0,
            opportunitiesCount: opportunitiesQuery.length,
            sentimentScore: sentimentQuery?.sentimentScore || 0
          }
        },
        recommendedTopics,
        topicInsights: topicInsightsQuery.map(insight => ({
          trend: insight.trend_text,
          evidence: insight.evidence ? JSON.parse(insight.evidence) : [],
          confidence: insight.confidence,
          recommendation: insight.recommendation,
          difficulty: insight.difficulty,
          potential: insight.potential,
          category: insight.category
        })),
        opportunities: opportunitiesQuery.map(opp => ({
          gap: opp.gap_description,
          potential: opp.potential,
          competition: opp.competition_level,
          suggestedAction: opp.suggested_action,
          estimatedDifficulty: opp.estimated_difficulty
        })),
        sentimentAnalysis: sentimentQuery ? {
          overall: sentimentQuery.overall_sentiment,
          dominantEmotion: sentimentQuery.dominant_emotion,
          sentimentScore: sentimentQuery.sentiment_score,
          emotionalTone: sentimentQuery.emotional_tone ? JSON.parse(sentimentQuery.emotional_tone) : []
        } : null
      }
    });

  } catch (error) {
    console.error('获取选题推荐失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// 生成详细的推荐选题
function generateDetailedTopics(
  keyword: string,
  topicInsights: any[],
  opportunities: any[],
  sentimentAnalysis: any,
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

  // 1. 基础关键词选题
  topics.push({
    title: `${keyword}现状分析与发展趋势`,
    description: `深入分析${keyword}当前的发展状况、技术特点和未来发展趋势，为行业从业者提供全面的行业洞察。`,
    difficulty: 'medium',
    potential: 'high',
    category: 'trend',
    source: 'keyword',
    confidence: 0.9,
    keywords: [keyword, '发展趋势', '行业分析', '现状调研'],
    targetAudience: '行业从业者',
    estimatedReadTime: 8
  });

  // 2. 基于话题洞察的选题
  topicInsights.slice(0, 4).forEach(insight => {
    topics.push({
      title: insight.recommendation || `${keyword}：${insight.trend_text}`,
      description: `${insight.trend_text}\n支撑证据：${insight.evidence ? JSON.parse(insight.evidence).slice(0, 2).join('；') : '暂无'}`,
      difficulty: insight.difficulty as 'easy' | 'medium' | 'hard',
      potential: insight.potential as 'high' | 'medium' | 'low',
      category: insight.category,
      source: 'trend',
      confidence: insight.confidence,
      keywords: [keyword, insight.trend_text.substring(0, 20)],
      targetAudience: getTargetAudience(insight.category),
      estimatedReadTime: getEstimatedReadTime(insight.difficulty)
    });
  });

  // 3. 基于机会识别的选题
  opportunities.slice(0, 2).forEach(opportunity => {
    topics.push({
      title: `${keyword}：${opportunity.gap_description}`,
      description: `市场机会分析：${opportunity.potential}\n实施建议：${opportunity.suggested_action}`,
      difficulty: opportunity.estimated_difficulty as 'easy' | 'medium' | 'hard',
      potential: opportunity.competition_level === 'low' ? 'high' : opportunity.competition_level === 'medium' ? 'medium' : 'low',
      category: 'opportunity',
      source: 'opportunity',
      confidence: 0.8,
      keywords: [keyword, '市场机会', '商业分析', opportunity.gap_description.substring(0, 20)],
      targetAudience: '创业者、投资者',
      estimatedReadTime: 6
    });
  });

  // 4. 基于情感分析的选题
  if (sentimentAnalysis && sentimentAnalysis.overall_sentiment) {
    const sentimentText = sentimentAnalysis.overall_sentiment === 'positive' ? '积极' :
                         sentimentAnalysis.overall_sentiment === 'negative' ? '消极' : '中性';

    topics.push({
      title: `${keyword}用户情感${sentimentText}态度深度分析`,
      description: `基于用户数据分析，${keyword}领域呈现${sentimentText}态度，主导情感为${sentimentAnalysis.dominant_emotion}。情感调性包括：${sentimentAnalysis.emotional_tone ? JSON.parse(sentimentAnalysis.emotional_tone).join('、') : '暂无'}`,
      difficulty: 'easy',
      potential: sentimentAnalysis.overall_sentiment === 'positive' ? 'high' : 'medium',
      category: 'sentiment',
      source: 'sentiment',
      confidence: Math.abs(sentimentAnalysis.sentiment_score || 0),
      keywords: [keyword, '用户情感', '态度分析', '舆情监测'],
      targetAudience: '市场分析师、产品经理',
      estimatedReadTime: 5
    });
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