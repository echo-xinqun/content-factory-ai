'use client';

import { useState } from 'react';
import { PenToolIcon, Image as ImageIcon, SaveIcon, SendIcon } from 'lucide-react';

// 模拟选题数据
const mockTopics = [
  'AI技术在医疗领域的应用前景',
  '2024年人工智能发展趋势预测',
  '机器学习在金融风控中的实践',
  '深度学习框架对比分析',
  'AI芯片技术发展现状与展望'
];

// 模拟Unsplash图片数据
const mockImages = [
  'https://images.unsplash.com/photo-1677756119517-756a178d02d5?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&h=600&fit=crop',
];

export default function Create() {
  const [selectedTopic, setSelectedTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState('');
  const [title, setTitle] = useState('');
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const handleGenerate = () => {
    if (!selectedTopic) return;

    setIsGenerating(true);

    // 模拟AI生成内容
    setTimeout(() => {
      const mockGeneratedTitle = `关于${selectedTopic}的深度分析`;
      const mockGeneratedContent = `
# ${mockGeneratedTitle}

在当今快速发展的科技时代，${selectedTopic}已经成为行业关注的焦点。本文将从多个维度深入探讨这一话题。

## 引言

随着技术的不断进步和应用场景的不断拓展，${selectedTopic}正在深刻改变着我们的生活和工作方式。本文将全面分析其发展现状、应用前景以及面临的挑战。

## 现状分析

目前，${selectedTopic}已经取得了显著的进展。在技术层面，相关算法和架构不断优化，性能大幅提升。在应用层面，各个行业都在积极探索和实践，涌现出许多成功的案例。

## 应用前景

展望未来，${selectedTopic}具有广阔的发展前景：

1. **技术创新**：随着研究的深入，我们可以期待更多突破性的技术进展
2. **产业应用**：更多传统行业将受益于相关技术的应用
3. **社会影响**：对社会生产和生活方式产生深远影响

## 挑战与机遇

当然，${selectedTopic}的发展也面临着一些挑战：

- 技术成熟度有待提高
- 标准化和规范化需要完善
- 人才培养和储备不足

但同时，这些挑战也带来了巨大的机遇：

- 市场需求旺盛
- 政策支持力度大
- 投资热度持续高涨

## 结论

综上所述，${selectedTopic}作为一个新兴领域，具有巨大的发展潜力和广阔的应用前景。我们应该抓住机遇，迎接挑战，推动这一领域的健康发展。

在未来，我们期待看到更多创新性的应用和突破性的进展，为社会发展做出更大贡献。
      `;

      setTitle(mockGeneratedTitle);
      setGeneratedContent(mockGeneratedContent);
      setSelectedImages([mockImages[0], mockImages[1]]); // 自动选择相关图片
      setIsGenerating(false);
    }, 3000);
  };

  const handleSaveDraft = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      alert('草稿已保存！');
    }, 1000);
  };

  const handleAddToPublish = () => {
    alert('文章已添加到发布管理！');
  };

  const toggleImage = (image: string) => {
    setSelectedImages(prev =>
      prev.includes(image)
        ? prev.filter(img => img !== image)
        : [...prev, image]
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">内容创作</h1>
      </div>

      {/* 选题选择 */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">选题选择</h2>
        <select
          value={selectedTopic}
          onChange={(e) => setSelectedTopic(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        >
          <option value="">请选择一个选题...</option>
          {mockTopics.map((topic) => (
            <option key={topic} value={topic}>{topic}</option>
          ))}
        </select>
      </div>

      {/* AI创作区域 */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">AI创作</h2>
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !selectedTopic}
            className="btn btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <PenToolIcon className="w-4 h-4" />
            <span>{isGenerating ? '生成中...' : '一键AI创作'}</span>
          </button>
        </div>

        {isGenerating && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              <span className="text-blue-700">正在基于选题生成内容...</span>
            </div>
            <div className="mt-3">
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '70%' }}></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 图片选择 */}
      {generatedContent && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            <ImageIcon className="w-5 h-5 inline mr-2" />
            相关图片
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {mockImages.map((image, index) => (
              <div
                key={index}
                className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                  selectedImages.includes(image)
                    ? 'border-primary-500 shadow-lg'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => toggleImage(image)}
              >
                <img
                  src={image}
                  alt={`相关图片 ${index + 1}`}
                  className="w-full h-32 object-cover"
                />
                {selectedImages.includes(image) && (
                  <div className="absolute top-2 right-2 bg-primary-500 text-white rounded-full p-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>
          <p className="text-sm text-gray-600 mt-3">点击图片选择/取消选择，选中的图片将插入到文章中</p>
        </div>
      )}

      {/* 文章预览/编辑 */}
      {generatedContent && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">文章预览/编辑</h2>

          {/* 标题编辑 */}
          <div className="mb-4">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 text-xl font-semibold border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="文章标题"
            />
          </div>

          {/* 内容预览 */}
          <div className="prose max-w-none">
            <div className="bg-gray-50 rounded-lg p-6 min-h-[400px] whitespace-pre-wrap">
              {selectedImages.length > 0 && (
                <div className="mb-4 grid grid-cols-2 gap-4">
                  {selectedImages.map((image, index) => (
                    <img
                      key={index}
                      src={image}
                      alt={`文章图片 ${index + 1}`}
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  ))}
                </div>
              )}
              <div className="text-gray-800">{generatedContent}</div>
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex justify-between items-center mt-6">
            <div className="flex space-x-3">
              <button
                onClick={handleSaveDraft}
                disabled={isSaving}
                className="btn btn-secondary flex items-center space-x-2 disabled:opacity-50"
              >
                <SaveIcon className="w-4 h-4" />
                <span>{isSaving ? '保存中...' : '保存草稿'}</span>
              </button>
            </div>
            <button
              onClick={handleAddToPublish}
              className="btn btn-primary flex items-center space-x-2"
            >
              <SendIcon className="w-4 h-4" />
              <span>添加到发布管理</span>
            </button>
          </div>
        </div>
      )}

      {!generatedContent && (
        <div className="card text-center py-12">
          <PenToolIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">开始AI创作</h3>
          <p className="text-gray-600">选择一个选题，让AI为您生成高质量的内容</p>
        </div>
      )}
    </div>
  );
}