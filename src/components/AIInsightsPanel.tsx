'use client';

import { useState } from 'react';
import {
  BrainIcon,
  TrendingUpIcon,
  BarChart3Icon,
  TargetIcon,
  StarIcon,
  ClockIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  LightbulbIcon,
  EyeIcon,
  HeartIcon,
  ActivityIcon
} from 'lucide-react';
import { AIEnhancedInsights, TopicInsight, SentimentAnalysis, Opportunity } from '@/types/aiInsights';

interface AIInsightsPanelProps {
  insights: AIEnhancedInsights | null;
  isLoading?: boolean;
  error?: string;
  onRetry?: () => void;
}

export default function AIInsightsPanel({
  insights,
  isLoading = false,
  error,
  onRetry
}: AIInsightsPanelProps) {
  const [expandedSections, setExpandedSections] = useState<string[]>([
    'trends',
    'sentiment'
  ]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev =>
      prev.includes(section)
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  if (isLoading) {
    return (
      <div className="card">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
          <span className="ml-3 text-gray-600">AI分析中，请稍候...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card text-center py-12">
        <AlertCircleIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">AI分析失败</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="btn btn-primary"
          >
            重试
          </button>
        )}
      </div>
    );
  }

  if (!insights) {
    return (
      <div className="card text-center py-12">
        <BrainIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">暂无AI洞察</h3>
        <p className="text-gray-600">请先进行选题分析以获取AI洞察</p>
      </div>
    );
  }

  const { aiAnalysis, metadata } = insights;

  return (
    <div className="space-y-6">
      {/* AI洞察标题区域 */}
      <div className="ai-insights-header bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-xl border border-purple-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
              <BrainIcon className="w-7 h-7 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">🤖 AI驱动的选题洞察</h3>
              <p className="text-sm text-gray-600 mt-1">
                基于 {metadata.articlesAnalyzed} 篇热门文章的深度分析
              </p>
            </div>
          </div>

          {/* 元数据信息 */}
          <div className="text-right space-y-1">
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span className="flex items-center">
                <TargetIcon className="w-4 h-4 mr-1" />
                置信度: {(metadata.confidence * 100).toFixed(1)}%
              </span>
              <span className="flex items-center">
                <ClockIcon className="w-4 h-4 mr-1" />
                {(metadata.processingTime / 1000).toFixed(1)}s
              </span>
            </div>
            <div className="flex items-center space-x-4 text-xs text-gray-500">
              <span>模型: {metadata.aiModel}</span>
              <span>Token: {metadata.tokensUsed}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 选题洞察 */}
      {aiAnalysis.topicInsights && aiAnalysis.topicInsights.length > 0 && (
        <div className="card">
          <div
            className="flex items-center justify-between cursor-pointer py-2"
            onClick={() => toggleSection('trends')}
          >
            <h4 className="text-lg font-semibold text-gray-900 flex items-center">
              <TrendingUpIcon className="w-5 h-5 mr-2 text-green-500" />
              选题趋势洞察
              <span className="ml-2 text-sm font-normal text-gray-500">
                ({aiAnalysis.topicInsights.length} 条洞察)
              </span>
            </h4>
            {expandedSections.includes('trends') ? (
              <ChevronUpIcon className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDownIcon className="w-5 h-5 text-gray-400" />
            )}
          </div>

          {expandedSections.includes('trends') && (
            <div className="space-y-4 mt-4">
              {aiAnalysis.topicInsights.map((insight, index) => (
                <InsightCard key={insight.id} insight={insight} index={index} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* 情感分析 */}
      {aiAnalysis.sentimentAnalysis && (
        <div className="card">
          <div
            className="flex items-center justify-between cursor-pointer py-2"
            onClick={() => toggleSection('sentiment')}
          >
            <h4 className="text-lg font-semibold text-gray-900 flex items-center">
              <HeartIcon className="w-5 h-5 mr-2 text-red-500" />
              情感倾向分析
            </h4>
            {expandedSections.includes('sentiment') ? (
              <ChevronUpIcon className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDownIcon className="w-5 h-5 text-gray-400" />
            )}
          </div>

          {expandedSections.includes('sentiment') && (
            <div className="mt-4">
              <SentimentAnalysisCard analysis={aiAnalysis.sentimentAnalysis} />
            </div>
          )}
        </div>
      )}

      {/* 机会识别 */}
      {aiAnalysis.opportunities && aiAnalysis.opportunities.length > 0 && (
        <div className="card">
          <div
            className="flex items-center justify-between cursor-pointer py-2"
            onClick={() => toggleSection('opportunities')}
          >
            <h4 className="text-lg font-semibold text-gray-900 flex items-center">
              <LightbulbIcon className="w-5 h-5 mr-2 text-yellow-500" />
              市场机会识别
              <span className="ml-2 text-sm font-normal text-gray-500">
                ({aiAnalysis.opportunities.length} 个机会)
              </span>
            </h4>
            {expandedSections.includes('opportunities') ? (
              <ChevronUpIcon className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDownIcon className="w-5 h-5 text-gray-400" />
            )}
          </div>

          {expandedSections.includes('opportunities') && (
            <div className="space-y-4 mt-4">
              {aiAnalysis.opportunities.map((opportunity, index) => (
                <OpportunityCard key={index} opportunity={opportunity} index={index} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* 文章AI摘要 */}
      {aiAnalysis.articleSummaries && aiAnalysis.articleSummaries.length > 0 && (
        <div className="card">
          <div
            className="flex items-center justify-between cursor-pointer py-2"
            onClick={() => toggleSection('summaries')}
          >
            <h4 className="text-lg font-semibold text-gray-900 flex items-center">
              <EyeIcon className="w-5 h-5 mr-2 text-blue-500" />
              文章智能摘要
              <span className="ml-2 text-sm font-normal text-gray-500">
                ({aiAnalysis.articleSummaries.length} 篇文章)
              </span>
            </h4>
            {expandedSections.includes('summaries') ? (
              <ChevronUpIcon className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDownIcon className="w-5 h-5 text-gray-400" />
            )}
          </div>

          {expandedSections.includes('summaries') && (
            <div className="space-y-4 mt-4">
              {aiAnalysis.articleSummaries.slice(0, 3).map((summary, index) => (
                <ArticleSummaryCard key={summary.articleId} summary={summary} index={index} />
              ))}
              {aiAnalysis.articleSummaries.length > 3 && (
                <div className="text-center text-sm text-gray-500 pt-2">
                  显示前 3 篇，共 {aiAnalysis.articleSummaries.length} 篇文章
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// 洞察卡片组件
function InsightCard({ insight, index }: { insight: TopicInsight; index: number }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'trend':
        return <TrendingUpIcon className="w-4 h-4" />;
      case 'opportunity':
        return <LightbulbIcon className="w-4 h-4" />;
      case 'strategy':
        return <TargetIcon className="w-4 h-4" />;
      case 'content':
        return <BarChart3Icon className="w-4 h-4" />;
      case 'audience':
        return <ActivityIcon className="w-4 h-4" />;
      default:
        return <StarIcon className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'trend':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'opportunity':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'strategy':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'content':
        return 'text-purple-600 bg-purple-50 border-purple-200';
      case 'audience':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'text-green-600 bg-green-50';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50';
      case 'hard':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getPotentialColor = (potential: string) => {
    switch (potential) {
      case 'high':
        return 'text-green-600 bg-green-50';
      case 'medium':
        return 'text-blue-600 bg-blue-50';
      case 'low':
        return 'text-gray-600 bg-gray-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="insight-card border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getCategoryColor(insight.category)}`}>
            <span className="text-lg font-bold">{index + 1}</span>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-2">
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(insight.category)}`}>
              {getCategoryIcon(insight.category)}
              <span className="ml-1">{insight.category}</span>
            </span>
            <span className="flex items-center text-xs text-gray-500">
              <BarChart3Icon className="w-3 h-3 mr-1" />
              置信度: {(insight.confidence * 100).toFixed(1)}%
            </span>
          </div>

          <h5 className="font-medium text-gray-900 mb-2">{insight.trend}</h5>

          {/* 支撑证据 */}
          {insight.evidence && insight.evidence.length > 0 && (
            <div className="mb-3">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-sm text-gray-600 hover:text-gray-800 flex items-center"
              >
                <span className="font-medium">支撑证据:</span>
                <span className="ml-1">({insight.evidence.length} 条)</span>
                {isExpanded ? (
                  <ChevronUpIcon className="w-3 h-3 ml-1" />
                ) : (
                  <ChevronDownIcon className="w-3 h-3 ml-1" />
                )}
              </button>

              {isExpanded && (
                <div className="mt-2 space-y-1">
                  {insight.evidence.map((evidence, idx) => (
                    <div key={idx} className="flex items-start space-x-2 text-sm text-gray-600">
                      <CheckCircleIcon className="w-3 h-3 mt-0.5 text-green-500 flex-shrink-0" />
                      <span>{evidence}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 内容建议 */}
          <div className="bg-gray-50 p-3 rounded">
            <p className="text-sm text-gray-700 mb-2">
              <strong>内容建议:</strong> {insight.recommendation}
            </p>

            <div className="flex items-center space-x-4 text-xs">
              <span className={`px-2 py-1 rounded ${getDifficultyColor(insight.difficulty)}`}>
                难度: {insight.difficulty}
              </span>
              <span className={`px-2 py-1 rounded ${getPotentialColor(insight.potential)}`}>
                潜力: {insight.potential}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// 情感分析卡片组件
function SentimentAnalysisCard({ analysis }: { analysis: SentimentAnalysis }) {
  const getSentimentColor = (sentiment: string) => {
    if (sentiment.includes('积极') || sentiment.includes('positive')) {
      return 'text-green-600 bg-green-50';
    } else if (sentiment.includes('消极') || sentiment.includes('negative')) {
      return 'text-red-600 bg-red-50';
    }
    return 'text-gray-600 bg-gray-50';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="bg-gray-50 p-4 rounded-lg">
        <h5 className="font-medium text-gray-900 mb-3">整体情感倾向</h5>
        <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getSentimentColor(analysis.overall)}`}>
          {analysis.overall}
        </div>
        <div className="mt-2 text-sm text-gray-600">
          情感评分: {analysis.sentimentScore.toFixed(2)}
        </div>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg">
        <h5 className="font-medium text-gray-900 mb-3">用户参与度</h5>
        <div className="text-lg font-semibold text-gray-900">{analysis.engagementLevel}</div>
        <div className="text-sm text-gray-600 mt-1">主导情感: {analysis.dominantEmotion}</div>
      </div>

      {analysis.emotionalTone && analysis.emotionalTone.length > 0 && (
        <div className="md:col-span-2 bg-gray-50 p-4 rounded-lg">
          <h5 className="font-medium text-gray-900 mb-3">情感调性</h5>
          <div className="flex flex-wrap gap-2">
            {analysis.emotionalTone.map((tone, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm"
              >
                {tone}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// 机会卡片组件
function OpportunityCard({ opportunity, index }: { opportunity: Opportunity; index: number }) {
  const getCompetitionColor = (competition: string) => {
    switch (competition) {
      case 'low':
        return 'text-green-600 bg-green-50';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50';
      case 'high':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 bg-gradient-to-br from-yellow-100 to-orange-100 rounded-lg flex items-center justify-center">
            <LightbulbIcon className="w-5 h-5 text-yellow-600" />
          </div>
        </div>

        <div className="flex-1">
          <h5 className="font-medium text-gray-900 mb-2">{opportunity.gap}</h5>

          <div className="space-y-2 mb-3">
            <p className="text-sm text-gray-700">
              <strong>发展潜力:</strong> {opportunity.potential}
            </p>
            {opportunity.suggestedAction && (
              <p className="text-sm text-gray-700">
                <strong>建议行动:</strong> {opportunity.suggestedAction}
              </p>
            )}
          </div>

          <div className="flex items-center space-x-3 text-xs">
            <span className={`px-2 py-1 rounded ${getCompetitionColor(opportunity.competition)}`}>
              竞争: {opportunity.competition}
            </span>
            <span className="text-gray-500">
              难度: {opportunity.estimatedDifficulty}
            </span>
            {opportunity.marketSize && (
              <span className="text-gray-500">
                市场规模: {opportunity.marketSize}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// 文章摘要卡片组件
function ArticleSummaryCard({ summary, index }: { summary: any; index: number }) {
  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <span className="text-blue-600 font-bold">{index + 1}</span>
          </div>
        </div>

        <div className="flex-1">
          <h6 className="font-medium text-gray-900 mb-2 line-clamp-2">{summary.title}</h6>
          <p className="text-sm text-gray-700 mb-3 line-clamp-3">{summary.summary}</p>

          {summary.keyPoints && summary.keyPoints.length > 0 && (
            <div className="mb-3">
              <p className="text-xs font-medium text-gray-600 mb-1">关键要点:</p>
              <ul className="space-y-1">
                {summary.keyPoints.slice(0, 3).map((point: string, idx: number) => (
                  <li key={idx} className="text-xs text-gray-600 flex items-start">
                    <span className="text-blue-500 mr-2">•</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex items-center space-x-3 text-xs text-gray-500">
            <span>目标受众: {summary.targetAudience}</span>
            <span>情感: {summary.sentiment}</span>
            <span>价值: {summary.contentValue}</span>
          </div>
        </div>
      </div>
    </div>
  );
}