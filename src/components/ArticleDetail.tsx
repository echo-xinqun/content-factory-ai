'use client';

import { useEffect } from 'react';
import {
  XIcon,
  ExternalLinkIcon,
  CalendarIcon,
  UserIcon,
  EyeIcon,
  HeartIcon,
  ThumbsUpIcon
} from 'lucide-react';
import { ArticleData } from '@/types/api';

interface ArticleDetailProps {
  article: ArticleData | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ArticleDetail({ article, isOpen, onClose }: ArticleDetailProps) {
  // ESC键关闭模态框
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // 防止背景滚动
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!article || !isOpen) return null;

  // 格式化内容，将换行符转换为段落
  const formatContent = (content: string) => {
    // 按双换行符分割段落
    const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim());

    if (paragraphs.length > 1) {
      return (
        <div className="space-y-4">
          {paragraphs.map((paragraph, index) => (
            <p key={index} className="text-gray-700 leading-relaxed text-base">
              {paragraph.trim()}
            </p>
          ))}
        </div>
      );
    }

    // 如果没有明显的段落分隔，按单换行符分割
    const lines = content.split('\n').filter(line => line.trim());
    return (
      <div className="space-y-2">
        {lines.map((line, index) => (
          <p key={index} className="text-gray-700 leading-relaxed text-base">
            {line.trim()}
          </p>
        ))}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* 背景遮罩 */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* 模态框容器 */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-4xl bg-white rounded-xl shadow-2xl">
          {/* 头部 */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl">
            <div className="flex items-start justify-between">
              <div className="flex-1 pr-4">
                <h1 className="text-2xl font-bold text-gray-900 mb-2 leading-tight">
                  {article.title}
                </h1>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <div className="flex items-center space-x-1">
                    <UserIcon className="w-4 h-4" />
                    <span>{article.wxName}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <CalendarIcon className="w-4 h-4" />
                    <span>{article.publishTime}</span>
                  </div>
                  {article.isOriginal && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-md">
                      原创
                    </span>
                  )}
                </div>
              </div>

              {/* 关闭按钮 */}
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
              >
                <XIcon className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          </div>

          {/* 文章内容 */}
          <div className="px-6 py-6">
            {/* 统计信息 */}
            <div className="flex items-center space-x-6 mb-6 pb-4 border-b border-gray-100">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <EyeIcon className="w-4 h-4" />
                <span>阅读 {article.readCount.toLocaleString()}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <HeartIcon className="w-4 h-4" />
                <span>点赞 {article.likeCount.toLocaleString()}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <ThumbsUpIcon className="w-4 h-4" />
                <span>互动率 {article.interactiveRate}%</span>
              </div>
            </div>

            {/* 正文内容 */}
            <div className="prose prose-sm max-w-none">
              {formatContent(article.content)}
            </div>
          </div>

          {/* 底部操作栏 */}
          <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 rounded-b-xl">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                文章来源：{article.wxName}
              </div>

              {/* 查看原文按钮 */}
              <a
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <span>查看原文</span>
                <ExternalLinkIcon className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}