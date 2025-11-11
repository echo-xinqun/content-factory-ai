// OpenAI兼容API服务封装

import { AIServiceConfig, AnalysisError, AnalysisErrorType } from '@/types/analysisTypes';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatCompletionRequest {
  model: string;
  messages: ChatMessage[];
  max_tokens?: number;
  temperature?: number;
  stream?: boolean;
}

export interface ChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class OpenAIService {
  private config: AIServiceConfig;

  constructor(config: AIServiceConfig) {
    this.config = {
      timeout: 60000, // 60秒
      retryAttempts: 3,
      retryDelay: 1000, // 1秒
      maxTokens: 4000,
      temperature: 0.7,
      ...config
    };
  }

  /**
   * 发送聊天完成请求
   */
  async chatCompletion(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    const baseURL = this.config.baseURL || 'https://api.openai.com';
    let url: string;

    // 特殊处理DeepSeek API
    if (baseURL.includes('api.deepseek.com')) {
      url = `${baseURL}/chat/completions`;
    } else {
      // OpenAI和其他兼容API的处理
      url = baseURL.endsWith('/v1')
        ? `${baseURL}/chat/completions`
        : `${baseURL}/v1/chat/completions`;
    }

    const requestBody = {
      model: request.model || this.config.model,
      messages: request.messages,
      max_tokens: request.max_tokens || this.config.maxTokens,
      temperature: request.temperature || this.config.temperature,
      stream: false
    };

    let lastError: Error | null = null;

    for (let attempt = 0; attempt < this.config.retryAttempts; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Authorization': `Bearer ${this.config.apiKey}`,
            ...(this.config.baseURL && !this.config.baseURL.includes('api.openai.com') && {
              'HTTP-Referer': process.env.NODE_ENV === 'production'
                ? process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
                : 'http://localhost:3000',
              'X-Title': 'ContentFactory'
            })
          },
          body: JSON.stringify(requestBody),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(`API请求失败: ${response.status} - ${errorData.error?.message || response.statusText}`);
        }

        const data: ChatCompletionResponse = await response.json();
        return data;

      } catch (error) {
        lastError = error as Error;

        // 如果是网络错误或超时，进行重试
        if (this.isRetryableError(error) && attempt < this.config.retryAttempts - 1) {
          console.warn(`API请求失败，正在重试 (${attempt + 1}/${this.config.retryAttempts}):`, error);
          await this.delay(this.config.retryDelay * Math.pow(2, attempt)); // 指数退避
          continue;
        }

        break;
      }
    }

    throw this.createAnalysisError(lastError);
  }

  /**
   * 发送简单的文本请求
   */
  async sendPrompt(prompt: string, systemPrompt?: string): Promise<string> {
    const messages: ChatMessage[] = [];

    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }

    messages.push({ role: 'user', content: prompt });

    const response = await this.chatCompletion({
      model: this.config.model,
      messages,
      max_tokens: this.config.maxTokens,
      temperature: this.config.temperature
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('API返回空内容');
    }

    return content;
  }

  /**
   * 发送JSON格式请求，确保返回有效的JSON
   */
  async sendJSONPrompt<T>(prompt: string, systemPrompt?: string): Promise<T> {
    const jsonSystemPrompt = systemPrompt
      ? `${systemPrompt}\n\n请严格按照JSON格式回复，不要包含任何其他文本或解释，不要使用markdown代码块。`
      : '请严格按照JSON格式回复，不要包含任何其他文本或解释，不要使用markdown代码块。';

    const response = await this.sendPrompt(prompt, jsonSystemPrompt);

    try {
      // 尝试解析JSON，处理可能的markdown代码块
      let jsonString = response;

      // 移除markdown代码块标记
      jsonString = jsonString.replace(/```json\s*/g, '').replace(/```\s*$/g, '');

      // 查找JSON对象
      const jsonMatch = jsonString.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonString = jsonMatch[0];
      }

      return JSON.parse(jsonString) as T;
    } catch (error) {
      console.error('JSON解析失败，原始响应:', response);
      throw new Error(`JSON解析失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 流式聊天完成（为将来扩展预留）
   */
  async *chatCompletionStream(request: ChatCompletionRequest): AsyncGenerator<string, void, unknown> {
    const baseURL = this.config.baseURL || 'https://api.openai.com';
    let url: string;

    // 特殊处理DeepSeek API
    if (baseURL.includes('api.deepseek.com')) {
      url = `${baseURL}/chat/completions`;
    } else {
      // OpenAI和其他兼容API的处理
      url = baseURL.endsWith('/v1')
        ? `${baseURL}/chat/completions`
        : `${baseURL}/v1/chat/completions`;
    }

    const requestBody = {
      ...request,
      stream: true
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`流式请求失败: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('无法获取响应流');
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\\n').filter(line => line.trim());

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') return;

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices[0]?.delta?.content;
              if (content) {
                yield content;
              }
            } catch (error) {
              console.error('解析流式数据失败:', error);
            }
          }
        }
      }
    } catch (error) {
      throw this.createAnalysisError(error);
    }
  }

  /**
   * 测试API连接
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.sendPrompt('测试连接', '请回复"连接成功"');
      return true;
    } catch (error) {
      console.error('API连接测试失败:', error);
      return false;
    }
  }

  /**
   * 获取模型信息
   */
  getConfig(): AIServiceConfig {
    return { ...this.config };
  }

  /**
   * 更新配置
   */
  updateConfig(newConfig: Partial<AIServiceConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * 判断是否为可重试的错误
   */
  private isRetryableError(error: unknown): boolean {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      return (
        message.includes('network') ||
        message.includes('timeout') ||
        message.includes('connection') ||
        message.includes('rate limit') ||
        message.includes('500') ||
        message.includes('502') ||
        message.includes('503') ||
        message.includes('504') ||
        message.includes('temporary') ||
        message.includes('overloaded') ||
        message.includes('deepseek') && message.includes('busy')
      );
    }
    return false;
  }

  /**
   * 创建分析错误
   */
  private createAnalysisError(error: unknown): AnalysisError {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();

      if (message.includes('timeout')) {
        return {
          type: AnalysisErrorType.TIMEOUT_ERROR,
          message: `请求超时: ${error.message}`,
          timestamp: Date.now(),
          retryable: true
        };
      }

      if (message.includes('network') || message.includes('connection')) {
        return {
          type: AnalysisErrorType.NETWORK_ERROR,
          message: `网络错误: ${error.message}`,
          timestamp: Date.now(),
          retryable: true
        };
      }

      if (message.includes('rate limit') || message.includes('too many requests')) {
        return {
          type: AnalysisErrorType.RATE_LIMIT_ERROR,
          message: `API调用频率限制: ${error.message}`,
          timestamp: Date.now(),
          retryable: true
        };
      }

      if (message.includes('invalid') || message.includes('validation')) {
        return {
          type: AnalysisErrorType.VALIDATION_ERROR,
          message: `请求参数错误: ${error.message}`,
          timestamp: Date.now(),
          retryable: false
        };
      }

      if (message.includes('quota') || message.includes('balance') || message.includes('insufficient')) {
        return {
          type: AnalysisErrorType.QUOTA_ERROR,
          message: `API配额不足: ${error.message}`,
          timestamp: Date.now(),
          retryable: false
        };
      }

      if (message.includes('busy') || message.includes('overloaded') || message.includes('temporary')) {
        return {
          type: AnalysisErrorType.SERVER_ERROR,
          message: `AI服务暂时繁忙: ${error.message}`,
          timestamp: Date.now(),
          retryable: true
        };
      }

      return {
        type: AnalysisErrorType.API_ERROR,
        message: `AI分析服务错误: ${error.message}`,
        timestamp: Date.now(),
        retryable: true
      };
    }

    return {
      type: AnalysisErrorType.UNKNOWN_ERROR,
      message: `未知错误: ${String(error)}`,
      timestamp: Date.now(),
      retryable: false
    };
  }

  /**
   * 延迟函数
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// 默认OpenAI服务实例
let defaultOpenAIService: OpenAIService | null = null;

/**
 * 获取默认OpenAI服务实例
 */
