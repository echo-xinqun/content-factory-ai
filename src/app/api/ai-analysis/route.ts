import { NextRequest, NextResponse } from 'next/server';
import { generateAIInsights } from '@/services/aiInsightsService';
import { AIAnalysisRequest } from '@/types/aiInsights';
import { AnalysisErrorType, AnalysisError } from '@/types/analysisTypes';
import { saveAIAnalysisResult } from '@/models/SearchHistory';

// 错误处理工具函数
function createErrorResponse(error: AnalysisError, status: number) {
  return NextResponse.json(
    {
      success: false,
      error: error.message,
      errorType: error.type,
      timestamp: error.timestamp,
      retryable: error.retryable,
      details: process.env.NODE_ENV === 'development' ? error.details : undefined
    },
    { status }
  );
}

// 创建标准化的错误对象
function createAnalysisError(
  type: AnalysisErrorType,
  message: string,
  details?: any,
  retryable: boolean = false
): AnalysisError {
  return {
    type,
    message,
    details,
    timestamp: Date.now(),
    retryable
  };
}

// 验证请求参数
function validateRequest(body: AIAnalysisRequest): { isValid: boolean; error?: AnalysisError } {
  const { keyword, articles } = body;

  if (!keyword || typeof keyword !== 'string' || keyword.trim().length === 0) {
    return {
      isValid: false,
      error: createAnalysisError(
        AnalysisErrorType.VALIDATION_ERROR,
        '关键词不能为空且必须是字符串',
        { keyword }
      )
    };
  }

  if (!articles || !Array.isArray(articles) || articles.length === 0) {
    return {
      isValid: false,
      error: createAnalysisError(
        AnalysisErrorType.VALIDATION_ERROR,
        '文章数据不能为空且必须是数组',
        { articlesLength: articles?.length || 0 }
      )
    };
  }

  if (articles.length > 20) {
    return {
      isValid: false,
      error: createAnalysisError(
        AnalysisErrorType.VALIDATION_ERROR,
        '文章数量不能超过20篇',
        { articlesLength: articles.length }
      )
    };
  }

  // 验证每篇文章的基本结构
  const invalidArticles = articles.filter(article =>
    !article.title || !article.id
  );

  if (invalidArticles.length > 0) {
    return {
      isValid: false,
      error: createAnalysisError(
        AnalysisErrorType.VALIDATION_ERROR,
        '文章数据格式不正确，缺少必要字段（title, content, id）',
        { invalidArticlesCount: invalidArticles.length }
      )
    };
  }

  return { isValid: true };
}

