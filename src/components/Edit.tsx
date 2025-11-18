'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { SaveIcon, ArrowLeftIcon, EyeIcon, BoldIcon, ItalicIcon, ListIcon, ListOrderedIcon, Heading1Icon, Heading2Icon, Heading3Icon } from 'lucide-react';
import MDEditor from '@uiw/react-md-editor';

export default function Edit() {
  const params = useParams();
  const router = useRouter();
  const articleId = params?.id as string;

  const [article, setArticle] = useState({
    title: '',
    content: ''
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (articleId) {
      loadArticle();
    }
  }, [articleId]);

  const loadArticle = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/articles');
      const data = await response.json();

      if (data.success) {
        const foundArticle = data.data.find((a: any) => a.id === articleId);
        if (foundArticle) {
          setArticle({
            title: foundArticle.title || '',
            content: foundArticle.content || ''
          });
        } else {
          alert('文章不存在');
          router.push('/publish');
        }
      } else {
        alert('加载文章失败');
        router.push('/publish');
      }
    } catch (error) {
      console.error('加载文章失败:', error);
      alert('加载文章失败');
      router.push('/publish');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!article.title.trim() || !article.content.trim()) {
      alert('标题和内容不能为空');
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(`/api/articles/${articleId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: article.title.trim(),
          content: article.content.trim(),
          status: 'draft'
        })
      });

      const data = await response.json();

      if (data.success) {
        alert('保存成功');
        router.push('/publish');
      } else {
        alert('保存失败: ' + (data.error || '未知错误'));
      }
    } catch (error) {
      console.error('保存失败:', error);
      alert('保存失败，请重试');
    } finally {
      setIsSaving(false);
    }
  };

  const formatContent = (content: string) => {
    // 微信公众号文章格式化
    return content
      .replace(/\n/g, '<br>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/^# (.*$)/gm, '<h1 style="font-size: 24px; font-weight: bold; margin: 20px 0; color: #333;">$1</h1>')
      .replace(/^## (.*$)/gm, '<h2 style="font-size: 20px; font-weight: bold; margin: 16px 0; color: #444;">$1</h2>')
      .replace(/^### (.*$)/gm, '<h3 style="font-size: 18px; font-weight: bold; margin: 14px 0; color: #555;">$1</h3>')
      .replace(/^\d+\. (.*$)/gm, '<div style="margin: 8px 0; padding-left: 20px;">$1</div>')
      .replace(/^- (.*$)/gm, '<div style="margin: 8px 0; padding-left: 20px;">• $1</div>');
  };

  const insertMarkdown = (prefix: string, suffix: string, placeholder: string) => {
    const textarea = document.querySelector('textarea');
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = textarea.value;
      const selectedText = text.substring(start, end) || placeholder;

      const newText = text.substring(0, start) + prefix + selectedText + suffix + text.substring(end);

      // 创建新的输入事件
      const event = new Event('input', { bubbles: true });
      (textarea as HTMLTextAreaElement).value = newText;
      textarea.dispatchEvent(event);

      // 设置新的光标位置
      const newCursorPos = start + prefix.length + selectedText.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
      textarea.focus();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-3 text-gray-600">正在加载文章...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-4">
        {/* 顶部工具栏 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/publish')}
                className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeftIcon className="w-4 h-4" />
                <span>返回</span>
              </button>

              <div className="h-6 w-px bg-gray-300"></div>

              <span className="text-sm text-gray-500">编辑文章</span>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowPreview(!showPreview)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  showPreview
                    ? 'bg-primary-100 text-primary-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <EyeIcon className="w-4 h-4" />
                <span>{showPreview ? '编辑' : '预览'}</span>
              </button>

              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <SaveIcon className="w-4 h-4" />
                <span>{isSaving ? '保存中...' : '保存'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* 编辑区域 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {!showPreview ? (
            /* 编辑模式 */
            <div className="p-6">
              {/* 标题编辑 */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  文章标题
                </label>
                <input
                  type="text"
                  value={article.title}
                  onChange={(e) => setArticle(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="请输入文章标题"
                  className="w-full px-4 py-3 text-lg font-medium border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  style={{ fontSize: '18px', fontWeight: '500' }}
                />
              </div>

              {/* 内容编辑 - 使用 Markdown 编辑器 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  文章内容
                </label>
                <div className="border border-gray-300 rounded-lg overflow-hidden">
                  <MDEditor
                    value={article.content}
                    onChange={(value) => setArticle(prev => ({ ...prev, content: value || '' }))}
                    height={400}
                    preview="edit"
                    hideToolbar={false}
                    textareaProps={{
                      placeholder: "请输入文章内容，支持Markdown格式...",
                      style: { fontSize: '16px', lineHeight: '1.6' }
                    }}
                    data-color-mode="light"
                  />
                </div>
              </div>

              {/* 快捷工具栏 */}
              <div className="mt-4 flex flex-wrap gap-2">
                <div className="text-sm text-gray-600">
                  <strong>快捷工具：</strong>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => insertMarkdown('**', '**', '粗体文字')}
                    className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm flex items-center space-x-1"
                  >
                    <BoldIcon className="w-3 h-3" />
                    <span>粗体</span>
                  </button>
                  <button
                    onClick={() => insertMarkdown('*', '*', '斜体文字')}
                    className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm flex items-center space-x-1"
                  >
                    <ItalicIcon className="w-3 h-3" />
                    <span>斜体</span>
                  </button>
                  <button
                    onClick={() => insertMarkdown('# ', '', '一级标题')}
                    className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm flex items-center space-x-1"
                  >
                    <Heading1Icon className="w-3 h-3" />
                    <span>H1</span>
                  </button>
                  <button
                    onClick={() => insertMarkdown('## ', '', '二级标题')}
                    className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm flex items-center space-x-1"
                  >
                    <Heading2Icon className="w-3 h-3" />
                    <span>H2</span>
                  </button>
                  <button
                    onClick={() => insertMarkdown('### ', '', '三级标题')}
                    className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm flex items-center space-x-1"
                  >
                    <Heading3Icon className="w-3 h-3" />
                    <span>H3</span>
                  </button>
                  <button
                    onClick={() => insertMarkdown('- ', '', '无序列表项')}
                    className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm flex items-center space-x-1"
                  >
                    <ListIcon className="w-3 h-3" />
                    <span>列表</span>
                  </button>
                  <button
                    onClick={() => insertMarkdown('1. ', '', '有序列表项')}
                    className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm flex items-center space-x-1"
                  >
                    <ListOrderedIcon className="w-3 h-3" />
                    <span>有序</span>
                  </button>
                </div>
              </div>

              {/* Markdown 语法提示 */}
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Markdown 语法提示：</strong>
                  <br />
                  • 标题：# ## ### （一级到三级标题）
                  <br />
                  • 文本格式：**粗体** *斜体* `代码`
                  <br />
                  • 列表：- 无序列表  /  1. 有序列表
                  <br />
                  • 链接：[链接文字](URL)
                  <br />
                  • 图片：![图片描述](图片URL)
                  <br />
                  • 引用：&gt; 引用文字
                  <br />
                  • 分割线：---
                </p>
              </div>
            </div>
          ) : (
            /* 预览模式 - 微信公众号风格 */
            <div className="p-8" style={{ minHeight: '600px' }}>
              <div
                className="wechat-article"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Helvetica Neue", "PingFang SC", "Microsoft YaHei", sans-serif',
                  fontSize: '16px',
                  lineHeight: '1.7',
                  color: '#333',
                  maxWidth: '677px',
                  margin: '0 auto',
                  padding: '20px',
                  backgroundColor: '#fff',
                  borderRadius: '8px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}
                dangerouslySetInnerHTML={{
                  __html: `
                    <h1 style="
                      font-size: 22px;
                      font-weight: bold;
                      margin: 0 0 20px 0;
                      color: #333;
                      text-align: center;
                      line-height: 1.4;
                    ">${article.title || '无标题'}</h1>
                    <div style="
                      font-size: 16px;
                      line-height: 1.7;
                      color: #333;
                      word-wrap: break-word;
                    ">${formatContent(article.content)}</div>
                  `
                }}
              />
            </div>
          )}
        </div>

        {/* 底部信息 */}
        <div className="mt-4 text-center text-sm text-gray-500">
          <p>提示：预览模式采用微信公众号风格显示，保存后将返回发布管理页面</p>
        </div>
      </div>
    </div>
  );
}