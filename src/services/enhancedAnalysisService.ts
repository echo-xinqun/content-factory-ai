// 增强分析流程编排服务

import { ArticleData } from '@/types/api';
import { AIEnhancedInsights, AIProcessingState } from '@/types/aiInsights';
import {
  EnhancedSearchHistoryDetail,
  AnalysisTask,
  AnalysisStatus,
  AnalysisConfig,
  AnalysisOptions,
  BatchAnalysisRequest,
  BatchAnalysisResult,
  ValidationResult,
  ValidationError
} from '@/types/analysisTypes';
import { aiInsightsService } from './aiInsightsService';
import { generateInsights } from './wechatApi';

export class EnhancedAnalysisService {
  private activeTasks = new Map<string, AnalysisTask>();
  private config: AnalysisConfig = { ...DEFAULT_ANALYSIS_CONFIG };

  /**
   * 执行增强分析
   */
  async performEnhancedAnalysis(
    searchId: string,
    keyword: string,
    articles: ArticleData[],
    options: AnalysisOptions = {}
  ): Promise<AIEnhancedInsights> {
    const config = { ...this.config, ...options.config };

    // 创建分析任务
    const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const task: AnalysisTask = {
      id: taskId,
      searchId,
      keyword,
      status: AnalysisStatus.PENDING,
      progress: 0,
      startTime: Date.now()
    };

    this.activeTasks.set(taskId, task);

    try {
      // 更新任务状态为处理中
      task.status = AnalysisStatus.PROCESSING;
      task.progress = 10;

      if (config.enableAI) {
        // 执行AI增强分析
        const result = await aiInsightsService.generateInsights({
          searchId,
          keyword,
          articles,
          analysisOptions: {
            maxArticles: config.maxArticles,
            includeSentiment: config.includeSentiment,
            includeOpportunities: config.includeOpportunities,
            model: config.aiModel
          }
        });

        task.status = AnalysisStatus.COMPLETED;
        task.progress = 100;
        task.endTime = Date.now();
        task.result = result;

        return result;
      } else {
        // 使用传统分析
        const insights = generateInsights(articles, keyword);
        const basicInsights = await this.formatBasicInsights(insights);

        const result: AIEnhancedInsights = {
          basicInsights,
          aiAnalysis: {
            articleSummaries: [],
            topicInsights: [],
            sentimentAnalysis: {
              overall: '中性',
              emotionalTone: ['客观'],
              engagementLevel: '中等',
              dominantEmotion: '理性',
              sentimentScore: 0
            },
            opportunities: []
          },
          metadata: {
            processingTime: Date.now() - task.startTime,
            confidence: 0.5,
            aiModel: 'basic',
            timestamp: Date.now(),
            articlesAnalyzed: 0,
            tokensUsed: 0,
            version: '1.0'
          }
        };

        task.status = AnalysisStatus.COMPLETED;
        task.progress = 100;
        task.endTime = Date.now();
        task.result = result;

        return result;
      }

    } catch (error) {
      task.status = AnalysisStatus.FAILED;
      task.endTime = Date.now();
      task.error = error instanceof Error ? error.message : '未知错误';

      throw error;
    } finally {
      // 清理任务（延迟清理，以便查询状态）
      setTimeout(() => {
        this.activeTasks.delete(taskId);
      }, 60000); // 1分钟后清理
    }
  }

