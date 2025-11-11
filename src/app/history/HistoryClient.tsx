'use client';

import { useState, useEffect } from 'react';
import { SearchIcon, TrashIcon, EyeIcon, RefreshCwIcon, HistoryIcon, FilterIcon, CalendarIcon, BarChart3Icon } from 'lucide-react';
import { SearchHistory } from '@/models/SearchHistory';

export default function HistoryClient() {
  const [records, setRecords] = useState<SearchHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<SearchHistory | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState<number | null>(null);

  // 加载搜索历史
  const loadSearchHistory = async (search?: string) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      params.append('limit', '30');

      const response = await fetch(`/api/search-history?${params}`);
      const result = await response.json();

      if (result.success) {
        setRecords(result.data);
      } else {
        console.error('Failed to load search history:', result.error);
      }
    } catch (error) {
      console.error('Error loading search history:', error);
    } finally {
      setLoading(false);
    }
  };

  // 删除搜索记录
  const deleteRecord = async (id: number) => {
    try {
      setDeleteLoading(id);
      const response = await fetch(`/api/search-history?id=${id}`, {
        method: 'DELETE'
      });
      const result = await response.json();

      if (result.success) {
        await loadSearchHistory(searchTerm);
        if (selectedRecord?.id === id) {
          setSelectedRecord(null);
          setShowDetail(false);
        }
      } else {
        console.error('Failed to delete record:', result.error);
      }
    } catch (error) {
      console.error('Error deleting record:', error);
    } finally {
      setDeleteLoading(null);
    }
  };

  // 重新分析
  const reAnalyze = (keyword: string) => {
    if (typeof window !== 'undefined') {
      window.location.href = `/analysis?keyword=${encodeURIComponent(keyword)}`;
    }
  };

  // 查看详情
  const viewDetail = async (record: SearchHistory) => {
    try {
      const response = await fetch(`/api/search-history/${record.id}`);
      const result = await response.json();

      if (result.success) {
        setSelectedRecord(result.data);
        setShowDetail(true);
      } else {
        console.error('Failed to load record detail:', result.error);
      }
    } catch (error) {
      console.error('Error loading record detail:', error);
    }
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

  useEffect(() => {
    loadSearchHistory();
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadSearchHistory(searchTerm);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <HistoryIcon className="w-8 h-8 text-primary-500" />
          <h1 className="text-3xl font-bold text-gray-900">分析历史</h1>
        </div>
        <div className="text-sm text-gray-500">
          共 {records.length} 条记录
        </div>
      </div>

      {/* 搜索和筛选 */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="搜索关键词..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
          <button
            onClick={() => loadSearchHistory()}
            className="btn btn-secondary flex items-center space-x-2"
          >
            <RefreshCwIcon className="w-4 h-4" />
            <span>刷新</span>
          </button>
        </div>
      </div>

      {/* 加载状态 */}
      {loading && (
        <div className="card text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      )}

      {/* 空状态 */}
      {!loading && records.length === 0 && (
        <div className="card text-center py-12">
          <HistoryIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">暂无分析历史</h3>
          <p className="text-gray-600 mb-4">开始选题分析后，历史记录将显示在这里</p>
          <button
            onClick={() => {
              if (typeof window !== 'undefined') {
                window.location.href = '/analysis';
              }
            }}
            className="btn btn-primary"
          >
            开始分析
          </button>
        </div>
      )}

      {/* 历史记录列表 */}
      {!loading && records.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {records.map((record) => (
            <div key={record.id} className="card hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">
                    {record.keyword}
                  </h3>
                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    <CalendarIcon className="w-3 h-3" />
                    <span>{formatDate(record.searchTime)}</span>
                  </div>
                </div>
                <div className="flex space-x-1">
                  <button
                    onClick={() => viewDetail(record)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="查看详情"
                  >
                    <EyeIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => reAnalyze(record.keyword)}
                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                    title="重新分析"
                  >
                    <RefreshCwIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteRecord(record.id)}
                    disabled={deleteLoading === record.id}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                    title="删除记录"
                  >
                    {deleteLoading === record.id ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                    ) : (
                      <TrashIcon className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* 统计信息 */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">分析文章数</span>
                  <span className="font-medium text-gray-900">{record.totalArticles}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">平均阅读量</span>
                  <span className="font-medium text-gray-900">{record.avgReadCount.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">平均点赞量</span>
                  <span className="font-medium text-gray-900">{record.avgLikeCount.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">平均互动率</span>
                  <span className="font-medium text-primary-600">{record.avgInteractionRate}%</span>
                </div>
              </div>

              {/* 操作按钮 */}
              <div className="mt-4 pt-4 border-t border-gray-200 flex space-x-2">
                <button
                  onClick={() => viewDetail(record)}
                  className="flex-1 btn btn-primary text-sm py-2"
                >
                  查看详情
                </button>
                <button
                  onClick={() => reAnalyze(record.keyword)}
                  className="flex-1 btn btn-secondary text-sm py-2"
                >
                  重新分析
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 详情模态框 */}
      {showDetail && selectedRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">分析详情</h2>
                <button
                  onClick={() => setShowDetail(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {/* 基本信息 */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-2">{selectedRecord.keyword}</h3>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span>分析时间: {formatDate(selectedRecord.searchTime)}</span>
                  <span>文章数量: {selectedRecord.totalArticles}</span>
                </div>
              </div>

              {/* 高频词云 */}
              {selectedRecord.wordCloud && selectedRecord.wordCloud.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 mb-3">高频词云</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedRecord.wordCloud.slice(0, 10).map((word, index) => (
                      <span
                        key={word.text}
                        className={`px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-sm ${
                          index < 3 ? 'font-semibold' : ''
                        }`}
                      >
                        {word.text} ({word.count})
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* 分析洞察 */}
              {selectedRecord.insights && selectedRecord.insights.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 mb-3">分析洞察</h4>
                  <div className="space-y-2">
                    {selectedRecord.insights.map((insight, index) => (
                      <div key={index} className="flex items-start space-x-2">
                        <BarChart3Icon className="w-4 h-4 text-primary-500 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-gray-700">{insight}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 文章列表 */}
              {selectedRecord.articles && selectedRecord.articles.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">热门文章</h4>
                  <div className="space-y-3">
                    {selectedRecord.articles.slice(0, 5).map((article) => (
                      <div key={article.id} className="border-l-4 border-primary-500 pl-3">
                        <h5 className="font-medium text-gray-900 text-sm mb-1 line-clamp-2">
                          {article.title}
                        </h5>
                        <div className="flex items-center space-x-3 text-xs text-gray-500">
                          <span>{article.wxName}</span>
                          <span>阅读: {article.readCount.toLocaleString()}</span>
                          <span>点赞: {article.likeCount.toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}