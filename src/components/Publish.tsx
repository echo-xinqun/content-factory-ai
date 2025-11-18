'use client';

import { useState, useEffect } from 'react';
import {
  EditIcon,
  EyeIcon,
  TrashIcon,
  SearchIcon,
  FilterIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon
} from 'lucide-react';
import PlatformIcon from './PlatformIcons';

const platforms = [
  { id: 'xiaohongshu', name: '小红书', color: 'red' },
  { id: 'wechat', name: '公众号', color: 'green' },
  { id: 'douyin', name: '抖音', color: 'blue' },
  { id: 'video', name: '视频号', color: 'purple' }
];

const statusFilters = [
  { value: 'all', label: '全部' },
  { value: 'draft', label: '草稿' },
  { value: 'pending', label: '待发布' },
  { value: 'published', label: '已发布' },
  { value: 'failed', label: '发布失败' }
];

export default function Publish() {
  const [articles, setArticles] = useState([]);
  const [selectedArticles, setSelectedArticles] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [isLoading, setIsLoading] = useState(true);

  // 加载文章数据
  useEffect(() => {
    loadArticles();
  }, []);

  const loadArticles = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/articles');
      const data = await response.json();

      if (data.success) {
        setArticles(data.data);
      } else {
        console.error('加载文章失败:', data.error);
        // 如果加载失败，显示空数组而不是错误页面
        setArticles([]);
      }
    } catch (error) {
      console.error('加载文章失败:', error);
      setArticles([]);
    } finally {
      setIsLoading(false);
    }
  };

  // 过滤和排序文章
  const filteredArticles = articles
    .filter(article => {
      const matchesSearch = article.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || article.status.type === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        case 'title':
          return a.title.localeCompare(b.title);
        case 'status':
          return a.status.type.localeCompare(b.status.type);
        default:
          return 0;
      }
    });

  const handleSelectAll = () => {
    if (selectedArticles.length === filteredArticles.length) {
      setSelectedArticles([]);
    } else {
      setSelectedArticles(filteredArticles.map(article => article.id));
    }
  };

  const handleSelectArticle = (articleId: string) => {
    setSelectedArticles(prev =>
      prev.includes(articleId)
        ? prev.filter(id => id !== articleId)
        : [...prev, articleId]
    );
  };

  const handlePublish = (articleId: string, platformId: string) => {
    alert(`正在发布文章到${platforms.find(p => p.id === platformId)?.name}...`);
  };

  const handleEdit = (articleId: string) => {
    // 跳转到编辑页面
    window.location.href = `/edit/${articleId}`;
  };

  const handleView = (articleId: string) => {
    // 实现预览功能 - 打开预览模态框或新页面
    const article = articles.find(a => a.id === articleId);
    if (article) {
      // 创建一个预览窗口
      const previewWindow = window.open('', '_blank', 'width=800,height=600');
      if (previewWindow) {
        previewWindow.document.write(`
          <html>
            <head>
              <title>${article.title} - 预览</title>
              <meta charset="utf-8">
              <style>
                body { font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; }
                h1 { color: #333; border-bottom: 1px solid #eee; padding-bottom: 10px; }
                .meta { color: #666; font-size: 14px; margin-bottom: 20px; }
                .status { padding: 4px 8px; border-radius: 4px; font-size: 12px; }
                .draft { background: #f0f0f0; color: #666; }
                .published { background: #d4edda; color: #155724; }
                .archived { background: #fff3cd; color: #856404; }
              </style>
            </head>
            <body>
              <h1>${article.title}</h1>
              <div class="meta">
                <span class="status ${article.status.type}">${article.status.label}</span>
                <span style="margin-left: 10px;">创建时间: ${article.createdAt}</span>
                <span style="margin-left: 10px;">更新时间: ${article.updatedAt}</span>
              </div>
              <div>${article.content}</div>
            </body>
          </html>
        `);
        previewWindow.document.close();
      }
    }
  };

  const handleDelete = async (articleId: string) => {
    if (confirm('确定要删除这篇文章吗？')) {
      try {
        const response = await fetch(`/api/articles/${articleId}`, {
          method: 'DELETE'
        });

        if (response.ok) {
          setArticles(prev => prev.filter(article => article.id !== articleId));
          setSelectedArticles(prev => prev.filter(id => id !== articleId));
        } else {
          alert('删除失败，请重试');
        }
      } catch (error) {
        console.error('删除文章失败:', error);
        alert('删除失败，请重试');
      }
    }
  };

  const handleBatchDelete = () => {
    if (selectedArticles.length === 0) return;

    if (confirm(`确定要删除选中的 ${selectedArticles.length} 篇文章吗？`)) {
      setArticles(prev => prev.filter(article => !selectedArticles.includes(article.id)));
      setSelectedArticles([]);
    }
  };

  const getStatusIcon = (statusType: string) => {
    switch (statusType) {
      case 'published':
        return <CheckCircleIcon className="w-4 h-4 text-green-500" />;
      case 'pending':
        return <ClockIcon className="w-4 h-4 text-yellow-500" />;
      case 'failed':
        return <XCircleIcon className="w-4 h-4 text-red-500" />;
      default:
        return <EditIcon className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: { type: string; label: string; color: string }) => {
    const colorClasses: Record<string, string> = {
      gray: 'bg-gray-100 text-gray-800',
      yellow: 'bg-yellow-100 text-yellow-800',
      green: 'bg-green-100 text-green-800',
      red: 'bg-red-100 text-red-800'
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClasses[status.color] || 'bg-gray-100 text-gray-800'}`}>
        {getStatusIcon(status.type)}
        <span className="ml-1">{status.label}</span>
      </span>
    );
  };

  const getPlatformBadge = (platformId: string) => {
    const platform = platforms.find(p => p.id === platformId);
    if (!platform) return null;

    const colorClasses: Record<string, string> = {
      red: 'bg-red-100 text-red-800',
      green: 'bg-green-100 text-green-800',
      blue: 'bg-blue-100 text-blue-800',
      purple: 'bg-purple-100 text-purple-800'
    };

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${colorClasses[platform.color] || 'bg-gray-100 text-gray-800'}`}>
        {platform.name}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">发布管理</h1>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <span>草稿: {articles.filter(a => a.status.type === 'draft').length}</span>
          <span>待发布: {articles.filter(a => a.status.type === 'pending').length}</span>
        </div>
      </div>

      {/* 筛选和搜索 */}
      <div className="card">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
            <div className="flex items-center space-x-2">
              <FilterIcon className="w-4 h-4 text-gray-500" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                {statusFilters.map(filter => (
                  <option key={filter.value} value={filter.value}>{filter.label}</option>
                ))}
              </select>
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="date">按时间排序</option>
              <option value="title">按标题排序</option>
              <option value="status">按状态排序</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="搜索文章..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 文章列表 */}
      <div className="card">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <span className="ml-3 text-gray-600">正在加载文章...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4">
                    <input
                      type="checkbox"
                      checked={selectedArticles.length === filteredArticles.length && filteredArticles.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">标题</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">状态</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">发布平台</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">创建时间</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredArticles.map((article) => (
                  <tr key={article.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <input
                        type="checkbox"
                        checked={selectedArticles.includes(article.id)}
                        onChange={() => handleSelectArticle(article.id)}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <div className="max-w-xs">
                        <p className="text-sm font-medium text-gray-900 truncate">{article.title}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {getStatusBadge(article.status)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1">
                        {article.platforms.length > 0 ? (
                          article.platforms.map(platformId => (
                            <div key={platformId}>
                              {getPlatformBadge(platformId)}
                            </div>
                          ))
                        ) : (
                          <span className="text-gray-400 text-xs">未发布</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {article.createdAt}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEdit(article.id)}
                          className="p-1 text-gray-600 hover:text-primary-600 transition-colors"
                          title="编辑"
                        >
                          <EditIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleView(article.id)}
                          className="p-1 text-gray-600 hover:text-primary-600 transition-colors"
                          title="预览"
                        >
                          <EyeIcon className="w-4 h-4" />
                        </button>

                        {article.status.type === 'draft' || article.status.type === 'pending' ? (
                          <div className="flex items-center space-x-1">
                            {platforms.map(platform => (
                              <button
                                key={platform.id}
                                onClick={() => handlePublish(article.id, platform.id)}
                                className="p-1 text-gray-600 hover:text-primary-600 transition-colors flex items-center justify-center"
                                title={`发布到${platform.name}`}
                              >
                                <PlatformIcon platformId={platform.id} className="w-4 h-4" />
                              </button>
                            ))}
                          </div>
                        ) : null}

                        <button
                          onClick={() => handleDelete(article.id)}
                          className="p-1 text-gray-600 hover:text-red-600 transition-colors"
                          title="删除"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {filteredArticles.length === 0 && !isLoading && (
          <div className="text-center py-8">
            <p className="text-gray-600">没有找到符合条件的文章</p>
          </div>
        )}

        {selectedArticles.length > 0 && !isLoading && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                已选择 {selectedArticles.length} 篇文章
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={handleBatchDelete}
                  className="btn btn-danger flex items-center space-x-2"
                >
                  <TrashIcon className="w-4 h-4" />
                  <span>批量删除</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}