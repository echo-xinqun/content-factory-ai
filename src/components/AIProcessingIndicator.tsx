'use client';

import { useEffect } from 'react';
import {
  BrainIcon,
  LoaderIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  ClockIcon
} from 'lucide-react';
import { AIProcessingState } from '@/types/aiInsights';

interface AIProcessingIndicatorProps {
  state: AIProcessingState;
  className?: string;
}

export default function AIProcessingIndicator({
  state,
  className = ''
}: AIProcessingIndicatorProps) {
  const [animatedProgress, setAnimatedProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setAnimatedProgress(prev => {
        const diff = state.progress - prev;
        if (Math.abs(diff) <= 1) {
          clearInterval(timer);
          return state.progress;
        }
        return prev + Math.sign(diff) * Math.min(Math.abs(diff), 2);
      });
    }, 50);

    return () => clearInterval(timer);
  }, [state.progress]);

  const getStatusIcon = () => {
    switch (state.status) {
      case 'processing':
        return <LoaderIcon className="w-5 h-5 animate-spin text-blue-500" />;
      case 'completed':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircleIcon className="w-5 h-5 text-red-500" />;
      default:
        return <ClockIcon className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = () => {
    switch (state.status) {
      case 'processing':
        return 'border-blue-200 bg-blue-50';
      case 'completed':
        return 'border-green-200 bg-green-50';
      case 'error':
        return 'border-red-200 bg-red-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const getProgressColor = () => {
    if (state.status === 'error') return 'bg-red-500';
    if (state.status === 'completed') return 'bg-green-500';
    return 'bg-blue-500';
  };

  if (state.status === 'idle' || state.status === 'completed') {
    return null;
  }

  return (
    <div className={`fixed top-4 right-4 z-50 ${className}`}>
      <div className={`border rounded-lg shadow-lg p-4 min-w-80 ${getStatusColor()}`}>
        {/* 头部 */}
        <div className="flex items-center space-x-3 mb-3">
          <div className="flex items-center justify-center w-10 h-10 bg-white rounded-full">
            {getStatusIcon()}
          </div>
          <div className="flex-1">
            <h4 className="font-medium text-gray-900">AI分析进行中</h4>
            <p className="text-sm text-gray-600">{state.currentStep}</p>
          </div>
        </div>

        {/* 进度条 */}
        <div className="mb-3">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
            <span>进度</span>
            <span>{animatedProgress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ease-out ${getProgressColor()}`}
              style={{ width: `${animatedProgress}%` }}
            />
          </div>
        </div>

        {/* 时间信息 */}
        {state.startTime && (
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>开始时间: {new Date(state.startTime).toLocaleTimeString()}</span>
            {state.endTime && (
              <span>
                耗时: {((state.endTime - state.startTime) / 1000).toFixed(1)}s
              </span>
            )}
          </div>
        )}

        {/* 错误信息 */}
        {state.error && (
          <div className="mt-3 p-2 bg-red-100 border border-red-200 rounded text-sm text-red-700">
            {state.error}
          </div>
        )}
      </div>
    </div>
  );
}

// 简化的内联处理指示器
export function CompactAIProcessingIndicator({
  state,
  className = ''
}: {
  state: AIProcessingState;
  className?: string;
}) {
  if (state.status === 'idle' || state.status === 'completed') {
    return null;
  }

  return (
    <div className={`flex items-center space-x-2 text-sm ${className}`}>
      <BrainIcon className="w-4 h-4 animate-pulse text-blue-500" />
      <span className="text-gray-600">AI分析中...</span>
      <span className="text-gray-500">({state.progress}%)</span>
    </div>
  );
}

// 全屏处理覆盖层
export function AIProcessingOverlay({
  state,
  className = ''
}: {
  state: AIProcessingState;
  className?: string;
}) {
  if (state.status === 'idle' || state.status === 'completed') {
    return null;
  }

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${className}`}>
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full mx-4">
        {/* 图标和标题 */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <BrainIcon className="w-8 h-8 text-blue-500 animate-pulse" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">AI分析进行中</h3>
          <p className="text-gray-600 text-center">{state.currentStep}</p>
        </div>

        {/* 进度条 */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
            <span>分析进度</span>
            <span>{state.progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="h-3 rounded-full bg-blue-500 transition-all duration-300 ease-out"
              style={{ width: `${state.progress}%` }}
            />
          </div>
        </div>

        {/* 步骤指示器 */}
        <div className="space-y-2 mb-6">
          {[
            { step: '准备数据', progress: 10 },
            { step: '分析文章', progress: 30 },
            { step: '生成洞察', progress: 70 },
            { step: '完成分析', progress: 100 }
          ].map(({ step, progress }) => (
            <div
              key={step}
              className={`flex items-center space-x-3 text-sm ${
                state.progress >= progress ? 'text-blue-600' : 'text-gray-400'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full border-2 ${
                  state.progress >= progress
                    ? 'bg-blue-500 border-blue-500'
                    : 'border-gray-300'
                }`}
              />
              <span>{step}</span>
            </div>
          ))}
        </div>

        {/* 时间信息 */}
        <div className="text-center text-sm text-gray-500">
          开始时间: {state.startTime && new Date(state.startTime).toLocaleTimeString()}
          {state.endTime && (
            <span className="block mt-1">
              耗时: {((state.endTime - state.startTime) / 1000).toFixed(1)}秒
            </span>
          )}
        </div>

        {/* 错误信息 */}
        {state.error && (
          <div className="mt-4 p-3 bg-red-100 border border-red-200 rounded text-sm text-red-700">
            <div className="flex items-center space-x-2">
              <AlertCircleIcon className="w-4 h-4" />
              <span>分析失败</span>
            </div>
            <p className="mt-1">{state.error}</p>
          </div>
        )}
      </div>
    </div>
  );
}