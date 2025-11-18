import { NextRequest, NextResponse } from 'next/server';
import { getOpenAIService } from '@/services/openAIService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { content, style, count = 3 } = body;

    if (!content) {
      return NextResponse.json(
        { success: false, error: '缺少文章内容' },
        { status: 400 }
      );
    }

    const aiService = getOpenAIService();

    // 生成图片提示词的提示
    const systemPrompt = `你是一个专业的图片提示词生成专家。请根据提供的文章内容，生成${count}个高质量的图片提示词，用于AI图片生成。

要求：
1. 每个提示词要生动、具体，适合生成高质量的配图
2. 提示词应该描述文章中最具代表性的场景或概念
3. 风格要符合指定的风格类型
4. 每个提示词长度控制在50-150字之间
5. 提示词用英文，包含场景描述、风格、光线、构图等要素

请严格按照以下JSON格式回复，不要包含任何其他文本：
{
  "prompts": [
    {
      "index": 1,
      "prompt": "详细的英文图片提示词",
      "description": "这个图片要表现的内容中文说明",
      "suggested_position": "开头" | "中间" | "结尾"
    }
  ]
}`;

    const userPrompt = `请为以下文章生成${count}个图片提示词，风格要求：${style}

文章内容：
${content}`;

    const response = await aiService.sendJSONPrompt<{
      prompts: Array<{
        index: number;
        prompt: string;
        description: string;
        suggested_position: string;
      }>;
    }>(userPrompt, systemPrompt);

    return NextResponse.json({
      success: true,
      data: response.prompts
    });

  } catch (error) {
    console.error('生成图片提示词失败:', error);

    // 返回默认提示词作为降级方案
    const defaultPrompts = Array.from({ length: body.count || 3 }, (_, i) => ({
      index: i + 1,
      prompt: `Professional illustration for article content, modern style, clean design, high quality digital art`,
      description: `文章配图 ${i + 1}`,
      suggested_position: i === 0 ? "开头" : i === 2 ? "结尾" : "中间"
    }));

    return NextResponse.json({
      success: true,
      data: defaultPrompts,
      fallback: true
    });
  }
}