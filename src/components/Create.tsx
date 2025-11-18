'use client';

import { useState, useEffect } from 'react';
import {
  PenToolIcon,
  Image as ImageIcon,
  SaveIcon,
  SendIcon,
  SearchIcon,
  TrendingUpIcon,
  SettingsIcon,
  ChevronDownIcon
} from 'lucide-react';

// 类型定义
interface InsightReport {
  id: number;
  keyword: string;
  searchTime: number;
  totalArticles: number;
  createdAt: number;
  recommendedTopics: TopicRecommendation[];
  stats: {
    totalInsights: number;
    avgConfidence: number;
    opportunitiesCount: number;
    sentimentScore: number;
  };
}

interface TopicRecommendation {
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  potential: 'high' | 'medium' | 'low';
  category: string;
  source: 'trend' | 'opportunity' | 'sentiment' | 'keyword';
  confidence: number;
  keywords: string[];
  targetAudience: string;
  estimatedReadTime: number;
}

interface GenerationParams {
  length: number;
  innovation: 'conservative' | 'moderate' | 'innovative';
  professional: 'beginner' | 'professional' | 'expert';
  audience: 'general' | 'industry' | 'professional';
}

interface GeneratedContent {
  title: string;
  content: string;
  imagePrompts: string[];
  metadata: {
    keyword: string;
    selectedTopic: string;
    generationParams: GenerationParams;
    generatedAt: number;
    wordCount: number;
  };
}

// 配图风格选项
const imageStyles = [
  { id: 'tech', name: '科技风格', icon: '📱' },
  { id: 'business', name: '商务风格', icon: '🏢' },
  { id: 'education', name: '教育风格', icon: '📚' },
  { id: 'nature', name: '自然风格', icon: '🌍' },
  { id: 'creative', name: '创意风格', icon: '🎭' },
  { id: 'lifestyle', name: '生活风格', icon: '🏠' }
];

