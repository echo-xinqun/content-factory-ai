import { NextRequest, NextResponse } from 'next/server';
import {
  generateAIInsights,
  performEnhancedAnalysis
} from '@/services/enhancedAnalysisService';
import {
  getAIAnalysisResult,
  saveAIAnalysisResult,
  hasAIAnalysisResult,
  getSearchHistoryDetail
} from '@/models/SearchHistory';
import { AIAnalysisRequest, AIAnalysisResponse } from '@/types/aiInsights';

// POST - 生成AI洞察
export async function POST(request: NextRequest) {
  try {
    const body: AIAnalysisRequest = await request.json();

    // 验证请求参数
    const { searchId, keyword, articles, analysisOptions } = body;

    if (!searchId || !keyword || !articles) {
      return NextResponse.json(
        {
          success: false,
          error: '缺少必要参数：searchId, keyword, articles'
        },
        { status: 400 }
      );
    }

    // 验证文章数据
    if (!Array.isArray(articles) || articles.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: '文章数据不能为空且必须是数组'
        },
        { status: 400 }
      );
    }

    // 验证searchId是否为有效数字
    const numericSearchId = parseInt(searchId);
    if (isNaN(numericSearchId)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid searchId parameter'
        },
        { status: 400 }
      );
    }

    // 检查搜索记录是否存在
    const searchRecord = getSearchHistoryDetail(numericSearchId);
    if (!searchRecord) {
      return NextResponse.json(
        {
          success: false,
          error: '搜索记录不存在'
        },
        { status: 404 }
      );
    }

    // 检查是否已有AI分析结果
    const existingResult = getAIAnalysisResult(numericSearchId);
    if (existingResult && !analysisOptions?.forceRefresh) {
      console.log(`Returning cached AI analysis for searchId: ${searchId}`);
      return NextResponse.json({
        success: true,
        data: existingResult,
        cached: true,
        processingTime: existingResult.metadata.processingTime
      });
    }

    // 执行AI分析
    console.log(`Starting AI analysis for keyword: ${keyword}, articles: ${articles.length}`);
    const startTime = Date.now();

    const result = await performEnhancedAnalysis(
      searchId,
      keyword,
      articles,
      {
        config: analysisOptions,
        onComplete: (result, error) => {
          if (error) {
            console.error('AI analysis failed:', error);
          } else {
            console.log(`AI analysis completed in ${Date.now() - startTime}ms`);
          }
        }
      }
    );

    // 保存分析结果到数据库
    try {
      saveAIAnalysisResult(numericSearchId, result);
      console.log(`AI analysis result saved for searchId: ${searchId}`);
    } catch (saveError) {
      console.error('Failed to save AI analysis result:', saveError);
      // 不影响返回结果，但记录错误
    }

    const totalProcessingTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      data: result,
      cached: false,
      processingTime: totalProcessingTime
    });

  } catch (error) {
    console.error('AI analysis generation failed:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined
      },
      { status: 500 }
    );
  }
}

// GET - 获取AI分析状态
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const searchId = searchParams.get('searchId');

    if (!searchId) {
      return NextResponse.json(
        {
          success: false,
          error: '缺少searchId参数'
        },
        { status: 400 }
      );
    }

    const numericSearchId = parseInt(searchId);
    if (isNaN(numericSearchId)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid searchId parameter'
        },
        { status: 400 }
      );
    }

    // 检查是否有AI分析结果
    const hasResult = hasAIAnalysisResult(numericSearchId);

    return NextResponse.json({
      success: true,
      hasAnalysis: hasResult,
      searchId: numericSearchId
    });

  } catch (error) {
    console.error('Get AI analysis status failed:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}