export function getOpenAIService(): OpenAIService {
  if (!defaultOpenAIService) {
    // 优先使用DeepSeek配置
    const deepSeekApiKey = process.env.DEEPSEEK_API_KEY;
    const deepSeekBaseURL = process.env.DEEPSEEK_BASE_URL;
    const deepSeekModel = process.env.DEEPSEEK_MODEL;

    if (deepSeekApiKey && deepSeekBaseURL) {
      console.log('使用DeepSeek API服务');
      defaultOpenAIService = new OpenAIService({
        apiKey: deepSeekApiKey,
        model: deepSeekModel || 'deepseek-chat',
        baseURL: deepSeekBaseURL,
        maxTokens: parseInt(process.env.AI_MAX_TOKENS || '4000'),
        temperature: parseFloat(process.env.AI_TEMPERATURE || '0.7'),
        timeout: parseInt(process.env.AI_TIMEOUT || '60000'),
        retryAttempts: parseInt(process.env.AI_RETRY_ATTEMPTS || '3'),
        retryDelay: parseInt(process.env.AI_RETRY_DELAY || '1000')
      });
    } else {
      // 回退到OpenAI配置
      const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY || process.env.OPENAI_API_KEY;

      if (!apiKey) {
        throw new Error('AI API密钥未配置，请设置DEEPSEEK_API_KEY或OPENAI_API_KEY');
      }

      console.log('使用OpenAI API服务');
      defaultOpenAIService = new OpenAIService({
        apiKey,
        model: process.env.AI_MODEL || process.env.OPENAI_MODEL || 'gpt-4',
        baseURL: process.env.OPENAI_BASE_URL,
        maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || '4000'),
        temperature: parseFloat(process.env.OPENAI_TEMPERATURE || '0.7'),
        timeout: parseInt(process.env.OPENAI_TIMEOUT || '60000'),
        retryAttempts: parseInt(process.env.OPENAI_RETRY_ATTEMPTS || '3'),
        retryDelay: parseInt(process.env.OPENAI_RETRY_DELAY || '1000')
      });
    }
  }

  return defaultOpenAIService;
}

/**
 * 创建新的OpenAI服务实例
 */
export function createOpenAIService(config: AIServiceConfig): OpenAIService {
  return new OpenAIService(config);
}