// 模拟图片URL生成 - 使用SVG占位图避免外部依赖
const generateMockImageUrl = (prompt: string, index: number) => {
  const seed = `${prompt}_${index}_${Date.now()}`.replace(/[^a-zA-Z0-9]/g, '_');
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect fill='%23f3f4f6' width='400' height='300'/%3E%3Cg fill='%239ca3af' text-anchor='middle' font-family='Arial, sans-serif'%3E%3Ctext x='200' y='150' font-size='18'%3E🖼️ AI生成图片 ${index + 1}%3C/text%3E%3Ctext x='200' y='180' font-size='12'%3E${seed.substring(0, 20)}...%3C/text%3E%3C/g%3E%3C/svg%3E`;
};

export default function Create() {
  // 基础状态
  const [insightSource, setInsightSource] = useState<'ai_insight' | 'custom'>('ai_insight');
  const [customKeyword, setCustomKeyword] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  // 数据状态
  const [insightReports, setInsightReports] = useState<InsightReport[]>([]);
  const [selectedInsight, setSelectedInsight] = useState<InsightReport | null>(null);
  const [recommendedTopics, setRecommendedTopics] = useState<TopicRecommendation[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<TopicRecommendation | null>(null);

  // 配置状态
  const [imageStyle, setImageStyle] = useState('tech');
  const [generationParams, setGenerationParams] = useState<GenerationParams>({
    length: 2000,
    innovation: 'moderate',
    professional: 'professional',
    audience: 'industry'
  });

  // 生成状态
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationStatus, setGenerationStatus] = useState('');
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [imageLoadErrors, setImageLoadErrors] = useState<Set<number>>(new Set());
  const [isSaving, setIsSaving] = useState(false);

  // 图片生成状态
  const [isGeneratingImages, setIsGeneratingImages] = useState(false);
  const [imageGenerationProgress, setImageGenerationProgress] = useState(0);
  const [imageGenerationStatus, setImageGenerationStatus] = useState('');
  const [imageCount, setImageCount] = useState(3);
  const [separateImageGeneration, setSeparateImageGeneration] = useState(false);
  const [imagePrompts, setImagePrompts] = useState<Array<{index: number; prompt: string; description: string}>>([]);
  const [generatedImageUrls, setGeneratedImageUrls] = useState<Array<{index: number; url: string; description: string; error?: boolean}>>([]);

  // 加载洞察报告
  useEffect(() => {
    loadInsightReports();
  }, []);

  const loadInsightReports = async () => {
    try {
      const response = await fetch('/api/insights');

      // 检查响应状态
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // 检查内容类型
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('响应不是有效的JSON格式');
      }

      const data = await response.json();

      if (data.success) {
        setInsightReports(data.data);
      }
    } catch (error) {
      console.error('加载洞察报告失败:', error);
      // 设置为空数组以避免应用崩溃
      setInsightReports([]);
    }
  };

  // 当选择洞察报告时，加载对应的选题推荐
  useEffect(() => {
    if (selectedInsight && insightSource === 'ai_insight') {
      loadTopicRecommendations(selectedInsight.id);
    } else {
      setRecommendedTopics([]);
    }
  }, [selectedInsight, insightSource]);

  const loadTopicRecommendations = async (insightId: number) => {
    try {
      const response = await fetch(`/api/insights/${insightId}/topics`);

      // 检查响应状态
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // 检查内容类型
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('响应不是有效的JSON格式');
      }

      const data = await response.json();

      if (data.success) {
        setRecommendedTopics(data.data.recommendedTopics);
      }
    } catch (error) {
      console.error('加载选题推荐失败:', error);
      // 设置为空数组以避免应用崩溃
      setRecommendedTopics([]);
    }
  };

  // 自定义关键词分析
  const handleCustomKeywordAnalysis = async () => {
    if (!customKeyword.trim()) return;

    try {
      // 这里可以调用API来分析自定义关键词
      // 目前先生成模拟的推荐选题
      const mockTopics: TopicRecommendation[] = [
        {
          title: `${customKeyword}现状与发展趋势分析`,
          description: `深入分析${customKeyword}当前的发展状况和未来趋势`,
          difficulty: 'medium',
          potential: 'high',
          category: 'trend',
          source: 'keyword',
          confidence: 0.85,
          keywords: [customKeyword, '发展趋势', '现状分析'],
          targetAudience: '行业关注者',
          estimatedReadTime: 8
        }
      ];

      setRecommendedTopics(mockTopics);
    } catch (error) {
      console.error('分析自定义关键词失败:', error);
    }
  };

  // 开始AI生成内容
  const handleGenerate = async () => {
    if (!selectedTopic) {
      alert('请先选择一个选题');
      return;
    }

    setIsGenerating(true);
    setGenerationProgress(0);
    setGenerationStatus('正在准备生成参数...');

    try {
      // 模拟进度更新
      const progressInterval = setInterval(() => {
        setGenerationProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + Math.random() * 20;
        });
      }, 800);

      setGenerationStatus('正在调用AI生成内容...');

      const keyword = insightSource === 'ai_insight'
        ? selectedInsight?.keyword || ''
        : customKeyword;

      const response = await fetch('/api/content/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          keyword,
          selectedTopic: selectedTopic.title,
          insightData: selectedInsight?.aiAnalysis || null,
          generationParams
        })
      });

      clearInterval(progressInterval);
      setGenerationProgress(100);
      setGenerationStatus('内容生成完成！');

      const data = await response.json();

      if (data.success) {
        setGeneratedContent(data.data);

        // 重置图片相关状态
        setImageLoadErrors(new Set());
        setImagePrompts([]);
        setGeneratedImageUrls([]);

        if (separateImageGeneration) {
          // 分离模式：先生成文章，后生成图片
          setGenerationStatus('文章生成完成，可以生成配图了');
        } else {
          // 集成模式：自动生成图片
          setGenerationStatus('正在生成图片提示词...');
          await generateImagesForContent(data.data);
        }
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('AI生成失败:', error);
      alert('AI生成失败，请重试');
      setGenerationStatus('生成失败，请重试');
    } finally {
      setIsGenerating(false);
      setTimeout(() => {
        setGenerationProgress(0);
        setGenerationStatus('');
      }, 2000);
    }
  };

  // 保存草稿
  const handleSaveDraft = async () => {
    if (!generatedContent) return;

    setIsSaving(true);
    try {
      const response = await fetch('/api/articles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: generatedContent.title || selectedTopic?.title || customKeyword || '未命名文章',
          content: generatedContent.content,
          status: 'draft',
          selectedImages: selectedImages,
          topicTitle: selectedTopic?.title,
          topicDescription: selectedTopic?.description,
          insightKeyword: selectedInsight?.keyword || customKeyword
        })
      });

      const data = await response.json();

      if (data.success) {
        alert(`草稿保存成功！文章ID: ${data.data.id}`);
      } else {
        throw new Error(data.error || '保存草稿失败');
      }
    } catch (error) {
      console.error('保存草稿失败:', error);
      alert('保存失败，请重试');
    } finally {
      setIsSaving(false);
    }
  };

  // 发布内容
  const handlePublish = async () => {
    if (!generatedContent) return;

    // 先保存草稿，然后显示成功消息
    await handleSaveDraft();
    alert('内容已添加到发布管理！');
  };

  // 切换图片选择
  const toggleImage = (imageUrl: string) => {
    setSelectedImages(prev =>
      prev.includes(imageUrl)
        ? prev.filter(img => img !== imageUrl)
        : [...prev, imageUrl]
    );
  };

  // 为内容生成图片
  const generateImagesForContent = async (content: GeneratedContent) => {
    try {
      setIsGeneratingImages(true);
      setImageGenerationProgress(0);
      setImageGenerationStatus('正在生成图片提示词...');

      // 步骤1：生成图片提示词
      const promptsResponse = await fetch('/api/image-prompts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: content.content,
          style: imageStyle,
          count: imageCount
        })
      });

      const promptsData = await promptsResponse.json();
      if (!promptsData.success) {
        throw new Error(promptsData.error || '生成图片提示词失败');
      }

      setImagePrompts(promptsData.data);
      setImageGenerationProgress(30);
      setImageGenerationStatus('正在生成图片...');

      // 步骤2：调用硅基流动API生成图片
      const imagesResponse = await fetch('/api/images/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompts: promptsData.data,
          style: imageStyle
        })
      });

      const imagesData = await imagesResponse.json();

      if (imagesData.success && imagesData.data) {
        setGeneratedImageUrls(imagesData.data);
        setImageGenerationProgress(100);
        setImageGenerationStatus('图片生成完成！');

        // 默认选择前2张图片
        const defaultImages = imagesData.data
          .filter(img => !img.error)
          .slice(0, 2)
          .map(img => img.url);
        setSelectedImages(defaultImages);

      } else {
        // 使用降级方案
        const fallbackImages = imagesData.fallbackData || [];
        setGeneratedImageUrls(fallbackImages);

        const fallbackUrls = fallbackImages.slice(0, 2).map(img => img.url);
        setSelectedImages(fallbackUrls);

        setImageGenerationStatus('图片生成失败，使用占位图');
      }

    } catch (error) {
      console.error('生成图片失败:', error);
      setImageGenerationStatus('图片生成失败，请稍后重试');

      // 生成占位图作为降级方案
      const placeholderImages = Array.from({ length: imageCount }, (_, i) => ({
        index: i,
        url: generateMockImageUrl(`placeholder_${i}`, i),
        description: `图片 ${i + 1}`,
        error: true
      }));
      setGeneratedImageUrls(placeholderImages);

    } finally {
      setIsGeneratingImages(false);
    }
  };

  // 手动生成图片（分离模式）
  const handleGenerateImages = async () => {
    if (!generatedContent) {
      alert('请先生成文章内容');
      return;
    }

    await generateImagesForContent(generatedContent);
  };

  // 过滤洞察报告
  const filteredReports = insightReports.filter(report =>
    report.keyword.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 获取置信度星级显示
  const getConfidenceStars = (confidence: number) => {
    const stars = Math.round(confidence * 5);
    return '⭐'.repeat(Math.min(stars, 5));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">📝 内容创作</h1>
      </div>

      <div className="flex gap-6">
        {/* 左侧创作配置区域 (35%) */}
        <div className="w-[35%] space-y-6">
          {/* 选择洞察来源 */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <TrendingUpIcon className="w-5 h-5 mr-2" />
              🔍 选择洞察来源
            </h2>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="flex items-center space-x-3">
                  <input
                    type="radio"
                    value="ai_insight"
                    checked={insightSource === 'ai_insight'}
                    onChange={(e) => setInsightSource(e.target.value as 'ai_insight' | 'custom')}
                    className="text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-gray-700">从AI洞察报告选择</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="radio"
                    value="custom"
                    checked={insightSource === 'custom'}
                    onChange={(e) => setInsightSource(e.target.value as 'ai_insight' | 'custom')}
                    className="text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-gray-700">自定义选题</span>
                </label>
              </div>

              {insightSource === 'ai_insight' ? (
                <div className="space-y-3">
                  <div className="relative">
                    <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="🔍 搜索洞察报告..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setShowDropdown(true);
                      }}
                      onFocus={() => setShowDropdown(true)}
                      onBlur={() => {
                        // 延迟隐藏，以便点击选项能生效
                        setTimeout(() => setShowDropdown(false), 200);
                      }}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  {/* 下拉列表 - 只在showDropdown为true且有内容时显示 */}
                  {showDropdown && (searchQuery || filteredReports.length > 0) && (
                    <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                      {filteredReports.length > 0 ? (
                        filteredReports.map(report => (
                          <div
                            key={report.id}
                            onMouseDown={() => {
                              setSelectedInsight(report);
                              setSearchQuery(report.keyword);
                              setShowDropdown(false);
                            }}
                            className={`p-3 border-b border-gray-100 cursor-pointer transition-colors last:border-b-0 ${
                              selectedInsight?.id === report.id
                                ? 'bg-primary-50 border-primary-200'
                                : 'hover:bg-gray-50'
                            }`}
                          >
                            <div className="font-medium text-gray-900">{report.keyword}</div>
                            <div className="text-sm text-gray-500 mt-1">
                              {report.totalArticles} 篇文章 | {getConfidenceStars(report.stats.avgConfidence)} {Math.round(report.stats.avgConfidence * 100)}%
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-3 text-gray-500 text-center">
                          没有找到匹配的洞察报告
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <textarea
                    placeholder="💬 请输入自定义关键词..."
                    value={customKeyword}
                    onChange={(e) => setCustomKeyword(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                    rows={3}
                  />
                  <button
                    onClick={handleCustomKeywordAnalysis}
                    disabled={!customKeyword.trim()}
                    className="w-full btn btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    分析关键词
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* 选择推荐选题 */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              🎯 选择推荐选题
            </h2>

            {recommendedTopics.length > 0 ? (
              <div className="space-y-3">
                <select
                  value={selectedTopic?.title || ''}
                  onChange={(e) => {
                    const topic = recommendedTopics.find(t => t.title === e.target.value);
                    setSelectedTopic(topic || null);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">▼ 选择推荐选题...</option>
                  {recommendedTopics.map((topic, index) => (
                    <option key={index} value={topic.title}>
                      {topic.title} (置信度: {Math.round(topic.confidence * 100)}%)
                    </option>
                  ))}
                </select>

                {selectedTopic && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-700">
                      <p><strong>描述：</strong>{selectedTopic.description}</p>
                      <p className="mt-2"><strong>目标受众：</strong>{selectedTopic.targetAudience}</p>
                      <p><strong>预计阅读时间：</strong>{selectedTopic.estimatedReadTime}分钟</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                {insightSource === 'ai_insight'
                  ? '请先选择一个洞察报告'
                  : '请先分析自定义关键词'
                }
              </div>
            )}
          </div>

          {/* 选择配图风格 */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              🎨 选择配图风格
            </h2>

            <div className="grid grid-cols-3 gap-2">
              {imageStyles.map(style => (
                <button
                  key={style.id}
                  onClick={() => setImageStyle(style.id)}
                  className={`p-3 rounded-lg border-2 transition-colors ${
                    imageStyle === style.id
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-2xl text-center">{style.icon}</div>
                  <div className="text-xs text-center mt-1">{style.name}</div>
                </button>
              ))}
            </div>
          </div>

          {/* 图片生成配置 */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <ImageIcon className="w-5 h-5 mr-2" />
              🖼️ 图片生成配置
            </h2>

            <div className="space-y-4">
              {/* 生图模式 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  🎯 生图模式
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="integrated"
                      checked={!separateImageGeneration}
                      onChange={(e) => setSeparateImageGeneration(e.target.value !== 'integrated')}
                      className="mr-2"
                    />
                    <span className="text-sm">集成模式（自动生图）</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="separate"
                      checked={separateImageGeneration}
                      onChange={(e) => setSeparateImageGeneration(e.target.value === 'separate')}
                      className="mr-2"
                    />
                    <span className="text-sm">分离模式（手动生图）</span>
                  </label>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  集成模式：生成文章后自动生成配图 | 分离模式：先生成文章，手动触发配图
                </p>
              </div>

              {/* 图片数量 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  📸 图片数量: {imageCount}张
                </label>
                <input
                  type="range"
                  min="1"
                  max="6"
                  step="1"
                  value={imageCount}
                  onChange={(e) => setImageCount(parseInt(e.target.value))}
                  className="w-full"
                  disabled={isGeneratingImages}
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>1张</span>
                  <span>6张</span>
                </div>
              </div>

              {/* 手动生图按钮（分离模式） */}
              {separateImageGeneration && generatedContent && (
                <div className="pt-2">
                  <button
                    onClick={handleGenerateImages}
                    disabled={isGeneratingImages}
                    className="w-full btn btn-primary flex items-center justify-center space-x-2 disabled:opacity-50"
                  >
                    {isGeneratingImages ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>生成中...</span>
                      </>
                    ) : (
                      <>
                        <ImageIcon className="w-4 h-4" />
                        <span>生成配图</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* 图片生成进度 */}
              {isGeneratingImages && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">{imageGenerationStatus}</span>
                    <span className="text-gray-600">{imageGenerationProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${imageGenerationProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 生成参数配置 */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <SettingsIcon className="w-5 h-5 mr-2" />
              ⚙️ 生成参数配置
            </h2>

            <div className="space-y-4">
              {/* 文章长度 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  📏 文章长度: {generationParams.length}字
                </label>
                <input
                  type="range"
                  min="1000"
                  max="5000"
                  step="500"
                  value={generationParams.length}
                  onChange={(e) => setGenerationParams(prev => ({ ...prev, length: parseInt(e.target.value) }))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>1000字</span>
                  <span>5000字</span>
                </div>
              </div>

              {/* 创新程度 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  💡 创新程度
                </label>
                <div className="space-y-2">
                  {[
                    { value: 'conservative', label: '保守创新' },
                    { value: 'moderate', label: '中等创新' },
                    { value: 'innovative', label: '高度创新' }
                  ].map(option => (
                    <label key={option.value} className="flex items-center space-x-3">
                      <input
                        type="radio"
                        value={option.value}
                        checked={generationParams.innovation === option.value}
                        onChange={(e) => setGenerationParams(prev => ({
                          ...prev,
                          innovation: e.target.value as 'conservative' | 'moderate' | 'innovative'
                        }))}
                        className="text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-gray-700">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* 专业深度 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  🎓 专业深度
                </label>
                <div className="flex space-x-2">
                  {[
                    { value: 'beginner', label: '入门级' },
                    { value: 'professional', label: '专业级' },
                    { value: 'expert', label: '专家级' }
                  ].map(option => (
                    <button
                      key={option.value}
                      onClick={() => setGenerationParams(prev => ({
                        ...prev,
                        professional: option.value as 'beginner' | 'professional' | 'expert'
                      }))}
                      className={`flex-1 py-2 px-3 rounded-lg border ${
                        generationParams.professional === option.value
                          ? 'border-primary-500 bg-primary-50 text-primary-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 目标受众 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  👥 目标受众
                </label>
                <select
                  value={generationParams.audience}
                  onChange={(e) => setGenerationParams(prev => ({
                    ...prev,
                    audience: e.target.value as 'general' | 'industry' | 'professional'
                  }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="general">🧑 普通用户</option>
                  <option value="industry">👔 行业从业者</option>
                  <option value="professional">🎓 专业人士</option>
                </select>
              </div>

              {/* 开始AI创作按钮 */}
              <button
                onClick={handleGenerate}
                disabled={!selectedTopic || isGenerating}
                className="w-full btn btn-primary flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <PenToolIcon className="w-4 h-4" />
                <span>{isGenerating ? 'AI生成中...' : '🚀 开始AI创作'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* 右侧内容预览与编辑区域 (65%) */}
        <div className="w-[65%] space-y-6">
          {generatedContent ? (
            <>
              {/* 标题编辑 */}
              <div className="card">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">📋 标题编辑</h2>
                <input
                  type="text"
                  value={generatedContent.title}
                  onChange={(e) => setGeneratedContent(prev =>
                    prev ? { ...prev, title: e.target.value } : null
                  )}
                  className="w-full px-4 py-3 text-lg font-semibold border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="文章标题"
                />
              </div>

              {/* 配图预览 */}
              <div className="card">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <ImageIcon className="w-5 h-5 mr-2" />
                  🖼️ 配图预览
                  {generatedImageUrls.length > 0 && (
                    <span className="ml-2 text-sm text-gray-500">({generatedImageUrls.filter(img => !img.error).length}/{generatedImageUrls.length})</span>
                  )}
                </h2>

                {generatedImageUrls.length > 0 ? (
                  <>
                    <div className="grid grid-cols-3 gap-4">
                      {generatedImageUrls.map((imageData, index) => {
                        const hasError = imageData.error || false;
                        return (
                          <div
                            key={index}
                            onClick={() => !hasError && toggleImage(imageData.url)}
                            className={`relative rounded-lg overflow-hidden border-2 transition-all ${
                              hasError
                                ? 'border-red-200 cursor-not-allowed opacity-60'
                                : selectedImages.includes(imageData.url)
                                ? 'border-primary-500 shadow-lg cursor-pointer'
                                : 'border-gray-200 hover:border-gray-300 cursor-pointer'
                            }`}
                          >
                            {hasError ? (
                              <div className="w-full h-32 bg-gray-100 flex flex-col items-center justify-center">
                                <div className="text-3xl mb-2">⚠️</div>
                                <div className="text-xs text-gray-500 text-center px-2">图片生成失败</div>
                              </div>
                            ) : (
                              <>
                                <img
                                  src={imageData.url}
                                  alt={`AI生成图片 ${index + 1}`}
                                  className="w-full h-32 object-cover"
                                  onError={() => {
                                    setImageLoadErrors(prev => new Set(prev).add(index));
                                  }}
                                  onLoad={() => {
                                    setImageLoadErrors(prev => {
                                      const newSet = new Set(prev);
                                      newSet.delete(index);
                                      return newSet;
                                    });
                                  }}
                                />
                                {selectedImages.includes(imageData.url) && (
                                  <div className="absolute top-2 right-2 bg-primary-500 text-white rounded-full p-1">
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  </div>
                                )}
                              </>
                            )}
                            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-2 text-center">
                              {imageStyles.find(s => s.id === imageStyle)?.icon} {imageStyles.find(s => s.id === imageStyle)?.name}
                            </div>
                            <div className="absolute top-2 left-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
                              图片 {imageData.index + 1}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* 重新生成按钮 */}
                    <div className="mt-4 flex justify-center">
                      <button
                        onClick={() => generatedContent && generateImagesForContent(generatedContent)}
                        disabled={isGeneratingImages}
                        className="btn btn-secondary flex items-center space-x-2 disabled:opacity-50"
                      >
                        <ImageIcon className="w-4 h-4" />
                        <span>🔄 重新生成图片</span>
                      </button>
                    </div>

                    <p className="text-sm text-gray-600 mt-3">点击图片选择/取消选择，选中的图片将插入到文章中</p>
                  </>
                ) : generatedContent && separateImageGeneration ? (
                  <div className="text-center py-8 text-gray-500">
                    <ImageIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p className="mb-4">还没有生成配图</p>
                    <button
                      onClick={handleGenerateImages}
                      disabled={isGeneratingImages}
                      className="btn btn-primary"
                    >
                      {isGeneratingImages ? '生成中...' : '开始生成配图'}
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <div className="animate-pulse">
                      <ImageIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>请先选择选题并生成文章内容</p>
                      <p className="text-sm mt-2">图片将在文章生成后自动创建</p>
                    </div>
                  </div>
                )}
              </div>

              {/* 内容预览 */}
              <div className="card">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">📄 内容预览</h2>

                <div className="prose max-w-none">
                  <div className="bg-gray-50 rounded-lg p-6 min-h-[500px]">
                    {/* 插入选中的图片 */}
                    {selectedImages.length > 0 && (
                      <div className="mb-6">
                        <div className="text-sm font-medium text-gray-700 mb-3">📸 选中的配图：</div>
                        <div className="grid grid-cols-2 gap-4">
                          {selectedImages.map((image, index) => (
                            <div key={index} className="relative group">
                              <img
                                src={image}
                                alt={`文章图片 ${index + 1}`}
                                className="w-full h-48 object-cover rounded-lg border border-gray-200"
                                onError={(e) => {
                                  e.currentTarget.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect fill='%23fee2e2' width='400' height='300'/%3E%3Cg fill='%23dc2626' text-anchor='middle' font-family='Arial, sans-serif'%3E%3Ctext x='200' y='150' font-size='16'%3E⚠️ 图片加载失败%3C/text%3E%3C/g%3E%3C/svg%3E`;
                                }}
                              />
                              <div className="absolute bottom-2 left-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
                                图片 {index + 1}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 显示Markdown格式的内容 */}
                    <div className="whitespace-pre-wrap text-gray-800">
                      {generatedContent.content}
                    </div>
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
                      <span>{isSaving ? '保存中...' : '💾 保存草稿'}</span>
                    </button>
                    <button className="btn btn-secondary flex items-center space-x-2">
                      <PenToolIcon className="w-4 h-4" />
                      <span>🔄 重新生成</span>
                    </button>
                  </div>
                  <button
                    onClick={handlePublish}
                    className="btn btn-primary flex items-center space-x-2"
                  >
                    <SendIcon className="w-4 h-4" />
                    <span>📤 发布到平台</span>
                  </button>
                </div>
              </div>

              {/* 生成进度显示 */}
              {isGenerating && (
                <div className="card bg-blue-50 border-blue-200">
                  <h2 className="text-lg font-semibold text-blue-900 mb-4">⚙️ 生成进度</h2>
                  <div className="space-y-3">
                    <div className="w-full bg-blue-200 rounded-full h-3">
                      <div
                        className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                        style={{ width: `${generationProgress}%` }}
                      />
                    </div>
                    <p className="text-blue-700">
                      ⚡ {generationStatus}
                    </p>
                    {generationProgress > 0 && generationProgress < 100 && (
                      <p className="text-blue-600 text-sm">
                        进度: {Math.round(generationProgress)}%
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* 图片生成进度 */}
              {isGeneratingImages && (
                <div className="card bg-green-50 border-green-200">
                  <h2 className="text-lg font-semibold text-green-900 mb-4">🖼️ 图片生成进度</h2>
                  <div className="space-y-3">
                    <div className="w-full bg-green-200 rounded-full h-3">
                      <div
                        className="bg-green-600 h-3 rounded-full transition-all duration-300"
                        style={{ width: `${imageGenerationProgress}%` }}
                      />
                    </div>
                    <p className="text-green-700">
                      🎨 {imageGenerationStatus}
                    </p>
                    {imageGenerationProgress > 0 && imageGenerationProgress < 100 && (
                      <p className="text-green-600 text-sm">
                        图片生成进度: {Math.round(imageGenerationProgress)}%
                      </p>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            /* 初始状态提示 */
            <div className="card text-center py-16">
              <div className="text-6xl mb-6">🎨</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">准备开始AI创作</h3>
              <div className="text-gray-600 space-y-2 max-w-md mx-auto">
                <p>请按照以下步骤开始创作：</p>
                <div className="text-left space-y-1 mt-4">
                  <p>1. 选择洞察来源：从AI洞察报告选择或自定义选题</p>
                  <p>2. 选择推荐选题：根据洞察报告选择合适选题</p>
                  <p>3. 配置生成参数：调整文章长度、创新程度、专业深度等</p>
                  <p>4. 选择配图风格：选择符合文章风格的图片类型</p>
                  <p>5. 点击"🚀 开始AI创作"按钮</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}