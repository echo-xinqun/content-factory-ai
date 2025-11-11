'use client';

import { useState, useEffect } from 'react';
import {
  XIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  Loader2Icon,
  ClockIcon,
  FileTextIcon,
  BrainIcon,
  TargetIcon
} from 'lucide-react';

interface AIAnalysisProgressProps {
  isVisible: boolean;
  progress: number;
  currentStep: string;
  error?: string;
  onCancel?: () => void;
  searchId?: string;
  totalArticles?: number;
  processedArticles?: number;
}

interface StepInfo {
  id: string;
  title: string;
  icon: React.ReactNode;
  status: 'pending' | 'processing' | 'completed' | 'error';
}

export default function AIAnalysisProgress({
  isVisible,
  progress,
  currentStep,
  error,
  onCancel,
  searchId,
  totalArticles = 5,
  processedArticles = 0
}: AIAnalysisProgressProps) {
  const [estimatedTime, setEstimatedTime] = useState<number>(0);
  const [currentArticle, setCurrentArticle] = useState<string>('');

  // 分析步骤定义
  const steps: StepInfo[] = [
    {
      id: 'select',
      title: '选择分析文章',
      icon: <FileTextIcon className="w-4 h-4" />,
      status: progress >= 20 ? 'completed' : progress >= 10 ? 'processing' : 'pending'
    },
    {
      id: 'analyze',
      title: '分析文章内容',
      icon: <BrainIcon className="w-4 h-4" />,
      status: progress >= 50 ? 'completed' : progress >= 20 ? 'processing' : 'pending'
    },
    {
      id: 'insights',
      title: '生成选题洞察',
      icon: <TargetIcon className="w-4 h-4" />,
      status: progress >= 70 ? 'completed' : progress >= 50 ? 'processing' : 'pending'
    },
    {
      id: 'sentiment',
      title: '分析情感倾向',
      icon: <ClockIcon className="w-4 h-4" />,
      status: progress >= 85 ? 'completed' : progress >= 70 ? 'processing' : 'pending'
    },
    {
      id: 'opportunities',
      title: '识别市场机会',
      icon: <TargetIcon className="w-4 h-4" />,
      status: progress >= 95 ? 'completed' : progress >= 85 ? 'processing' : 'pending'
    },
    {
      id: 'complete',
      title: '整合分析结果',
      icon: <CheckCircleIcon className="w-4 h-4" />,
      status: progress >= 100 ? 'completed' : progress >= 95 ? 'processing' : 'pending'
    }
  ];

  // 估算剩余时间
  useEffect(() => {
    if (progress < 100 && progress > 0) {
      const estimatedSeconds = Math.ceil((100 - progress) * 2.5); // 估算每1%需要2.5秒
      setEstimatedTime(estimatedSeconds);
    } else {
      setEstimatedTime(0);
    }
  }, [progress]);

  // 模拟当前处理的文章（实际应用中应该从API获取）
  useEffect(() => {
    if (progress >= 20 && progress < 50 && totalArticles > 0) {
      const articleIndex = Math.min(
        Math.floor(((progress - 20) / 30) * totalArticles),
        totalArticles - 1
      );
      setCurrentArticle(`第 ${articleIndex + 1} 篇文章`);
    }
  }, [progress, totalArticles]);

  if (!isVisible) return null;

  const getStatusIcon = (status: StepInfo['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'processing':
        return <Loader2Icon className="w-5 h-5 text-blue-500 animate-spin" />;
      case 'error':
        return <AlertCircleIcon className="w-5 h-5 text-red-500" />;
      default:
        return <ClockIcon className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: StepInfo['status']) => {
    switch (status) {
      case 'completed':
        return 'text-green-600';
      case 'processing':
        return 'text-blue-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <BrainIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">AI深度分析进行中</h3>
              <p className="text-sm text-gray-500">搜索ID: {searchId}</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {error ? (
            /* 错误状态 */
            <div className="text-center py-8">
              <AlertCircleIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-red-800 mb-2">分析出现错误</h4>
              <p className="text-red-600 mb-4">{error}</p>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={onCancel}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  取消分析
                </button>
                <button
                  onClick={() => {
                    if (typeof window !== 'undefined') {
                      window.location.reload();
                    }
                  }}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  重试
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* 进度条 */}
              <div className="mb-6">
                <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                  <span>分析进度</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {/* 分析步骤 */}
              <div className="space-y-4 mb-6">
                {steps.map((step, index) => (
                  <div key={step.id} className="flex items-center space-x-3">
                    <div className={getStatusColor(step.status)}>
                      {getStatusIcon(step.status)}
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${
                        step.status === 'completed' ? 'text-green-700' :
                        step.status === 'processing' ? 'text-blue-700' :
                        step.status === 'error' ? 'text-red-700' : 'text-gray-500'
                      }`}>
                        {step.title}
                      </p>
                      {step.status === 'processing' && step.id === 'analyze' && (
                        <p className="text-xs text-gray-500 mt-1">
                          {currentArticle}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* 当前状态详情 */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">当前状态:</span>
                  <span className="font-medium text-gray-900">{currentStep}</span>
                </div>

                {progress < 100 && (
                  <div className="mt-3 text-sm text-gray-600">
                    {estimatedTime > 0 && (
                      <p>预计剩余时间: {estimatedTime}秒</p>
                    )}
                    {processedArticles > 0 && (
                      <p>已分析文章: {processedArticles}/{totalArticles} 篇</p>
                    )}
                  </div>
                )}
              </div>

              {/* 操作选项 */}
              <div className="flex justify-center">
                <button
                  onClick={onCancel}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  取消分析
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}