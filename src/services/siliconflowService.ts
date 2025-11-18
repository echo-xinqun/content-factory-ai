// SiliconFlow API 服务封装
export interface SiliconFlowImageRequest {
  model: string;
  prompt: string;
  num_images?: number;
  size?: string;
  seed?: number;
}

export interface SiliconFlowImageResponse {
  images: Array<{
    url: string;
  }>;
  timings: {
    inference: number;
  };
  seed: number;
}

export interface SiliconFlowConfig {
  apiKey: string;
  baseURL: string;
  model: string;
  timeout?: number;
  retryAttempts?: number;
}

export class SiliconFlowService {
  private config: SiliconFlowConfig;

  constructor(config: SiliconFlowConfig) {
    this.config = {
      timeout: 120000, // 2分钟超时
      retryAttempts: 3,
      ...config
    };
  }

  /**
   * 生成图片
   */
  async generateImage(request: SiliconFlowImageRequest): Promise<SiliconFlowImageResponse> {
    const url = `${this.config.baseURL}/images/generations`;

    const requestBody = {
      model: request.model || this.config.model,
      prompt: request.prompt,
      num_images: request.num_images || 1,
      seed: request.seed
    };

    // 只在有size参数时才添加，避免不必要的参数
    if (request.size) {
      (requestBody as any).size = request.size;
    }

    let lastError: Error | null = null;

    for (let attempt = 0; attempt < this.config.retryAttempts; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

        console.log(`API请求 ${attempt + 1}/${this.config.retryAttempts}:`, {
          url,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.config.apiKey.substring(0, 10)}...`
          },
          body: requestBody
        });

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.config.apiKey}`
          },
          body: JSON.stringify(requestBody),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        console.log(`API响应状态: ${response.status} ${response.statusText}`);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error(`API错误响应:`, errorData);
          throw new Error(`SiliconFlow API请求失败: ${response.status} - ${errorData.error?.message || response.statusText}`);
        }

        const data: SiliconFlowImageResponse = await response.json();
        console.log(`API成功响应:`, data);
        return data;

      } catch (error) {
        lastError = error as Error;

        // 如果是网络错误或超时，进行重试
        if (this.isRetryableError(error) && attempt < this.config.retryAttempts - 1) {
          console.warn(`SiliconFlow API请求失败，正在重试 (${attempt + 1}/${this.config.retryAttempts}):`, error);
          await this.delay(2000 * Math.pow(2, attempt)); // 指数退避
          continue;
        }

        break;
      }
    }

    throw lastError || new Error('SiliconFlow API请求失败');
  }

  /**
   * 批量生成图片
   */
  async generateMultipleImages(
    prompts: string[],
    style: string = '',
    onProgress?: (current: number, total: number) => void
  ): Promise<Array<{ url: string; prompt: string; index: number }>> {
    const results: Array<{ url: string; prompt: string; index: number }> = [];

    for (let i = 0; i < prompts.length; i++) {
      try {
        const promptWithStyle = this.addStyleToPrompt(prompts[i], style);
        console.log(`正在生成图片 ${i + 1}/${prompts.length}，提示词:`, promptWithStyle);

        const response = await this.generateImage({
          prompt: promptWithStyle,
          seed: (Date.now() + i) % 1000000000 // 限制在API要求的范围内 (≤ 9.999999999e+09)
        });

        console.log(`图片 ${i + 1} 生成成功:`, response);

        if (response.images && response.images.length > 0) {
          results.push({
            url: response.images[0].url,
            prompt: prompts[i],
            index: i
          });
        } else {
          console.error(`图片 ${i + 1} 响应为空:`, response);
        }

        // 回调进度
        if (onProgress) {
          onProgress(i + 1, prompts.length);
        }

      } catch (error) {
        console.error(`生成图片 ${i + 1} 失败:`, error);
        // 继续生成其他图片，不中断整个过程
      }
    }

    return results;
  }

  /**
   * 根据风格ID添加风格描述到提示词
   */
  private addStyleToPrompt(prompt: string, styleId: string): string {
    const styleMap = {
      'tech': 'modern technology style, digital art, futuristic, clean design',
      'business': 'professional business style, corporate, clean photography, office setting',
      'education': 'educational style, academic, learning environment, school setting',
      'nature': 'natural style, outdoor environment, landscape photography, organic',
      'creative': 'creative artistic style, abstract, colorful, artistic interpretation',
      'lifestyle': 'lifestyle style, casual, everyday life, relatable scenarios'
    };

    const styleDescription = styleMap[styleId as keyof typeof styleMap] || '';
    return styleDescription ? `${prompt}, ${styleDescription}` : prompt;
  }

  /**
   * 判断是否为可重试的错误
   */
  private isRetryableError(error: unknown): boolean {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      return (
        message.includes('timeout') ||
        message.includes('network') ||
        message.includes('connection') ||
        message.includes('rate limit') ||
        message.includes('500') ||
        message.includes('502') ||
        message.includes('503') ||
        message.includes('504') ||
        message.includes('temporary') ||
        message.includes('overloaded')
      );
    }
    return false;
  }

  /**
   * 延迟函数
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 获取配置
   */
  getConfig(): SiliconFlowConfig {
    return { ...this.config };
  }
}

// 默认服务实例
let defaultSiliconFlowService: SiliconFlowService | null = null;

/**
 * 获取默认SiliconFlow服务实例
 */
export function getSiliconFlowService(): SiliconFlowService {
  if (!defaultSiliconFlowService) {
    const apiKey = process.env.SILICONFLOW_API_KEY;
    const baseURL = process.env.SILICONFLOW_BASE_URL || 'https://api.siliconflow.cn/v1';
    const model = process.env.SILICONFLOW_MODEL || 'Kwai-Kolors/Kolors';

    if (!apiKey) {
      throw new Error('SiliconFlow API密钥未配置，请设置SILICONFLOW_API_KEY');
    }

    defaultSiliconFlowService = new SiliconFlowService({
      apiKey,
      baseURL,
      model
    });
  }

  return defaultSiliconFlowService;
}

/**
 * 创建新的SiliconFlow服务实例
 */
export function createSiliconFlowService(config: SiliconFlowConfig): SiliconFlowService {
  return new SiliconFlowService(config);
}