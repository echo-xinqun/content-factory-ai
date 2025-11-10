'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeftIcon,
  SearchIcon,
  TrendingUpIcon,
  EyeIcon,
  HeartIcon,
  AlertCircleIcon,
  BarChart3Icon,
  ThumbsUpIcon,
  ActivityIcon,
  CalendarIcon,
  RefreshCwIcon,
  DownloadIcon
  // BrainIcon
} from 'lucide-react';
import { ArticleData, WordCloudData } from '@/types/api';
// import { AIEnhancedInsights, AIProcessingState } from '@/types/aiInsights';
import ArticleDetail from '@/components/ArticleDetail';
// import AIInsightsPanel from '@/components/AIInsightsPanel';
// import AIProcessingIndicator, { CompactAIProcessingIndicator } from '@/components/AIProcessingIndicator';

interface SearchHistoryDetail {
  id: number;
  keyword: string;
  searchTime: number;
  totalArticles: number;
  avgReadCount: number;
  avgLikeCount: number;
  avgInteractionRate: number;
  createdAt: number;
  updatedAt: number;
  articles: ArticleData[];
  wordCloud: WordCloudData[];
  insights: string[];
}

export default function AnalysisDetailClient({ id }: { id: string }) {
  const [detail, setDetail] = useState<SearchHistoryDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const articlesPerPage = 5;
  const [selectedArticle, setSelectedArticle] = useState<ArticleData | null>(null);
  const [isArticleModalOpen, setIsArticleModalOpen] = useState(false);
  // const [aiInsights, setAiInsights] = useState<AIEnhancedInsights | null>(null);
  // const [aiProcessingState, setAiProcessingState] = useState<AIProcessingState>({
  //   status: 'idle',
  //   progress: 0,
  //   currentStep: ''
  // });
  // const [aiError, setAiError] = useState<string>('');
  const router = useRouter();

  // 加载AI洞察 - 临时禁用
  // const loadAIInsights = async (searchId: number) => {
  //   try {
  //     const response = await fetch(`/api/search-history/${searchId}`);
  //     const result = await response.json();

  //     if (result.success && result.data.aiInsights) {
  //       setAiInsights(result.data.aiInsights);
  //     }
  //   } catch (error) {
  //     console.error('Error loading AI insights:', error);
  //     // 不设置错误，因为AI洞察是可选的
  //   }
  // };

  // 加载分析详情
  const loadAnalysisDetail = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/search-history/${id}`);
      const result = await response.json();

      if (result.success) {
        setDetail(result.data);
        // 尝试加载已有的AI洞察 - 临时禁用
        // await loadAIInsights(parseInt(id));
      } else {
        setError(result.error || '加载分析详情失败');
      }
    } catch (error) {
      console.error('Error loading analysis detail:', error);
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 重新分析
  const reAnalyze = (keyword: string) => {
    router.push(`/analysis?keyword=${encodeURIComponent(keyword)}`);
  };

  // 导出分析报告
  const exportReport = () => {
    if (!detail) return;

    const topLikedArticles = [...detail.articles]
      .sort((a, b) => b.likeCount - a.likeCount)
      .slice(0, 5);

    const topInteractiveArticles = [...detail.articles]
      .sort((a, b) => b.interactiveRate - a.interactiveRate)
      .slice(0, 5);

    const reportData = {
      keyword: detail.keyword,
      totalArticles: detail.articles.length,
      wordCloud: detail.wordCloud,
      insights: detail.insights,
      topLikedArticles,
      topInteractiveArticles,
      generatedAt: new Date(detail.searchTime).toLocaleString('zh-CN')
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `选题分析报告_${detail.keyword}_${detail.searchTime}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // 格式化时间
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 处理文章点击
  const handleArticleClick = (article: ArticleData) => {
    setSelectedArticle(article);
    setIsArticleModalOpen(true);
  };

  // 关闭文章详情模态框
  const closeArticleModal = () => {
    setSelectedArticle(null);
    setIsArticleModalOpen(false);
  };

  // 启动AI分析
  const startAIAnalysis = async () => {
    if (!detail || aiProcessingState.status === 'processing') return;

    try {
      setAiProcessingState({
        status: 'processing',
        progress: 10,
        currentStep: '准备AI分析...',
        startTime: Date.now()
      });
      setAiError('');

      const response = await fetch('/api/ai-insights/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          searchId: detail.id.toString(),
          keyword: detail.keyword,
          articles: detail.articles,
          analysisOptions: {
            maxArticles: 10,
            includeSentiment: true,
            includeOpportunities: true,
            model: 'gpt-4'
          }
        })
      });

      const result = await response.json();

      if (result.success && result.data) {
        setAiInsights(result.data);
        setAiProcessingState({
          status: 'completed',
          progress: 100,
          currentStep: 'AI分析完成',
          startTime: aiProcessingState.startTime,
          endTime: Date.now()
        });
      } else {
        throw new Error(result.error || 'AI分析失败');
      }
    } catch (error) {
      console.error('AI analysis failed:', error);
      setAiError(error instanceof Error ? error.message : '未知错误');
      setAiProcessingState({
        status: 'error',
        progress: 0,
        currentStep: '分析失败',
        error: error instanceof Error ? error.message : '未知错误',
        startTime: aiProcessingState.startTime,
        endTime: Date.now()
      });
    }
  };

  // 重试AI分析 - 临时禁用
  // const retryAIAnalysis = () => {
  //   setAiError('');
  //   startAIAnalysis();
  // };

  // 计算分页数据
  const indexOfLastArticle = currentPage * articlesPerPage;
  const indexOfFirstArticle = indexOfLastArticle - articlesPerPage;
  const currentArticles = detail?.articles.slice(indexOfFirstArticle, indexOfLastArticle) || [];
  const totalPages = Math.ceil((detail?.articles.length || 0) / articlesPerPage);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  useEffect(() => {
    loadAnalysisDetail();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
        <span className="ml-3 text-gray-600">加载中...</span>
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="card text-center py-12">
        <AlertCircleIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">加载失败</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={loadAnalysisDetail}
          className="btn btn-primary mr-3"
        >
          重试
        </button>
        <button
          onClick={() => router.back()}
          className="btn btn-secondary"
        >
          返回
        </button>
      </div>
    );
  }

  const topLikedArticles = [...detail.articles]
    .sort((a, b) => b.likeCount - a.likeCount)
    .slice(0, 5);

  const topInteractiveArticles = [...detail.articles]
    .sort((a, b) => b.interactiveRate - a.interactiveRate)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{detail.keyword}</h1>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <CalendarIcon className="w-4 h-4" />
              <span>分析时间: {formatDate(detail.searchTime)}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => reAnalyze(detail.keyword)}
            className="btn btn-secondary flex items-center space-x-2"
          >
            <RefreshCwIcon className="w-4 h-4" />
            <span>重新分析</span>
          </button>
          <button
            onClick={exportReport}
            className="btn btn-secondary flex items-center space-x-2"
          >
            <DownloadIcon className="w-4 h-4" />
            <span>导出报告</span>
          </button>
        </div>
      </div>

      {/* 统计数据卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">分析文章数</p>
              <p className="text-2xl font-bold text-blue-900 mt-1">{detail.totalArticles}</p>
              <p className="text-xs text-blue-700 mt-1">相关文章总量</p>
            </div>
            <div className="w-12 h-12 bg-blue-200 rounded-lg flex items-center justify-center">
              <BarChart3Icon className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">平均阅读量</p>
              <p className="text-2xl font-bold text-green-900 mt-1">{detail.avgReadCount.toLocaleString()}</p>
              <p className="text-xs text-green-700 mt-1">篇均阅读次数</p>
            </div>
            <div className="w-12 h-12 bg-green-200 rounded-lg flex items-center justify-center">
              <EyeIcon className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-600">平均点赞量</p>
              <p className="text-2xl font-bold text-red-900 mt-1">{detail.avgLikeCount.toLocaleString()}</p>
              <p className="text-xs text-red-700 mt-1">篇均点赞次数</p>
            </div>
            <div className="w-12 h-12 bg-red-200 rounded-lg flex items-center justify-center">
              <ThumbsUpIcon className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600">平均互动率</p>
              <p className="text-2xl font-bold text-purple-900 mt-1">{detail.avgInteractionRate}%</p>
              <p className="text-xs text-purple-700 mt-1">篇均互动百分比</p>
            </div>
            <div className="w-12 h-12 bg-purple-200 rounded-lg flex items-center justify-center">
              <ActivityIcon className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* 高频词云 */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">高频词云</h2>
        <div className="flex flex-wrap gap-3 justify-center p-6 bg-gray-50 rounded-lg">
          {detail.wordCloud.map((word, index) => (
            <span
              key={word.text}
              className={`px-4 py-2 bg-primary-50 text-primary-700 rounded-full hover:bg-primary-100 transition-colors ${
                index < 3 ? 'font-semibold text-primary-800' : ''
              }`}
              style={{
                fontSize: `${Math.max(14, 28 - index * 1.2)}px`,
                margin: index < 5 ? '8px' : '4px'
              }}
            >
              {word.text} ({word.count})
            </span>
          ))}
        </div>
      </div>

      {/* 分析报告和文章列表 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 分析报告 */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">分析报告</h2>

          {/* 点赞量最高的五篇文章 */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">👍 点赞量最高的五篇文章</h3>
            <div className="space-y-3">
              {topLikedArticles.map((article, index) => (
                <div key={article.id} className="border-l-4 border-primary-500 pl-3">
                  <h4 className="text-sm font-medium text-gray-900">
                    {index + 1}. {article.title}
                  </h4>
                  <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                    <span className="flex items-center">
                      <EyeIcon className="w-3 h-3 mr-1" />
                      阅读: {article.readCount}
                    </span>
                    <span className="flex items-center">
                      <HeartIcon className="w-3 h-3 mr-1" />
                      点赞: {article.likeCount}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 互动率最高的五篇文章 */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">📈 互动率最高的五篇文章</h3>
            <div className="space-y-3">
              {topInteractiveArticles.map((article, index) => (
                <div key={article.id} className="border-l-4 border-green-500 pl-3">
                  <h4 className="text-sm font-medium text-gray-900">
                    {index + 1}. {article.title}
                  </h4>
                  <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                    <span>互动率: {article.interactiveRate}%</span>
                    <span>点赞: {article.likeCount}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 五个选题洞察 */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">💡 五个选题洞察</h3>
            <div className="space-y-2">
              {detail.insights.map((insight, index) => (
                <div key={index} className="flex items-start space-x-2">
                  <TrendingUpIcon className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-gray-700">{insight}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 文章列表 */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">文章列表</h2>
            <span className="text-sm text-gray-500">
              共 {detail.articles.length} 篇文章，当前第 {currentPage} / {totalPages} 页
            </span>
          </div>

          {/* 点击提示 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-blue-700 flex items-center">
              💡 点击任意文章卡片可查看完整内容
            </p>
          </div>
          <div className="space-y-4">
            {currentArticles.map((article) => (
              <div
                key={article.id}
                className="border-b border-gray-200 pb-4 last:border-0 cursor-pointer hover:bg-gray-50 rounded-lg p-3 transition-colors"
                onClick={() => handleArticleClick(article)}
              >
                <div className="flex items-start space-x-3">
                  {article.avatar && (
                    <img
                      src={article.avatar}
                      alt={article.wxName}
                      className="w-8 h-8 rounded-lg object-cover flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 mb-1 line-clamp-2 hover:text-primary-700 transition-colors">
                      {article.title}
                    </h3>
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-xs text-gray-500">{article.wxName}</span>
                      {article.isOriginal && (
                        <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 text-xs rounded">原创</span>
                      )}
                      <span className="text-xs text-gray-400">{article.publishTime}</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-3">{article.summary}</p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center space-x-3">
                        <span className="flex items-center">
                          <EyeIcon className="w-3 h-3 mr-1" />
                          {article.readCount.toLocaleString()}
                        </span>
                        <span className="flex items-center">
                          <HeartIcon className="w-3 h-3 mr-1" />
                          {article.likeCount.toLocaleString()}
                        </span>
                        <span className="flex items-center">
                          👁 {article.viewCount.toLocaleString()}
                        </span>
                      </div>
                      <span className="font-medium text-primary-600">互动率: {article.interactiveRate}%</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 分页控件 */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center space-x-2 mt-6">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                上一页
              </button>

              <div className="flex space-x-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-3 py-1 text-sm border rounded-md ${
                      currentPage === page
                        ? 'bg-primary-500 text-white border-primary-500'
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                下一页
              </button>
            </div>
          )}
        </div>
      </div>

      {/* AI洞察面板 - 临时禁用 */}
      {/* <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <BrainIcon className="w-6 h-6 mr-2 text-purple-600" />
            AI智能洞察
          </h2>
          <div className="flex items-center space-x-3">
            <CompactAIProcessingIndicator state={aiProcessingState} />
            {!aiInsights && !aiError && aiProcessingState.status !== 'processing' && (
              <button
                onClick={startAIAnalysis}
                className="btn btn-primary flex items-center space-x-2"
                disabled={aiProcessingState.status === 'processing'}
              >
                <BrainIcon className="w-4 h-4" />
                <span>开始AI分析</span>
              </button>
            )}
          </div>
        </div>

        <AIInsightsPanel
          insights={aiInsights}
          isLoading={aiProcessingState.status === 'processing'}
          error={aiError}
          onRetry={retryAIAnalysis}
        />
      </div>

      {/* AI处理指示器 */}
      {/* <AIProcessingIndicator state={aiProcessingState} /> */}

      {/* 文章详情模态框 */}
      <ArticleDetail
        article={selectedArticle}
        isOpen={isArticleModalOpen}
        onClose={closeArticleModal}
      />
    </div>
  );
}