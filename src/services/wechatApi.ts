import { ApifoxModel, Datum, ArticleData, ApiRequestParams } from '@/types/api';

// API配置
const API_CONFIG = {
    baseUrl: 'https://www.dajiala.com/fbmain/monitor/v3/kw_search',
    apiKey: 'JZL0a2b0298ebcb567c'
};

/**
 * 获取公众号文章数据
 */
export async function fetchWeChatArticles(keyword: string, page: number = 1): Promise<ArticleData[]> {
    try {
        const requestBody: ApiRequestParams = {
            kw: keyword,
            sort_type: 1,
            mode: 1,
            period: 7,
            page: page,
            key: API_CONFIG.apiKey,
            any_kw: '',
            ex_kw: '',
            verifycode: '',
            type: 1
        };

        // 使用代理API来避免CORS问题
        const proxyUrl = '/api/wechat-proxy';
        const response = await fetch(proxyUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                url: API_CONFIG.baseUrl,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                data: requestBody
            })
        });

        if (!response.ok) {
            throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();

        // 如果代理返回错误，直接抛出
        if (result.error) {
            throw new Error(result.error);
        }

        const data: ApifoxModel = result.data;

        if (data.code !== 0) {
            throw new Error(`API返回错误: ${data.msg}`);
        }

        // 转换数据格式
        return data.data.map(transformArticleData);
    } catch (error) {
        console.error('获取公众号文章失败:', error);
        throw error;
    }
}

/**
 * 备用方法：直接调用API（可能遇到CORS问题）
 */
export async function fetchWeChatArticlesDirect(keyword: string, page: number = 1): Promise<ArticleData[]> {
    try {
        const requestBody: ApiRequestParams = {
            kw: keyword,
            sort_type: 1,
            mode: 1,
            period: 7,
            page: page,
            key: API_CONFIG.apiKey,
            any_kw: '',
            ex_kw: '',
            verifycode: '',
            type: 1
        };

        const response = await fetch(API_CONFIG.baseUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
        }

        const data: ApifoxModel = await response.json();

        if (data.code !== 0) {
            throw new Error(`API返回错误: ${data.msg}`);
        }

        // 转换数据格式
        return data.data.map(transformArticleData);
    } catch (error) {
        console.error('获取公众号文章失败:', error);
        throw error;
    }
}

/**
 * 转换API返回的数据格式为应用所需格式
 */
function transformArticleData(datum: Datum): ArticleData {
    // 计算互动率
    const readCount = datum.read || 0;
    const likeCount = datum.praise || 0;
    const viewCount = datum.looking || 0;
    const interactiveRate = readCount > 0 ? ((likeCount + viewCount) / readCount * 100) : 0;

    // 生成文章摘要
    const summary = generateSummary(datum.content);

    return {
        id: `${datum.ghid}_${datum.publish_time}`,
        title: datum.title || '无标题',
        content: datum.content || '',
        readCount,
        likeCount,
        viewCount,
        interactiveRate: Math.round(interactiveRate * 10) / 10,
        summary,
        wxName: datum.wx_name || '未知公众号',
        publishTime: datum.publish_time_str || '',
        url: datum.url || '',
        avatar: datum.avatar || '',
        classify: datum.classify || '',
        isOriginal: datum.is_original === 1
    };
}

/**
 * 生成文章摘要
 */
function generateSummary(content: string): string {
    if (!content) return '无内容摘要';

    // 移除HTML标签
    const cleanContent = content.replace(/<[^>]*>/g, '');

    // 截取前200个字符作为摘要
    let summary = cleanContent.substring(0, 200);

    // 如果内容超过200字符，在句号或逗号处截断
    if (cleanContent.length > 200) {
        const lastPunctuation = Math.max(
            summary.lastIndexOf('。'),
            summary.lastIndexOf('，'),
            summary.lastIndexOf('！'),
            summary.lastIndexOf('？')
        );

        if (lastPunctuation > 100) {
            summary = summary.substring(0, lastPunctuation + 1);
        } else {
            summary += '...';
        }
    }

    return summary;
}

/**
 * 提取高频词汇
 */
export function extractKeywords(keyword: string, articles: ArticleData[]): Array<{ text: string; count: number }> {
    // 常见停用词
    const stopWords = new Set([
        '的', '了', '在', '是', '我', '有', '和', '就', '不', '人', '都', '一', '一个',
        '上', '也', '很', '到', '说', '要', '去', '你', '会', '着', '没有', '看', '好',
        '自己', '这', '那', '里', '就是', '但是', '还是', '为了', '可以', '这个',
        'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be'
    ]);

    // 合并所有文章内容
    const allText = articles.map(article => article.title + ' ' + article.content).join(' ');

    // 分词并统计词频
    const words = allText
        .replace(/[^\u4e00-\u9fa5a-zA-Z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter(word => word.length > 1 && !stopWords.has(word.toLowerCase()));

    const wordCount: Record<string, number> = {};
    words.forEach(word => {
        wordCount[word] = (wordCount[word] || 0) + 1;
    });

    // 排序并返回前20个高频词
    return Object.entries(wordCount)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 20)
        .map(([text, count]) => ({ text, count }));
}

/**
 * 生成分析洞察
 */
export function generateInsights(articles: ArticleData[], keyword: string): string[] {
    const insights: string[] = [];

    if (articles.length === 0) {
        return ['未找到相关文章，请尝试其他关键词'];
    }

    // 计算平均数据
    const avgReadCount = articles.reduce((sum, article) => sum + article.readCount, 0) / articles.length;
    const avgLikeCount = articles.reduce((sum, article) => sum + article.likeCount, 0) / articles.length;
    const avgInteractiveRate = articles.reduce((sum, article) => sum + article.interactiveRate, 0) / articles.length;

    // 生成洞察
    insights.push(`关键词"${keyword}"相关文章共${articles.length}篇`);
    insights.push(`平均阅读量为${Math.round(avgReadCount)}次，平均点赞数为${Math.round(avgLikeCount)}个`);

    if (avgInteractiveRate > 10) {
        insights.push('该领域文章互动率较高，用户参与度强');
    } else if (avgInteractiveRate > 5) {
        insights.push('该领域文章互动率中等，有一定用户基础');
    } else {
        insights.push('该领域文章互动率较低，可能需要优化内容策略');
    }

    // 分析热门公众号
    const wxCount: Record<string, number> = {};
    articles.forEach(article => {
        wxCount[article.wxName] = (wxCount[article.wxName] || 0) + 1;
    });

    const topWx = Object.entries(wxCount)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3);

    if (topWx.length > 0) {
        insights.push(`主要内容来源：${topWx.map(([name]) => name).join('、')}`);
    }

    // 分析原创内容比例
    const originalCount = articles.filter(article => article.isOriginal).length;
    const originalRate = (originalCount / articles.length * 100).toFixed(1);
    insights.push(`原创内容占比：${originalRate}%`);

    return insights;
}