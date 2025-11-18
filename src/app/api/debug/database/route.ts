import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';

export async function GET() {
  try {
    const db = getDatabase();

    // 检查搜索历史表
    const searchHistory = db.prepare('SELECT id, keyword, total_articles, created_at FROM search_history LIMIT 5').all();

    // 检查AI分析结果表
    const aiAnalysis = db.prepare('SELECT search_id, result_data, created_at FROM ai_analysis_results LIMIT 5').all();

    // 检查话题洞察表
    const topicInsights = db.prepare('SELECT search_id, trend_text, confidence, created_at FROM topic_insights LIMIT 5').all();

    return NextResponse.json({
      success: true,
      data: {
        searchHistory,
        aiAnalysis,
        topicInsights
      }
    });
  } catch (error) {
    console.error('数据库调试失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}