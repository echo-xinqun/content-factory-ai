'use client';

import {
  BrainIcon,
  TrendingUpIcon,
  LightbulbIcon,
  TargetIcon,
  BarChart3Icon,
  CheckCircleIcon,
  AlertTriangleIcon,
  InfoIcon,
  HeartIcon,
  TrendingUp
} from 'lucide-react';
import { AIEnhancedInsights } from '@/types/aiInsights';

interface AIInsightsDisplayProps {
  insights: AIEnhancedInsights | null;
  isLoading?: boolean;
  error?: string;
  compact?: boolean;
  showTitle?: boolean;
}

export default function AIInsightsDisplay({
  insights,
  isLoading = false,
  error = '',
  compact = false,
  showTitle = true
}: AIInsightsDisplayProps) {
  console.log('🎨 AIInsightsDisplay组件被调用，参数:', {
    insights: !!insights,
    isLoading,
    error,
    compact,
    showTitle,
    insightsKeys: insights ? Object.keys(insights) : null
  });

  if (isLoading) {
    return (
      <div className="card">
        {showTitle && (
          <div className="flex items-center mb-6">
            <BrainIcon className="w-5 h-5 mr-2 text-purple-600" />
            <h2 className="text-lg font-semibold text-gray-900">AI深度洞察分析</h2>
          </div>
        )}
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
          <span className="ml-3 text-gray-600">AI分析进行中...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card bg-red-50 border-red-200">
        {showTitle && (
          <div className="flex items-center mb-4">
            <BrainIcon className="w-5 h-5 mr-2 text-red-600" />
            <h2 className="text-lg font-semibold text-red-900">AI分析失败</h2>
          </div>
        )}
        <div className="flex items-start space-x-3">
          <AlertTriangleIcon className="w-5 h-5 text-red-500 mt-0.5" />
          <div>
            <p className="text-sm text-red-700">{error}</p>
            <button className="text-sm text-red-600 underline mt-2 hover:text-red-800">
              重试分析
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!insights) {
    console.log('❌ AIInsightsDisplay: insights为空，显示无数据状态');
    return (
      <div className="card">
        {showTitle && (
          <div className="flex items-center mb-6">
            <BrainIcon className="w-5 h-5 mr-2 text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900">AI深度洞察分析</h2>
          </div>
        )}
        <div className="text-center py-8">
          <BrainIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">暂无AI洞察分析结果</p>
          <p className="text-sm text-gray-500">点击"AI 深度分析"按钮获取智能洞察</p>
        </div>
      </div>
    );
  }

  console.log('✅ AIInsightsDisplay: 有数据，开始渲染AI洞察结果');
  console.log('📊 数据结构检查:', {
    sentimentAnalysis: !!insights.aiAnalysis?.sentimentAnalysis,
    opportunities: !!insights.aiAnalysis?.opportunities,
    opportunitiesCount: insights.aiAnalysis?.opportunities?.length || 0,
    overallAnalysis: !!insights.overallAnalysis
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-100 text-green-700';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700';
      case 'hard':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getPotentialColor = (potential: string) => {
    switch (potential) {
      case 'high':
        return 'text-green-600';
      case 'medium':
        return 'text-yellow-600';
      case 'low':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return '容易';
      case 'medium': return '中等';
      case 'hard': return '困难';
      default: return difficulty;
    }
  };

  const getPotentialText = (potential: string) => {
    switch (potential) {
      case 'high': return '高';
      case 'medium': return '中';
      case 'low': return '低';
      default: return potential;
    }
  };

  return (
    <div className={`card bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200 ${compact ? 'p-4' : ''}`}>
      {showTitle && (
        <div className="flex items-center mb-6">
          <BrainIcon className="w-5 h-5 mr-2 text-purple-600" />
          <h2 className="text-lg font-semibold text-gray-900">AI深度洞察分析</h2>
          {insights.metadata?.analysisTime && (
            <span className="text-xs text-gray-500 ml-auto">
              分析于: {new Date(insights.metadata.analysisTime).toLocaleString('zh-CN')}
            </span>
          )}
        </div>
      )}

      <div className={compact ? 'space-y-4' : 'space-y-6'}>
        {/* 基础洞察 */}
        {insights.basicInsights && insights.basicInsights.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
              <InfoIcon className="w-4 h-4 mr-2 text-blue-500" />
              基础数据洞察
            </h3>
            <div className="bg-white p-4 rounded-lg border border-purple-100">
              <ul className="space-y-2">
                {insights.basicInsights.map((insight, index) => (
                  <li key={index} className="flex items-start">
                    <CheckCircleIcon className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{insight}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* 文章摘要 */}
        {insights.aiAnalysis?.articleSummaries && insights.aiAnalysis.articleSummaries.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
              <InfoIcon className="w-4 h-4 mr-2 text-blue-500" />
              文章深度摘要
            </h3>
            <div className={`${compact ? 'space-y-2' : 'space-y-3'}`}>
              {insights.aiAnalysis.articleSummaries.slice(0, compact ? 2 : 5).map((summary, index) => (
                <div key={index} className="bg-white p-3 rounded-lg border border-purple-100">
                  <h4 className={`font-medium text-gray-900 mb-2 ${compact ? 'text-sm' : ''}`}>
                    {summary.title}
                  </h4>
                  <p className={`text-gray-700 mb-3 ${compact ? 'text-xs line-clamp-2' : 'text-sm'}`}>
                    {summary.summary}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {summary.keywords.slice(0, compact ? 3 : 5).map((keyword, kidx) => (
                      <span
                        key={kidx}
                        className={`px-2 py-1 bg-purple-100 text-purple-700 rounded ${
                          compact ? 'text-xs' : 'text-xs'
                        }`}
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 选题洞察 */}
        {insights.aiAnalysis?.topicInsights && insights.aiAnalysis.topicInsights.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
              <LightbulbIcon className="w-4 h-4 mr-2 text-yellow-500" />
              选题深度洞察
            </h3>
            <div className={`grid grid-cols-1 ${compact ? 'lg:grid-cols-2' : 'md:grid-cols-2'} gap-4`}>
              {insights.aiAnalysis.topicInsights.slice(0, compact ? 2 : 6).map((insight, index) => (
                <div key={index} className="bg-white p-4 rounded-lg border border-purple-100 shadow-sm">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className={`font-medium text-gray-900 ${compact ? 'text-sm' : ''}`}>
                      {insight.trend}
                    </h4>
                    <span className={`px-2 py-1 text-xs rounded ${getDifficultyColor(insight.difficulty)}`}>
                      {getDifficultyText(insight.difficulty)}
                    </span>
                  </div>
                  <p className={`text-gray-700 mb-3 ${compact ? 'text-xs line-clamp-3' : 'text-sm'}`}>
                    {insight.recommendation}
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center text-xs text-gray-500">
                      <span className="font-medium">潜力评估:</span>
                      <span className={`ml-2 ${getPotentialColor(insight.potential)}`}>
                        {getPotentialText(insight.potential)}
                      </span>
                    </div>
                    {insight.evidence && insight.evidence.length > 0 && (
                      <div className="text-xs text-gray-500">
                        <span className="font-medium">支撑证据:</span>
                        <ul className="mt-1 ml-2 list-disc">
                          {insight.evidence.slice(0, compact ? 1 : 2).map((evidence, eidx) => (
                            <li key={eidx} className={compact ? 'line-clamp-1' : ''}>
                              {evidence}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 情感分析 */}
        {insights.aiAnalysis?.sentimentAnalysis && !compact && (
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
              <HeartIcon className="w-4 h-4 mr-2 text-pink-500" />
              情感分析
            </h3>
            <div className="bg-white p-4 rounded-lg border border-purple-100">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-xs font-medium text-gray-500">整体情感</span>
                  <p className="text-sm font-medium text-gray-900 mt-1">{insights.aiAnalysis.sentimentAnalysis.overall}</p>
                </div>
                <div>
                  <span className="text-xs font-medium text-gray-500">情感得分</span>
                  <div className="flex items-center mt-1">
                    <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                      <div
                        className="bg-pink-500 h-2 rounded-full"
                        style={{width: `${Math.round((insights.aiAnalysis.sentimentAnalysis.sentimentScore || 0) * 100)}%`}}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-900">{Math.round((insights.aiAnalysis.sentimentAnalysis.sentimentScore || 0) * 100)}%</span>
                  </div>
                </div>
                <div>
                  <span className="text-xs font-medium text-gray-500">主导情感</span>
                  <p className="text-sm font-medium text-gray-900 mt-1">{insights.aiAnalysis.sentimentAnalysis.dominantEmotion}</p>
                </div>
                <div>
                  <span className="text-xs font-medium text-gray-500">互动水平</span>
                  <p className="text-sm font-medium text-gray-900 mt-1">{insights.aiAnalysis.sentimentAnalysis.engagementLevel}</p>
                </div>
              </div>
              {insights.aiAnalysis.sentimentAnalysis.emotionalTone && insights.aiAnalysis.sentimentAnalysis.emotionalTone.length > 0 && (
                <div className="mt-4">
                  <span className="text-xs font-medium text-gray-500">情感调性</span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {insights.aiAnalysis.sentimentAnalysis.emotionalTone.map((tone, index) => (
                      <span key={index} className="px-2 py-1 bg-pink-100 text-pink-700 rounded text-xs">
                        {tone}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 机会识别 */}
        {insights.aiAnalysis?.opportunities && insights.aiAnalysis.opportunities.length > 0 && !compact && (
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
              <TargetIcon className="w-4 h-4 mr-2 text-orange-500" />
              机会识别
            </h3>
            <div className="space-y-4">
              {insights.aiAnalysis.opportunities.slice(0, 5).map((opportunity, index) => (
                <div key={index} className="bg-white p-4 rounded-lg border border-purple-100 shadow-sm">
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="font-medium text-gray-900">{opportunity.gap}</h4>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs rounded ${getDifficultyColor(opportunity.estimatedDifficulty)}`}>
                        {getDifficultyText(opportunity.estimatedDifficulty)}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded bg-orange-100 text-orange-700`}>
                        {opportunity.competition}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 mb-3">{opportunity.potential}</p>
                  <div className="space-y-2">
                    <div className="flex items-start">
                      <span className="text-xs font-medium text-gray-500 mr-2">建议行动:</span>
                      <span className="text-xs text-gray-700 flex-1">{opportunity.suggestedAction}</span>
                    </div>
                    {opportunity.marketSize && (
                      <div className="flex items-start">
                        <span className="text-xs font-medium text-gray-500 mr-2">市场规模:</span>
                        <span className="text-xs text-gray-700 flex-1">{opportunity.marketSize}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 综合分析 */}
        {insights.overallAnalysis && !compact && (
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
              <BarChart3Icon className="w-4 h-4 mr-2 text-green-500" />
              综合分析
            </h3>
            <div className="bg-white p-4 rounded-lg border border-purple-100">
              <p className="text-sm text-gray-700">{insights.overallAnalysis}</p>
            </div>
          </div>
        )}

        {/* 元数据 */}
        {insights.metadata && !compact && (
          <div className="text-xs text-gray-500 border-t border-purple-200 pt-4">
            <div className="flex items-center justify-between">
              <span>分析模型: {insights.metadata.aiModel || 'AI'}</span>
              <span>分析文章数: {insights.metadata.articlesAnalyzed || insights.aiAnalysis?.articleSummaries?.length || 0}</span>
            </div>
            <div className="flex items-center justify-between mt-1">
              <span>置信度: {Math.round((insights.metadata.confidence || 0) * 100)}%</span>
              <span>处理时间: {Math.round((insights.metadata.processingTime || 0) / 1000)}秒</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}