'use client';

import { useState, useEffect } from 'react';
import { SearchIcon, TrendingUpIcon, EyeIcon, HeartIcon, AlertCircleIcon, BarChart3Icon, ThumbsUpIcon, ActivityIcon, SaveIcon, DatabaseIcon, BrainIcon } from 'lucide-react';
import { fetchWeChatArticles, extractKeywords, generateInsights } from '@/services/wechatApi';
import { ArticleData, WordCloudData } from '@/types/api';
import AIAnalysisProgress from './AIAnalysisProgress';
import AIInsightsDisplay from './AIInsightsDisplay';
import { AIEnhancedInsights } from '@/types/aiInsights';

export default function Analysis() {
  const [keyword, setKeyword] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [articles, setArticles] = useState<ArticleData[]>([]);
  const [reportGenerated, setReportGenerated] = useState(false);
  const [error, setError] = useState<string>('');
  const [wordCloud, setWordCloud] = useState<WordCloudData[]>([]);
  const [insights, setInsights] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const articlesPerPage = 5;
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [databaseInitialized, setDatabaseInitialized] = useState(false);

  // AI Analysis states
  const [isAIAnalyzing, setIsAIAnalyzing] = useState(false);
  const [aiAnalysisProgress, setAiAnalysisProgress] = useState(0);
  const [aiAnalysisStep, setAiAnalysisStep] = useState('');
  const [aiAnalysisError, setAiAnalysisError] = useState<string>('');
  const [aiAnalysisVisible, setAiAnalysisVisible] = useState(false);
  const [aiInsights, setAiInsights] = useState<AIEnhancedInsights | null>(null);
  const [currentAnalysisId, setCurrentAnalysisId] = useState<string>('');

  // 初始化数据库
  useEffect(() => {
    const initializeDatabase = async () => {
      try {
        const response = await fetch('/api/database/init', { method: 'POST' });
        const result = await response.json();
        if (result.success) {
          setDatabaseInitialized(true);
        } else {
          console.error('Database initialization failed:', result.error);
        }
      } catch (error) {
        console.error('Error initializing database:', error);
      }
    };

    initializeDatabase();

    // 从URL参数中获取关键词
    const urlKeyword = typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('keyword')
      : null;
    if (urlKeyword) {
      setKeyword(urlKeyword);
      // 延迟执行分析，确保组件完全加载
      setTimeout(() => {
        handleAnalyzeWithReset();
      }, 100);
    }
  }, []);

  // 保存分析结果到数据库
  const saveToDatabase = async () => {
    if (!reportGenerated || articles.length === 0 || !databaseInitialized) return;

    setIsSaving(true);
    setSaveStatus('idle');

    try {
      const response = await fetch('/api/search-history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          keyword,
          articles,
          wordCloud,
          insights
        })
      });

      const result = await response.json();

      if (result.success) {
        setSaveStatus('success');
        // 3秒后重置状态
        setTimeout(() => setSaveStatus('idle'), 3000);
      } else {
        setSaveStatus('error');
        console.error('Save failed:', result.error);
      }
    } catch (error) {
      setSaveStatus('error');
      console.error('Error saving to database:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAnalyze = async () => {
    if (!keyword.trim()) return;

    setIsAnalyzing(true);
    setError('');
    setReportGenerated(false);

    try {
      // 获取公众号文章数据
      const fetchedArticles = await fetchWeChatArticles(keyword);
      setArticles(fetchedArticles);

      if (fetchedArticles.length === 0) {
        setError('未找到相关文章，请尝试其他关键词');
        setIsAnalyzing(false);
        return;
      }

      // 生成词云数据
      const keywords = extractKeywords(keyword, fetchedArticles);
      setWordCloud(keywords);

      // 生成分析洞察
      const analysisInsights = generateInsights(fetchedArticles, keyword);
      setInsights(analysisInsights);

      setReportGenerated(true);

      // 自动保存到数据库
      if (databaseInitialized) {
        // 使用setTimeout确保状态更新完成后再保存
        setTimeout(async () => {
          try {
            const response = await fetch('/api/search-history', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                keyword,
                articles: fetchedArticles,
                wordCloud: keywords,
                insights: analysisInsights
              })
            });

            const result = await response.json();
            if (result.success) {
              console.log('Analysis auto-saved successfully');
            } else {
              console.error('Auto-save failed:', result.error);
            }
          } catch (error) {
            console.error('Error auto-saving to database:', error);
          }
        }, 100);
      }
    } catch (err) {
      console.error('分析失败:', err);
      setError(err instanceof Error ? err.message : '分析失败，请稍后重试');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // AI深度分析函数
  const handleAIAnalysis = async () => {
    if (!keyword.trim() || articles.length === 0) return;

    setIsAIAnalyzing(true);
    setAiAnalysisError('');
    setAiAnalysisVisible(true);
    setAiAnalysisProgress(0);
    setAiAnalysisStep('准备开始AI分析...');

    // 生成分析ID
    const analysisId = `ai_analysis_${Date.now()}`;
    setCurrentAnalysisId(analysisId);

    try {
      const response = await fetch('/api/ai-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          searchId: analysisId,
          keyword,
          articles: articles.slice(0, 5), // 只分析TOP 5文章
          options: {
            maxArticles: 5,
            includeSentiment: true,
            includeOpportunities: true,
            model: 'deepseek-chat'
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `API请求失败: ${response.status}`);
      }

      const aiResult = await response.json();

      if (aiResult && aiResult.success && aiResult.data) {
        setAiInsights(aiResult.data);
        setAiAnalysisProgress(100);
        setAiAnalysisStep('AI分析完成！');

        // 2秒后隐藏进度条
        setTimeout(() => {
          setAiAnalysisVisible(false);
        }, 2000);
      } else {
        throw new Error(aiResult?.error || 'AI分析返回无效结果');
      }
    } catch (error) {
      console.error('AI分析失败:', error);
      setAiAnalysisError(error instanceof Error ? error.message : 'AI分析失败，请稍后重试');
    } finally {
      setIsAIAnalyzing(false);
    }
  };

  // 取消AI分析
  const handleCancelAIAnalysis = () => {
    setAiAnalysisVisible(false);
    setIsAIAnalyzing(false);
    setAiAnalysisError('');
    setAiAnalysisProgress(0);
    setAiAnalysisStep('');
  };

  const topLikedArticles = [...articles]
    .sort((a, b) => b.likeCount - a.likeCount)
    .slice(0, 5);

  const topInteractiveArticles = [...articles]
    .sort((a, b) => b.interactiveRate - a.interactiveRate)
    .slice(0, 5);

  // 计算统计数据
  const calculateStats = () => {
    if (articles.length === 0) {
      return {
        totalArticles: 0,
        avgReadCount: 0,
        avgLikeCount: 0,
        avgInteractionRate: 0
      };
    }

    const totalReadCount = articles.reduce((sum, article) => sum + article.readCount, 0);
    const totalLikeCount = articles.reduce((sum, article) => sum + article.likeCount, 0);
    const totalInteractionRate = articles.reduce((sum, article) => sum + article.interactiveRate, 0);

    return {
      totalArticles: articles.length,
      avgReadCount: Math.round(totalReadCount / articles.length),
      avgLikeCount: Math.round(totalLikeCount / articles.length),
      avgInteractionRate: Math.round((totalInteractionRate / articles.length) * 10) / 10
    };
  };

  const stats = calculateStats();

  const handleReset = () => {
    setArticles([]);
    setReportGenerated(false);
    setError('');
    setWordCloud([]);
    setInsights([]);
    setKeyword('');
    setCurrentPage(1);
  };

  // 计算分页数据
  const indexOfLastArticle = currentPage * articlesPerPage;
  const indexOfFirstArticle = indexOfLastArticle - articlesPerPage;
  const currentArticles = articles.slice(indexOfFirstArticle, indexOfLastArticle);
  const totalPages = Math.ceil(articles.length / articlesPerPage);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  // 当开始新的分析时重置页码
  const handleAnalyzeWithReset = async () => {
    setCurrentPage(1);
    await handleAnalyze();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">选题分析</h1>
      </div>

      {/* 搜索栏 */}
      <div className="card">
        <div className="flex flex-col space-y-4">
          <div className="flex space-x-4">
            <div className="flex-1">
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="请输入关键词进行选题分析..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                onKeyDown={(e) => e.key === 'Enter' && handleAnalyzeWithReset()}
              />
            </div>
            <button
              onClick={handleAnalyzeWithReset}
              disabled={isAnalyzing || !keyword.trim()}
              className="btn btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <SearchIcon className="w-4 h-4" />
              <span>{isAnalyzing ? '分析中...' : '开始分析'}</span>
            </button>
          </div>

          {/* AI深度分析按钮 */}
          {articles.length > 0 && (
            <div className="flex justify-center">
              <button
                onClick={handleAIAnalysis}
                disabled={isAIAnalyzing}
                className="btn bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                <BrainIcon className="w-4 h-4" />
                <span>{isAIAnalyzing ? 'AI分析中...' : 'AI 深度分析'}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="card bg-red-50 border-red-200">
          <div className="flex items-start space-x-3">
            <AlertCircleIcon className="w-5 h-5 text-red-500 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-red-800">分析失败</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* AI分析进度组件 */}
      <AIAnalysisProgress
        isVisible={aiAnalysisVisible}
        progress={aiAnalysisProgress}
        currentStep={aiAnalysisStep}
        error={aiAnalysisError}
        onCancel={handleCancelAIAnalysis}
        searchId={currentAnalysisId}
        totalArticles={Math.min(articles.length, 5)}
        processedArticles={Math.min(Math.floor(aiAnalysisProgress / 20), Math.min(articles.length, 5))}
      />

      {/* AI洞察结果展示 */}
      <AIInsightsDisplay
        insights={aiInsights}
        isLoading={isAIAnalyzing}
        error={aiAnalysisError}
      />

      {reportGenerated && (
        <>
          {/* 高频词云 - 单独显示 */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">高频词云</h2>
            <div className="flex flex-wrap gap-3 justify-center p-6 bg-gray-50 rounded-lg">
              {wordCloud.map((word, index) => (
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

          {/* 统计数据卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">分析文章数</p>
                  <p className="text-2xl font-bold text-blue-900 mt-1">{stats.totalArticles}</p>
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
                  <p className="text-2xl font-bold text-green-900 mt-1">{stats.avgReadCount.toLocaleString()}</p>
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
                  <p className="text-2xl font-bold text-red-900 mt-1">{stats.avgLikeCount.toLocaleString()}</p>
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
                  <p className="text-2xl font-bold text-purple-900 mt-1">{stats.avgInteractionRate}%</p>
                  <p className="text-xs text-purple-700 mt-1">篇均互动百分比</p>
                </div>
                <div className="w-12 h-12 bg-purple-200 rounded-lg flex items-center justify-center">
                  <ActivityIcon className="w-6 h-6 text-purple-600" />
                </div>
              </div>
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
                  {insights.map((insight, index) => (
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
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">文章列表</h2>
                <span className="text-sm text-gray-500">
                  共 {articles.length} 篇文章，当前第 {currentPage} / {totalPages} 页
                </span>
              </div>
              <div className="space-y-4">
                {currentArticles.map((article) => (
                  <div key={article.id} className="border-b border-gray-200 pb-4 last:border-0">
                    <div className="flex items-start space-x-3">
                      {article.avatar && (
                        <img
                          src={article.avatar}
                          alt={article.wxName}
                          className="w-8 h-8 rounded-lg object-cover flex-shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 mb-1 line-clamp-2">{article.title}</h3>
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

          {/* 操作按钮 */}
          <div className="flex flex-col sm:flex-row justify-center items-center space-y-3 sm:space-y-0 sm:space-x-4">
            <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-4">
              <button
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    window.location.href = '/create';
                  }
                }}
                className="btn btn-primary"
              >
                基于此洞察创作内容
              </button>

              {/* 保存到数据库按钮 */}
              <button
                onClick={saveToDatabase}
                disabled={isSaving || !databaseInitialized || !reportGenerated}
                className={`btn flex items-center space-x-2 ${
                  saveStatus === 'success'
                    ? 'bg-green-500 hover:bg-green-600 text-white'
                    : saveStatus === 'error'
                    ? 'bg-red-500 hover:bg-red-600 text-white'
                    : 'btn-secondary'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                    <span>保存中...</span>
                  </>
                ) : saveStatus === 'success' ? (
                  <>
                    <DatabaseIcon className="w-4 h-4" />
                    <span>已保存</span>
                  </>
                ) : saveStatus === 'error' ? (
                  <>
                    <DatabaseIcon className="w-4 h-4" />
                    <span>保存失败</span>
                  </>
                ) : (
                  <>
                    <SaveIcon className="w-4 h-4" />
                    <span>保存到数据库</span>
                  </>
                )}
              </button>

              <button
                onClick={() => {
                  const reportData = {
                    keyword,
                    totalArticles: articles.length,
                    wordCloud,
                    insights,
                    topLikedArticles,
                    topInteractiveArticles,
                    generatedAt: new Date().toLocaleString('zh-CN')
                  };
                  const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `选题分析报告_${keyword}_${Date.now()}.json`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                }}
                className="btn btn-secondary"
              >
                导出分析报告
              </button>

              <button
                onClick={handleReset}
                className="btn btn-secondary"
              >
                重新分析
              </button>
            </div>

            {/* 查看历史按钮 */}
            <button
              onClick={() => {
                  if (typeof window !== 'undefined') {
                    window.location.href = '/history';
                  }
                }}
              className="btn btn-outline flex items-center space-x-2"
            >
              <DatabaseIcon className="w-4 h-4" />
              <span>查看历史记录</span>
            </button>
          </div>
        </>
      )}

      {!reportGenerated && (
        <div className="card text-center py-12">
          <SearchIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">开始选题分析</h3>
          <p className="text-gray-600">输入关键词，获取深度选题洞察和内容创作建议</p>
        </div>
      )}
    </div>
  );
}