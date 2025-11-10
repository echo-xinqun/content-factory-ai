'use client';

import { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import {
  TrendingUpIcon,
  EyeIcon,
  HeartIcon,
  CheckCircleIcon,
  SearchIcon,
  PenToolIcon,
  ClipboardListIcon,
  BarChart3Icon,
  DatabaseIcon
} from 'lucide-react';

// 模拟数据
const trendData = [
  { date: '一', count: 12 },
  { date: '二', count: 15 },
  { date: '三', count: 8 },
  { date: '四', count: 20 },
  { date: '五', count: 18 },
  { date: '六', count: 25 },
  { date: '日', count: 10 },
];

const platformData = [
  { name: '小红书', value: 45, count: 70 },
  { name: '公众号', value: 30, count: 47 },
  { name: '抖音', value: 20, count: 31 },
  { name: '视频号', value: 5, count: 8 },
];

const COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'];

const activities = [
  {
    id: 1,
    type: 'success',
    title: '文章《xxx》已发布到小红书',
    description: '2小时前'
  },
  {
    id: 2,
    type: 'info',
    title: '完成选题分析："AI行业趋势"',
    description: '5小时前'
  },
  {
    id: 3,
    type: 'warning',
    title: '文章《xxx》发布失败',
    description: '昨天'
  }
];

const hotTopics = [
  { name: 'AI技术应用', rate: 12.3 },
  { name: '数字化转型', rate: 10.8 },
  { name: '行业分析', rate: 9.5 },
  { name: '产品评测', rate: 8.9 },
  { name: '趋势预测', rate: 8.2 },
];

const bestArticles = [
  { title: 'AI改变生活的10种方式', reads: '15.2k', likes: 892 },
  { title: '2024年科技趋势预测', reads: '12.8k', likes: 756 },
  { title: '数字化转型实战指南', reads: '10.5k', likes: 623 },
];

export default function Dashboard() {
  const [trendPeriod, setTrendPeriod] = useState('week');

  const StatCard = ({ icon: Icon, title, value, change, changeType }: any) => (
    <div className="stat-card">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-semibold text-gray-900 mt-1">{value}</p>
          <div className={`flex items-center mt-2 text-sm ${
            changeType === 'positive' ? 'text-green-600' : 'text-red-600'
          }`}>
            <Icon className="w-4 h-4 mr-1" />
            {change}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">内容工厂仪表盘</h1>
      </div>

      {/* 数据概览 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={TrendingUpIcon}
          title="总文章数"
          value="156"
          change="+12 本周"
          changeType="positive"
        />
        <StatCard
          icon={EyeIcon}
          title="总阅读量"
          value="25.6k"
          change="+3.2k 本周"
          changeType="positive"
        />
        <StatCard
          icon={HeartIcon}
          title="互动率"
          value="8.5%"
          change="+1.2% 本周"
          changeType="positive"
        />
        <StatCard
          icon={CheckCircleIcon}
          title="发布成功率"
          value="92%"
          change="+5% 本周"
          changeType="positive"
        />
      </div>

      {/* 快速操作 */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">快速操作</h2>
        <div className="flex justify-around items-center gap-4">
          <button className="flex items-center space-x-3 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors group">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
              <SearchIcon className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-sm font-medium text-gray-700">新建选题分析</span>
          </button>

          <button className="flex items-center space-x-3 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors group">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
              <PenToolIcon className="w-5 h-5 text-green-600" />
            </div>
            <span className="text-sm font-medium text-gray-700">AI创作文章</span>
          </button>

          <button className="flex items-center space-x-3 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors group">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors">
              <ClipboardListIcon className="w-5 h-5 text-purple-600" />
            </div>
            <span className="text-sm font-medium text-gray-700">查看发布队列</span>
          </button>

          <button className="flex items-center space-x-3 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors group">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center group-hover:bg-orange-200 transition-colors">
              <BarChart3Icon className="w-5 h-5 text-orange-600" />
            </div>
            <span className="text-sm font-medium text-gray-700">查看详细报告</span>
          </button>

          <button
            onClick={() => window.location.href = '/history'}
            className="flex items-center space-x-3 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors group"
          >
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center group-hover:bg-indigo-200 transition-colors">
              <DatabaseIcon className="w-5 h-5 text-indigo-600" />
            </div>
            <span className="text-sm font-medium text-gray-700">分析历史</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 内容生产趋势图 */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">内容生产趋势图</h2>
            <div className="flex space-x-2">
              {['日', '周', '月'].map((period) => (
                <button
                  key={period}
                  onClick={() => setTrendPeriod(period)}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    trendPeriod === period
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {period}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ fill: '#3b82f6', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
          <p className="text-sm text-gray-600 mt-4">总计: 68篇</p>
        </div>

        {/* 发布平台分布 */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">发布平台分布</h2>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={platformData}
                cx="50%"
                cy="50%"
                outerRadius={70}
                fill="#8884d8"
                dataKey="value"
                label={({ name, value }) => `${name} ${value}%`}
              >
                {platformData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 space-y-2">
            {platformData.map((platform, index) => (
              <div key={platform.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center">
                  <div
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: COLORS[index] }}
                  />
                  <span>{platform.name}</span>
                </div>
                <span className="text-gray-600">{platform.count}篇</span>
              </div>
            ))}
          </div>
          <p className="text-sm text-gray-600 mt-4 text-center">总计: 156篇</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 最近活动 */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">最近活动</h2>
            <button className="btn btn-secondary px-4 py-2 text-sm">查看全部活动</button>
          </div>
          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3">
                <div className={`w-2 h-2 rounded-full mt-2 ${
                  activity.type === 'success' ? 'bg-green-500' :
                  activity.type === 'warning' ? 'bg-yellow-500' :
                  activity.type === 'error' ? 'bg-red-500' : 'bg-blue-500'
                }`} />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                  <p className="text-xs text-gray-500">{activity.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 热门选题与表现 */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">热门选题与表现</h2>

          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">🔥 本周热门选题 TOP 5</h3>
            <div className="space-y-2">
              {hotTopics.map((topic, index) => (
                <div key={topic.name} className="flex items-center justify-between text-sm p-2 hover:bg-gray-50 rounded">
                  <span className="text-gray-900 font-medium">{index + 1}. {topic.name}</span>
                  <span className="text-gray-600 font-medium">互动率 {topic.rate}%</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">📈 最佳表现文章</h3>
            <div className="space-y-3">
              {bestArticles.map((article, index) => (
                <div key={index} className="text-sm p-3 bg-gray-50 rounded-lg">
                  <p className="text-gray-900 font-medium mb-1">{article.title}</p>
                  <div className="flex items-center space-x-4 text-xs text-gray-600">
                    <span className="flex items-center">
                      <EyeIcon className="w-3 h-3 mr-1" />
                      阅读 {article.reads}
                    </span>
                    <span className="flex items-center">
                      <HeartIcon className="w-3 h-3 mr-1" />
                      点赞 {article.likes}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}