// POST - 生成AI洞察分析
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // 解析请求体
    let body: AIAnalysisRequest;
    try {
      const rawBody = await request.text();
      console.log('Raw request body:', rawBody);
      body = JSON.parse(rawBody);
      console.log('Parsed request body:', JSON.stringify(body, null, 2));
    } catch (parseError) {
      console.error('JSON parsing error:', parseError);
      return createErrorResponse(
        createAnalysisError(
          AnalysisErrorType.PARSING_ERROR,
          '请求JSON格式错误',
          { parseError: String(parseError) }
        ),
        400
      );
    }

    // 验证请求参数
    const validation = validateRequest(body);
    if (!validation.isValid) {
      console.error('Validation error:', validation.error);
      return createErrorResponse(validation.error!, 400);
    }

    const { keyword, articles, onProgress, options, searchId } = body;

    // 处理空内容的文章
    const processedArticles = articles.map(article => ({
      ...article,
      content: article.content || article.summary || '文章内容暂不可获取'
    }));

    console.log(`开始AI分析: 关键词="${keyword}", 文章数=${processedArticles.length}`);
    console.log('Environment variables:', {
      DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY ? 'SET' : 'NOT_SET',
      DEEPSEEK_BASE_URL: process.env.DEEPSEEK_BASE_URL,
      DEEPSEEK_MODEL: process.env.DEEPSEEK_MODEL
    });

    try {
      // 使用传入的searchId或生成新的
      const analysisId = searchId || `ai_analysis_${Date.now()}`;

      // 执行AI分析
      const result = await generateAIInsights({
        searchId: analysisId,
        keyword,
        articles: processedArticles.slice(0, 5), // 使用处理后的文章数据，限制为前5篇
        onProgress: onProgress || undefined,
        analysisOptions: {
          maxArticles: 5,
          includeSentiment: true,
          includeOpportunities: true,
          model: options?.model || 'deepseek-chat',
          maxTokens: options?.maxTokens || 4000,
          temperature: options?.temperature || 0.7,
          ...options
        }
      });

      const processingTime = Date.now() - startTime;

      if (!result || !result.success) {
        return createErrorResponse(
          createAnalysisError(
            AnalysisErrorType.SERVER_ERROR,
            result?.error || 'AI分析失败，未返回有效结果',
            { processingTime }
          ),
          500
        );
      }

      console.log(`AI分析完成: 耗时=${processingTime}ms, 洞察数=${result.data?.aiAnalysis?.topicInsights?.length || 0}`);
      console.log('AI分析结果:', JSON.stringify(result, null, 2));

      // 如果提供了searchId，自动保存AI分析结果到数据库
      if (searchId && result.data) {
        try {
          const searchIdNum = parseInt(searchId);
          console.log(`准备保存AI分析结果，searchId: ${searchId}, searchIdNum: ${searchIdNum}, isNaN: ${isNaN(searchIdNum)}`);

          if (isNaN(searchIdNum)) {
            console.error('searchId转换为数字失败:', { searchId, searchIdNum });
          } else {
            saveAIAnalysisResult(searchIdNum, result.data);
            console.log(`AI分析结果已自动保存到数据库，searchId: ${searchIdNum}`);
          }
        } catch (saveError) {
          console.error('保存AI分析结果失败:', saveError);
          // 不影响主要功能，只记录错误
        }
      }

      return NextResponse.json({
        success: true,
        data: result.data,
        metadata: {
          processingTime,
          keyword,
          articlesAnalyzed: Math.min(articles.length, 5),
          insightsGenerated: result.data?.aiAnalysis?.topicInsights?.length || 0,
          summariesGenerated: result.data?.aiAnalysis?.articleSummaries?.length || 0,
          model: options?.model || 'deepseek-chat',
          timestamp: Date.now()
        }
      });

    } catch (apiError) {
      console.error('AI API调用失败:', apiError);
      console.error('Error details:', {
        name: apiError instanceof Error ? apiError.name : 'Unknown',
        message: apiError instanceof Error ? apiError.message : String(apiError),
        stack: apiError instanceof Error ? apiError.stack : undefined
      });

      // 根据错误类型返回不同的错误响应
      const errorMessage = apiError instanceof Error ? apiError.message : String(apiError);

      if (errorMessage.includes('API key') || errorMessage.includes('authentication')) {
        return createErrorResponse(
          createAnalysisError(
            AnalysisErrorType.API_ERROR,
            'API密钥无效或认证失败',
            { errorMessage },
            false
          ),
          401
        );
      }

      if (errorMessage.includes('quota') || errorMessage.includes('limit') || errorMessage.includes('rate')) {
        return createErrorResponse(
          createAnalysisError(
            AnalysisErrorType.QUOTA_ERROR,
            'API配额已用完或请求频率过高',
            { errorMessage },
            true
          ),
          429
        );
      }

      if (errorMessage.includes('timeout') || errorMessage.includes('time out')) {
        return createErrorResponse(
          createAnalysisError(
            AnalysisErrorType.TIMEOUT_ERROR,
            'AI分析请求超时',
            { errorMessage },
            true
          ),
          408
        );
      }

      if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        return createErrorResponse(
          createAnalysisError(
            AnalysisErrorType.NETWORK_ERROR,
            '网络连接失败',
            { errorMessage },
            true
          ),
          503
        );
      }

      // 其他API错误
      return createErrorResponse(
        createAnalysisError(
          AnalysisErrorType.API_ERROR,
          'AI服务调用失败',
          { errorMessage },
          true
        ),
        502
      );
    }

  } catch (error) {
    console.error('AI分析路由处理失败:', error);

    return createErrorResponse(
      createAnalysisError(
        AnalysisErrorType.SERVER_ERROR,
        '服务器内部错误',
        {
          error: error instanceof Error ? error.message : String(error),
          processingTime: Date.now() - startTime
        },
        false
      ),
      500
    );
  }
}

// GET - 获取AI分析服务状态
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const keyword = searchParams.get('keyword');

    // 检查API配置
    const deepSeekApiKey = process.env.DEEPSEEK_API_KEY;
    const openaiApiKey = process.env.OPENAI_API_KEY;

    const status = {
      available: false,
      provider: null as string | null,
      model: null as string | null,
      configured: false,
      error: null as string | null
    };

    if (deepSeekApiKey) {
      status.available = true;
      status.provider = 'deepseek';
      status.model = process.env.DEEPSEEK_MODEL || 'deepseek-chat';
      status.configured = true;
    } else if (openaiApiKey) {
      status.available = true;
      status.provider = 'openai';
      status.model = process.env.AI_MODEL || 'gpt-4';
      status.configured = true;
    } else {
      status.error = '未配置AI服务API密钥';
    }

    return NextResponse.json({
      success: true,
      status,
      timestamp: Date.now()
    });

  } catch (error) {
    console.error('获取AI分析状态失败:', error);

    return createErrorResponse(
      createAnalysisError(
        AnalysisErrorType.SERVER_ERROR,
        '获取服务状态失败',
        { error: error instanceof Error ? error.message : String(error) }
      ),
      500
    );
  }
}