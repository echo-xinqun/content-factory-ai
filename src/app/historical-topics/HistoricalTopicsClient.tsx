'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { SearchIcon, FilterIcon, EyeIcon, CalendarIcon, TrendingUpIcon, TrashIcon } from 'lucide-react';
import { SearchHistory } from '@/models/SearchHistory';

export default function HistoricalTopicsClient() {
  const [records, setRecords] = useState<SearchHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteLoading, setDeleteLoading] = useState<number | null>(null);

  // 加载历史选题记录
  const loadHistoricalTopics = async (search?: string) => {
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
        console.error('Failed to load historical topics:', result.error);
      }
    } catch (error) {
      console.error('Error loading historical topics:', error);
    } finally {
      setLoading(false);
    }
  };

  // 删除记录
  const deleteRecord = async (id: number) => {
    try {
      setDeleteLoading(id);
      const response = await fetch(`/api/search-history?id=${id}`, {
        method: 'DELETE'
      });
      const result = await response.json();

      if (result.success) {
        await loadHistoricalTopics(searchTerm);
      } else {
        console.error('Failed to delete record:', result.error);
      }
    } catch (error) {
      console.error('Error deleting record:', error);
    } finally {
      setDeleteLoading(null);
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

  // 格式化数字
  const formatNumber = (num: number) => {
    if (num >= 10000) {
      return (num / 10000).toFixed(1) + 'w';
    }
    return num.toLocaleString();
  };

  useEffect(() => {
    loadHistoricalTopics();
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadHistoricalTopics(searchTerm);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  return (
    <div>
      {/* 页面标题 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <h1 className="text-2xl font-bold text-gray-900">历史选题</h1>
          <span className="text-sm text-gray-500">共 {records.length} 条记录</span>
        </div>
        <Link
          href="/analysis"
          className="btn btn-primary flex items-center space-x-2"
        >
          <TrendingUpIcon className="w-4 h-4" />
          <span>新建选题分析</span>
        </Link>
      </div>

      {/* 搜索和筛选 */}
      <div className="card mb-6">
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
          <button className="btn btn-outline flex items-center space-x-2">
            <FilterIcon className="w-4 h-4" />
            <span>筛选</span>
          </button>
        </div>
      </div>

      {/* 数据表格 */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  选题名称
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  分析时间
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  文章数量
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  平均阅读量
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  平均点赞量
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  平均互动率
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="flex items-center justify-center space-x-3">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500"></div>
                      <span className="text-gray-500">加载中...</span>
                    </div>
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="text-center">
                      <TrendingUpIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">暂无历史选题</h3>
                      <p className="text-gray-600 mb-4">开始选题分析后，历史记录将显示在这里</p>
                      <Link
                        href="/analysis"
                        className="btn btn-primary"
                      >
                        开始分析
                      </Link>
                    </div>
                  </td>
                </tr>
              ) : (
                records.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8 bg-primary-100 rounded-full flex items-center justify-center">
                          <TrendingUpIcon className="w-4 h-4 text-primary-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {record.keyword}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-500">
                        <CalendarIcon className="w-4 h-4 mr-2" />
                        {formatDate(record.searchTime)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{record.totalArticles}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{formatNumber(record.avgReadCount)}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{formatNumber(record.avgLikeCount)}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        record.avgInteractionRate > 10
                          ? 'bg-green-100 text-green-800'
                          : record.avgInteractionRate > 5
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {record.avgInteractionRate}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <Link
                          href={`/analysis-detail/${record.id}`}
                          className="text-primary-600 hover:text-primary-900 flex items-center space-x-1"
                        >
                          <EyeIcon className="w-4 h-4" />
                          <span>查看</span>
                        </Link>
                        <button
                          onClick={() => deleteRecord(record.id)}
                          disabled={deleteLoading === record.id}
                          className="text-red-600 hover:text-red-900 flex items-center space-x-1 disabled:opacity-50"
                        >
                          {deleteLoading === record.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                          ) : (
                            <TrashIcon className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}