  /**
   * 流式增强分析
   */
  async *performEnhancedAnalysisStream(
    searchId: string,
    keyword: string,
    articles: ArticleData[],
    options: AnalysisOptions = {}
  ): AsyncGenerator<AIProcessingState, AIEnhancedInsights, unknown> {
    const config = { ...this.config, ...options.config };

    // 创建分析任务
    const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const task: AnalysisTask = {
      id: taskId,
      searchId,
      keyword,
      status: AnalysisStatus.PENDING,
      progress: 0,
      startTime: Date.now()
    };

    this.activeTasks.set(taskId, task);

    try {
      if (config.enableAI) {
        // AI流式分析
        for await (const state of aiInsightsService.generateInsightsStream({
          searchId,
          keyword,
          articles,
          analysisOptions: {
            maxArticles: config.maxArticles,
            includeSentiment: config.includeSentiment,
            includeOpportunities: config.includeOpportunities,
            model: config.aiModel
          }
        })) {
          task.status = state.status as AnalysisStatus;
          task.progress = state.progress;
          task.error = state.error;

          if (state.status === 'error') {
            throw new Error(state.error);
          }

          yield state;
        }
      } else {
        // 传统分析流式状态
        const states = [
          { status: 'processing' as const, progress: 20, currentStep: '准备分析数据...' },
          { status: 'processing' as const, progress: 40, currentStep: '计算基础指标...' },
          { status: 'processing' as const, progress: 60, currentStep: '生成洞察...' },
          { status: 'processing' as const, progress: 80, currentStep: '整理结果...' },
          { status: 'completed' as const, progress: 100, currentStep: '分析完成' }
        ];

        for (const state of states) {
          task.status = state.status as AnalysisStatus;
          task.progress = state.progress;
          yield state;
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }

      // 生成最终结果
      const insights = generateInsights(articles, keyword);
      const basicInsights = await this.formatBasicInsights(insights);

      const result: AIEnhancedInsights = {
        basicInsights,
        aiAnalysis: {
          articleSummaries: [],
          topicInsights: [],
          sentimentAnalysis: {
            overall: '中性',
            emotionalTone: ['客观'],
            engagementLevel: '中等',
            dominantEmotion: '理性',
            sentimentScore: 0
          },
          opportunities: []
        },
        metadata: {
          processingTime: Date.now() - task.startTime,
          confidence: config.enableAI ? 0.8 : 0.5,
          aiModel: config.enableAI ? config.aiModel : 'basic',
          timestamp: Date.now(),
          articlesAnalyzed: config.enableAI ? Math.min(articles.length, config.maxArticles) : 0,
          tokensUsed: 0,
          version: config.enableAI ? '2.0' : '1.0'
        }
      };

      task.status = AnalysisStatus.COMPLETED;
      task.progress = 100;
      task.endTime = Date.now();
      task.result = result;

      return result;

    } catch (error) {
      task.status = AnalysisStatus.FAILED;
      task.endTime = Date.now();
      task.error = error instanceof Error ? error.message : '未知错误';

      yield {
        status: 'error',
        progress: 0,
        currentStep: `分析失败: ${task.error}`,
        error: task.error,
        startTime: task.startTime,
        endTime: task.endTime
      };

      throw error;
    } finally {
      setTimeout(() => {
        this.activeTasks.delete(taskId);
      }, 60000);
    }
  }

  /**
   * 批量分析
   */
  async performBatchAnalysis(request: BatchAnalysisRequest): Promise<BatchAnalysisResult> {
    const taskId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const startTime = Date.now();

    const results = [];
    let completedTasks = 0;
    let failedTasks = 0;

    for (const taskRequest of request.tasks) {
      try {
        const result = await this.performEnhancedAnalysis(
          taskRequest.searchId,
          taskRequest.keyword,
          taskRequest.articles,
          taskRequest.options
        );

        results.push({
          searchId: taskRequest.searchId,
          success: true,
          result
        });

        completedTasks++;

      } catch (error) {
        results.push({
          searchId: taskRequest.searchId,
          success: false,
          error: error instanceof Error ? error.message : '未知错误'
        });

        failedTasks++;
      }
    }

    const totalProcessingTime = Date.now() - startTime;

    return {
      taskId,
      totalTasks: request.tasks.length,
      completedTasks,
      failedTasks,
      results,
      totalProcessingTime
    };
  }

  /**
   * 获取任务状态
   */
  getTaskStatus(taskId: string): AnalysisTask | null {
    return this.activeTasks.get(taskId) || null;
  }

  /**
   * 获取所有活跃任务
   */
  getActiveTasks(): AnalysisTask[] {
    return Array.from(this.activeTasks.values());
  }

  /**
   * 取消任务
   */
  cancelTask(taskId: string): boolean {
    const task = this.activeTasks.get(taskId);
    if (task && task.status === AnalysisStatus.PROCESSING) {
      task.status = AnalysisStatus.FAILED;
      task.endTime = Date.now();
      task.error = '任务已取消';
      return true;
    }
    return false;
  }

  /**
   * 验证分析请求
   */
  validateAnalysisRequest(
    searchId: string,
    keyword: string,
    articles: ArticleData[]
  ): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: string[] = [];

    // 验证搜索ID
    if (!searchId || typeof searchId !== 'string') {
      errors.push({
        field: 'searchId',
        message: '搜索ID不能为空且必须是字符串',
        value: searchId
      });
    }

    // 验证关键词
    if (!keyword || typeof keyword !== 'string' || keyword.trim().length === 0) {
      errors.push({
        field: 'keyword',
        message: '关键词不能为空且必须是有效字符串',
        value: keyword
      });
    } else if (keyword.length > 100) {
      warnings.push('关键词过长，可能影响分析效果');
    }

    // 验证文章数组
    if (!Array.isArray(articles)) {
      errors.push({
        field: 'articles',
        message: '文章数据必须是数组',
        value: typeof articles
      });
    } else if (articles.length === 0) {
      errors.push({
        field: 'articles',
        message: '文章数组不能为空',
        value: articles.length
      });
    } else if (articles.length < 3) {
      warnings.push('文章数量过少，可能影响分析质量');
    } else if (articles.length > 100) {
      warnings.push('文章数量过多，将限制分析数量以提高效率');
    }

    // 验证文章数据质量
    const validArticles = articles.filter(article =>
      article &&
      typeof article.title === 'string' &&
      article.title.trim().length > 0 &&
      typeof article.content === 'string' &&
      article.content.trim().length > 0
    );

    if (validArticles.length < articles.length * 0.8) {
      warnings.push('部分文章数据质量较低，可能影响分析结果');
    }

    if (validArticles.length < 3) {
      errors.push({
        field: 'articles',
        message: '有效文章数量不足，至少需要3篇完整文章',
        value: validArticles.length
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * 获取配置
   */
  getConfig(): AnalysisConfig {
    return { ...this.config };
  }

  /**
   * 更新配置
   */
  updateConfig(newConfig: Partial<AnalysisConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * 重置配置为默认值
   */
  resetConfig(): void {
    this.config = { ...DEFAULT_ANALYSIS_CONFIG };
  }

  /**
   * 清理所有任务
   */
  clearAllTasks(): void {
    this.activeTasks.clear();
  }

  /**
   * 获取系统状态
   */
  getSystemStatus(): {
    activeTasks: number;
    completedTasks: number;
    failedTasks: number;
    averageProcessingTime: number;
  } {
    const tasks = Array.from(this.activeTasks.values());
    const activeTasks = tasks.filter(t => t.status === AnalysisStatus.PROCESSING).length;
    const completedTasks = tasks.filter(t => t.status === AnalysisStatus.COMPLETED).length;
    const failedTasks = tasks.filter(t => t.status === AnalysisStatus.FAILED).length;

    const completedTasksWithTime = tasks.filter(t => t.status === AnalysisStatus.COMPLETED && t.endTime);
    const averageProcessingTime = completedTasksWithTime.length > 0
      ? completedTasksWithTime.reduce((sum, task) => sum + (task.endTime! - task.startTime), 0) / completedTasksWithTime.length
      : 0;

    return {
      activeTasks,
      completedTasks,
      failedTasks,
      averageProcessingTime
    };
  }

  /**
   * 格式化基础洞察
   */
  private async formatBasicInsights(insights: string[]): Promise<string[]> {
    // 确保洞察是字符串格式
    return insights.map(insight => {
      if (typeof insight === 'string') {
        return insight;
      }
      return String(insight);
    });
  }
}

// 导出默认服务实例
export const enhancedAnalysisService = new EnhancedAnalysisService();

/**
 * 执行增强分析（便捷函数）
 */
export async function performEnhancedAnalysis(
  searchId: string,
  keyword: string,
  articles: ArticleData[],
  options?: AnalysisOptions
): Promise<AIEnhancedInsights> {
  return enhancedAnalysisService.performEnhancedAnalysis(searchId, keyword, articles, options);
}

/**
 * 流式增强分析（便捷函数）
 */
export async function* performEnhancedAnalysisStream(
  searchId: string,
  keyword: string,
  articles: ArticleData[],
  options?: AnalysisOptions
): AsyncGenerator<AIProcessingState, AIEnhancedInsights, unknown> {
  yield* enhancedAnalysisService.performEnhancedAnalysisStream(searchId, keyword, articles, options);
}